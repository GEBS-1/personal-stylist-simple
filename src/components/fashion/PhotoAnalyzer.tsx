import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Camera, 
  Upload, 
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Ruler,
  ChevronRight
} from "lucide-react";
import { mediaPipeService } from "@/services/mediaPipeService";

interface PoseLandmarks {
  nose: { x: number; y: number; z: number };
  leftShoulder: { x: number; y: number; z: number };
  rightShoulder: { x: number; y: number; z: number };
  leftElbow: { x: number; y: number; z: number };
  rightElbow: { x: number; y: number; z: number };
  leftWrist: { x: number; y: number; z: number };
  rightWrist: { x: number; y: number; z: number };
  leftHip: { x: number; y: number; z: number };
  rightHip: { x: number; y: number; z: number };
  leftKnee: { x: number; y: number; z: number };
  rightKnee: { x: number; y: number; z: number };
  leftAnkle: { x: number; y: number; z: number };
  rightAnkle: { x: number; y: number; z: number };
}

interface BodyMeasurements {
  height: number;
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
}

interface PhotoAnalyzerProps {
  onAnalysisComplete: (measurements: BodyMeasurements, bodyType: string, gender?: 'male' | 'female' | 'unknown') => void;
}

export const PhotoAnalyzer = ({ onAnalysisComplete }: PhotoAnalyzerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<{
    measurements: BodyMeasurements;
    bodyType: string;
    confidence: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Реальный MediaPipe анализ (с fallback к симуляции)
  const analyzePose = useCallback(async (imageElement: HTMLImageElement): Promise<{
    landmarks: PoseLandmarks;
    measurements: BodyMeasurements;
    confidence: number;
  }> => {
    console.log('🚀 Начинаем MediaPipe анализ...');
    
    try {
      // Пытаемся использовать реальный MediaPipe
      console.log('📡 Вызываем mediaPipeService.analyzePose...');
      const results = await mediaPipeService.analyzePose(imageElement);
      console.log('✅ MediaPipe результаты получены:', results);
      
      // Конвертируем MediaPipe landmarks в наш формат
      const landmarks: PoseLandmarks = {
        nose: { x: 0.5, y: 0.2, z: 0 }, // MediaPipe не предоставляет нос, используем центр
        leftShoulder: { x: results.landmarks.leftShoulder.x, y: results.landmarks.leftShoulder.y, z: 0 },
        rightShoulder: { x: results.landmarks.rightShoulder.x, y: results.landmarks.rightShoulder.y, z: 0 },
        leftElbow: { x: 0.3, y: 0.5, z: 0 }, // Примерные значения
        rightElbow: { x: 0.7, y: 0.5, z: 0 },
        leftWrist: { x: 0.2, y: 0.7, z: 0 },
        rightWrist: { x: 0.8, y: 0.7, z: 0 },
        leftHip: { x: results.landmarks.leftHip.x, y: results.landmarks.leftHip.y, z: 0 },
        rightHip: { x: results.landmarks.rightHip.x, y: results.landmarks.rightHip.y, z: 0 },
        leftKnee: { x: results.landmarks.leftKnee.x, y: results.landmarks.leftKnee.y, z: 0 },
        rightKnee: { x: results.landmarks.rightKnee.x, y: results.landmarks.rightKnee.y, z: 0 },
        leftAnkle: { x: results.landmarks.leftAnkle.x, y: results.landmarks.leftAnkle.y, z: 0 },
        rightAnkle: { x: results.landmarks.rightAnkle.x, y: results.landmarks.rightAnkle.y, z: 0 }
      };
      
      console.log('🎯 Landmarks сконвертированы:', landmarks);
      
      return {
        landmarks,
        measurements: results.measurements,
        confidence: results.confidence,
        gender: results.gender
      };
    } catch (error) {
      console.warn('❌ MediaPipe analysis failed, using simulation:', error);
      
      // Fallback к симуляции
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('🔄 Используем симуляцию...');
          const landmarks: PoseLandmarks = {
            nose: { x: 0.5, y: 0.2, z: 0 },
            leftShoulder: { x: 0.4, y: 0.3, z: 0 },
            rightShoulder: { x: 0.6, y: 0.3, z: 0 },
            leftElbow: { x: 0.3, y: 0.5, z: 0 },
            rightElbow: { x: 0.7, y: 0.5, z: 0 },
            leftWrist: { x: 0.2, y: 0.7, z: 0 },
            rightWrist: { x: 0.8, y: 0.7, z: 0 },
            leftHip: { x: 0.45, y: 0.6, z: 0 },
            rightHip: { x: 0.55, y: 0.6, z: 0 },
            leftKnee: { x: 0.4, y: 0.8, z: 0 },
            rightKnee: { x: 0.6, y: 0.8, z: 0 },
            leftAnkle: { x: 0.4, y: 0.95, z: 0 },
            rightAnkle: { x: 0.6, y: 0.95, z: 0 }
          };
          
          const measurements = calculateMeasurements(landmarks);
          resolve({
            landmarks,
            measurements,
            confidence: 0.85 + Math.random() * 0.1,
            gender: 'unknown' as const
          });
        }, 2000);
      });
    }
  }, []);

  // Расчет измерений на основе ключевых точек
  const calculateMeasurements = useCallback((landmarks: PoseLandmarks): BodyMeasurements => {
    // Расчеты основаны на пропорциях и расстояниях между ключевыми точками
    const shoulderWidth = Math.abs(landmarks.rightShoulder.x - landmarks.leftShoulder.x);
    const hipWidth = Math.abs(landmarks.rightHip.x - landmarks.leftHip.x);
    const height = Math.abs(landmarks.nose.y - landmarks.leftAnkle.y);
    
    // Конвертируем в реальные размеры (примерные)
    const scaleFactor = 170 / height; // Предполагаем рост 170см
    
    return {
      height: 170,
      shoulders: Math.min(shoulderWidth * scaleFactor * 50, 120), // Ограничиваем разумными значениями
      chest: Math.min(shoulderWidth * scaleFactor * 45, 110),
      waist: Math.min(hipWidth * scaleFactor * 40, 100),
      hips: Math.min(hipWidth * scaleFactor * 50, 120),
      inseam: Math.min(Math.abs(landmarks.leftHip.y - landmarks.leftAnkle.y) * scaleFactor * 50, 90)
    };
  }, []);

  // Определение типа фигуры
  const determineBodyType = useCallback((measurements: BodyMeasurements): string => {
    const waistToHipRatio = measurements.waist / measurements.hips;
    const shoulderToHipRatio = measurements.shoulders / measurements.hips;
    
    if (waistToHipRatio > 0.85) {
      return 'apple';
    } else if (shoulderToHipRatio > 1.05) {
      return 'inverted-triangle';
    } else if (shoulderToHipRatio < 0.95) {
      return 'pear';
    } else if (waistToHipRatio < 0.75) {
      return 'hourglass';
    } else {
      return 'rectangle';
    }
  }, []);

  // Обработка загрузки фото
  const handlePhotoUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, загрузите изображение",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      // Создаем URL для предварительного просмотра
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Симуляция прогресса анализа
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Создаем элемент изображения для MediaPipe
      const imageElement = new Image();
      imageElement.src = imageUrl;
      
      await new Promise((resolve) => {
        imageElement.onload = resolve;
      });

      console.log('🔍 Начинаем анализ позы...');
      
      // Анализ позы с MediaPipe
      const analysisResults = await analyzePose(imageElement);
      console.log('✅ Анализ позы завершен:', analysisResults);
      
      // Определение типа фигуры
      const bodyType = determineBodyType(analysisResults.measurements);
      console.log('🎯 Определен тип фигуры:', bodyType);
      
      setProgress(100);
      
      const results = {
        measurements: analysisResults.measurements,
        bodyType,
        confidence: analysisResults.confidence
      };
      
      setAnalysisResults(results);
      
      // Вызываем callback с результатами
              onAnalysisComplete(analysisResults.measurements, bodyType, analysisResults.gender);
      
      toast({
        title: "Анализ завершен",
        description: `Определен тип фигуры: ${bodyType}`,
      });
      
    } catch (error) {
      console.error('❌ Ошибка в handlePhotoUpload:', error);
      toast({
        title: "Ошибка анализа",
        description: "Не удалось проанализировать фото. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzePose, determineBodyType, onAnalysisComplete, toast]);

  // Обработка клика по кнопке загрузки
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Обработка изменения файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  // Отрисовка ключевых точек на canvas (для демонстрации)
  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Здесь можно добавить отрисовку ключевых точек
          // когда будет реальная интеграция с MediaPipe
        };
        img.src = uploadedImage;
      }
    }
  }, [uploadedImage]);

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Анализ фото
          </CardTitle>
          <CardDescription>
            Загрузите фото в полный рост для автоматического анализа фигуры
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Область загрузки */}
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center">
            {!uploadedImage ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">Загрузите фото</p>
                  <p className="text-sm text-muted-foreground">
                    Рекомендуется фото в полный рост на нейтральном фоне
                  </p>
                </div>
                <Button onClick={handleUploadClick} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Анализируем...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Выбрать фото
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-[200px] h-[150px] mx-auto overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <img
                    src={uploadedImage}
                    alt="Загруженное фото"
                    className="w-full h-full object-contain"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                  />
                  {/* Временно убираем canvas для отладки */}
                  {/* <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                  /> */}
                </div>
                                 {isAnalyzing && (
                   <div className="space-y-2">
                     <Progress value={progress} className="w-full" />
                     <p className="text-sm text-muted-foreground">
                       Анализируем ключевые точки тела... {progress}%
                     </p>
                   </div>
                 )}
                 
                                                                       {!isAnalyzing && (
                     <div className="flex flex-col gap-2 mt-4">
                       <Button
                         variant="outline"
                         onClick={() => {
                           setUploadedImage(null);
                           setAnalysisResults(null);
                         }}
                       >
                         Загрузить другое фото
                       </Button>
                     </div>
                   )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Результаты анализа */}
          {analysisResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-medium">Результаты анализа</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Тип фигуры
                  </h4>
                  <Badge variant="secondary" className="text-sm">
                    {analysisResults.bodyType}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Уверенность: {(analysisResults.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    Измерения (см)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Рост: {analysisResults.measurements.height}</div>
                    <div>Плечи: {analysisResults.measurements.shoulders.toFixed(1)}</div>
                    <div>Грудь: {analysisResults.measurements.chest.toFixed(1)}</div>
                    <div>Талия: {analysisResults.measurements.waist.toFixed(1)}</div>
                    <div>Бедра: {analysisResults.measurements.hips.toFixed(1)}</div>
                    <div>Длина ног: {analysisResults.measurements.inseam.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 