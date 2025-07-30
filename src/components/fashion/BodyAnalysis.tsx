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
  AlertCircle
} from "lucide-react";

interface BodyMeasurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  hips: number;
  shoulders: number;
}

type BodyType = 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle';

const bodyTypeDescriptions = {
  apple: "Яблоко - полнота в области талии",
  pear: "Груша - узкие плечи, широкие бедра",
  hourglass: "Песочные часы - пропорциональная фигура",
  rectangle: "Прямоугольник - равные пропорции",
  'inverted-triangle': "Перевернутый треугольник - широкие плечи"
};

export const BodyAnalysis = () => {
  const [activeTab, setActiveTab] = useState<'photo' | 'manual'>('photo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: 0,
    weight: 0,
    chest: 0,
    waist: 0,
    hips: 0,
    shoulders: 0
  });
  
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
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Анализ фото с помощью ИИ
              </CardTitle>
              <CardDescription>
                Загрузите фото в полный рост для автоматического определения параметров фигуры
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAnalyzing && !analysisComplete && (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 smooth-transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Загрузить фото</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Поддерживаются форматы: JPG, PNG, WEBP
                  </p>
                  <Button>
                    Выбрать файл
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
                  <h3 className="text-lg font-medium">Анализируем фото...</h3>
                  <p className="text-sm text-muted-foreground">
                    Определяем ключевые точки тела и рассчитываем параметры
                  </p>
                  <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                </div>
              )}

              {analysisComplete && (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
                  <h3 className="text-lg font-medium">Анализ завершен</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAnalysisComplete(false);
                      setBodyType(null);
                      setMeasurements({
                        height: 0,
                        weight: 0,
                        chest: 0,
                        waist: 0,
                        hips: 0,
                        shoulders: 0
                      });
                    }}
                  >
                    Загрузить другое фото
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                    <Label htmlFor="height">Рост (см)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="165"
                      value={measurements.height || ''}
                      onChange={(e) => handleMeasurementChange('height', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Вес (кг)</Label>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Результаты анализа */}
      {bodyType && (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};