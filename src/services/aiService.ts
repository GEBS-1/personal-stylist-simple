import { env, getValidApiKeys, hasValidAiKey, logConfig } from "@/config/env";

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

type AIProvider = 'openai' | 'gemini' | 'claude' | 'cohere' | 'local' | 'simulation';

export class AIService {
  private currentProvider: AIProvider = 'simulation';
  private apiKeys: ReturnType<typeof getValidApiKeys>;
  private responseTimes: Partial<Record<AIProvider, number[]>> = {};

  constructor() {
    console.log('🚀 Initializing AI Service...');
    this.loadAPIKeys();
    this.initializeProvider();
  }

  private loadAPIKeys() {
    this.apiKeys = getValidApiKeys();
    
    if (!hasValidAiKey()) {
      console.log('⚠️ No valid API keys found. Running in simulation mode.');
    }
  }

  private async initializeProvider() {
    console.log('🔧 Initializing AI provider...');
    
    // Проверяем только Gemini и симуляцию
    const providers: AIProvider[] = ['gemini', 'simulation'];
    
    for (const provider of providers) {
      console.log(`🔍 Testing ${provider}...`);
      if (await this.testProvider(provider)) {
        this.currentProvider = provider;
        console.log(`✅ Using AI provider: ${provider}`);
        break;
      }
    }
    
    // Если Gemini не работает, используем симуляцию
    if (this.currentProvider === 'simulation') {
      console.log('🎭 Using simulation mode');
      console.log('💡 Tips:');
      console.log('  - Gemini API может быть временно недоступен');
      console.log('  - Проверьте лимиты запросов в Google AI Studio');
      console.log('  - Попробуйте позже или используйте другой API ключ');
    }
  }

  private async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          const hasOpenAI = !!this.apiKeys.openai;
          console.log(`🔍 Testing OpenAI: ${hasOpenAI ? '✅ Available' : '❌ No API key'}`);
          return hasOpenAI;
        case 'gemini':
          const hasGemini = !!this.apiKeys.gemini;
          if (!hasGemini) {
            console.log('❌ Gemini: No API key');
            return false;
          }
          
          // Тестируем разные модели Gemini (актуальный список)
          const testModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
          
          for (const model of testModels) {
            try {
              console.log(`🧪 Testing Gemini model: ${model}`);
              const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.gemini}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: "Hello"
                    }]
                  }],
                  generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10
                  }
                })
              });
              
                        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Gemini (${model}): API test successful`);
            return true;
          } else {
            const errorText = await response.text();
            console.log(`❌ Gemini (${model}): API test failed - ${response.status}: ${errorText}`);
            
            // Анализируем ошибки для лучшего понимания
            if (response.status === 503) {
              console.log(`⚠️ Gemini (${model}): Service temporarily unavailable, trying next model...`);
            } else if (response.status === 429) {
              console.log(`⚠️ Gemini (${model}): Rate limit exceeded, trying next model...`);
            } else if (response.status === 404) {
              console.log(`⚠️ Gemini (${model}): Model not found, trying next model...`);
            }
            // Продолжаем тестировать следующую модель
          }
            } catch (error) {
              console.log(`❌ Gemini (${model}): API test error:`, error);
              // Продолжаем тестировать следующую модель
            }
          }
          
          console.log('❌ Gemini: All models failed, falling back to simulation');
          return false;
        case 'claude':
          const hasClaude = !!this.apiKeys.claude;
          console.log(`🔍 Testing Claude: ${hasClaude ? '✅ Available' : '❌ No API key'}`);
          return hasClaude;
        case 'cohere':
          const hasCohere = !!this.apiKeys.cohere;
          console.log(`🔍 Testing Cohere: ${hasCohere ? '✅ Available' : '❌ No API key'}`);
          return hasCohere;
        case 'local':
          // Проверяем доступность локальной модели
          const hasLocal = await this.testLocalModel();
          console.log(`🔍 Testing Local: ${hasLocal ? '✅ Available' : '❌ Not available'}`);
          return hasLocal;
        default:
          return false;
      }
    } catch (error) {
      console.warn(`❌ Provider ${provider} test failed:`, error);
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
    const startTime = Date.now();
    
    try {
      let result: GeneratedOutfit;
      
      switch (this.currentProvider) {
        case 'openai':
          result = await this.generateWithOpenAI(request);
          break;
        case 'gemini':
          result = await this.generateWithGemini(request);
          break;
        case 'claude':
          result = await this.generateWithClaude(request);
          break;
        case 'cohere':
          result = await this.generateWithCohere(request);
          break;
        case 'local':
          result = await this.generateWithLocal(request);
          break;
        default:
          result = this.simulateResponse(request);
      }

      // Записываем время ответа
      const responseTime = Date.now() - startTime;
      if (!this.responseTimes[this.currentProvider]) {
        this.responseTimes[this.currentProvider] = [];
      }
      this.responseTimes[this.currentProvider].push(responseTime);

      return result;
    } catch (error) {
      console.error(`Error with ${this.currentProvider}:`, error);
      
      // Если ошибка связана с регионом/локацией, переключаемся на симуляцию
      if (error.message && error.message.includes('location is not supported')) {
        console.log('🔄 Switching to simulation mode due to regional restrictions');
        this.currentProvider = 'simulation';
      } else if (error.message && error.message.includes('401')) {
        console.log('🔑 API key issue detected, switching to simulation mode');
        this.currentProvider = 'simulation';
      } else if (error.message && error.message.includes('400')) {
        console.log('⚠️ Bad request detected, switching to simulation mode');
        this.currentProvider = 'simulation';
      }
      
      // Fallback к симуляции
      console.log('🎭 Using simulation mode for outfit generation');
      return this.simulateResponse(request);
    }
  }

  private async generateWithOpenAI(request: OutfitRequest): Promise<GeneratedOutfit> {
    const response = await fetch('/api/openai/v1/chat/completions', {
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
    // Пробуем разные модели Gemini (актуальный список)
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    let lastError: Error | null = null;
    
    for (const model of models) {
      // Пробуем каждую модель с retry
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Добавляем задержку между попытками
          if (attempt > 1) {
            const delay = attempt * 1000; // 1s, 2s, 3s
            console.log(`⏳ Waiting ${delay}ms before retry ${attempt} for model ${model}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKeys.gemini}`;
          console.log(`🔄 Trying Gemini model: ${model} (attempt ${attempt})`);
          
          const body = {
            contents: [{
              parts: [{
                text: this.createPrompt(request)
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000
            }
          };

          console.log('🌐 Gemini API Request:', { url: url.replace(this.apiKeys.gemini, '***'), model });

                      const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
              signal: AbortSignal.timeout(30000) // 30 секунд таймаут
            });

          console.log('📡 Gemini API Response Status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Gemini API Error (${model}):`, errorText);
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
            return this.parseResponse(responseText, request);
          } catch (parseError) {
            console.error(`❌ Failed to parse Gemini response (${model}):`, parseError);
            // Пробуем следующую модель
            continue;
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
    
    // Если все модели не работают, выбрасываем последнюю ошибку
    throw lastError || new Error('All Gemini models failed');
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
    console.log('🎭 Generating enhanced simulation outfit...');
    
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
    
    return {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: outfitName,
      description: description,
      occasion: request.occasion,
      season: request.season,
      items: items,
      totalPrice: this.calculateTotalPrice(items),
      styleNotes: styleNotes,
      colorPalette: request.colorPreferences,
      confidence: 0.95
    };
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

export const aiService = new AIService(); 