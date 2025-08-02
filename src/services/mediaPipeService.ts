// Сервис для работы с MediaPipe Pose Landmarker
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export interface PoseLandmarks {
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip: { x: number; y: number };
  rightHip: { x: number; y: number };
  leftKnee: { x: number; y: number };
  rightKnee: { x: number; y: number };
  leftAnkle: { x: number; y: number };
  rightAnkle: { x: number; y: number };
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
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numPoses: 1
      });

      this.isInitialized = true;
      console.log('MediaPipe Pose Landmarker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  async analyzePose(imageElement: HTMLImageElement): Promise<{
    landmarks: PoseLandmarks;
    measurements: BodyMeasurements;
    confidence: number;
    gender?: 'male' | 'female' | 'unknown';
  }> {
    if (!this.poseLandmarker) {
      await this.initialize();
    }

    try {
      const results = await this.poseLandmarker!.detect(imageElement);
      
      if (!results.landmarks || results.landmarks.length === 0) {
        throw new Error('No pose detected in image');
      }

      const landmarks = results.landmarks[0];
      const poseLandmarks = this.extractKeyLandmarks(landmarks);
      const measurements = this.calculateMeasurements(poseLandmarks, imageElement);
      const confidence = this.calculateConfidence(results);
      const gender = this.detectGender(landmarks, measurements);

      return {
        landmarks: poseLandmarks,
        measurements,
        confidence,
        gender
      };
    } catch (error) {
      console.error('Pose analysis failed:', error);
      throw error;
    }
  }

  private extractKeyLandmarks(landmarks: any[]): PoseLandmarks {
    return {
      leftShoulder: { x: landmarks[11].x, y: landmarks[11].y },
      rightShoulder: { x: landmarks[12].x, y: landmarks[12].y },
      leftHip: { x: landmarks[23].x, y: landmarks[23].y },
      rightHip: { x: landmarks[24].x, y: landmarks[24].y },
      leftKnee: { x: landmarks[25].x, y: landmarks[25].y },
      rightKnee: { x: landmarks[26].x, y: landmarks[26].y },
      leftAnkle: { x: landmarks[27].x, y: landmarks[27].y },
      rightAnkle: { x: landmarks[28].x, y: landmarks[28].y }
    };
  }

  private calculateMeasurements(landmarks: PoseLandmarks, image: HTMLImageElement): BodyMeasurements {
    // Расчет масштаба на основе известного роста (предполагаем 170см)
    const shoulderWidth = Math.abs(landmarks.leftShoulder.x - landmarks.rightShoulder.x) * image.width;
    const hipWidth = Math.abs(landmarks.leftHip.x - landmarks.rightHip.x) * image.width;
    
    // Примерный масштаб (в реальном проекте нужно калибровать)
    const scaleFactor = 170 / (Math.abs(landmarks.leftShoulder.y - landmarks.leftAnkle.y) * image.height);

    return {
      height: 170, // Предполагаемый рост
      shoulders: Math.min(shoulderWidth * scaleFactor * 50, 120),
      chest: Math.min(shoulderWidth * scaleFactor * 45, 110),
      waist: Math.min(hipWidth * scaleFactor * 40, 100),
      hips: Math.min(hipWidth * scaleFactor * 50, 120),
      inseam: Math.min(Math.abs(landmarks.leftHip.y - landmarks.leftAnkle.y) * scaleFactor * 50, 90)
    };
  }

  private calculateConfidence(results: any): number {
    // Расчет уверенности на основе количества обнаруженных ключевых точек
    const detectedLandmarks = results.landmarks[0].filter((lm: any) => lm.visibility > 0.5);
    return detectedLandmarks.length / 33; // 33 ключевые точки в MediaPipe Pose
  }

  private detectGender(landmarks: any[], measurements: BodyMeasurements): 'male' | 'female' | 'unknown' {
    try {
      // Простая эвристика для определения пола на основе пропорций
      const shoulderToHipRatio = measurements.shoulders / measurements.hips;
      const waistToHipRatio = measurements.waist / measurements.hips;
      
      console.log('🔍 Gender detection ratios:', { shoulderToHipRatio, waistToHipRatio });
      
      // Мужские пропорции: более широкие плечи, меньшее соотношение талия-бедра
      // Женские пропорции: более узкие плечи, большее соотношение талия-бедра
      
      if (shoulderToHipRatio > 1.1 && waistToHipRatio < 0.85) {
        console.log('👨 Detected: male');
        return 'male';
      } else if (shoulderToHipRatio < 1.0 && waistToHipRatio > 0.75) {
        console.log('👩 Detected: female');
        return 'female';
      } else {
        console.log('❓ Detected: unknown');
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