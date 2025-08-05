// Сервис для работы с MediaPipe Pose Landmarker
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface PoseLandmarks {
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

export interface BodyMeasurements {
  height: number;
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  inseam: number;
  gender?: 'male' | 'female' | 'unknown';
}

class MediaPipeService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing MediaPipe Pose Landmarker...');
      
      // Проверка поддержки WebGL
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('⚠️ WebGL not supported, using CPU delegate');
      } else {
        console.log('✅ WebGL supported, using GPU delegate');
      }
      
      // Попытка загрузки WASM
      console.log('📦 Loading MediaPipe WASM...');
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      console.log('✅ WASM loaded successfully');

      // Попытка создания PoseLandmarker
      console.log('🔧 Creating PoseLandmarker...');
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: gl ? "GPU" : "CPU"
        },
        runningMode: "IMAGE",
        numPoses: 1
      });

      this.isInitialized = true;
      console.log('✅ MediaPipe Pose Landmarker initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MediaPipe:', error);
      console.log('🔄 Falling back to simulation mode');
      // Не выбрасываем ошибку, а позволяем использовать fallback
      this.isInitialized = false;
    }
  }

  async analyzePose(imageElement: HTMLImageElement): Promise<{
    landmarks: PoseLandmarks;
    measurements: BodyMeasurements;
    confidence: number;
    gender?: 'male' | 'female' | 'unknown';
  }> {
    console.log('🚀 Starting MediaPipe pose analysis...');
    console.log('🖼️ Image element:', imageElement.width, 'x', imageElement.height);
    
    if (!this.poseLandmarker) {
      console.log('🔧 Initializing MediaPipe...');
      await this.initialize();
    }

    if (!this.poseLandmarker) {
      console.error('❌ MediaPipe failed to initialize');
      throw new Error('MediaPipe not initialized');
    }

    try {
      console.log('📡 Calling MediaPipe detect...');
      const results = await this.poseLandmarker.detect(imageElement);
      console.log('📊 MediaPipe results:', results);
      
      if (!results.landmarks || results.landmarks.length === 0) {
        console.error('❌ No landmarks detected');
        throw new Error('No pose detected in image');
      }

      console.log('✅ Landmarks detected:', results.landmarks.length, 'poses');
      const landmarks = results.landmarks[0];
      console.log('🎯 First pose landmarks:', landmarks.length, 'points');
      
      const poseLandmarks = this.extractKeyLandmarks(landmarks);
      const measurements = this.calculateMeasurements(poseLandmarks, imageElement);
      const confidence = this.calculateConfidence(results);
      const gender = this.detectGender(landmarks, measurements);

      const result = {
        landmarks: poseLandmarks,
        measurements,
        confidence,
        gender
      };
      
      console.log('✅ MediaPipe analysis completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Pose analysis failed:', error);
      throw error;
    }
  }

  private extractKeyLandmarks(landmarks: any[]): PoseLandmarks {
    console.log('🔍 Extracting landmarks from MediaPipe results:', landmarks.length, 'landmarks found');
    
    return {
      nose: { x: landmarks[0]?.x || 0.5, y: landmarks[0]?.y || 0.2, z: landmarks[0]?.z || 0 },
      leftShoulder: { x: landmarks[11]?.x || 0.4, y: landmarks[11]?.y || 0.3, z: landmarks[11]?.z || 0 },
      rightShoulder: { x: landmarks[12]?.x || 0.6, y: landmarks[12]?.y || 0.3, z: landmarks[12]?.z || 0 },
      leftElbow: { x: landmarks[13]?.x || 0.3, y: landmarks[13]?.y || 0.5, z: landmarks[13]?.z || 0 },
      rightElbow: { x: landmarks[14]?.x || 0.7, y: landmarks[14]?.y || 0.5, z: landmarks[14]?.z || 0 },
      leftWrist: { x: landmarks[15]?.x || 0.2, y: landmarks[15]?.y || 0.7, z: landmarks[15]?.z || 0 },
      rightWrist: { x: landmarks[16]?.x || 0.8, y: landmarks[16]?.y || 0.7, z: landmarks[16]?.z || 0 },
      leftHip: { x: landmarks[23]?.x || 0.45, y: landmarks[23]?.y || 0.6, z: landmarks[23]?.z || 0 },
      rightHip: { x: landmarks[24]?.x || 0.55, y: landmarks[24]?.y || 0.6, z: landmarks[24]?.z || 0 },
      leftKnee: { x: landmarks[25]?.x || 0.4, y: landmarks[25]?.y || 0.8, z: landmarks[25]?.z || 0 },
      rightKnee: { x: landmarks[26]?.x || 0.6, y: landmarks[26]?.y || 0.8, z: landmarks[26]?.z || 0 },
      leftAnkle: { x: landmarks[27]?.x || 0.4, y: landmarks[27]?.y || 0.95, z: landmarks[27]?.z || 0 },
      rightAnkle: { x: landmarks[28]?.x || 0.6, y: landmarks[28]?.y || 0.95, z: landmarks[28]?.z || 0 }
    };
  }

  private calculateMeasurements(landmarks: PoseLandmarks, image: HTMLImageElement): BodyMeasurements {
    console.log('📏 Calculating measurements from landmarks:', landmarks);
    console.log('🖼️ Image dimensions:', image.width, 'x', image.height);
    
    // Используем реальные пропорции из MediaPipe landmarks
    const shoulderWidth = Math.abs(landmarks.leftShoulder.x - landmarks.rightShoulder.x) * image.width;
    const hipWidth = Math.abs(landmarks.leftHip.x - landmarks.rightHip.x) * image.width;
    const totalHeight = Math.abs(landmarks.nose.y - landmarks.leftAnkle.y) * image.height;
    const torsoHeight = Math.abs(landmarks.leftShoulder.y - landmarks.leftHip.y) * image.height;
    const legHeight = Math.abs(landmarks.leftHip.y - landmarks.leftAnkle.y) * image.height;
    
    // Более точный расчет масштаба
    const scaleFactor = 170 / totalHeight;
    
    // Расчет реальных измерений на основе пропорций
    const shoulders = Math.round(shoulderWidth * scaleFactor);
    const hips = Math.round(hipWidth * scaleFactor);
    const chest = Math.round(shoulders * 0.9); // Грудь обычно на 10% меньше плеч
    const waist = Math.round(hips * 0.8); // Талия обычно на 20% меньше бедер
    const inseam = Math.round(legHeight * scaleFactor * 0.6); // Длина ног (внутренний шов)
    
    const measurements = {
      height: 170,
      shoulders: Math.min(Math.max(shoulders, 30), 150), // Ограничиваем разумными значениями
      chest: Math.min(Math.max(chest, 25), 140),
      waist: Math.min(Math.max(waist, 20), 130),
      hips: Math.min(Math.max(hips, 25), 150),
      inseam: Math.min(Math.max(inseam, 20), 100)
    };
    
    console.log('📊 Raw calculations:', {
      shoulderWidth: shoulderWidth.toFixed(1),
      hipWidth: hipWidth.toFixed(1),
      totalHeight: totalHeight.toFixed(1),
      scaleFactor: scaleFactor.toFixed(3)
    });
    
    console.log('📊 Calculated measurements:', measurements);
    return measurements;
  }

  private calculateConfidence(results: any): number {
    // Расчет уверенности на основе количества обнаруженных ключевых точек
    const detectedLandmarks = results.landmarks[0].filter((lm: any) => lm.visibility > 0.5);
    return detectedLandmarks.length / 33; // 33 ключевые точки в MediaPipe Pose
  }

  private detectGender(landmarks: any[], measurements: BodyMeasurements): 'male' | 'female' | 'unknown' {
    try {
      // Анализируем реальные MediaPipe landmarks для определения пола
      console.log('🔍 Analyzing MediaPipe landmarks for gender detection...');
      
      // Получаем ключевые точки для анализа
      const nose = landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const leftKnee = landmarks[25];
      const rightKnee = landmarks[26];
      
      // Проверяем видимость ключевых точек
      const visibleLandmarks = [nose, leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee];
      const visibleCount = visibleLandmarks.filter(lm => lm && lm.visibility > 0.5).length;
      
      console.log('👁️ Visible landmarks:', visibleCount, 'out of', visibleLandmarks.length);
      
      if (visibleCount < 4) {
        console.log('❓ Not enough visible landmarks for gender detection');
        return 'unknown';
      }
      
      // Анализируем пропорции тела
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      const hipWidth = Math.abs(leftHip.x - rightHip.x);
      const torsoHeight = Math.abs((leftShoulder.y + rightShoulder.y) / 2 - (leftHip.y + rightHip.y) / 2);
      const legHeight = Math.abs((leftHip.y + rightHip.y) / 2 - (leftKnee.y + rightKnee.y) / 2);
      
      const shoulderToHipRatio = shoulderWidth / hipWidth;
      const torsoToLegRatio = torsoHeight / legHeight;
      
      console.log('📊 Body proportions:', {
        shoulderToHipRatio: shoulderToHipRatio.toFixed(3),
        torsoToLegRatio: torsoToLegRatio.toFixed(3),
        shoulderWidth: shoulderWidth.toFixed(3),
        hipWidth: hipWidth.toFixed(3)
      });
      
      // Улучшенная логика определения пола
      // Мужчины обычно имеют более широкие плечи относительно бедер
      // и более короткий торс относительно ног
      if (shoulderToHipRatio > 1.05 && torsoToLegRatio < 0.8) {
        console.log('👨 Detected: male (wide shoulders, long legs)');
        return 'male';
      } else if (shoulderToHipRatio < 0.95 && torsoToLegRatio > 0.9) {
        console.log('👩 Detected: female (narrow shoulders, shorter legs)');
        return 'female';
      } else if (shoulderToHipRatio > 1.02) {
        console.log('👨 Detected: male (wide shoulders)');
        return 'male';
      } else if (shoulderToHipRatio < 0.98) {
        console.log('👩 Detected: female (narrow shoulders)');
        return 'female';
      } else {
        console.log('❓ Detected: unknown (ambiguous proportions)');
        return 'unknown';
      }
    } catch (error) {
      console.warn('Gender detection failed:', error);
      return 'unknown';
    }
  }

  // Рисование ключевых точек на canvas
  drawLandmarks(canvas: HTMLCanvasElement, landmarks: PoseLandmarks, image: HTMLImageElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;

    // Рисуем скелет
    const points = [
      [landmarks.leftShoulder, landmarks.rightShoulder],
      [landmarks.leftShoulder, landmarks.leftHip],
      [landmarks.rightShoulder, landmarks.rightHip],
      [landmarks.leftHip, landmarks.rightHip],
      [landmarks.leftHip, landmarks.leftKnee],
      [landmarks.rightHip, landmarks.rightKnee],
      [landmarks.leftKnee, landmarks.leftAnkle],
      [landmarks.rightKnee, landmarks.rightAnkle]
    ];

    points.forEach(([start, end]) => {
      ctx.beginPath();
      ctx.moveTo(start.x * image.width, start.y * image.height);
      ctx.lineTo(end.x * image.width, end.y * image.height);
      ctx.stroke();
    });

    // Рисуем ключевые точки
    Object.values(landmarks).forEach(point => {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(point.x * image.width, point.y * image.height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
}

export const mediaPipeService = new MediaPipeService();
export type { BodyMeasurements }; 