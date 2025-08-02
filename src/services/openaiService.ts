// Сервис для работы с OpenAI GPT-4
// В реальном проекте здесь будет интеграция с OpenAI API

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

export interface OutfitItem {
  category: string;
  description: string;
  colors: string[];
  style: string;
  fit: string;
  price: string;
  imageUrl?: string;
}

export interface GeneratedOutfit {
  id: string;
  name: string;
  description: string;
  occasion: string;
  season: string;
  items: OutfitItem[];
  totalPrice: string;
  styleNotes: string;
  colorPalette: string[];
  confidence: number;
}

class OpenAIService {
  private apiKey: string | null = null;
  private baseUrl: string = '/api/openai/v1';

  constructor() {
    // В реальном проекте API ключ будет загружаться из переменных окружения
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    console.log('API Key loaded:', this.apiKey ? 'YES' : 'NO');
    console.log('API Key length:', this.apiKey?.length || 0);
  }

  // Реальный запрос к GPT-4 API
  async generateOutfit(request: OutfitRequest): Promise<GeneratedOutfit> {
    // Временно используем симуляцию из-за проблем с VPN/доступом к OpenAI
    console.log('Using simulation mode - VPN required for OpenAI API access');
    return this.simulateGPTResponse(request, `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Раскомментируйте код ниже после включения VPN
    /*
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('Making request to:', `${this.baseUrl}/chat/completions`);
      console.log('API Key (first 10 chars):', this.apiKey?.substring(0, 10) + '...');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Ты эксперт по стилю и модный консультант. Создай детальные образы одежды в формате JSON с полями: name, description, items (массив с category, description, colors, style, fit, price), styleNotes, colorPalette (массив цветов), totalPrice.'
            },
            {
              role: 'user',
              content: this.createOutfitPrompt(request)
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Пытаемся распарсить JSON из ответа GPT
      try {
        const content = data.choices[0]?.message?.content;
        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedOutfit = JSON.parse(jsonMatch[0]);
            return this.formatOutfitResponse(parsedOutfit, request);
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse GPT response as JSON, using fallback');
      }

      // Fallback к симуляции если парсинг не удался
      return this.simulateGPTResponse(request, `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback к симуляции при ошибке
      return this.simulateGPTResponse(request, `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    */
  }

  private createOutfitPrompt(request: OutfitRequest): string {
    return `
Создай персональный образ для женщины со следующими параметрами:
- Тип фигуры: ${request.bodyType}
- Рост: ${request.measurements.height} см
- Обхват груди: ${request.measurements.chest} см
- Обхват талии: ${request.measurements.waist} см
- Обхват бедер: ${request.measurements.hips} см
- Ширина плеч: ${request.measurements.shoulders} см

Предпочтения:
- Стиль: ${request.stylePreferences.join(', ')}
- Цвета: ${request.colorPreferences.join(', ')}
- Повод: ${request.occasion}
- Сезон: ${request.season}
- Бюджет: ${request.budget}

Создай полный образ с описанием каждого предмета одежды, цветовой палитрой и рекомендациями по стилю.
    `;
  }

  private simulateGPTResponse(request: OutfitRequest, outfitId: string): GeneratedOutfit {
    // Генерируем образы на основе типа фигуры и предпочтений
    const outfits = this.getOutfitTemplates(request.bodyType, request.occasion);
    const selectedOutfit = outfits[Math.floor(Math.random() * outfits.length)];

    return {
      id: outfitId,
      name: selectedOutfit.name,
      description: selectedOutfit.description,
      occasion: request.occasion,
      season: request.season,
      items: selectedOutfit.items.map(item => ({
        ...item,
        price: this.generatePrice(request.budget)
      })),
      totalPrice: this.calculateTotalPrice(selectedOutfit.items, request.budget),
      styleNotes: selectedOutfit.styleNotes,
      colorPalette: request.colorPreferences,
      confidence: 0.85 + Math.random() * 0.1
    };
  }

  private getOutfitTemplates(bodyType: string, occasion: string) {
    const templates = {
      casual: [
        {
          name: "Повседневный кэжуал",
          description: "Комфортный и стильный образ для повседневной носки",
          items: [
            {
              category: "Верх",
              description: "Свободная блуза из хлопка",
              colors: ["белый", "бежевый", "голубой"],
              style: "кэжуал",
              fit: "свободный",
              price: "2000-4000"
            },
            {
              category: "Низ",
              description: "Джинсы mom-fit",
              colors: ["синий", "черный"],
              style: "кэжуал",
              fit: "высокая посадка",
              price: "3000-6000"
            },
            {
              category: "Обувь",
              description: "Белые кроссовки",
              colors: ["белый"],
              style: "спортивный",
              fit: "стандартный",
              price: "1500-3000"
            }
          ],
          styleNotes: "Идеально подходит для прогулок и встреч с друзьями"
        }
      ],
      business: [
        {
          name: "Деловой образ",
          description: "Элегантный и профессиональный look для офиса",
          items: [
            {
              category: "Верх",
              description: "Блуза из шелка",
              colors: ["белый", "голубой", "бежевый"],
              style: "классический",
              fit: "приталенный",
              price: "5000-12000"
            },
            {
              category: "Низ",
              description: "Брюки-палаццо",
              colors: ["черный", "серый", "бежевый"],
              style: "классический",
              fit: "высокая посадка",
              price: "4000-10000"
            },
            {
              category: "Обувь",
              description: "Лоферы на низком каблуке",
              colors: ["черный", "коричневый"],
              style: "классический",
              fit: "стандартный",
              price: "3000-8000"
            }
          ],
          styleNotes: "Профессиональный образ с акцентом на комфорт"
        }
      ],
      evening: [
        {
          name: "Вечерний образ",
          description: "Элегантный наряд для особых случаев",
          items: [
            {
              category: "Платье",
              description: "Платье-миди с V-образным вырезом",
              colors: ["черный", "темно-синий", "бордовый"],
              style: "элегантный",
              fit: "приталенный",
              price: "8000-20000"
            },
            {
              category: "Обувь",
              description: "Туфли на каблуке",
              colors: ["черный", "золотой"],
              style: "элегантный",
              fit: "стандартный",
              price: "5000-15000"
            },
            {
              category: "Аксессуары",
              description: "Мини-сумка",
              colors: ["черный", "золотой"],
              style: "элегантный",
              fit: "стандартный",
              price: "2000-6000"
            }
          ],
          styleNotes: "Идеально подходит для вечерних мероприятий"
        }
      ]
    };

    return templates[occasion as keyof typeof templates] || templates.casual;
  }

  private generatePrice(budget: string): string {
    const budgets = {
      low: ["1500-3000", "2000-4000", "1000-2500"],
      medium: ["3000-8000", "5000-12000", "2000-6000"],
      high: ["8000-20000", "12000-30000", "6000-15000"]
    };

    const budgetRange = budgets[budget as keyof typeof budgets] || budgets.medium;
    return budgetRange[Math.floor(Math.random() * budgetRange.length)];
  }

  private calculateTotalPrice(items: OutfitItem[], budget: string): string {
    const total = items.reduce((sum, item) => {
      const priceRange = item.price.split('-');
      const avgPrice = (parseInt(priceRange[0]) + parseInt(priceRange[1])) / 2;
      return sum + avgPrice;
    }, 0);

    return `${Math.round(total)} ₽`;
  }

  // Генерация нескольких образов
  async generateMultipleOutfits(request: OutfitRequest, count: number = 3): Promise<GeneratedOutfit[]> {
    const outfits: GeneratedOutfit[] = [];
    
    for (let i = 0; i < count; i++) {
      const outfit = await this.generateOutfit(request);
      outfits.push(outfit);
    }

    return outfits;
  }

  // Анализ стиля и рекомендации
  async analyzeStyle(request: OutfitRequest): Promise<{
    recommendations: string[];
    colorAnalysis: string;
    fitAdvice: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      recommendations: [
        `Для типа фигуры "${request.bodyType}" рекомендуем акцентировать внимание на ${this.getBodyTypeAdvice(request.bodyType)}`,
        `Цветовая палитра ${request.colorPreferences.join(', ')} отлично подойдет для ${request.season}`,
        `Стиль ${request.stylePreferences.join(', ')} идеален для ${request.occasion}`
      ],
      colorAnalysis: `Ваша цветовая палитра ${request.colorPreferences.join(', ')} создает гармоничный образ`,
      fitAdvice: `Учитывая ваши параметры, рекомендуем ${this.getFitAdvice(request.bodyType)}`
    };
  }

  private getBodyTypeAdvice(bodyType: string): string {
    const advice = {
      apple: "области выше талии, используя вертикальные линии",
      pear: "верхнюю часть тела, создавая баланс с бедрами",
      hourglass: "талию, подчеркивая естественные пропорции",
      rectangle: "создание объема в нужных местах",
      'inverted-triangle': "нижнюю часть тела для баланса с плечами"
    };
    return advice[bodyType as keyof typeof advice] || "естественных пропорциях";
  }

  private getFitAdvice(bodyType: string): string {
    const advice = {
      apple: "свободные силуэты в области талии и приталенные в плечах",
      pear: "приталенные блузы и свободные брюки/юбки",
      hourglass: "приталенные силуэты, подчеркивающие талию",
      rectangle: "создание объема с помощью фактур и принтов",
      'inverted-triangle': "объемные низы и простые верхи"
    };
    return advice[bodyType as keyof typeof advice] || "классические силуэты";
  }

  // Форматирование ответа от GPT в нужный формат
  private formatOutfitResponse(gptResponse: any, request: OutfitRequest): GeneratedOutfit {
    return {
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: gptResponse.name || 'Персональный образ',
      description: gptResponse.description || 'Создан специально для вас',
      occasion: request.occasion,
      season: request.season,
      items: gptResponse.items || [],
      totalPrice: gptResponse.totalPrice || '5000 ₽',
      styleNotes: gptResponse.styleNotes || 'Стильный и комфортный образ',
      colorPalette: gptResponse.colorPalette || request.colorPreferences,
      confidence: 0.95
    };
  }
}

export const openAIService = new OpenAIService(); 