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

    console.log('🔐 Getting GigaChat access token via proxy...');

    try {
      // Используем прокси для получения токена
      const response = await fetch(`${this.proxyUrl}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GigaChat proxy test failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        if (data.fallback) {
          console.log('⚠️ GigaChat authentication failed, using fallback mode');
          this.accessToken = 'fallback_token';
          this.tokenExpiry = Date.now() + (3600 * 1000); // 1 час
          return this.accessToken;
        }
        throw new Error(`GigaChat proxy error: ${data.error}`);
      }

      // Прокси обрабатывает аутентификацию, используем фиктивный токен
      this.accessToken = 'proxy_token';
      this.tokenExpiry = Date.now() + (3600 * 1000); // 1 час

      console.log('✅ GigaChat proxy connection successful');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Failed to connect to GigaChat proxy:', error);
      throw error;
    }
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
      throw error;
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
        console.log('⚠️ GigaChat authentication failed, returning false to trigger fallback');
        return false;
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
      
      return hasModels;

    } catch (error) {
      console.error('❌ GigaChat connection test failed:', error);
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
