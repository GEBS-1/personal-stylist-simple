import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { 
  Camera, 
  Upload, 
  Calculator,
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { PhotoAnalyzer } from "./PhotoAnalyzer";

interface BodyMeasurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
}

type BodyType = 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle';

interface BodyAnalysisProps {
  onComplete?: (data: { bodyType: BodyType; measurements: BodyMeasurements }) => void;
  onContinue?: () => void;
  analysisData?: any;
}

const bodyTypeDescriptions = {
  apple: "Яблоко - полнота в области талии",
  pear: "Груша - узкие плечи, широкие бедра",
  hourglass: "Песочные часы - пропорциональная фигура",
  rectangle: "Прямоугольник - равные пропорции",
  'inverted-triangle': "Перевернутый треугольник - широкие плечи"
};

export const BodyAnalysis = ({ onComplete, onContinue, analysisData }: BodyAnalysisProps) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'manual'>('photo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bodyType, setBodyType] = useState<BodyType | null>(analysisData?.bodyType || null);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: analysisData?.measurements?.height || 0,
    weight: analysisData?.measurements?.weight || 0,
    chest: analysisData?.measurements?.chest || 0,
    waist: analysisData?.measurements?.waist || 0,
    hips: analysisData?.measurements?.hips || 0,
    shoulders: analysisData?.measurements?.shoulders || 0
  });
  const [isEditing, setIsEditing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const analyzeBodyType = useCallback((measures: BodyMeasurements): BodyType => {
    const waistToHipRatio = measures.waist / measures.hips;
    const shoulderToHipRatio = measures.shoulders / measures.hips;
    const bustToWaistRatio = measures.chest / measures.waist;
    
    // Алгоритм определения типа фигуры
    if (waistToHipRatio > 0.85) {
      return 'apple';
    } else if (shoulderToHipRatio > 1.05) {
      return 'inverted-triangle';
    } else if (shoulderToHipRatio < 0.95 && bustToWaistRatio < 1.3) {
      return 'pear';
    } else if (
      shoulderToHipRatio >= 0.95 && 
      shoulderToHipRatio <= 1.05 && 
      bustToWaistRatio >= 1.3
    ) {
      return 'hourglass';
    } else {
      return 'rectangle';
    }
  }, []);

  const handlePhotoUpload = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setUploadProgress(0);
    
    try {
      // Симуляция анализа фото
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Ожидание завершения "анализа"
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Симуляция результатов анализа
      const mockMeasurements: BodyMeasurements = {
        height: 165,
        weight: 60,
        chest: 88,
        waist: 68,
        hips: 92,
        shoulders: 86
      };
      
      setMeasurements(mockMeasurements);
      const detectedBodyType = analyzeBodyType(mockMeasurements);
      setBodyType(detectedBodyType);
      setAnalysisComplete(true);
      
      toast({
        title: "Анализ завершен",
        description: `Определен тип фигуры: ${bodyTypeDescriptions[detectedBodyType]}`,
      });
      
      // Вызываем callback с данными анализа
      onComplete?.({ bodyType: detectedBodyType, measurements: mockMeasurements });
      
    } catch (error) {
      toast({
        title: "Ошибка анализа",
        description: "Попробуйте загрузить другое фото",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeBodyType, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handlePhotoUpload(file);
      } else {
        toast({
          title: "Неверный формат",
          description: "Пожалуйста, выберите изображение",
          variant: "destructive",
        });
      }
    }
  }, [handlePhotoUpload, toast]);

  const handleMeasurementChange = useCallback((field: keyof BodyMeasurements, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newMeasurements = { ...measurements, [field]: numValue };
    setMeasurements(newMeasurements);
    
    // Автоматический расчет типа фигуры при заполнении всех полей
    if (Object.values(newMeasurements).every(val => val > 0)) {
      const detectedBodyType = analyzeBodyType(newMeasurements);
      setBodyType(detectedBodyType);
      setAnalysisComplete(true);
      
      // Вызываем callback с данными анализа
      onComplete?.({ bodyType: detectedBodyType, measurements: newMeasurements });
    }
  }, [measurements, analyzeBodyType]);

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photo" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Анализ фото
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Ручной ввод
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="space-y-6">
          <PhotoAnalyzer 
            onAnalysisComplete={(measurements, bodyType, gender) => {
              setMeasurements({
                height: measurements.height,
                weight: 0, // Вес не определяется по фото
                chest: measurements.chest,
                waist: measurements.waist,
                hips: measurements.hips,
                shoulders: measurements.shoulders
              });
              setBodyType(bodyType as BodyType);
              setAnalysisComplete(true);
              
              // Показываем информацию о поле
              if (gender && gender !== 'unknown') {
                console.log(`👤 Определен пол: ${gender === 'male' ? 'мужской' : 'женский'}`);
              }
              
              // Вызываем callback с результатами
              onComplete?.({
                bodyType: bodyType as BodyType,
                measurements: {
                  height: measurements.height,
                  weight: 0,
                  chest: measurements.chest,
                  waist: measurements.waist,
                  hips: measurements.hips,
                  shoulders: measurements.shoulders
                }
              });
            }}
          />
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Ручной ввод параметров
              </CardTitle>
              <CardDescription>
                Введите ваши измерения для определения типа фигуры
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                                     <div>
                     <Label htmlFor="height">Рост (см) *</Label>
                     <Input
                       id="height"
                       type="number"
                       placeholder="165"
                       value={measurements.height || ''}
                       onChange={(e) => handleMeasurementChange('height', e.target.value)}
                     />
                   </div>
                   <div>
                     <Label htmlFor="weight">Вес (кг) *</Label>
                     <Input
                       id="weight"
                       type="number"
                       placeholder="60"
                       value={measurements.weight || ''}
                       onChange={(e) => handleMeasurementChange('weight', e.target.value)}
                     />
                   </div>
                  <div>
                    <Label htmlFor="chest">Обхват груди (см)</Label>
                    <Input
                      id="chest"
                      type="number"
                      placeholder="88"
                      value={measurements.chest || ''}
                      onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="waist">Обхват талии (см)</Label>
                    <Input
                      id="waist"
                      type="number"
                      placeholder="68"
                      value={measurements.waist || ''}
                      onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hips">Обхват бедер (см)</Label>
                    <Input
                      id="hips"
                      type="number"
                      placeholder="92"
                      value={measurements.hips || ''}
                      onChange={(e) => handleMeasurementChange('hips', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shoulders">Ширина плеч (см)</Label>
                    <Input
                      id="shoulders"
                      type="number"
                      placeholder="86"
                      value={measurements.shoulders || ''}
                      onChange={(e) => handleMeasurementChange('shoulders', e.target.value)}
                    />
                                     </div>
                 </div>
               </div>
                               <p className="text-sm text-muted-foreground">* Обязательные поля для определения типа фигуры</p>

                {/* Кнопка продолжить для ручного ввода */}
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => {
                      const detectedBodyType = analyzeBodyType(measurements);
                      setBodyType(detectedBodyType);
                      setAnalysisComplete(true);
                      onComplete?.({ bodyType: detectedBodyType, measurements });
                    }}
                    disabled={measurements.height <= 0 || measurements.weight <= 0}
                    className="px-8"
                  >
                    Продолжить
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>

      {/* Результаты анализа */}
      {bodyType && !isEditing && (
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Результаты анализа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Badge variant="default" className="text-lg px-6 py-2 mb-4">
                {bodyTypeDescriptions[bodyType]}
              </Badge>
              <p className="text-muted-foreground">
                На основе ваших параметров определен тип фигуры
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary">{measurements.height} см</div>
                  <div className="text-sm text-muted-foreground">Рост</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary">{measurements.weight} кг</div>
                  <div className="text-sm text-muted-foreground">Вес</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((measurements.waist / measurements.hips) * 100) / 100}
                  </div>
                  <div className="text-sm text-muted-foreground">Соотношение Т/Б</div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Рекомендации для вашего типа фигуры:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {bodyType === 'apple' && (
                  <>
                    <li>• Акцент на ноги и декольте</li>
                    <li>• Избегайте объема в области талии</li>
                    <li>• V-образные вырезы визуально удлиняют силуэт</li>
                  </>
                )}
                {bodyType === 'pear' && (
                  <>
                    <li>• Увеличивайте объем в области плеч</li>
                    <li>• Акцент на верхнюю часть тела</li>
                    <li>• Темные цвета снизу, светлые сверху</li>
                  </>
                )}
                {bodyType === 'hourglass' && (
                  <>
                    <li>• Подчеркивайте талию</li>
                    <li>• Избегайте прямого кроя</li>
                    <li>• Облегающие силуэты идеально подходят</li>
                  </>
                )}
                {bodyType === 'rectangle' && (
                  <>
                    <li>• Создавайте иллюзию талии</li>
                    <li>• Используйте пояса и акценты</li>
                    <li>• Многослойность добавит объема</li>
                  </>
                )}
                {bodyType === 'inverted-triangle' && (
                  <>
                    <li>• Акцент на нижнюю часть тела</li>
                    <li>• Избегайте объема в плечах</li>
                    <li>• Расклешенные низы балансируют силуэт</li>
                  </>
                )}
              </ul>
            </div>

            {/* Кнопки действий */}
            <div className="flex justify-center gap-4 pt-4">
              <Button 
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Редактировать данные
              </Button>
              <Button 
                onClick={() => {
                  toast({
                    title: "Данные подтверждены",
                    description: "Переходим к настройке стилевых предпочтений",
                  });
                  onComplete?.({ bodyType, measurements });
                  onContinue?.();
                }}
                className="px-8"
              >
                Подтвердить данные и продолжить
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма редактирования */}
      {isEditing && (
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Редактирование данных
            </CardTitle>
            <CardDescription>
              Внесите изменения в параметры и нажмите "Сохранить"
            </CardDescription>
          </CardHeader>
                     <CardContent className="space-y-6">
             <div className="grid md:grid-cols-2 gap-4">
               <div>
                 <Label htmlFor="edit-height">Рост (см) *</Label>
                 <Input
                   id="edit-height"
                   type="number"
                   placeholder="170"
                   value={measurements.height || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, height: Number(e.target.value) }))}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-weight">Вес (кг) *</Label>
                 <Input
                   id="edit-weight"
                   type="number"
                   placeholder="65"
                   value={measurements.weight || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, weight: Number(e.target.value) }))}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-chest">Обхват груди (см)</Label>
                 <Input
                   id="edit-chest"
                   type="number"
                   placeholder="88"
                   value={measurements.chest || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, chest: Number(e.target.value) }))}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-waist">Обхват талии (см)</Label>
                 <Input
                   id="edit-waist"
                   type="number"
                   placeholder="68"
                   value={measurements.waist || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, waist: Number(e.target.value) }))}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-hips">Обхват бедер (см)</Label>
                 <Input
                   id="edit-hips"
                   type="number"
                   placeholder="92"
                   value={measurements.hips || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, hips: Number(e.target.value) }))}
                 />
               </div>
               <div>
                 <Label htmlFor="edit-shoulders">Ширина плеч (см)</Label>
                 <Input
                   id="edit-shoulders"
                   type="number"
                   placeholder="86"
                   value={measurements.shoulders || ''}
                   onChange={(e) => setMeasurements(prev => ({ ...prev, shoulders: Number(e.target.value) }))}
                 />
               </div>
             </div>
             <p className="text-sm text-muted-foreground">* Обязательные поля</p>

            <div className="flex justify-center gap-4 pt-4">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // Пересчитываем тип фигуры при изменении данных
                  const newBodyType = analyzeBodyType(measurements);
                  setBodyType(newBodyType);
                }}
              >
                Сохранить изменения
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};