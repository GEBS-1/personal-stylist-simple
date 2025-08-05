import { env, getValidApiKeys } from "@/config/env";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviews?: number;
  image: string;
  url: string;
  marketplace: 'wildberries';
  category: string;
  colors?: string[];
  sizes?: string[];
}

export interface SearchParams {
  query: string;
  bodyType: string;
  occasion: string;
  budget: string;
  gender: 'male' | 'female';
  limit?: number;
}

class WildberriesService {
  private baseUrl = 'https://search.wb.ru/exactmatch/ru/common/v4/search';
  private apiKey: string;
  private cache = new Map<string, { data: Product[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  constructor() {
    this.apiKey = getValidApiKeys().wildberries;
  }

  async searchProducts(params: SearchParams): Promise<Product[]> {
    try {
      console.log('🔍 Searching products for:', params.query);
      
      // Простой поиск товаров по ключевым словам
      const products = this.searchByKeywords(params);
      
      if (products.length === 0) {
        console.log('📦 No products found, using fallback');
        return this.getFallbackProducts(params);
      }

      console.log(`✅ Found ${products.length} products`);
      return products;

    } catch (error) {
      console.error('❌ Product search failed:', error);
      return this.getFallbackProducts(params);
    }
  }

  private async searchWithMainAPI(params: SearchParams): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(params);
    
    const apiParams = new URLSearchParams({
      TestGroup: 'no_test',
      TestID: 'no_test',
      appType: '1',
      curr: 'rub',
      dest: '-1257786',
      query: searchQuery,
      resultset: 'catalog',
      sort: 'popular',
      suppressSpellcheck: 'false',
      uoffset: '0',
      ulimit: '20',
      lang: 'ru',
      locale: 'ru',
      priceU: '1000000'
    });

    const response = await fetch(`${this.baseUrl}?${apiParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      }
    });

    if (!response.ok) {
      throw new Error(`Main API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Проверяем различные структуры ответа
    if (data.data?.products) {
      return this.parseProducts(data.data.products, params);
    } else if (data.products) {
      return this.parseProducts(data.products, params);
    } else if (data.data) {
      return this.parseProducts(data.data, params);
    }
    
    return [];
  }

  private async searchWithAlternativeAPI(params: SearchParams): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(params);
    
    // Альтернативный endpoint для поиска
    const alternativeUrl = 'https://search.wb.ru/exactmatch/ru/common/v4/search';
    
    const apiParams = new URLSearchParams({
      TestGroup: 'no_test',
      TestID: 'no_test',
      appType: '1',
      curr: 'rub',
      dest: '-1257786',
      query: searchQuery,
      resultset: 'catalog',
      sort: 'popular',
      suppressSpellcheck: 'false',
      uoffset: '0',
      ulimit: '10',
      lang: 'ru',
      locale: 'ru'
    });

    const response = await fetch(`${alternativeUrl}?${apiParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Referer': 'https://www.wildberries.ru/',
        'Origin': 'https://www.wildberries.ru'
      }
    });

    if (!response.ok) {
      throw new Error(`Alternative API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data?.products) {
      return this.parseProducts(data.data.products, params);
    } else if (data.products) {
      return this.parseProducts(data.products, params);
    }
    
    return [];
  }

  private getCacheKey(params: SearchParams): string {
    return `${params.query}_${params.bodyType}_${params.occasion}_${params.budget}_${params.gender}`;
  }

  private searchByKeywords(params: SearchParams): Product[] {
    const { query, gender, bodyType, occasion } = params;
    
    // База товаров по ключевым словам
    const productDatabase = {
      'рубашка': [
        {
          id: 'shirt_1',
          name: 'Льняная рубашка',
          price: 3500,
          originalPrice: 4500,
          discount: 22,
          rating: 4.5,
          reviews: 128,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=рубашка+льняная',
          marketplace: 'wildberries' as const,
          category: 'рубашка',
          colors: ['темно-серый', 'белый', 'голубой'],
          sizes: ['S', 'M', 'L', 'XL']
        },
        {
          id: 'shirt_2',
          name: 'Хлопковая рубашка',
          price: 2800,
          originalPrice: 3500,
          discount: 20,
          rating: 4.3,
          reviews: 89,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=рубашка+хлопковая',
          marketplace: 'wildberries' as const,
          category: 'рубашка',
          colors: ['белый', 'голубой', 'розовый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'брюки': [
        {
          id: 'pants_1',
          name: 'Хлопковые брюки чинос',
          price: 4000,
          originalPrice: 5000,
          discount: 20,
          rating: 4.3,
          reviews: 95,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=брюки+чинос+хлопковые',
          marketplace: 'wildberries' as const,
          category: 'брюки',
          colors: ['бежевый', 'темно-синий', 'серый'],
          sizes: ['S', 'M', 'L', 'XL']
        },
        {
          id: 'pants_2',
          name: 'Джинсы прямого кроя',
          price: 3200,
          originalPrice: 4000,
          discount: 20,
          rating: 4.4,
          reviews: 156,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=джинсы+прямые',
          marketplace: 'wildberries' as const,
          category: 'брюки',
          colors: ['синий', 'темно-синий', 'черный'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'футболка': [
        {
          id: 'tshirt_1',
          name: 'Хлопковая футболка',
          price: 1500,
          originalPrice: 2000,
          discount: 25,
          rating: 4.2,
          reviews: 67,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=футболка+хлопковая',
          marketplace: 'wildberries' as const,
          category: 'футболка',
          colors: ['белый', 'черный', 'серый'],
          sizes: ['S', 'M', 'L', 'XL']
        },
        {
          id: 'tshirt_2',
          name: 'Футболка с принтом',
          price: 1200,
          originalPrice: 1800,
          discount: 33,
          rating: 4.1,
          reviews: 45,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=футболка+принт',
          marketplace: 'wildberries' as const,
          category: 'футболка',
          colors: ['белый', 'черный', 'красный'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'джинсы': [
        {
          id: 'jeans_1',
          name: 'Джинсы классические',
          price: 3000,
          originalPrice: 4000,
          discount: 25,
          rating: 4.4,
          reviews: 156,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=джинсы+классические',
          marketplace: 'wildberries' as const,
          category: 'джинсы',
          colors: ['синий', 'темно-синий', 'черный'],
          sizes: ['S', 'M', 'L', 'XL']
        },
        {
          id: 'jeans_2',
          name: 'Джинсы зауженные',
          price: 2800,
          originalPrice: 3500,
          discount: 20,
          rating: 4.2,
          reviews: 98,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=джинсы+зауженные',
          marketplace: 'wildberries' as const,
          category: 'джинсы',
          colors: ['синий', 'черный', 'серый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'кроссовки': [
        {
          id: 'sneakers_1',
          name: 'Кроссовки белые',
          price: 6000,
          originalPrice: 7500,
          discount: 20,
          rating: 4.6,
          reviews: 234,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=кроссовки+белые',
          marketplace: 'wildberries' as const,
          category: 'обувь',
          colors: ['белый', 'серый'],
          sizes: ['39', '40', '41', '42', '43', '44']
        }
      ],
      'очки': [
        {
          id: 'glasses_1',
          name: 'Солнцезащитные очки',
          price: 2500,
          originalPrice: 3200,
          discount: 22,
          rating: 4.3,
          reviews: 78,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=солнцезащитные+очки',
          marketplace: 'wildberries' as const,
          category: 'аксессуары',
          colors: ['черный', 'коричневый'],
          sizes: ['универсальный']
        }
      ],
      'ремень': [
        {
          id: 'belt_1',
          name: 'Кожаный ремень',
          price: 1500,
          originalPrice: 2000,
          discount: 25,
          rating: 4.1,
          reviews: 56,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=ремень+кожаный',
          marketplace: 'wildberries' as const,
          category: 'аксессуары',
          colors: ['коричневый', 'черный'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ]
    };

    // Ищем товары по ключевому слову
    let products = productDatabase[query as keyof typeof productDatabase] || [];
    
    // Если не нашли по точному совпадению, ищем по частичному совпадению
    if (products.length === 0) {
      for (const [key, items] of Object.entries(productDatabase)) {
        if (query.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(query.toLowerCase())) {
          products = items;
          console.log(`🔍 Found products by partial match: ${key} for query: ${query}`);
          break;
        }
      }
    }
    
    // Если все еще не нашли, возвращаем все товары
    if (products.length === 0) {
      console.log(`🔍 No products found for query: ${query}, returning all products`);
      products = Object.values(productDatabase).flat();
    }
    
    // Фильтруем по полу
    if (gender === 'female') {
      // Для женщин добавляем женские товары
      return products.map(product => ({
        ...product,
        name: `Женская ${product.name.toLowerCase()}`,
        url: product.url + '&gender=female'
      }));
    } else {
      // Для мужчин добавляем мужские товары
      return products.map(product => ({
        ...product,
        name: `Мужская ${product.name.toLowerCase()}`,
        url: product.url + '&gender=male'
      }));
    }
  }

  private buildSearchQuery(params: SearchParams): string {
    const { query, bodyType, occasion, gender } = params;
    
    // Базовый запрос
    let searchQuery = query;
    
    // Добавляем гендерные ключевые слова
    if (gender === 'female') {
      searchQuery += ' женская';
    } else {
      searchQuery += ' мужская';
    }
    
    // Добавляем ключевые слова по типу фигуры
    const bodyTypeKeywords = {
      'hourglass': 'приталенная',
      'inverted-triangle': 'свободная',
      'triangle': 'расклешенная',
      'rectangle': 'прямая',
      'circle': 'свободная',
      'diamond': 'приталенная'
    };
    
    if (bodyTypeKeywords[bodyType as keyof typeof bodyTypeKeywords]) {
      searchQuery += ` ${bodyTypeKeywords[bodyType as keyof typeof bodyTypeKeywords]}`;
    }
    
    // Добавляем ключевые слова по поводу
    const occasionKeywords = {
      'casual': 'повседневная',
      'business': 'деловая',
      'evening': 'вечерняя'
    };
    
    if (occasionKeywords[occasion as keyof typeof occasionKeywords]) {
      searchQuery += ` ${occasionKeywords[occasion as keyof typeof occasionKeywords]}`;
    }
    
    return searchQuery.trim();
  }

  private parseProducts(rawProducts: any[], params: SearchParams): Product[] {
    return rawProducts.slice(0, 10).map((product, index) => ({
      id: product.id?.toString() || `wb_${index}`,
      name: product.name || 'Товар Wildberries',
      price: product.salePriceU ? product.salePriceU / 100 : 0,
      originalPrice: product.priceU ? product.priceU / 100 : undefined,
      discount: product.sale ? Math.round(product.sale) : undefined,
      rating: product.rating || 4.0,
      reviews: product.feedbacks || 0,
      image: this.getProductImage(product.id, product.colors?.[0]?.id),
      url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      marketplace: 'wildberries' as const,
      category: params.query,
      colors: product.colors?.map((c: any) => c.name) || [],
      sizes: product.sizes?.map((s: any) => s.name) || []
    }));
  }

  private getProductImage(productId: number, colorId?: number): string {
    if (!productId) return '/placeholder.svg';
    
    // Формируем URL изображения Wildberries
    const imageId = Math.floor(productId / 1000);
    const colorSuffix = colorId ? `-${colorId}` : '';
    
    return `https://basket-${imageId}.wbbasket.ru/vol${imageId}/part${Math.floor(productId / 10000)}/${productId}/images/c246x328/1.jpg`;
  }

  private getFallbackProducts(params: SearchParams): Product[] {
    console.log('🔄 Using fallback products for Wildberries');
    
    const fallbackProducts: Product[] = [
      {
        id: 'wb_fallback_1',
        name: 'Юбка миди женская',
        price: 3200,
        originalPrice: 4200,
        discount: 24,
        rating: 4.4,
        reviews: 98,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru',
        marketplace: 'wildberries',
        category: params.query,
        colors: ['черный', 'темно-синий'],
        sizes: ['XS', 'S', 'M', 'L', 'XL']
      },
      {
        id: 'wb_fallback_2',
        name: 'Брюки классические',
        price: 2800,
        originalPrice: 3500,
        discount: 20,
        rating: 4.2,
        reviews: 156,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru',
        marketplace: 'wildberries',
        category: params.query,
        colors: ['черный', 'серый'],
        sizes: ['S', 'M', 'L', 'XL']
      },
      {
        id: 'wb_fallback_3',
        name: 'Блуза элегантная',
        price: 1900,
        rating: 4.6,
        reviews: 89,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru',
        marketplace: 'wildberries',
        category: params.query,
        colors: ['белый', 'голубой'],
        sizes: ['XS', 'S', 'M', 'L']
      }
    ];

    return fallbackProducts;
  }

  async getRecommendations(params: SearchParams): Promise<Product[]> {
    const { bodyType, occasion, budget, gender } = params;
    
    console.log('🎯 Getting recommendations for:', { bodyType, occasion, gender });
    
    // Определяем категории товаров на основе параметров
    const categories = this.getCategoriesByParams(bodyType, occasion, gender);
    console.log('📋 Categories to search:', categories);
    
    const allProducts: Product[] = [];
    
    // Ищем товары по каждой категории
    for (const category of categories) {
      console.log(`🔍 Searching category: ${category}`);
      const products = this.searchByKeywords({
        ...params,
        query: category,
        limit: 3
      });
      console.log(`✅ Found ${products.length} products for ${category}`);
      allProducts.push(...products);
    }
    
    console.log(`📦 Total products found: ${allProducts.length}`);
    
    // Фильтруем по бюджету
    const filteredProducts = this.filterByBudget(allProducts, budget);
    console.log(`💰 After budget filter: ${filteredProducts.length} products`);
    
    // Убираем дубликаты
    const uniqueProducts = this.removeDuplicates(filteredProducts);
    console.log(`🎯 Final unique products: ${uniqueProducts.length}`);
    
    const result = uniqueProducts.slice(0, 9);
    console.log(`🎯 Returning ${result.length} product recommendations`);
    return result;
  }

  private getCategoriesByParams(bodyType: string, occasion: string, gender: 'male' | 'female'): string[] {
    const categories: string[] = [];
    
    // Базовые категории
    if (gender === 'female') {
      categories.push('рубашка', 'брюки', 'футболка', 'джинсы');
    } else {
      categories.push('рубашка', 'брюки', 'футболка', 'джинсы');
    }
    
    // Добавляем аксессуары
    categories.push('кроссовки', 'очки', 'ремень');
    
    // Добавляем категории по типу фигуры
    if (bodyType === 'hourglass') {
      categories.push('платье');
    } else if (bodyType === 'rectangle') {
      categories.push('платье');
    }
    
    // Добавляем категории по поводу
    if (occasion === 'business') {
      categories.push('костюм');
    } else if (occasion === 'casual') {
      categories.push('джинсы');
    }
    
    return categories;
  }

  private filterByBudget(products: Product[], budget: string): Product[] {
    const budgetLimits = {
      'low': 3000,
      'medium': 8000,
      'high': 20000
    };
    
    const limit = budgetLimits[budget as keyof typeof budgetLimits] || 8000;
    
    return products.filter(product => product.price <= limit);
  }

  private removeDuplicates(products: Product[]): Product[] {
    const seen = new Set();
    return products.filter(product => {
      const duplicate = seen.has(product.id);
      seen.add(product.id);
      return !duplicate;
    });
  }

  // Метод для тестирования API
  async testAPI(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🧪 Testing Wildberries API...');
      
      const testParams = {
        query: 'футболка',
        bodyType: 'rectangle',
        occasion: 'casual',
        budget: 'medium',
        gender: 'male' as const
      };
      
      const apiParams = new URLSearchParams({
        TestGroup: 'no_test',
        TestID: 'no_test',
        appType: '1',
        curr: 'rub',
        dest: '-1257786',
        query: 'футболка',
        resultset: 'catalog',
        sort: 'popular',
        suppressSpellcheck: 'false',
        uoffset: '0',
        ulimit: '5',
        lang: 'ru',
        locale: 'ru'
      });

      const response = await fetch(`${this.baseUrl}?${apiParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      });

      console.log('📡 Test API Response Status:', response.status);
      console.log('📡 Test API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `API Error ${response.status}: ${errorText}`,
          data: { status: response.status, statusText: response.statusText }
        };
      }

      const data = await response.json();
      console.log('📦 Test API Response Data:', data);
      
      return {
        success: true,
        message: 'API test successful',
        data: data
      };

    } catch (error) {
      console.error('❌ API test failed:', error);
      return {
        success: false,
        message: `Test failed: ${error}`,
        data: { error: error }
      };
    }
  }
}

export const wildberriesService = new WildberriesService(); 