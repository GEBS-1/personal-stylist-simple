// Универсальный сервис для работы с разными AI провайдерами
// Автоматически выбирает лучший доступный вариант

export interface OutfitRequest {
  bodyType: string;
  measurements: {
    height: number;
    chest: number;
    waist: number;
    hips: number;
    shoulders: number;
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

class AIService {
  private currentProvider: AIProvider = 'simulation';
  private apiKeys: Record<string, string> = {};
  private responseTimes: Record<AIProvider, number[]> = {};

  constructor() {
    console.log('🚀 Initializing AI Service...');
    this.loadAPIKeys();
    this.initializeProvider();
  }

  private loadAPIKeys() {
    this.apiKeys = {
      openai: import.meta.env.VITE_OPENAI_API_KEY || '',
      gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
      claude: import.meta.env.VITE_CLAUDE_API_KEY || '',
      cohere: import.meta.env.VITE_COHERE_API_KEY || ''
    };
    
    console.log('🔑 Loaded API Keys:');
    console.log(`  OpenAI: ${this.apiKeys.openai ? '✅ Present' : '❌ Missing'}`);
    console.log(`  Gemini: ${this.apiKeys.gemini ? '✅ Present' : '❌ Missing'}`);
    console.log(`  Claude: ${this.apiKeys.claude ? '✅ Present' : '❌ Missing'}`);
    console.log(`  Cohere: ${this.apiKeys.cohere ? '✅ Present' : '❌ Missing'}`);
  }

  private async initializeProvider() {
    // Проверяем доступность провайдеров в порядке приоритета
    const providers: AIProvider[] = ['gemini', 'openai', 'claude', 'cohere', 'local'];
    
    for (const provider of providers) {
      if (await this.testProvider(provider)) {
        this.currentProvider = provider;
        console.log(`✅ Using AI provider: ${provider}`);
        break;
      }
    }
    
    // Если ни один провайдер не доступен, используем симуляцию
    if (this.currentProvider === 'simulation') {
      console.log('⚠️ No AI providers available, using enhanced simulation mode');
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
          console.log(`🔍 Testing Gemini: ${hasGemini ? '✅ Available' : '❌ No API key'}`);
          return hasGemini;
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
      }
      
      // Fallback к симуляции
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKeys.gemini}`;
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

    console.log('🌐 Gemini API Request:', { url: url.replace(this.apiKeys.gemini, '***'), body });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    console.log('📡 Gemini API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error Response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API Success Response:', data);
    return this.parseResponse(data.candidates[0]?.content?.parts[0]?.text, request);
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
    
    return `
Ты эксперт-стилист с 15-летним опытом. Создай ПЕРСОНАЛЬНЫЙ ГОТОВЫЙ ОБРАЗ для женщины.

АНАЛИЗ КЛИЕНТА:
- Тип фигуры: ${request.bodyType}
- Рост: ${request.measurements.height} см
- Обхват груди: ${request.measurements.chest} см
- Обхват талии: ${request.measurements.waist} см
- Обхват бедер: ${request.measurements.hips} см
- Ширина плеч: ${request.measurements.shoulders} см

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

ЗАДАЧА: Создай КОНКРЕТНЫЙ ГОТОВЫЙ ОБРАЗ с точными предметами одежды, которые идеально подходят для данной фигуры, сезона и повода.

Создай образ в формате JSON:
{
  "name": "Креативное название образа",
  "description": "Подробное описание образа и почему он подходит",
  "items": [
    {
      "category": "Верх/Низ/Обувь/Аксессуары",
      "name": "Точное название предмета",
      "description": "Детальное описание (материал, фасон, особенности)",
      "colors": ["основной цвет", "дополнительный цвет"],
      "style": "конкретный стиль",
      "fit": "рекомендуемая посадка для типа фигуры",
      "price": "диапазон цен в рублях"
    }
  ],
  "styleNotes": "Конкретные советы по стилю для данного типа фигуры",
  "colorPalette": ["основные цвета образа"],
  "totalPrice": "общая стоимость в рублях",
  "whyItWorks": "Объяснение, почему образ идеально подходит для данной фигуры"
}
    `;
  }

  private parseResponse(response: string, request: OutfitRequest): GeneratedOutfit {
    try {
      console.log('📝 Raw AI response:', response);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      // Очищаем JSON от лишних символов
      let jsonString = jsonMatch[0];
      
      // Исправляем типичные ошибки Gemini
      jsonString = jsonString
        .replace(/,\s*}/g, '}') // Убираем запятые перед закрывающими скобками
        .replace(/,\s*]/g, ']') // Убираем запятые перед закрывающими квадратными скобками
        .replace(/\\"/g, '"') // Исправляем экранированные кавычки
        .replace(/\\n/g, ' ') // Заменяем переносы строк на пробелы
        .replace(/\\t/g, ' ') // Заменяем табуляции на пробелы
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .replace(/"\s*:\s*"/g, '": "') // Исправляем пробелы вокруг двоеточий
        .replace(/"\s*,\s*"/g, '", "') // Исправляем пробелы вокруг запятых
        .replace(/"\s*}\s*$/g, '"}') // Исправляем конец объекта
        .replace(/"\s*]\s*$/g, '"]'); // Исправляем конец массива
      
      console.log('🔧 Cleaned JSON string:', jsonString);
      
      const parsed = JSON.parse(jsonString);
      console.log('✅ Parsed JSON:', parsed);
      
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
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('🔄 Falling back to simulation due to parsing error');
      return this.simulateResponse(request);
    }
  }

  private simulateResponse(request: OutfitRequest): GeneratedOutfit {
    const bodyTypeRecommendations = this.getBodyTypeRecommendations(request.bodyType);
    const seasonRecommendations = this.getSeasonRecommendations(request.season);
    const occasionRecommendations = this.getOccasionRecommendations(request.occasion);
    
    // Генерируем персонализированный образ на основе данных
    const outfitName = this.generateOutfitName(request);
    const items = this.generateOutfitItems(request);
    const styleNotes = this.generateStyleNotes(request, bodyTypeRecommendations);
    
    return {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: outfitName,
      description: `Персональный образ для ${request.bodyType} типа фигуры в стиле ${request.stylePreferences.join(', ')}`,
      occasion: request.occasion,
      season: request.season,
      items: items,
      totalPrice: this.calculateTotalPrice(items),
      styleNotes: styleNotes,
      colorPalette: request.colorPreferences,
      confidence: 0.9
    };
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
    
    // Верх
    const tops = {
      casual: ['Блуза из хлопка', 'Топ базовый', 'Футболка стильная'],
      business: ['Рубашка офисная', 'Блуза классическая', 'Топ деловой'],
      evening: ['Блуза вечерняя', 'Топ элегантный', 'Рубашка праздничная']
    };
    
    // Низ
    const bottoms = {
      casual: ['Джинсы прямого кроя', 'Брюки комфортные', 'Юбка миди'],
      business: ['Брюки классические', 'Юбка-карандаш', 'Брюки офисные'],
      evening: ['Юбка вечерняя', 'Брюки элегантные', 'Платье праздничное']
    };
    
    // Обувь
    const shoes = {
      casual: ['Кроссовки стильные', 'Лоферы комфортные', 'Балетки классические'],
      business: ['Туфли на каблуке', 'Лоферы деловые', 'Балетки офисные'],
      evening: ['Туфли вечерние', 'Босоножки элегантные', 'Туфли праздничные']
    };
    
    const styleTops = tops[style as keyof typeof tops] || tops.casual;
    const styleBottoms = bottoms[style as keyof typeof bottoms] || bottoms.casual;
    const styleShoes = shoes[style as keyof typeof shoes] || shoes.casual;
    
    items.push({
      category: 'Верх',
      description: styleTops[Math.floor(Math.random() * styleTops.length)],
      colors: request.colorPreferences,
      style: style,
      fit: this.getRecommendedFit(request.bodyType),
      price: '2000-4000'
    });
    
    items.push({
      category: 'Низ',
      description: styleBottoms[Math.floor(Math.random() * styleBottoms.length)],
      colors: request.colorPreferences,
      style: style,
      fit: this.getRecommendedFit(request.bodyType),
      price: '3000-6000'
    });
    
    items.push({
      category: 'Обувь',
      description: styleShoes[Math.floor(Math.random() * styleShoes.length)],
      colors: request.colorPreferences,
      style: style,
      fit: 'стандартный',
      price: '4000-8000'
    });
    
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
      'rectangle': `
• Выбирайте одежду с акцентом на талию (пояса, приталенные силуэты)
• Вертикальные линии и полоски визуально удлиняют фигуру
• А-силуэты и трапеции создают объем в нужных местах
• Избегайте мешковатой одежды - она скрывает естественные пропорции`,
      'hourglass': `
• Подчеркивайте талию - это ваша сильная сторона
• Выбирайте приталенные силуэты и пояса
• Избегайте мешковатой одежды и прямых силуэтов
• Балансируйте верх и низ - не перегружайте одну часть`,
      'pear': `
• Акцентируйте внимание на верхней части тела
• Выбирайте темные цвета для низа, светлые для верха
• V-образные вырезы и яркие аксессуары на уровне груди
• Избегайте обтягивающих юбок и светлых брюк`,
      'apple': `
• Создавайте вертикальные линии и удлиняющие силуэты
• Выбирайте одежду с акцентом на ноги
• V-образные вырезы и удлиненные кардиганы
• Избегайте обтягивающей одежды в области талии`,
      'inverted-triangle': `
• Балансируйте широкие плечи с объемом внизу
• Выбирайте А-силуэты и расклешенные юбки
• Темные цвета для верха, светлые для низа
• Избегайте объемных плеч и ярких цветов в верхней части`
    };
    
    return recommendations[bodyType as keyof typeof recommendations] || 
           'Выбирайте одежду, которая подчеркивает ваши достоинства и скрывает недостатки.';
  }

  // Сезонные рекомендации
  private getSeasonRecommendations(season: string): string {
    const recommendations = {
      'весна': `
• Светлые пастельные тона и яркие акценты
• Легкие ткани: хлопок, лен, шелк
• Многослойность: кардиганы, жилеты
• Цветочные принты и нежные узоры`,
      'лето': `
• Легкие дышащие ткани: хлопок, лен, вискоза
• Светлые и яркие цвета
• Минималистичные силуэты
• Защита от солнца: шляпы, солнцезащитные очки`,
      'осень': `
• Теплые землистые тона: коричневый, бордовый, оранжевый
• Плотные ткани: шерсть, твид, джинс
• Многослойность: пальто, шарфы, шапки
• Классические принты: клетка, горох`,
      'зима': `
• Темные цвета и яркие акценты
• Теплые ткани: шерсть, кашемир, мех
• Многослойность и объем
• Контрастные сочетания и металлические акценты`
    };
    
    return recommendations[season as keyof typeof recommendations] || 
           'Выбирайте одежду, соответствующую сезону и погодным условиям.';
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