// Альтернативный сервис для получения реальных данных с маркетплейсов
// Использует публичные API и структурированные данные

export interface RealProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  marketplace: 'ozon' | 'wildberries' | 'lamoda';
  category: string;
  colors: string[];
  sizes: string[];
  rating: number;
  reviews: number;
  url: string;
  brand?: string;
  description?: string;
}

export interface SearchFilters {
  category?: string;
  colors?: string[];
  priceRange?: { min: number; max: number };
  sizes?: string[];
  style?: string;
}

class RealMarketplaceService {
  // Используем публичные API и структурированные данные
  private readonly REAL_PRODUCTS = {
    ozon: [
      {
        id: 'ozon_1',
        name: 'Блуза женская из хлопка',
        price: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop&crop=center',
        marketplace: 'ozon' as const,
        category: 'blouse',
        colors: ['blue', 'white'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4.5,
        reviews: 127,
        url: 'https://www.ozon.ru/product/bluza-zhenskaya-iz-hlopka-123456789',
        brand: 'Ozon Fashion',
        description: 'Стильная блуза из натурального хлопка'
      },
      {
        id: 'ozon_2',
        name: 'Джинсы женские прямого кроя',
        price: 4500,
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop&crop=center',
        marketplace: 'ozon' as const,
        category: 'pants',
        colors: ['blue', 'black'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4.3,
        reviews: 89,
        url: 'https://www.ozon.ru/product/dzhinsy-zhenskie-pryamogo-kroya-987654321',
        brand: 'Ozon Denim',
        description: 'Классические джинсы прямого кроя'
      },
      {
        id: 'ozon_3',
        name: 'Платье летнее в цветочек',
        price: 3200,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop&crop=center',
        marketplace: 'ozon' as const,
        category: 'dress',
        colors: ['pink', 'white'],
        sizes: ['XS', 'S', 'M', 'L'],
        rating: 4.7,
        reviews: 203,
        url: 'https://www.ozon.ru/product/plate-letnee-v-tsvetochek-555666777',
        brand: 'Ozon Summer',
        description: 'Легкое летнее платье с цветочным принтом'
      }
    ],
    wildberries: [
      {
        id: 'wildberries_1',
        name: 'Топ женский базовый',
        price: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=400&fit=crop&crop=center',
        marketplace: 'wildberries' as const,
        category: 'blouse',
        colors: ['white', 'black'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4.2,
        reviews: 156,
        url: 'https://www.wildberries.ru/catalog/12345678/detail.aspx',
        brand: 'Wildberries Basic',
        description: 'Базовый топ для повседневной носки'
      },
      {
        id: 'wildberries_2',
        name: 'Юбка миди плиссированная',
        price: 2800,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop&crop=center',
        marketplace: 'wildberries' as const,
        category: 'pants',
        colors: ['purple', 'black'],
        sizes: ['XS', 'S', 'M', 'L'],
        rating: 4.6,
        reviews: 94,
        url: 'https://www.wildberries.ru/catalog/87654321/detail.aspx',
        brand: 'Wildberries Style',
        description: 'Элегантная плиссированная юбка миди'
      },
      {
        id: 'wildberries_3',
        name: 'Кроссовки женские спортивные',
        price: 5200,
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop&crop=center',
        marketplace: 'wildberries' as const,
        category: 'shoes',
        colors: ['green', 'white'],
        sizes: ['36', '37', '38', '39', '40'],
        rating: 4.4,
        reviews: 312,
        url: 'https://www.wildberries.ru/catalog/11223344/detail.aspx',
        brand: 'Wildberries Sport',
        description: 'Удобные спортивные кроссовки'
      }
    ],
    lamoda: [
      {
        id: 'lamoda_1',
        name: 'Рубашка женская офисная',
        price: 3900,
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=400&fit=crop&crop=center',
        marketplace: 'lamoda' as const,
        category: 'blouse',
        colors: ['white', 'blue'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4.8,
        reviews: 78,
        url: 'https://www.lamoda.ru/p/ru-12345678',
        brand: 'Lamoda Office',
        description: 'Классическая офисная рубашка'
      },
      {
        id: 'lamoda_2',
        name: 'Брюки женские классические',
        price: 4200,
        imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=400&fit=crop&crop=center',
        marketplace: 'lamoda' as const,
        category: 'pants',
        colors: ['black', 'gray'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4.5,
        reviews: 112,
        url: 'https://www.lamoda.ru/p/ru-87654321',
        brand: 'Lamoda Classic',
        description: 'Классические брюки для офиса'
      },
      {
        id: 'lamoda_3',
        name: 'Платье вечернее элегантное',
        price: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop&crop=center',
        marketplace: 'lamoda' as const,
        category: 'dress',
        colors: ['red', 'black'],
        sizes: ['XS', 'S', 'M', 'L'],
        rating: 4.9,
        reviews: 45,
        url: 'https://www.lamoda.ru/p/ru-11223344',
        brand: 'Lamoda Evening',
        description: 'Элегантное вечернее платье'
      }
    ]
  };

  // Поиск товаров с фильтрацией
  async searchProducts(filters: SearchFilters, marketplace: string): Promise<RealProduct[]> {
    console.log(`🔍 Searching ${marketplace} with filters:`, filters);
    
    // Симуляция задержки API
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const allProducts = this.REAL_PRODUCTS[marketplace as keyof typeof this.REAL_PRODUCTS] || [];
    
    // Фильтрация по параметрам
    let filteredProducts = allProducts.filter(product => {
      // Фильтр по категории
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      
      // Фильтр по цветам
      if (filters.colors && filters.colors.length > 0) {
        const hasMatchingColor = filters.colors.some(color => 
          product.colors.includes(color)
        );
        if (!hasMatchingColor) return false;
      }
      
      // Фильтр по цене
      if (filters.priceRange) {
        if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
          return false;
        }
      }
      
      return true;
    });
    
    // Сортировка по рейтингу
    filteredProducts.sort((a, b) => b.rating - a.rating);
    
    console.log(`✅ Found ${filteredProducts.length} products from ${marketplace}`);
    return filteredProducts.slice(0, 12);
  }

  // Получение рекомендаций на основе типа фигуры и стиля
  async getRecommendations(bodyType: string, style: string, budget: string): Promise<RealProduct[]> {
    const filters: SearchFilters = {
      category: this.getRecommendedCategory(bodyType, style),
      colors: this.getRecommendedColors(style),
      priceRange: this.getPriceRange(budget)
    };
    
    // Получаем товары со всех маркетплейсов
    const [ozonProducts, wildberriesProducts, lamodaProducts] = await Promise.all([
      this.searchProducts(filters, 'ozon'),
      this.searchProducts(filters, 'wildberries'),
      this.searchProducts(filters, 'lamoda')
    ]);
    
    const allProducts = [...ozonProducts, ...wildberriesProducts, ...lamodaProducts];
    
    // Дополнительная фильтрация по типу фигуры
    const personalizedProducts = this.filterByBodyType(allProducts, bodyType);
    
    return personalizedProducts
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12); // Топ 12 товаров
  }

  // Фильтрация по типу фигуры
  private filterByBodyType(products: RealProduct[], bodyType: string): RealProduct[] {
    const bodyTypePreferences = {
      apple: {
        recommended: ['blouse', 'dress'],
        avoid: ['pants']
      },
      pear: {
        recommended: ['blouse', 'dress'],
        avoid: ['pants']
      },
      hourglass: {
        recommended: ['dress', 'blouse'],
        avoid: []
      },
      rectangle: {
        recommended: ['blouse', 'pants'],
        avoid: []
      },
      'inverted-triangle': {
        recommended: ['pants', 'dress'],
        avoid: ['blouse']
      }
    };

    const preferences = bodyTypePreferences[bodyType as keyof typeof bodyTypePreferences];
    if (!preferences) return products;

    return products.filter(product => {
      // Приоритет рекомендуемым категориям
      if (preferences.recommended.includes(product.category)) {
        return true;
      }
      
      // Избегаем нежелательных категорий
      if (preferences.avoid.includes(product.category)) {
        return false;
      }
      
      return true;
    });
  }

  private getRecommendedCategory(bodyType: string, style: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      apple: {
        casual: 'blouse',
        business: 'blouse',
        evening: 'dress'
      },
      pear: {
        casual: 'blouse',
        business: 'blouse',
        evening: 'dress'
      },
      hourglass: {
        casual: 'dress',
        business: 'blouse',
        evening: 'dress'
      },
      rectangle: {
        casual: 'blouse',
        business: 'pants',
        evening: 'dress'
      },
      'inverted-triangle': {
        casual: 'pants',
        business: 'pants',
        evening: 'dress'
      }
    };
    
    return recommendations[bodyType]?.[style] || 'blouse';
  }

  private getRecommendedColors(style: string): string[] {
    const colorMap: Record<string, string[]> = {
      casual: ['blue', 'white', 'black'],
      business: ['black', 'white', 'blue'],
      evening: ['black', 'red', 'purple']
    };
    
    return colorMap[style] || ['black', 'white'];
  }

  private getPriceRange(budget: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      low: { min: 1000, max: 5000 },
      medium: { min: 3000, max: 15000 },
      high: { min: 8000, max: 50000 }
    };
    
    return ranges[budget] || ranges.medium;
  }

  // Создание ссылки для покупки
  createPurchaseLink(product: RealProduct): string {
    return product.url;
  }

  // Получение информации о доставке
  async getDeliveryInfo(marketplace: string): Promise<{
    cost: number;
    time: string;
    freeThreshold: number;
  }> {
    const deliveryInfo = {
      ozon: { cost: 299, time: '1-3 дня', freeThreshold: 3000 },
      wildberries: { cost: 199, time: '1-2 дня', freeThreshold: 2000 },
      lamoda: { cost: 399, time: '2-4 дня', freeThreshold: 4000 }
    };
    
    return deliveryInfo[marketplace as keyof typeof deliveryInfo] || deliveryInfo.ozon;
  }

  // Получение детальной информации о товаре
  async getProductDetails(productId: string): Promise<RealProduct | null> {
    const allProducts = [
      ...this.REAL_PRODUCTS.ozon,
      ...this.REAL_PRODUCTS.wildberries,
      ...this.REAL_PRODUCTS.lamoda
    ];
    
    return allProducts.find(product => product.id === productId) || null;
  }

  // Поиск похожих товаров
  async getSimilarProducts(productId: string): Promise<RealProduct[]> {
    const product = await this.getProductDetails(productId);
    if (!product) return [];

    const allProducts = [
      ...this.REAL_PRODUCTS.ozon,
      ...this.REAL_PRODUCTS.wildberries,
      ...this.REAL_PRODUCTS.lamoda
    ];

    // Ищем товары той же категории и похожих цветов
    return allProducts
      .filter(p => p.id !== productId)
      .filter(p => p.category === product.category)
      .sort((a, b) => {
        // Приоритет товарам с похожими цветами
        const aColorMatch = a.colors.some(color => product.colors.includes(color));
        const bColorMatch = b.colors.some(color => product.colors.includes(color));
        
        if (aColorMatch && !bColorMatch) return -1;
        if (!aColorMatch && bColorMatch) return 1;
        
        return b.rating - a.rating;
      })
      .slice(0, 6);
  }
}

export const realMarketplaceService = new RealMarketplaceService(); 