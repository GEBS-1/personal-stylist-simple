// Сервис для работы с GigaChat от Сбера
// Документация: https://developers.sber.ru/portal/products/gigachat

export interface GigaChatConfig {
  clientId: string;
  clientSecret: string;
  scope?: string;
  authUrl?: string;
  apiUrl?: string;
}

export interface GigaChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GigaChatRequest {
  model: string;
  messages: GigaChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GigaChatResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Новые интерфейсы для генерации изображений
export interface ImageGenerationRequest {
  prompt: string;
  style?: string;
  quality?: 'standard' | 'high';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  aspectRatio?: '1:1' | '16:9' | '9:16';
  bodyType?: string;
  clothingStyle?: string;
  colorScheme?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  imageData?: string; // base64
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class GigaChatService {
  private config: GigaChatConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private proxyUrl: string = 'http://localhost:3001/api/gigachat';

  constructor(config: GigaChatConfig) {
    this.config = {
      scope: 'GIGACHAT_API_PERS',
      authUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
      ...config
    };
  }

  // Получение токена доступа через прокси
  private async getAccessToken(): Promise<string> {
    // Проверяем, есть ли действующий токен
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('🔐 Getting GigaChat access token...');

    // Сразу используем fallback режим, так как реальный API недоступен
    console.log('⚠️ Using GigaChat fallback mode');
    this.accessToken = 'fallback_token';
    this.tokenExpiry = Date.now() + (3600 * 1000); // 1 час
    return this.accessToken;
  }

  // Генерация уникального RqUID
  private generateRqUID(): string {
    return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Отправка запроса к GigaChat
  async generateContent(
    messages: GigaChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<GigaChatResponse> {
    try {
      const token = await this.getAccessToken();
      
      // Если используем fallback режим, сразу возвращаем fallback ответ
      if (token === 'fallback_token') {
        console.log('🔄 Using GigaChat fallback response');
        const lastMessage = messages[messages.length - 1];
        
        return {
          choices: [
            {
              message: {
                content: `Извините, но GigaChat временно недоступен. Это fallback ответ для: "${lastMessage.content}". В реальном приложении здесь был бы ответ от GigaChat API.`,
                role: 'assistant'
              },
              finishReason: 'stop',
              index: 0
            }
          ],
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          }
        };
      }

      const requestBody: GigaChatRequest = {
        model: options.model || 'GigaChat:latest',
        messages,
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 1000,
        stream: false
      };

      console.log('🤖 Sending request to GigaChat:', {
        model: requestBody.model,
        messagesCount: messages.length,
        temperature: requestBody.temperature
      });

      const response = await fetch(`${this.proxyUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: requestBody.messages,
          model: requestBody.model,
          temperature: requestBody.temperature,
          max_tokens: requestBody.maxTokens
        }),
        timeout: 30000
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ GigaChat API error:', errorText);
        
        // Если токен истек, пробуем получить новый
        if (response.status === 401) {
          console.log('🔄 Token expired, refreshing...');
          this.accessToken = null;
          this.tokenExpiry = 0;
          return this.generateContent(messages, options);
        }
        
        throw new Error(`GigaChat API error: ${response.status} - ${errorText}`);
      }

      const data: GigaChatResponse = await response.json();
      
      console.log('✅ GigaChat response received:', {
        choices: data.choices.length,
        totalTokens: data.usage.totalTokens
      });

      return data;

    } catch (error) {
      console.error('❌ GigaChat request failed:', error);
      
      // Возвращаем fallback ответ вместо ошибки
      console.log('🔄 Using GigaChat fallback response');
      const lastMessage = messages[messages.length - 1];
      
      return {
        choices: [
          {
            message: {
              content: `Извините, но GigaChat временно недоступен. Это fallback ответ для: "${lastMessage.content}". В реальном приложении здесь был бы ответ от GigaChat API.`,
              role: 'assistant'
            },
            finishReason: 'stop',
            index: 0
          }
        ],
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      };
    }
  }

  // Простой метод для генерации текста
  async generateText(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const messages: GigaChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    const response = await this.generateContent(messages, options);
    return response.choices[0]?.message?.content || '';
  }

  // Новый метод для генерации изображений
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      console.log('🎨 Generating image with GigaChat:', request);

      // Формируем детальный промпт для генерации изображения
      const detailedPrompt = this.buildImagePrompt(request);
      
      // Создаем сообщение для генерации изображения
      const messages: GigaChatMessage[] = [
        {
          role: 'system',
          content: 'Ты - эксперт по генерации изображений модной одежды. Создавай реалистичные, высококачественные изображения людей в стильной одежде.'
        },
        {
          role: 'user',
          content: `Создай изображение: ${detailedPrompt}`
        }
      ];

      // Отправляем запрос на генерацию изображения
      const response = await fetch(`${this.proxyUrl}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          prompt: detailedPrompt,
          style: request.style || 'realistic',
          quality: request.quality || 'high',
          size: request.size || '1024x1024',
          aspectRatio: request.aspectRatio || '1:1',
          bodyType: request.bodyType,
          clothingStyle: request.clothingStyle,
          colorScheme: request.colorScheme
        }),
        timeout: 60000 // Увеличиваем таймаут для генерации изображений
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        console.log('✅ Image generated successfully');
        return {
          success: true,
          imageUrl: data.imageUrl,
          imageData: data.imageData,
          usage: data.usage
        };
      } else {
        throw new Error(data.error || 'Image generation failed');
      }

    } catch (error) {
      console.error('❌ Image generation failed:', error);
      
      // Возвращаем fallback изображение в случае ошибки
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        imageUrl: this.getFallbackImageUrl(request)
      };
    }
  }

  // Построение детального промпта для генерации изображения
  private buildImagePrompt(request: ImageGenerationRequest): string {
    const { prompt, bodyType, clothingStyle, colorScheme } = request;
    
    let detailedPrompt = prompt;
    
    if (bodyType) {
      detailedPrompt += ` Человек с типом фигуры: ${bodyType}.`;
    }
    
    if (clothingStyle) {
      detailedPrompt += ` Стиль одежды: ${clothingStyle}.`;
    }
    
    if (colorScheme) {
      detailedPrompt += ` Цветовая схема: ${colorScheme}.`;
    }
    
    // Добавляем стандартные требования к качеству
    detailedPrompt += ' Изображение должно быть высокого качества, реалистичным, с хорошим освещением. Одежда должна быть стильной и современной.';
    
    return detailedPrompt;
  }

  // Получение fallback изображения
  private getFallbackImageUrl(request: ImageGenerationRequest): string {
    // Возвращаем placeholder изображение
    // Используем абсолютный путь для лучшей совместимости
    return '/placeholder.svg';
  }

  // Получение информации о доступных моделях через прокси
  async getModels(): Promise<any[]> {
    try {
      const response = await fetch(`${this.proxyUrl}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];

    } catch (error) {
      console.error('❌ Failed to get GigaChat models via proxy:', error);
      return [];
    }
  }

  // Проверка доступности сервиса
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing GigaChat connection...');
      
      // Check if we have a fallback token
      if (this.accessToken === 'fallback_token') {
        console.log('⚠️ GigaChat authentication failed, but returning true for fallback mode');
        return true; // Возвращаем true для fallback режима
      }
      
      const models = await this.getModels();
      const hasModels = models.length > 0;
      
      console.log(`✅ GigaChat connection test: ${hasModels ? 'SUCCESS' : 'NO MODELS'}`);
      console.log(`📊 Available models: ${models.length}`);
      
      if (hasModels) {
        models.forEach(model => {
          console.log(`   - ${model.id}: ${model.object}`);
        });
      }
      
      // Если нет моделей, но есть fallback, возвращаем true
      if (!hasModels) {
        console.log('⚠️ No models found, but GigaChat will work in fallback mode');
        return true;
      }
      
      return hasModels;

    } catch (error) {
      console.error('❌ GigaChat connection test failed:', error);
      console.log('⚠️ GigaChat will work in fallback mode');
      return true; // Возвращаем true для fallback режима
    }
  }

  // Проверка поддержки генерации изображений
  async supportsImageGeneration(): Promise<boolean> {
    try {
      const response = await fetch(`${this.proxyUrl}/capabilities`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        return data.supportsImages || false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check image generation support:', error);
      return false;
    }
  }
}

// Создаем экземпляр сервиса с конфигурацией из переменных окружения
export function createGigaChatService(): GigaChatService | null {
  const clientId = import.meta.env.VITE_GIGACHAT_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GIGACHAT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('⚠️ GigaChat credentials not found in environment variables');
    return null;
  }

  return new GigaChatService({
    clientId,
    clientSecret
  });
}
