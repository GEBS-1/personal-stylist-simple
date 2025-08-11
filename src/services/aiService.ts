import { env, getValidApiKeys, hasValidAiKey, logConfig } from "@/config/env";
import { findMatchingOutfit, OutfitTemplate } from "@/data/outfitDatabase";
import { createGigaChatService, GigaChatService } from "./gigaChatService";

// Универсальный сервис для работы с разными AI провайдерами
// Автоматически выбирает лучший доступный вариант

export interface OutfitRequest {
  bodyType: string;
  measurements: {
    height: number;
    weight: number;
    gender: 'male' | 'female';
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    shoeSize: number;
  };
  stylePreferences: string[];
  colorPreferences: string[];
  occasion: string;
  season: string;
  budget: string;
}

export interface GeneratedOutfit {
  id: string;
  name: string;
  description: string;
  occasion: string;
  season: string;
  items: any[];
  totalPrice: string;
  styleNotes: string;
  colorPalette: string[];
  confidence: number;
}

type AIProvider = 'openai' | 'gemini' | 'claude' | 'cohere' | 'local' | 'simulation' | 'gigachat';

export class AIService {
  private static instance: AIService | null = null;
  private currentProvider: AIProvider = 'simulation';
  private apiKeys: ReturnType<typeof getValidApiKeys>;
  private responseTimes: Partial<Record<AIProvider, number[]>> = {};
  private gigaChatService: GigaChatService | null = null;
  private initialized = false;

  constructor() {
    if (AIService.instance) {
      return AIService.instance;
    }
    
    console.log('🚀 Initializing AI Service...');
    this.loadAPIKeys();
    this.gigaChatService = createGigaChatService();
    this.initializeProvider();
    AIService.instance = this;
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadAPIKeys() {
    this.apiKeys = getValidApiKeys();
    
    if (!hasValidAiKey()) {
      console.log('⚠️ No valid API keys found. Running in simulation mode.');
    }
  }

  private async initializeProvider() {
    if (this.initialized) {
      console.log('🔧 AI provider already initialized');
      return;
    }
    
    console.log('🔧 Initializing AI provider...');
    
    // Используем только GigaChat по требованию пользователя
    const providers: AIProvider[] = [
      'gigachat',    // 🥇 Единственный активный провайдер - GigaChat
      'simulation'   // 🎭 Fallback - только если GigaChat недоступен
    ];
    
    for (const provider of providers) {
      console.log(`🧪 Testing ${provider}...`);
      const isAvailable = await this.testProvider(provider);
      
      if (isAvailable) {
        this.currentProvider = provider;
        console.log(`✅ Selected ${provider} as AI provider`);
        this.initialized = true;
        return;
      }
      
      console.log(`❌ ${provider} is not available`);
    }
    
    // Если ничего не работает, используем симуляцию
    this.currentProvider = 'simulation';
    console.log('🎭 Using simulation mode as fallback');
    this.initialized = true;
  }

  private async testProvider(provider: AIProvider): Promise<boolean> {
    console.log(`🧪 Testing ${provider} provider...`);
    
    try {
      switch (provider) {
        case 'gigachat':
          return await this.testGigaChat();
        case 'simulation':
          return true; // Симуляция всегда доступна
        case 'gemini':
        case 'openai':
        case 'claude':
        case 'cohere':
        case 'local':
          // Все остальные провайдеры отключены по требованию пользователя
          console.log(`🚫 ${provider} is disabled - using only GigaChat`);
          return false;
        default:
          console.log(`❌ Unknown provider: ${provider}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ ${provider} test failed:`, error);
      return false;
    }
  }

  private async testOpenAI(): Promise<boolean> {
    const hasOpenAI = !!this.apiKeys.openai;
    console.log(`🔍 Testing OpenAI: ${hasOpenAI ? '✅ Available' : '❌ No API key'}`);
    return hasOpenAI;
  }

  private async testGemini(): Promise<boolean> {
    const hasGemini = !!this.apiKeys.gemini;
    if (!hasGemini) {
      console.log('❌ Gemini: No API key');
      return false;
    }
    
    console.log('🔍 Testing Gemini API...');
    console.log(`�� Gemini API Key: ${this.apiKeys.gemini.substring(0, 10)}...`);
    
    // Тестируем разные модели Gemini (актуальный список)
    const testModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const model of testModels) {
      try {
        console.log(`🧪 Testing Gemini model: ${model}`);
        
        // Сначала проверяем доступность модели
        const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${this.apiKeys.gemini}`;
        console.log(`🔍 Checking model availability: ${model}`);
        
        const modelResponse = await fetch(modelUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000)
        });
        
        console.log(`📡 Model check status: ${modelResponse.status}`);
        
        if (!modelResponse.ok) {
          const errorText = await modelResponse.text();
          console.error(`❌ Model ${model} not available:`, errorText);
          
          if (modelResponse.status === 429) {
            console.log('⏰ Rate limit hit during model check');
            console.log('💡 This might be due to:');
            console.log('   - Requests per minute limit');
            console.log('   - Requests per day limit');
            console.log('   - Concurrent requests limit');
            return false;
          }
          
          continue; // Пробуем следующую модель
        }
        
        const modelData = await modelResponse.json();
        console.log(`✅ Model ${model} is available:`, modelData.name);
        
        // Теперь делаем простой тестовый запрос
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.gemini}`;
        
        const testBody = {
          contents: [{
            parts: [{
              text: "Привет! Это тестовый запрос. Ответь одним словом: 'Работает'"
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10
          }
        };
        
        console.log(`🧪 Making test request to ${model}...`);
        
        const testResponse = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testBody),
          signal: AbortSignal.timeout(15000)
        });
        
        console.log(`📡 Test response status: ${testResponse.status}`);
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error(`❌ Test request failed for ${model}:`, errorText);
          
          if (testResponse.status === 429) {
            console.log('⏰ Rate limit exceeded during test');
            console.log('📊 Error details:', errorText);
            return false;
          }
          
          continue; // Пробуем следующую модель
        }
        
        const testData = await testResponse.json();
        console.log(`✅ Test successful for ${model}:`, testData);
        
        return true; // Модель работает
        
      } catch (error) {
        console.error(`❌ Error testing ${model}:`, error);
        continue; // Пробуем следующую модель
      }
    }
    
    console.log('❌ All Gemini models failed');
    return false;
  }

  private async testClaude(): Promise<boolean> {
    const hasClaude = !!this.apiKeys.claude;
    console.log(`🔍 Testing Claude: ${hasClaude ? '✅ Available' : '❌ No API key'}`);
    return hasClaude;
  }

  private async testCohere(): Promise<boolean> {
    const hasCohere = !!this.apiKeys.cohere;
    console.log(`🔍 Testing Cohere: ${hasCohere ? '✅ Available' : '❌ No API key'}`);
    return hasCohere;
  }

  private async testGigaChat(): Promise<boolean> {
    console.log('🔍 Testing GigaChat availability...');
    
    // Проверяем наличие credentials
    const hasCredentials = this.apiKeys.gigachat.clientId && this.apiKeys.gigachat.clientSecret;
    if (!hasCredentials) {
      console.log('❌ GigaChat: No credentials found');
      console.log('   Client ID:', this.apiKeys.gigachat.clientId ? '✅ Present' : '❌ Missing');
      console.log('   Client Secret:', this.apiKeys.gigachat.clientSecret ? '✅ Present' : '❌ Missing');
      return false;
    }
    
    if (!this.gigaChatService) {
      console.log('❌ GigaChat service not initialized');
      return false;
    }

    try {
      console.log('🔐 Testing GigaChat connection...');
      const isAvailable = await this.gigaChatService.testConnection();
      console.log(`✅ GigaChat test: ${isAvailable ? 'SUCCESS' : 'FAILED'}`);
      return isAvailable;
    } catch (error) {
      console.error('❌ GigaChat test failed:', error);
      return false;
    }
  }

  private async testLocalModel(): Promise<boolean> {
    // Проверяем наличие локальной модели
    try {
      const response = await fetch('/api/local/health');
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateOutfit(request: OutfitRequest): Promise<GeneratedOutfit> {
    console.log(`🎨 Generating outfit with ${this.currentProvider}...`);
    
    // Проверяем, что request существует
    if (!request) {
      console.error('❌ Request is undefined or null in generateOutfit');
      throw new Error('Request object is required for outfit generation');
    }
    
    const startTime = Date.now();
    
    try {
      let result: GeneratedOutfit;
      
      // Используем только GigaChat по требованию пользователя
      if (this.currentProvider === 'gigachat') {
        result = await this.generateWithGigaChat(request);
      } else {
        // Fallback на симуляцию
        result = this.simulateResponse(request);
      }
      
      // Записываем время ответа
      const responseTime = Date.now() - startTime;
      if (!this.responseTimes[this.currentProvider]) {
        this.responseTimes[this.currentProvider] = [];
      }
      this.responseTimes[this.currentProvider]!.push(responseTime);
      
      console.log(`✅ Outfit generated in ${responseTime}ms using ${this.currentProvider}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to generate outfit with ${this.currentProvider}:`, error);
      
      // При ошибке GigaChat сразу переключаемся на симуляцию
      if (this.currentProvider === 'gigachat') {
        console.log('🔄 GigaChat failed, switching to simulation mode...');
        this.currentProvider = 'simulation';
        return this.simulateResponse(request);
      }
      
      // Для simulation режима тоже возвращаем fallback
      if (this.currentProvider === 'simulation') {
        console.log('🔄 Simulation failed, using emergency fallback...');
        return this.createEmergencyFallback(request);
      }
      
      throw error;
    }
  }

  private async generateWithOpenAI(request: OutfitRequest): Promise<GeneratedOutfit> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Ты эксперт по стилю. Создай образ в формате JSON.'
          },
          {
            role: 'user',
            content: this.createPrompt(request)
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data.choices[0]?.message?.content, request);
  }

  private async generateWithGemini(request: OutfitRequest): Promise<GeneratedOutfit> {
    // Проверяем доступность Gemini API для региона
    console.log('🌍 Checking Gemini API availability for your region...');
    
    // Список моделей с приоритетами (только те, что точно работают)
    const models = [
      // Основные модели Gemini 1.5
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest'
    ];
    
    let lastError: Error | null = null;
    let successfulModel: string | null = null;
    
    console.log('🤖 Trying Gemini models in order of preference...');
    
    for (const model of models) {
      // Пробуем каждую модель с retry
      for (let attempt = 1; attempt <= 2; attempt++) { // Уменьшили количество попыток
        try {
          // Добавляем задержку между попытками
          if (attempt > 1) {
            const delay = attempt * 1000; // 1s, 2s
            console.log(`⏳ Waiting ${delay}ms before retry ${attempt} for model ${model}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.gemini}`;
          console.log(`🔄 Trying Gemini model: ${model} (attempt ${attempt})`);
          
          // Адаптируем параметры под разные модели
          const generationConfig = this.getGeminiConfigForModel(model);
          
          const body = {
            contents: [{
              parts: [{
                text: this.createPrompt(request)
              }]
            }],
            generationConfig
          };

          console.log('🌐 Gemini API Request:', { 
            url: url.replace(this.apiKeys.gemini, '***'), 
            model,
            config: generationConfig 
          });

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(20000) // Уменьшили таймаут до 20 секунд
          });

          console.log('📡 Gemini API Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Gemini API Error (${model}):`, errorText);
            
            // Обрабатываем специфические ошибки
            if (response.status === 503) {
              console.log(`🔄 Gemini API is temporarily unavailable (503) for ${model}, trying next model`);
              break; // Переходим к следующей модели
            } else if (response.status === 429) {
              console.log(`⏰ Gemini API rate limit exceeded (429) for ${model}, trying next model`);
              break; // Переходим к следующей модели
            } else if (response.status === 400) {
              // Проверяем на географические ограничения
              if (errorText.includes('User location is not supported') || errorText.includes('FAILED_PRECONDITION')) {
                console.log(`🌍 Gemini API not available in your region for ${model}`);
                console.log('💡 This is a geographic restriction. Consider using a VPN or switching to simulation mode.');
                // Если это географическое ограничение, сразу переходим к симуляции
                console.log('🔄 Switching to simulation mode due to geographic restrictions...');
                this.currentProvider = 'simulation';
                return this.simulateResponse(request);
              }
              console.log(`❌ Model ${model} not available or invalid, trying next model`);
              break; // Переходим к следующей модели
            }
            
            lastError = new Error(`Gemini API error (${model}): ${response.status} - ${errorText}`);
            continue; // Пробуем следующую попытку
          }

          const data = await response.json();
          console.log(`✅ Gemini API Success (${model}):`, data);
          
          const responseText = data.candidates[0]?.content?.parts[0]?.text;
          if (!responseText) {
            console.error(`❌ Empty response from Gemini (${model})`);
            continue;
          }
          
          try {
            const result = this.parseResponse(responseText, request);
            successfulModel = model;
            console.log(`🎉 Successfully generated outfit using ${model}`);
            return result;
          } catch (parseError) {
            console.error(`❌ Failed to parse Gemini response (${model}):`, parseError);
            // Пробуем следующую модель
            break;
          }
          
        } catch (error) {
          console.error(`❌ Gemini API Error (${model}):`, error);
          lastError = error as Error;
          
          // Если это таймаут, пробуем следующую попытку
          if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
            console.log(`⏰ Timeout for ${model}, trying next attempt...`);
          }
          continue; // Пробуем следующую попытку
        }
      }
    }
    
    // Если все модели не работают, переключаемся на симуляцию
    console.log(`❌ All Gemini models failed. Last error: ${lastError?.message}`);
    console.log('🔄 Switching to simulation mode...');
    this.currentProvider = 'simulation';
    return this.simulateResponse(request);
  }

  // Метод для получения оптимальной конфигурации для каждой модели
  private getGeminiConfigForModel(model: string) {
    const baseConfig = {
      temperature: 0.7,
      maxOutputTokens: 1000
    };

    // Специфичные настройки для разных моделей
    switch (model) {
      case 'gemini-2.0-flash-exp':
      case 'gemini-2.0-flash':
        return {
          ...baseConfig,
          temperature: 0.6, // Более стабильные результаты
          maxOutputTokens: 1200 // Больше токенов для лучшего качества
        };
      
      case 'gemini-2.0-pro':
        return {
          ...baseConfig,
          temperature: 0.5, // Более консервативные настройки
          maxOutputTokens: 1500 // Максимальное качество
        };
      
      case 'gemini-1.5-pro':
      case 'gemini-1.5-pro-latest':
        return {
          ...baseConfig,
          temperature: 0.7,
          maxOutputTokens: 1000
        };
      
      case 'gemini-1.5-flash':
        return {
          ...baseConfig,
          temperature: 0.8, // Более креативные результаты
          maxOutputTokens: 800 // Быстрее, но меньше деталей
        };
      
      default:
        return baseConfig;
    }
  }

  private async generateWithClaude(request: OutfitRequest): Promise<GeneratedOutfit> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKeys.claude,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [{
          role: 'user',
          content: this.createPrompt(request)
        }],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data.content[0]?.text, request);
  }

  private async generateWithCohere(request: OutfitRequest): Promise<GeneratedOutfit> {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKeys.cohere}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: this.createPrompt(request),
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data.generations[0]?.text, request);
  }

  private async generateWithGigaChat(request: OutfitRequest): Promise<GeneratedOutfit> {
    if (!this.gigaChatService) {
      throw new Error('GigaChat service not available');
    }

    console.log('🤖 Generating outfit with GigaChat...');
    
    const prompt = this.createPrompt(request);
    
    try {
      const response = await this.gigaChatService.generateText(prompt, {
        model: 'GigaChat:latest',
        temperature: 0.7,
        maxTokens: 1500
      });
      
      console.log('✅ GigaChat response received:', response.substring(0, 100) + '...');
      
      return this.parseResponse(response, request);
      
    } catch (error) {
      console.error('❌ GigaChat generation failed:', error);
      throw error;
    }
  }

  private async generateWithLocal(request: OutfitRequest): Promise<GeneratedOutfit> {
    const response = await fetch('/api/local/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: this.createPrompt(request),
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Local API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseResponse(data.text, request);
  }

  private createPrompt(request: OutfitRequest): string {
    const bodyTypeRecommendations = this.getBodyTypeRecommendations(request.bodyType);
    const seasonRecommendations = this.getSeasonRecommendations(request.season);
    const occasionRecommendations = this.getOccasionRecommendations(request.occasion);
    
    const isMale = request.measurements.gender === 'male';
    const genderText = isMale ? 'мужчины' : 'женщины';
    const genderTextShort = isMale ? 'мужской' : 'женский';
    
    return `
Ты эксперт-стилист с 15-летним опытом. ВАЖНО: Создай ПОЛНЫЙ ГОТОВЫЙ ОБРАЗ ТОЛЬКО для ${genderText}.

АНАЛИЗ КЛИЕНТА:
- Пол: ${isMale ? 'Мужчина' : 'Женщина'} (ОБЯЗАТЕЛЬНО УЧТИ!)
- Тип фигуры: ${request.bodyType}
- Рост: ${request.measurements.height} см
- Вес: ${request.measurements.weight} кг
- Размер обуви: ${request.measurements.shoeSize}
- Любимый сезон: ${request.measurements.season}

ПРЕДПОЧТЕНИЯ:
- Стиль: ${request.stylePreferences.join(', ')}
- Цвета: ${request.colorPreferences.join(', ')}
- Повод: ${request.occasion}
- Сезон: ${request.season}
- Бюджет: ${request.budget}

РЕКОМЕНДАЦИИ ПО ТИПУ ФИГУРЫ (${request.bodyType}):
${bodyTypeRecommendations}

СЕЗОННЫЕ РЕКОМЕНДАЦИИ (${request.season}):
${seasonRecommendations}

РЕКОМЕНДАЦИИ ПО ПОВОДУ (${request.occasion}):
${occasionRecommendations}

ЗАДАЧА: Создай ПОЛНЫЙ КОМПЛЕКТ ОДЕЖДЫ (минимум 4-5 предметов) ТОЛЬКО для ${genderText}.

ВАЖНО: Все предметы должны быть ${genderTextShort} одеждой!

ОБЯЗАТЕЛЬНО ВКЛЮЧИ:
${isMale ? `
- Верх (футболка, рубашка, свитер, поло) - ТОЛЬКО МУЖСКИЕ
- Низ (джинсы, брюки, шорты) - ТОЛЬКО МУЖСКИЕ
- Обувь (кроссовки, туфли, ботинки) - ТОЛЬКО МУЖСКИЕ
- Аксессуары (часы, очки, кепка, сумка) - ТОЛЬКО МУЖСКИЕ
- Дополнительно (куртка, пальто если холодно) - ТОЛЬКО МУЖСКИЕ` : `
- Верх (блуза, топ, рубашка, свитер) - ТОЛЬКО ЖЕНСКИЕ
- Низ (джинсы, юбка, брюки, платье) - ТОЛЬКО ЖЕНСКИЕ
- Обувь (туфли, кроссовки, босоножки) - ТОЛЬКО ЖЕНСКИЕ
- Аксессуары (сумка, очки, украшения, шарф) - ТОЛЬКО ЖЕНСКИЕ
- Дополнительно (куртка, пальто если холодно) - ТОЛЬКО ЖЕНСКИЕ`}

ВАЖНО: 
- Создай КОМПЛЕКТ, а не один предмет
- Все предметы должны сочетаться между собой
- Учитывай сезон и повод
- Ответь ТОЛЬКО в формате JSON без дополнительного текста
- ВСЕ строки в JSON должны быть в двойных кавычках
- В массивах colors и colorPalette используй ТОЛЬКО двойные кавычки

Создай образ в формате JSON (обязательно используй двойные кавычки для всех строк):
{
  "name": "Название образа",
  "description": "Описание образа",
  "items": [
    {
      "category": "Верх",
      "name": "Название предмета",
      "description": "Описание",
      "colors": ["цвет1", "цвет2"],
      "style": "стиль",
      "fit": "посадка",
      "price": "цена в рублях"
    },
    {
      "category": "Низ",
      "name": "Название предмета",
      "description": "Описание",
      "colors": ["цвет1", "цвет2"],
      "style": "стиль",
      "fit": "посадка",
      "price": "цена в рублях"
    },
    {
      "category": "Обувь",
      "name": "Название обуви",
      "description": "Описание",
      "colors": ["цвет1", "цвет2"],
      "style": "стиль",
      "fit": "размер",
      "price": "цена в рублях"
    },
    {
      "category": "Аксессуары",
      "name": "Название аксессуара",
      "description": "Описание",
      "colors": ["цвет1", "цвет2"],
      "style": "стиль",
      "fit": "размер",
      "price": "цена в рублях"
    }
  ],
  "styleNotes": "Советы по стилю",
  "colorPalette": ["основные цвета"],
  "totalPrice": "общая стоимость",
  "whyItWorks": "Почему образ подходит"
}
    `;
  }

  private detectGender(request: OutfitRequest): 'male' | 'female' {
    // Используем пол из данных пользователя
    return request.measurements.gender;
  }

  private parseResponse(response: string, request: OutfitRequest): GeneratedOutfit {
    console.log('📝 Raw AI response:', response);
    
    // Извлекаем JSON из markdown блока
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.log('⚠️ No JSON block found, trying to find JSON without markdown...');
      // Попробуем найти JSON без markdown блоков
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        const jsonString = response.substring(jsonStart, jsonEnd + 1);
        console.log('🔍 Found JSON without markdown:', jsonString.substring(0, 200) + '...');
        return this.parseJsonString(jsonString, request);
      }
      console.log('⚠️ No JSON found, using simulation');
      return this.simulateResponse(request);
    }
    
    let jsonString = jsonMatch[1]; // Берем содержимое JSON блока
    return this.parseJsonString(jsonString, request);
  }

  private parseJsonString(jsonString: string, request: OutfitRequest): GeneratedOutfit {
    // Создаем более надежный парсер
    try {
      // Сначала пробуем парсить как есть
      const parsed = JSON.parse(jsonString);
      if (parsed.items && Array.isArray(parsed.items)) {
        console.log('✅ Direct JSON parsing successful');
        return this.transformToGeneratedOutfit(parsed, request);
      }
    } catch (error) {
      console.log('⚠️ Direct parsing failed, trying manual fix...', error);
    }
    
    // Ручная очистка JSON
    jsonString = this.cleanJsonString(jsonString);
    
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.items && Array.isArray(parsed.items)) {
        console.log('✅ Manual JSON parsing successful');
        return this.transformToGeneratedOutfit(parsed, request);
      }
    } catch (error) {
      console.log('⚠️ Manual parsing failed, trying advanced parsing...', error);
    }
    
    // Попробуем продвинутый парсинг
    try {
      const parsed = this.advancedJsonParsing(jsonString);
      if (parsed && parsed.items && Array.isArray(parsed.items)) {
        console.log('✅ Advanced JSON parsing successful');
        return this.transformToGeneratedOutfit(parsed, request);
      }
    } catch (error) {
      console.log('⚠️ Advanced parsing failed:', error);
    }
    
    // Если все не удалось, используем симуляцию
    console.log('⚠️ All parsing attempts failed, using simulation');
    return this.simulateResponse(request);
  }

  private advancedJsonParsing(jsonString: string): any {
    console.log('🔧 Advanced JSON parsing...');
    
    // Извлекаем основные поля с помощью regex
    const nameMatch = jsonString.match(/"name"\s*:\s*"([^"]+)"/);
    const descriptionMatch = jsonString.match(/"description"\s*:\s*"([^"]+)"/);
    const totalPriceMatch = jsonString.match(/"totalPrice"\s*:\s*"([^"]+)"/);
    const styleNotesMatch = jsonString.match(/"styleNotes"\s*:\s*"([^"]+)"/);
    const whyItWorksMatch = jsonString.match(/"whyItWorks"\s*:\s*"([^"]+)"/);
    
    // Извлекаем colorPalette
    const colorPaletteMatch = jsonString.match(/"colorPalette"\s*:\s*\[([^\]]+)\]/);
    let colorPalette: string[] = [];
    if (colorPaletteMatch) {
      colorPalette = colorPaletteMatch[1].split(',').map(c => 
        c.trim().replace(/"/g, '').replace(/'/g, '')
      );
    }
    
    // Извлекаем items
    const itemsMatch = jsonString.match(/"items"\s*:\s*\[([\s\S]*?)\]/);
    let items: any[] = [];
    if (itemsMatch) {
      const itemsContent = itemsMatch[1];
      // Простой парсинг items
      const itemRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const itemMatches = itemsContent.match(itemRegex);
      if (itemMatches) {
        items = itemMatches.map(itemStr => {
          try {
            return JSON.parse(itemStr);
          } catch {
            // Ручной парсинг item
            const itemName = itemStr.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || '';
            const itemCategory = itemStr.match(/"category"\s*:\s*"([^"]+)"/)?.[1] || '';
            const itemPrice = itemStr.match(/"price"\s*:\s*"([^"]+)"/)?.[1] || '1000';
            return {
              name: itemName,
              category: itemCategory,
              price: itemPrice,
              colors: ['Черный'],
              style: 'Классический',
              fit: 'Универсальный'
            };
          }
        });
      }
    }
    
    return {
      name: nameMatch?.[1] || 'Персональный образ',
      description: descriptionMatch?.[1] || 'Создан специально для вас',
      totalPrice: totalPriceMatch?.[1] || '5000 ₽',
      styleNotes: styleNotesMatch?.[1] || 'Стильный и комфортный образ',
      whyItWorks: whyItWorksMatch?.[1] || '',
      colorPalette,
      items
    };
  }

  private cleanJsonString(jsonString: string): string {
    console.log('🔧 Cleaning JSON string...');
    
    // Удаляем лишние пробелы и переносы строк
    let cleaned = jsonString.trim();
    
    // Исправляем проблемные кавычки в массивах цветов
    cleaned = cleaned.replace(/"colors":\s*\[([^\]]+)\]/g, (match, colors) => {
      console.log('🎨 Fixing colors array:', colors);
      const fixedColors = colors.split(',').map(c => {
        const cleanColor = c.trim().replace(/"/g, '').replace(/'/g, '');
        return `"${cleanColor}"`;
      }).join(', ');
      return `"colors": [${fixedColors}]`;
    });
    
    // Исправляем кавычки в colorPalette
    cleaned = cleaned.replace(/"colorPalette":\s*\[([^\]]+)\]/g, (match, colors) => {
      console.log('🎨 Fixing colorPalette array:', colors);
      const fixedColors = colors.split(',').map(c => {
        const cleanColor = c.trim().replace(/"/g, '').replace(/'/g, '');
        return `"${cleanColor}"`;
      }).join(', ');
      return `"colorPalette": [${fixedColors}]`;
    });
    
    // Исправляем двойные кавычки в названиях полей
    cleaned = cleaned.replace(/"([^"]*)"([^"]*):/g, (match, p1, p2) => {
      return `"${p1}${p2}":`;
    });
    
    // Исправляем кавычки в строках с запятыми
    cleaned = cleaned.replace(/"([^"]*), ([^"]*)"/g, (match, p1, p2) => {
      return `"${p1}, ${p2}"`;
    });
    
    // Исправляем кавычки в названиях полей
    cleaned = cleaned.replace(/"([^"]*):\s*([^"]*)"/g, (match, field, value) => {
      return `"${field}": "${value}"`;
    });
    
    // Исправляем проблемные кавычки в значениях
    cleaned = cleaned.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
      return `"${p1}${p2}${p3}"`;
    });
    
    // Удаляем лишние кавычки в конце строк
    cleaned = cleaned.replace(/"\s*,\s*"/g, '", "');
    
    console.log('✅ Cleaned JSON:', cleaned.substring(0, 200) + '...');
    return cleaned;
  }

  private transformToGeneratedOutfit(parsed: any, request: OutfitRequest): GeneratedOutfit {
    return {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: parsed.name || 'Персональный образ',
      description: parsed.description || 'Создан специально для вас',
      occasion: request.occasion,
      season: request.season,
      items: parsed.items || [],
      totalPrice: parsed.totalPrice || '5000 ₽',
      styleNotes: parsed.styleNotes || 'Стильный и комфортный образ',
      colorPalette: parsed.colorPalette || request.colorPreferences,
      confidence: 0.95
    };
  }

  // Ручной парсер JSON как fallback
  private manualParseJSON(jsonString: string): any {
    try {
      console.log('🔧 Manual parsing JSON:', jsonString.substring(0, 200) + '...');
      
      // Извлекаем основные поля с более гибким regex
      const nameMatch = jsonString.match(/"name"\s*:\s*"([^"]+)"/);
      const descriptionMatch = jsonString.match(/"description"\s*:\s*"([^"]+)"/);
      const totalPriceMatch = jsonString.match(/"totalPrice"\s*:\s*"([^"]+)"/);
      const styleNotesMatch = jsonString.match(/"styleNotes"\s*:\s*"([^"]+)"/);
      const whyItWorksMatch = jsonString.match(/"whyItWorks"\s*:\s*"([^"]+)"/);
      
      // Извлекаем items с более сложным парсингом
      const itemsMatch = jsonString.match(/"items"\s*:\s*\[([\s\S]*?)\]/);
      let items = [];
      if (itemsMatch) {
        const itemsContent = itemsMatch[1];
        console.log('🔍 Items content found:', itemsContent.substring(0, 100) + '...');
        
        // Более точный regex для поиска объектов items
        const itemRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
        const itemMatches = itemsContent.match(itemRegex);
        
        if (itemMatches) {
          console.log(`🔍 Found ${itemMatches.length} items`);
          items = itemMatches.map((itemStr, index) => {
            console.log(`🔍 Parsing item ${index + 1}:`, itemStr.substring(0, 100) + '...');
            
            const nameMatch = itemStr.match(/"name"\s*:\s*"([^"]+)"/);
            const categoryMatch = itemStr.match(/"category"\s*:\s*"([^"]+)"/);
            const priceMatch = itemStr.match(/"price"\s*:\s*"([^"]+)"/);
            const colorsMatch = itemStr.match(/"colors"\s*:\s*\[([^\]]+)\]/);
            const descriptionMatch = itemStr.match(/"description"\s*:\s*"([^"]+)"/);
            const styleMatch = itemStr.match(/"style"\s*:\s*"([^"]+)"/);
            const fitMatch = itemStr.match(/"fit"\s*:\s*"([^"]+)"/);
            
            const item = {
              name: nameMatch ? nameMatch[1] : `Товар ${index + 1}`,
              category: categoryMatch ? categoryMatch[1] : 'Одежда',
              price: priceMatch ? priceMatch[1] : '1000-3000',
              colors: colorsMatch ? colorsMatch[1].split(',').map(c => c.trim().replace(/"/g, '')) : ['черный'],
              description: descriptionMatch ? descriptionMatch[1] : 'Стильный товар',
              style: styleMatch ? styleMatch[1] : 'casual',
              fit: fitMatch ? fitMatch[1] : 'стандартный'
            };
            
            console.log(`✅ Parsed item ${index + 1}:`, item);
            return item;
          });
        } else {
          console.log('⚠️ No items found in regex match, trying alternative parsing...');
          
          // Альтернативный способ парсинга - ищем отдельные поля
          const itemNames = itemsContent.match(/"name"\s*:\s*"([^"]+)"/g);
          const itemCategories = itemsContent.match(/"category"\s*:\s*"([^"]+)"/g);
          const itemPrices = itemsContent.match(/"price"\s*:\s*"([^"]+)"/g);
          
          if (itemNames) {
            items = itemNames.map((nameStr, index) => {
              const name = nameStr.match(/"name"\s*:\s*"([^"]+)"/)?.[1] || `Товар ${index + 1}`;
              const category = itemCategories?.[index]?.match(/"category"\s*:\s*"([^"]+)"/)?.[1] || 'Одежда';
              const price = itemPrices?.[index]?.match(/"price"\s*:\s*"([^"]+)"/)?.[1] || '1000-3000';
              
              return {
                name,
                category,
                price,
                colors: ['черный'],
                description: 'Стильный товар',
                style: 'casual',
                fit: 'стандартный'
              };
            });
            console.log(`✅ Alternative parsing found ${items.length} items`);
          }
        }
      } else {
        console.log('⚠️ No items array found in JSON');
      }
      
      // Извлекаем colorPalette
      const colorPaletteMatch = jsonString.match(/"colorPalette"\s*:\s*\[([^\]]+)\]/);
      const colorPalette = colorPaletteMatch 
        ? colorPaletteMatch[1].split(',').map(c => c.trim().replace(/"/g, ''))
        : ['черный', 'белый'];
      
      const result = {
        name: nameMatch ? nameMatch[1] : 'Персональный образ',
        description: descriptionMatch ? descriptionMatch[1] : 'Создан специально для вас',
        items: items,
        totalPrice: totalPriceMatch ? totalPriceMatch[1] : '5000-15000',
        styleNotes: styleNotesMatch ? styleNotesMatch[1] : 'Стильный и комфортный образ',
        colorPalette: colorPalette,
        whyItWorks: whyItWorksMatch ? whyItWorksMatch[1] : 'Образ создан с учетом ваших предпочтений'
      };
      
      console.log('✅ Manual parsing result:', result);
      return result;
      
    } catch (error) {
      console.error('Manual parsing failed:', error);
      return {
        name: 'Персональный образ',
        description: 'Создан специально для вас',
        items: [],
        totalPrice: '5000-15000',
        styleNotes: 'Стильный и комфортный образ',
        colorPalette: ['черный', 'белый']
      };
    }
  }

  simulateResponse(request: OutfitRequest): GeneratedOutfit {
    console.log('🎭 Generating enhanced simulation outfit based on user data...');
    
    // Проверяем, что request существует и имеет необходимые поля
    if (!request) {
      console.error('❌ Request is undefined or null in simulateResponse');
      throw new Error('Request object is required for simulation');
    }
    
    // Проверяем measurements, но не выбрасываем ошибку
    if (!request.measurements || !request.measurements.gender) {
      console.warn('⚠️ Request measurements or gender is missing, using defaults');
      // Устанавливаем значения по умолчанию
      if (!request.measurements) {
        request.measurements = {
          height: 170,
          weight: 65,
          gender: 'female',
          season: 'spring',
          shoeSize: 38
        };
      } else if (!request.measurements.gender) {
        request.measurements.gender = 'female';
      }
    }
    
    console.log('📊 User data:', {
      bodyType: request.bodyType,
      gender: request.measurements.gender,
      style: request.stylePreferences,
      colors: request.colorPreferences,
      occasion: request.occasion,
      season: request.season
    });
    
    // Сначала пытаемся найти подходящий образ в базе данных
    const matchingOutfit = findMatchingOutfit(
      request.measurements.gender,
      request.bodyType,
      request.stylePreferences,
      request.occasion,
      request.season
    );
    
    if (matchingOutfit) {
      console.log('✅ Found matching outfit in database:', matchingOutfit.name);
      
      // Конвертируем шаблон в GeneratedOutfit
      const outfit: GeneratedOutfit = {
        id: matchingOutfit.id,
        name: matchingOutfit.name,
        description: matchingOutfit.description,
        occasion: request.occasion,
        season: request.season,
        items: matchingOutfit.items.map(item => ({
          ...item,
          // Адаптируем цвета под предпочтения пользователя
          colors: request.colorPreferences.length > 0 
            ? request.colorPreferences 
            : item.colors
        })),
        totalPrice: matchingOutfit.totalPrice,
        styleNotes: matchingOutfit.styleNotes,
        colorPalette: request.colorPreferences.length > 0 
          ? request.colorPreferences 
          : matchingOutfit.colorPalette,
        confidence: matchingOutfit.confidence
      };
      
      console.log('🎨 Generated outfit from database:', {
        name: outfit.name,
        itemsCount: outfit.items.length,
        items: outfit.items.map(item => `${item.category}: ${item.name}`)
      });
      
      return outfit;
    }
    
    console.log('⚠️ No matching outfit found in database, using fallback generation...');
    
    // Fallback к старой логике генерации
    const bodyTypeRecommendations = this.getBodyTypeRecommendations(request.bodyType);
    const seasonRecommendations = this.getSeasonRecommendations(request.season);
    const occasionRecommendations = this.getOccasionRecommendations(request.occasion);
    
    // Генерируем персонализированный образ на основе данных
    const outfitName = this.generateOutfitName(request);
    const items = this.generateOutfitItems(request);
    const styleNotes = this.generateStyleNotes(request, bodyTypeRecommendations);
    
    // Создаем более детальное описание
    const gender = this.detectGender(request);
    const description = this.generateDetailedDescription(request, gender);
    
    const outfit = {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: outfitName,
      description: description,
      occasion: request.occasion,
      season: request.season,
      items: items,
      totalPrice: this.calculateTotalPrice(items),
      styleNotes: styleNotes,
      colorPalette: request.colorPreferences,
      confidence: 0.85 // Немного ниже, так как это fallback
    };
    
    console.log('🎨 Generated fallback outfit:', {
      name: outfit.name,
      itemsCount: outfit.items.length,
      items: outfit.items.map(item => `${item.category}: ${item.name}`)
    });
    
    return outfit;
  }

  private createEmergencyFallback(request: OutfitRequest): GeneratedOutfit {
    console.log('🚨 Creating emergency fallback outfit...');
    
    // Создаем базовый fallback образ
    const outfit: GeneratedOutfit = {
      id: `emergency_${Date.now()}`,
      name: 'Стильный базовый образ',
      description: 'Классический образ, подходящий для большинства случаев',
      occasion: request.occasion || 'casual',
      season: request.season || 'spring',
      items: [
        {
          category: 'Верх',
          name: 'Базовая футболка',
          description: 'Универсальная футболка нейтрального цвета',
          colors: ['белый', 'черный'],
          style: 'casual',
          fit: 'regular',
          price: '1500 ₽'
        },
        {
          category: 'Низ',
          name: 'Джинсы классического кроя',
          description: 'Универсальные джинсы прямого кроя',
          colors: ['синий'],
          style: 'casual',
          fit: 'regular',
          price: '3000 ₽'
        },
        {
          category: 'Обувь',
          name: 'Кроссовки на плоской подошве',
          description: 'Удобные кроссовки для повседневной носки',
          colors: ['белый'],
          style: 'casual',
          fit: 'regular',
          price: '2500 ₽'
        },
        {
          category: 'Аксессуары',
          name: 'Сумка через плечо',
          description: 'Практичная сумка среднего размера',
          colors: ['черный'],
          style: 'casual',
          fit: 'regular',
          price: '2000 ₽'
        }
      ],
      totalPrice: '9000 ₽',
      styleNotes: 'Базовый образ подходит для повседневной носки и различных случаев',
      colorPalette: ['белый', 'черный', 'синий'],
      confidence: 0.7
    };
    
    console.log('✅ Emergency fallback outfit created');
    return outfit;
  }

  private generateDetailedDescription(request: OutfitRequest, gender: 'male' | 'female'): string {
    const { bodyType, occasion, season, stylePreferences } = request;
    
    const bodyTypeNames = {
      'hourglass': 'песочные часы',
      'inverted-triangle': 'перевернутый треугольник',
      'triangle': 'треугольник',
      'rectangle': 'прямоугольник',
      'circle': 'круг',
      'diamond': 'ромб'
    };
    
    const occasionNames = {
      'casual': 'повседневный',
      'business': 'деловой',
      'evening': 'вечерний'
    };
    
    const seasonNames = {
      'spring': 'весенний',
      'summer': 'летний',
      'autumn': 'осенний',
      'winter': 'зимний'
    };
    
    const bodyTypeName = bodyTypeNames[bodyType as keyof typeof bodyTypeNames] || bodyType;
    const occasionName = occasionNames[occasion as keyof typeof occasionNames] || occasion;
    const seasonName = seasonNames[season as keyof typeof seasonNames] || season;
    
    return `Стильный ${occasionName} образ для ${gender === 'female' ? 'женщины' : 'мужчины'} с фигурой типа "${bodyTypeName}". Образ создан с учетом ${seasonName} сезона и включает элементы стиля ${stylePreferences.join(', ')}. Все предметы гардероба подобраны с учетом особенностей фигуры и создают гармоничный, комфортный лук.`;
  }

  private generateOutfitName(request: OutfitRequest): string {
    const names = {
      casual: ['Повседневный образ', 'Комфортный лук', 'Стильный casual'],
      business: ['Деловой образ', 'Офисный лук', 'Элегантный business'],
      evening: ['Вечерний образ', 'Праздничный лук', 'Гламурный evening']
    };
    
    const style = request.stylePreferences[0] || 'casual';
    const styleNames = names[style as keyof typeof names] || names.casual;
    return styleNames[Math.floor(Math.random() * styleNames.length)];
  }

  private generateOutfitItems(request: OutfitRequest): any[] {
    const items = [];
    const style = request.stylePreferences[0] || 'casual';
    const gender = this.detectGender(request);
    
    console.log(`👕 Generating outfit items for ${gender} with ${style} style...`);
    
    if (gender === 'male') {
      // Мужские образы
      const maleTops = {
        casual: ['Футболка хлопковая', 'Рубашка поло', 'Свитер вязаный'],
        business: ['Рубашка офисная', 'Свитер кардиган', 'Пиджак классический'],
        evening: ['Рубашка вечерняя', 'Свитер элегантный', 'Пиджак праздничный']
      };
      
      const maleBottoms = {
        casual: ['Джинсы прямого кроя', 'Шорты хлопковые', 'Брюки спортивные'],
        business: ['Брюки классические', 'Брюки офисные', 'Джинсы темные'],
        evening: ['Брюки элегантные', 'Джинсы темные', 'Брюки праздничные']
      };
      
      const maleShoes = {
        casual: ['Кроссовки спортивные', 'Лоферы кожаные', 'Ботинки повседневные'],
        business: ['Туфли офисные', 'Лоферы деловые', 'Оксфорды классические'],
        evening: ['Туфли вечерние', 'Оксфорды элегантные', 'Туфли праздничные']
      };
      
      const maleAccessories = {
        casual: ['Часы спортивные', 'Кепка бейсболка', 'Рюкзак повседневный'],
        business: ['Часы классические', 'Портфель кожаный', 'Галстук шелковый'],
        evening: ['Часы элегантные', 'Портфель вечерний', 'Галстук праздничный']
      };
      
      const styleTops = maleTops[style as keyof typeof maleTops] || maleTops.casual;
      const styleBottoms = maleBottoms[style as keyof typeof maleBottoms] || maleBottoms.casual;
      const styleShoes = maleShoes[style as keyof typeof maleShoes] || maleShoes.casual;
      const styleAccessories = maleAccessories[style as keyof typeof maleAccessories] || maleAccessories.casual;
      
      items.push({
        category: 'Верх',
        name: styleTops[Math.floor(Math.random() * styleTops.length)],
        description: 'Стильный верх для мужчин',
        colors: request.colorPreferences,
        style: style,
        fit: this.getRecommendedFit(request.bodyType),
        price: '2500-5000'
      });
      
      items.push({
        category: 'Низ',
        name: styleBottoms[Math.floor(Math.random() * styleBottoms.length)],
        description: 'Комфортный низ для мужчин',
        colors: request.colorPreferences,
        style: style,
        fit: this.getRecommendedFit(request.bodyType),
        price: '3500-7000'
      });
      
      items.push({
        category: 'Обувь',
        name: styleShoes[Math.floor(Math.random() * styleShoes.length)],
        description: 'Качественная обувь для мужчин',
        colors: request.colorPreferences,
        style: style,
        fit: 'стандартный',
        price: '5000-12000'
      });
      
      items.push({
        category: 'Аксессуары',
        name: styleAccessories[Math.floor(Math.random() * styleAccessories.length)],
        description: 'Стильные аксессуары для мужчин',
        colors: request.colorPreferences,
        style: style,
        fit: 'стандартный',
        price: '2000-8000'
      });
      
    } else {
      // Женские образы
      const femaleTops = {
        casual: ['Блуза из хлопка', 'Топ базовый', 'Футболка стильная'],
        business: ['Рубашка офисная', 'Блуза классическая', 'Топ деловой'],
        evening: ['Блуза вечерняя', 'Топ элегантный', 'Рубашка праздничная']
      };
      
      const femaleBottoms = {
        casual: ['Джинсы прямого кроя', 'Брюки комфортные', 'Юбка миди'],
        business: ['Брюки классические', 'Юбка-карандаш', 'Брюки офисные'],
        evening: ['Юбка вечерняя', 'Брюки элегантные', 'Платье праздничное']
      };
      
      const femaleShoes = {
        casual: ['Кроссовки стильные', 'Лоферы комфортные', 'Балетки классические'],
        business: ['Туфли на каблуке', 'Лоферы деловые', 'Балетки офисные'],
        evening: ['Туфли вечерние', 'Босоножки элегантные', 'Туфли праздничные']
      };
      
      const femaleAccessories = {
        casual: ['Сумка повседневная', 'Очки солнцезащитные', 'Шарф легкий'],
        business: ['Сумка офисная', 'Очки классические', 'Шарф элегантный'],
        evening: ['Сумка вечерняя', 'Очки элегантные', 'Украшения']
      };
      
      const styleTops = femaleTops[style as keyof typeof femaleTops] || femaleTops.casual;
      const styleBottoms = femaleBottoms[style as keyof typeof femaleBottoms] || femaleBottoms.casual;
      const styleShoes = femaleShoes[style as keyof typeof femaleShoes] || femaleShoes.casual;
      const styleAccessories = femaleAccessories[style as keyof typeof femaleAccessories] || femaleAccessories.casual;
      
      items.push({
        category: 'Верх',
        name: styleTops[Math.floor(Math.random() * styleTops.length)],
        description: 'Стильный верх для женщин',
        colors: request.colorPreferences,
        style: style,
        fit: this.getRecommendedFit(request.bodyType),
        price: '2000-4000'
      });
      
      items.push({
        category: 'Низ',
        name: styleBottoms[Math.floor(Math.random() * styleBottoms.length)],
        description: 'Элегантный низ для женщин',
        colors: request.colorPreferences,
        style: style,
        fit: this.getRecommendedFit(request.bodyType),
        price: '3000-6000'
      });
      
      items.push({
        category: 'Обувь',
        name: styleShoes[Math.floor(Math.random() * styleShoes.length)],
        description: 'Стильная обувь для женщин',
        colors: request.colorPreferences,
        style: style,
        fit: 'стандартный',
        price: '4000-8000'
      });
      
      items.push({
        category: 'Аксессуары',
        name: styleAccessories[Math.floor(Math.random() * styleAccessories.length)],
        description: 'Элегантные аксессуары для женщин',
        colors: request.colorPreferences,
        style: style,
        fit: 'стандартный',
        price: '1500-5000'
      });
    }
    
    console.log(`✅ Generated ${items.length} outfit items:`, items.map(item => `${item.category}: ${item.name}`));
    return items;
  }

  private getRecommendedFit(bodyType: string): string {
    const fits = {
      apple: 'свободный в области талии',
      pear: 'приталенный верх, свободный низ',
      hourglass: 'приталенный',
      rectangle: 'прямой крой',
      'inverted-triangle': 'свободный верх, приталенный низ'
    };
    
    return fits[bodyType as keyof typeof fits] || 'стандартный';
  }

  private generateStyleNotes(request: OutfitRequest, bodyTypeRecommendations: string): string {
    const notes = [
      `Образ создан специально для ${request.bodyType} типа фигуры.`,
      `Рекомендуется для ${request.occasion} в ${request.season} сезон.`,
      `Цветовая палитра: ${request.colorPreferences.join(', ')}.`,
      bodyTypeRecommendations.split('\n')[1] || 'Подчеркивает достоинства фигуры.'
    ];
    
    return notes.join(' ');
  }

  private calculateTotalPrice(items: any[]): string {
    const total = items.reduce((sum, item) => {
      const priceRange = item.price.split('-');
      const avgPrice = (parseInt(priceRange[0]) + parseInt(priceRange[1])) / 2;
      return sum + avgPrice;
    }, 0);
    
    return `${Math.round(total)} ₽`;
  }

  // Метрики производительности
  getPerformanceMetrics() {
    const metrics: Record<string, any> = {};
    
    for (const [provider, times] of Object.entries(this.responseTimes)) {
      if (times.length > 0) {
        metrics[provider] = {
          averageTime: times.reduce((a, b) => a + b, 0) / times.length,
          minTime: Math.min(...times),
          maxTime: Math.max(...times),
          requestCount: times.length
        };
      }
    }
    
    return metrics;
  }

  // Принудительное переключение провайдера
  async switchProvider(provider: AIProvider) {
    if (await this.testProvider(provider)) {
      this.currentProvider = provider;
      console.log(`Switched to provider: ${provider}`);
      return true;
    }
    return false;
  }

  // Получение текущего провайдера
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  // Рекомендации по типу фигуры
  private getBodyTypeRecommendations(bodyType: string): string {
    const recommendations = {
      'hourglass': `
• Подчеркивайте талию - это ваша сильная сторона
• Выбирайте приталенные силуэты и пояса
• Избегайте мешковатой одежды и прямых силуэтов
• Балансируйте верх и низ - не перегружайте одну часть`,
      'inverted-triangle': `
• Балансируйте широкие плечи с объемом внизу
• Выбирайте А-силуэты и расклешенные юбки
• Темные цвета для верха, светлые для низа
• Избегайте объемных плеч и ярких цветов в верхней части`,
      'triangle': `
• Акцентируйте внимание на верхней части тела
• Выбирайте темные цвета для низа, светлые для верха
• V-образные вырезы и яркие аксессуары на уровне груди
• Избегайте обтягивающих юбок и светлых брюк`,
      'rectangle': `
• Выбирайте одежду с акцентом на талию (пояса, приталенные силуэты)
• Вертикальные линии и полоски визуально удлиняют фигуру
• А-силуэты и трапеции создают объем в нужных местах
• Избегайте мешковатой одежды - она скрывает естественные пропорции`,
      'circle': `
• Создавайте вертикальные линии и удлиняющие силуэты
• Выбирайте одежду с акцентом на ноги
• V-образные вырезы и удлиненные кардиганы
• Избегайте обтягивающей одежды в области талии`,
      'diamond': `
• Балансируйте широкую талию с акцентами на плечи и бедра
• Выбирайте А-силуэты и приталенные силуэты
• Темные цвета для средней части, светлые для верха и низа
• Избегайте обтягивающей одежды в области талии`
    };
    
    return recommendations[bodyType as keyof typeof recommendations] || 
           'Выбирайте одежду, которая подчеркивает ваши достоинства и скрывает недостатки.';
  }

  // Сезонные рекомендации
  private getSeasonRecommendations(season: string): string {
    const recommendations = {
      'spring': `
• Light pastel tones and bright accents
• Light fabrics: cotton, linen, silk
• Layering: cardigans, vests
• Floral prints and delicate patterns`,
      'summer': `
• Light breathable fabrics: cotton, linen, viscose
• Light and bright colors
• Minimalist silhouettes
• Sun protection: hats, sunglasses`,
      'autumn': `
• Warm earthy tones: brown, burgundy, orange
• Dense fabrics: wool, tweed, denim
• Layering: coats, scarves, hats
• Classic prints: plaid, polka dots`,
      'winter': `
• Dark colors and bright accents
• Warm fabrics: wool, cashmere, fur
• Layering and volume
• Contrast combinations and metallic accents`
    };
    
    return recommendations[season as keyof typeof recommendations] || 
           'Choose clothing appropriate for the season and weather conditions.';
  }

  // Рекомендации по поводу
  private getOccasionRecommendations(occasion: string): string {
    const recommendations = {
      'casual': `
• Комфортная повседневная одежда
• Джинсы, футболки, кроссовки
• Практичные материалы и удобные силуэты
• Минималистичные аксессуары`,
      'business': `
• Классический деловой стиль
• Костюмы, блузы, туфли на каблуке
• Нейтральные цвета: черный, серый, белый, синий
• Минималистичные украшения`,
      'evening': `
• Элегантные вечерние наряды
• Платья, костюмы, туфли на каблуке
• Яркие цвета и блестящие акценты
• Драгоценные украшения и клатчи`,
      'sport': `
• Спортивная одежда и обувь
• Дышащие ткани и удобные силуэты
• Яркие цвета и функциональные детали
• Спортивные аксессуары: сумки, бутылки`
    };
    
    return recommendations[occasion as keyof typeof recommendations] || 
           'Выбирайте одежду, соответствующую формату мероприятия.';
  }
}

export const aiService = AIService.getInstance(); 