// Сервис для генерации изображений с поддержкой различных AI-сервисов
import { env } from "@/config/env";

export interface ImageGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'fashion' | 'casual';
  quality?: 'standard' | 'high';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  aspectRatio?: '1:1' | '16:9' | '9:16';
  model?: 'gigachat' | 'dalle' | 'stable-diffusion' | 'midjourney' | 'leonardo';
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  imageData?: string; // base64
  error?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ImageGenerationService {
  private currentProvider: 'gigachat' | 'dalle' | 'stable-diffusion' | 'midjourney' | 'leonardo' = 'gigachat';

  constructor() {
    console.log('🎨 Initializing Image Generation Service...');
    this.initializeProvider();
  }

  private initializeProvider() {
    // Проверяем доступность провайдеров
    const providers = [
      { name: 'dalle', available: this.checkDalleAvailability() },
      { name: 'gigachat', available: this.checkGigaChatAvailability() },
      { name: 'stable-diffusion', available: this.checkStableDiffusionAvailability() },
      { name: 'midjourney', available: this.checkMidjourneyAvailability() },
      { name: 'leonardo', available: this.checkLeonardoAvailability() }
    ];

    const availableProvider = providers.find(p => p.available);
    if (availableProvider) {
      this.currentProvider = availableProvider.name as any;
      console.log(`✅ Selected ${this.currentProvider} as image generation provider`);
    } else {
      console.log('⚠️ No image generation providers available, using fallback');
    }
  }

  private checkGigaChatAvailability(): boolean {
    return !!(env.GIGACHAT_CLIENT_ID && env.GIGACHAT_CLIENT_SECRET);
  }

  private checkDalleAvailability(): boolean {
    return !!env.OPENAI_API_KEY;
  }

  private checkStableDiffusionAvailability(): boolean {
    // Проверяем доступность локального Stable Diffusion или API
    return false; // Пока отключено
  }

  private checkMidjourneyAvailability(): boolean {
    // Проверяем доступность Midjourney API
    return false; // Пока отключено
  }

  private checkLeonardoAvailability(): boolean {
    // Проверяем доступность Leonardo.ai API
    return false; // Пока отключено
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    console.log(`🎨 Generating image with ${this.currentProvider}...`);
    
    try {
      switch (this.currentProvider) {
        case 'gigachat':
          return await this.generateWithGigaChat(request);
        case 'dalle':
          return await this.generateWithDalle(request);
        case 'stable-diffusion':
          return await this.generateWithStableDiffusion(request);
        case 'midjourney':
          return await this.generateWithMidjourney(request);
        case 'leonardo':
          return await this.generateWithLeonardo(request);
        default:
          return this.generateFallbackImage(request);
      }
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      return this.generateFallbackImage(request);
    }
  }

  private async generateWithGigaChat(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const prompt = this.buildGigaChatPrompt(request);
      
      const response = await fetch('http://localhost:3001/api/gigachat/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: request.style || 'realistic',
          quality: request.quality || 'standard',
          size: request.size || '1024x1024'
        })
      });

      if (!response.ok) {
        throw new Error(`GigaChat image generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        return {
          success: true,
          imageUrl: data.imageUrl,
          model: 'gigachat',
          usage: data.usage
        };
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ GigaChat image generation failed:', error);
      return this.generateFallbackImage(request);
    }
  }

  private async generateWithDalle(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      const prompt = this.buildDallePrompt(request);
      
      const response = await fetch('http://localhost:3001/api/dalle/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard'
        })
      });

      if (!response.ok) {
        throw new Error(`DALL-E generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        return {
          success: true,
          imageUrl: data.imageUrl,
          model: data.model || 'dalle',
          usage: data.usage
        };
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ DALL-E generation failed:', error);
      return this.generateFallbackImage(request);
    }
  }

  private generateWithStableDiffusion(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Заглушка для будущей интеграции
    return Promise.resolve(this.generateFallbackImage(request));
  }

  private generateWithMidjourney(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Заглушка для будущей интеграции
    return Promise.resolve(this.generateFallbackImage(request));
  }

  private generateWithLeonardo(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    // Заглушка для будущей интеграции
    return Promise.resolve(this.generateFallbackImage(request));
  }

  private generateFallbackImage(request: ImageGenerationRequest): ImageGenerationResponse {
    console.log('🎭 Using fallback image generation');
    
    // Возвращаем placeholder изображение
    return {
      success: true,
      imageUrl: '/placeholder.svg',
      model: 'fallback',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private buildGigaChatPrompt(request: ImageGenerationRequest): string {
    const styleMap = {
      'realistic': 'фотографическое качество, реалистичный стиль',
      'artistic': 'художественный стиль, творческий подход',
      'fashion': 'стиль fashion-фотографии, профессиональная съемка',
      'casual': 'естественный вид, повседневная фотография'
    };

    const style = styleMap[request.style || 'realistic'];
    
    return `Создай изображение: ${request.prompt}. 
    Стиль: ${style}. 
    Качество: ${request.quality === 'high' ? 'высокое' : 'стандартное'}. 
    Размер: ${request.size}. 
    Изображение должно быть реалистичным и качественным.`;
  }

  private buildDallePrompt(request: ImageGenerationRequest): string {
    const styleMap = {
      'realistic': 'photorealistic, high quality photography',
      'artistic': 'artistic style, creative approach',
      'fashion': 'fashion photography style, professional lighting',
      'casual': 'natural look, casual photography'
    };

    const style = styleMap[request.style || 'realistic'];
    
    return `${request.prompt}, ${style}, high quality, detailed, professional photography`;
  }

  getCurrentProvider(): string {
    return this.currentProvider;
  }

  getAvailableProviders(): string[] {
    const providers = [];
    if (this.checkGigaChatAvailability()) providers.push('gigachat');
    if (this.checkDalleAvailability()) providers.push('dalle');
    if (this.checkStableDiffusionAvailability()) providers.push('stable-diffusion');
    if (this.checkMidjourneyAvailability()) providers.push('midjourney');
    if (this.checkLeonardoAvailability()) providers.push('leonardo');
    return providers;
  }
}

// Создаем экземпляр сервиса
export const imageGenerationService = new ImageGenerationService();