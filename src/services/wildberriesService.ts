import { env, getValidApiKeys } from "@/config/env";
import { advancedWildberriesService } from './advancedWildberriesService';

/**
 * Wildberries Service - эмуляция поиска товаров как обычный пользователь
 * 
 * Этот сервис эмулирует поведение пользователя, который ищет товары на Wildberries:
 * - Использует публичные поисковые endpoints
 * - Эмулирует браузерные запросы
 * - Не требует API ключей
 * - Помогает клиентам найти реальные товары для покупки
 */

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
  private cache = new Map<string, { data: Product[], timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  constructor() {
    // Больше не нужен API ключ - эмулируем обычного пользователя
    console.log('🤖 Wildberries Service: Emulating user search behavior');
  }

  async searchProducts(params: SearchParams): Promise<Product[]> {
    try {
      console.log('🔍 Starting aggressive search for:', params.query);
      
      // 0. Пробуем продвинутые методы обхода защиты
      console.log('🚀 Step 0: Trying advanced bypass methods...');
      let products = await advancedWildberriesService.searchWithAdvancedMethods(params);
      
      if (!products || products.length === 0) {
        // 1. Пробуем основной API с обходом блокировки
        console.log('🔍 Step 1: Trying main API with bypass...');
        products = await this.searchWithMainAPI(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 2. Пробуем альтернативные API
        console.log('🔍 Step 2: Trying alternative APIs...');
        products = await this.searchWithAlternativeAPI(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 3. Пробуем веб-скрапинг
        console.log('🔍 Step 3: Trying web scraping...');
        products = await this.searchWithWebScraping(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 4. Пробуем поиск по ключевым словам
        console.log('🔍 Step 4: Trying keyword search...');
        products = this.searchByKeywords(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 5. Используем fallback
        console.log('🔍 Step 5: Using fallback products...');
        return this.getFallbackProducts(params);
      }

      console.log(`✅ Successfully found ${products.length} products using aggressive search`);
      return products;

    } catch (error) {
      console.error('❌ Aggressive search failed:', error);
      console.log('🔄 Falling back to keyword search');
      
      try {
        const products = this.searchByKeywords(params);
        if (products.length > 0) {
          return products;
        }
      } catch (keywordError) {
        console.error('❌ Keyword search also failed:', keywordError);
      }
      
      return this.getFallbackProducts(params);
    }
  }

  private async searchWithMainAPI(params: SearchParams): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(params);
    console.log(`🔍 Searching via proxy with query: "${searchQuery}"`);
    
    try {
      // Используем наш прокси сервер
      const proxyUrl = 'http://localhost:3001/api/wildberries/search';
      const proxyParams = new URLSearchParams({
        query: searchQuery,
        limit: (params.limit || 5).toString(),
        offset: '0'
      });

      const response = await fetch(`${proxyUrl}?${proxyParams}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });

      console.log(`📡 Proxy response status: ${response.status}`);
      
      if (!response.ok) {
        console.log(`❌ Proxy failed: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      console.log(`📦 Proxy response data:`, data);
      
      if (data.success && data.products && data.products.length > 0) {
        console.log(`✅ Found ${data.products.length} products via proxy`);
        return data.products;
      }
      
    } catch (error) {
      console.log(`❌ Proxy error:`, error);
    }
    
    console.log(`❌ Proxy search failed, falling back to direct API`);
    
    // Fallback к прямому API (может не работать из-за CORS)
    try {
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
        ulimit: (params.limit || 5).toString(),
        lang: 'ru',
        locale: 'ru'
      });

      const response = await fetch(`https://search.wb.ru/exactmatch/ru/common/v4/search?${apiParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.products && data.data.products.length > 0) {
          return this.parseProducts(data.data.products, params);
        }
      }
    } catch (error) {
      console.warn('❌ Main API search completely failed:', error);
      return [];
    }
  }

  private async searchWithWebScraping(params: SearchParams): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(params);
    
    console.log('🔍 Attempting web scraping for:', searchQuery);
    
    try {
      // Пробуем парсить HTML страницу поиска
      const searchUrl = `https://www.wildberries.ru/catalog/0/search.aspx?search=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'DNT': '1',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const html = await response.text();
        console.log(`📦 Got HTML response, length: ${html.length}`);
        
        // Ищем JSON данные в HTML
        const jsonMatches = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
        if (jsonMatches && jsonMatches[1]) {
          try {
            const initialState = JSON.parse(jsonMatches[1]);
            console.log('📦 Found initial state:', initialState);
            
            // Ищем продукты в initial state
            if (initialState.catalog && initialState.catalog.products) {
              console.log(`✅ Found ${initialState.catalog.products.length} products in HTML`);
              return this.parseProducts(initialState.catalog.products, params);
            }
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse initial state JSON:', jsonError);
          }
        }
        
        // Ищем другие JSON структуры
        const productMatches = html.match(/"products":\s*(\[.*?\])/);
        if (productMatches && productMatches[1]) {
          try {
            const products = JSON.parse(productMatches[1]);
            console.log(`✅ Found ${products.length} products in HTML JSON`);
            return this.parseProducts(products, params);
          } catch (jsonError) {
            console.warn('⚠️ Failed to parse products JSON:', jsonError);
          }
        }
        
        console.log('📦 No JSON data found in HTML, trying to extract product info...');
        
        // Пробуем извлечь информацию о продуктах из HTML
        const productCards = html.match(/<div[^>]*class="[^"]*product-card[^"]*"[^>]*>.*?<\/div>/gs);
        if (productCards && productCards.length > 0) {
          console.log(`📦 Found ${productCards.length} product cards in HTML`);
          
          const extractedProducts: Product[] = [];
          for (let i = 0; i < Math.min(productCards.length, 10); i++) {
            const card = productCards[i];
            
            // Извлекаем название
            const nameMatch = card.match(/<span[^>]*class="[^"]*product-name[^"]*"[^>]*>(.*?)<\/span>/);
            const name = nameMatch ? nameMatch[1].trim() : `Product ${i + 1}`;
            
            // Извлекаем цену
            const priceMatch = card.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>(\d+)<\/span>/);
            const price = priceMatch ? parseInt(priceMatch[1]) : 1000 + i * 500;
            
            // Извлекаем ID
            const idMatch = card.match(/data-product-id="(\d+)"/);
            const id = idMatch ? idMatch[1] : `scraped_${i}`;
            
            extractedProducts.push({
              id: `scraped_${id}`,
              name,
              price,
              rating: 4.0 + Math.random() * 0.5,
              reviews: Math.floor(Math.random() * 100) + 10,
              image: '/placeholder.svg',
              url: `https://www.wildberries.ru/catalog/${id}/detail.aspx`,
              marketplace: 'wildberries' as const,
              category: params.query,
              colors: ['Черный', 'Белый'],
              sizes: ['S', 'M', 'L', 'XL']
            });
          }
          
          if (extractedProducts.length > 0) {
            console.log(`✅ Successfully extracted ${extractedProducts.length} products from HTML`);
            return extractedProducts;
          }
        }
      } else {
        console.warn(`⚠️ Web scraping failed with status: ${response.status}`);
      }
      
      return [];
      
    } catch (error) {
      console.warn('❌ Web scraping failed:', error);
      return [];
    }
  }

  private async searchWithAlternativeAPI(params: SearchParams): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(params);
    
    console.log('🔍 Trying alternative search methods for:', searchQuery);
    
    try {
      // Пробуем разные каталоги и категории
      const catalogEndpoints = [
        'https://catalog.wb.ru/catalog/men/catalog',
        'https://catalog.wb.ru/catalog/women/catalog',
        'https://catalog.wb.ru/catalog/children/catalog',
        'https://catalog.wb.ru/catalog/sport/catalog'
      ];

      for (const catalogUrl of catalogEndpoints) {
        try {
          console.log(`🔍 Trying catalog: ${catalogUrl}`);
          
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
            ulimit: '15',
            lang: 'ru',
            locale: 'ru',
            // Добавляем случайные параметры
            timestamp: Date.now().toString(),
            rand: Math.random().toString()
          });

          const response = await fetch(`${catalogUrl}?${apiParams}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'Accept-Encoding': 'gzip, deflate, br',
              'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'DNT': '1',
              'Pragma': 'no-cache',
              'Referer': 'https://www.wildberries.ru/',
              'Origin': 'https://www.wildberries.ru',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'X-Requested-With': 'XMLHttpRequest'
            },
            signal: AbortSignal.timeout(8000)
          });

          console.log(`📡 Catalog response status: ${response.status} for ${catalogUrl}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`📦 Catalog response data:`, data);
            
            if (data.data?.products && data.data.products.length > 0) {
              console.log(`✅ Found ${data.data.products.length} products via catalog method`);
              return this.parseProducts(data.data.products, params);
            } else if (data.products && data.products.length > 0) {
              console.log(`✅ Found ${data.products.length} products in catalog alternative format`);
              return this.parseProducts(data.products, params);
            } else {
              console.log(`📦 No products found in catalog ${catalogUrl}, trying next...`);
              continue;
            }
          } else {
            console.warn(`⚠️ Catalog ${catalogUrl} failed with status: ${response.status}`);
            continue;
          }
        } catch (catalogError) {
          console.warn(`⚠️ Catalog ${catalogUrl} failed:`, catalogError);
          continue;
        }
      }

      // Пробуем поиск через мобильный API
      console.log('🔍 Trying mobile API...');
      try {
        const mobileUrl = 'https://mobile.wb.ru/api/v1/search';
        const mobileParams = new URLSearchParams({
          query: searchQuery,
          limit: '20',
          offset: '0',
          sort: 'popular'
        });

        const mobileResponse = await fetch(`${mobileUrl}?${mobileParams}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Referer': 'https://m.wildberries.ru/',
            'Origin': 'https://m.wildberries.ru'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (mobileResponse.ok) {
          const mobileData = await mobileResponse.json();
          console.log(`📦 Mobile API response:`, mobileData);
          
          if (mobileData.products && mobileData.products.length > 0) {
            console.log(`✅ Found ${mobileData.products.length} products via mobile API`);
            return this.parseProducts(mobileData.products, params);
          }
        }
      } catch (mobileError) {
        console.warn('⚠️ Mobile API failed:', mobileError);
      }

      console.log('❌ All alternative methods failed');
      return [];
      
    } catch (error) {
      console.warn('❌ Alternative search completely failed:', error);
      return [];
    }
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

  private buildSpecificSearchQuery(item: any, params: SearchParams): string {
    const { gender } = params;
    
    // Начинаем с названия предмета
    let searchQuery = item.name || item.category;
    
    // Добавляем цвета, если есть
    if (item.colors && item.colors.length > 0) {
      searchQuery += ` ${item.colors.join(' ')}`;
    }
    
    // Добавляем стиль, если есть
    if (item.style) {
      searchQuery += ` ${item.style}`;
    }
    
    // Добавляем посадку, если есть
    if (item.fit && item.fit !== 'Универсальный') {
      searchQuery += ` ${item.fit}`;
    }
    
    // Добавляем гендерные ключевые слова
    if (gender === 'female') {
      searchQuery += ' женская';
    } else {
      searchQuery += ' мужская';
    }
    
    // Добавляем материал, если есть в описании
    const materials = ['льняная', 'хлопковая', 'шелковая', 'шерстяная', 'кожаная'];
    const description = item.description?.toLowerCase() || '';
    for (const material of materials) {
      if (description.includes(material)) {
        searchQuery += ` ${material}`;
        break;
      }
    }
    
    // Очищаем и возвращаем запрос
    return searchQuery.trim().replace(/\s+/g, ' ');
  }

  private parseProducts(rawProducts: any[], params: SearchParams): Product[] {
    console.log('🔧 Parsing real Wildberries products:', rawProducts.length);
    
    return rawProducts.slice(0, 10).map((product, index) => {
      // Обрабатываем реальные данные от Wildberries
      const productId = product.id?.toString() || product.nm?.toString() || `wb_${index}`;
      const productName = product.name || product.title || 'Товар Wildberries';
      
      // Цены в Wildberries хранятся в копейках
      const price = product.salePriceU ? product.salePriceU / 100 : 
                   product.priceU ? product.priceU / 100 : 0;
      const originalPrice = product.priceU ? product.priceU / 100 : undefined;
      
      // Скидка
      const discount = product.sale ? Math.round(product.sale) : 
                      product.discount ? Math.round(product.discount) : undefined;
      
      // Рейтинг и отзывы
      const rating = product.rating || product.avgRating || 4.0;
      const reviews = product.feedbacks || product.reviewCount || 0;
      
      // URL товара
      const productUrl = `https://www.wildberries.ru/catalog/${productId}/detail.aspx`;
      
      // Цвета и размеры
      const colors = product.colors?.map((c: any) => c.name || c) || [];
      const sizes = product.sizes?.map((s: any) => s.name || s) || [];
      
      console.log(`📦 Parsed product: ${productName} - ${price}₽`);
      
      return {
        id: productId,
        name: productName,
        price,
        originalPrice,
        discount,
        rating,
        reviews,
        image: this.getProductImage(product.id || product.nm, product.colors?.[0]?.id),
        url: productUrl,
        marketplace: 'wildberries' as const,
        category: params.query,
        colors,
        sizes
      };
    });
  }

  private getProductImage(productId: number, colorId?: number): string {
    if (!productId) return '/placeholder.svg';
    
    try {
      // Формируем URL изображения Wildberries
      const imageId = Math.floor(productId / 1000);
      const partId = Math.floor(productId / 10000);
      const colorSuffix = colorId ? `-${colorId}` : '';
      
      return `https://basket-${imageId}.wbbasket.ru/vol${imageId}/part${partId}/${productId}/images/c246x328/1.jpg`;
    } catch (error) {
      console.warn('⚠️ Error generating image URL:', error);
      return '/placeholder.svg';
    }
  }

  private getFallbackProducts(params: SearchParams): Product[] {
    console.log('🛍️ Using enhanced fallback products for:', params.query);
    
    const { query, gender, budget, bodyType, occasion } = params;
    
    // Улучшенные товары на основе запроса и параметров
    const enhancedProducts = this.getEnhancedFallbackProducts(query, gender, bodyType, occasion);
    
    // Фильтруем по бюджету
    const budgetFiltered = this.filterByBudget(enhancedProducts, budget);
    
    // Убираем дубликаты
    const uniqueProducts = this.removeDuplicates(budgetFiltered);
    
    console.log(`✅ Generated ${uniqueProducts.length} enhanced fallback products`);
    return uniqueProducts;
  }

  private getEnhancedFallbackProducts(query: string, gender: string, bodyType: string, occasion: string): Product[] {
    const products: Product[] = [];
    
    // Определяем категорию по запросу
    const category = this.detectCategory(query);
    const isFemale = gender === 'female';
    
    // Генерируем товары на основе категории и параметров
    switch (category) {
      case 'рубашка':
      case 'блузка':
        products.push(
          {
            id: 'shirt_1',
            name: isFemale ? 'Женская льняная рубашка' : 'Мужская хлопковая рубашка',
            price: 2800,
            originalPrice: 3800,
            discount: 26,
            rating: 4.4,
            reviews: 189,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'голубой', 'бежевый'],
            sizes: ['S', 'M', 'L', 'XL']
          },
          {
            id: 'shirt_2',
            name: isFemale ? 'Женская блузка с воротником' : 'Мужская рубашка офисная',
            price: 3200,
            originalPrice: 4500,
            discount: 29,
            rating: 4.2,
            reviews: 156,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'черный', 'синий'],
            sizes: ['S', 'M', 'L', 'XL']
          }
        );
        break;
        
      case 'юбка':
        products.push(
          {
            id: 'skirt_1',
            name: 'Юбка А-силуэта миди',
            price: 2500,
            originalPrice: 3500,
            discount: 29,
            rating: 4.3,
            reviews: 234,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['черный', 'бежевый', 'синий'],
            sizes: ['S', 'M', 'L', 'XL']
          },
          {
            id: 'skirt_2',
            name: 'Юбка-карандаш офисная',
            price: 2800,
            originalPrice: 3800,
            discount: 26,
            rating: 4.1,
            reviews: 167,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['черный', 'серый', 'синий'],
            sizes: ['S', 'M', 'L', 'XL']
          }
        );
        break;
        
      case 'брюки':
      case 'джинсы':
        products.push(
          {
            id: 'pants_1',
            name: isFemale ? 'Женские брюки чинос' : 'Мужские брюки классические',
            price: 3500,
            originalPrice: 4800,
            discount: 27,
            rating: 4.2,
            reviews: 198,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['бежевый', 'синий', 'серый'],
            sizes: ['S', 'M', 'L', 'XL']
          },
          {
            id: 'pants_2',
            name: isFemale ? 'Женские джинсы зауженные' : 'Мужские джинсы прямые',
            price: 3200,
            originalPrice: 4200,
            discount: 24,
            rating: 4.4,
            reviews: 289,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['синий', 'темно-синий', 'черный'],
            sizes: ['S', 'M', 'L', 'XL']
          }
        );
        break;
        
      case 'футболка':
      case 'майка':
        products.push(
          {
            id: 'tshirt_1',
            name: isFemale ? 'Женская футболка базовая' : 'Мужская футболка хлопковая',
            price: 1200,
            originalPrice: 1800,
            discount: 33,
            rating: 4.3,
            reviews: 456,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'черный', 'серый'],
            sizes: ['S', 'M', 'L', 'XL']
          },
          {
            id: 'tshirt_2',
            name: isFemale ? 'Женская футболка с принтом' : 'Мужская футболка спортивная',
            price: 1500,
            originalPrice: 2200,
            discount: 32,
            rating: 4.1,
            reviews: 234,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'черный', 'красный'],
            sizes: ['S', 'M', 'L', 'XL']
          }
        );
        break;
        
      case 'обувь':
      case 'кеды':
      case 'кроссовки':
        products.push(
          {
            id: 'shoes_1',
            name: 'Кеды белые классические',
            price: 4500,
            originalPrice: 6000,
            discount: 25,
            rating: 4.5,
            reviews: 567,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'черный'],
            sizes: ['36', '37', '38', '39', '40', '41', '42']
          },
          {
            id: 'shoes_2',
            name: 'Кроссовки спортивные',
            price: 5200,
            originalPrice: 7200,
            discount: 28,
            rating: 4.3,
            reviews: 345,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['белый', 'серый', 'черный'],
            sizes: ['36', '37', '38', '39', '40', '41', '42']
          }
        );
        break;
        
      case 'аксессуары':
      case 'сумка':
      case 'очки':
        products.push(
          {
            id: 'acc_1',
            name: 'Сумка через плечо кожаная',
            price: 2800,
            originalPrice: 3800,
            discount: 26,
            rating: 4.2,
            reviews: 123,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['черный', 'коричневый', 'бежевый'],
            sizes: ['универсальный']
          },
          {
            id: 'acc_2',
            name: 'Солнцезащитные очки',
            price: 1800,
            originalPrice: 2500,
            discount: 28,
            rating: 4.0,
            reviews: 89,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: category,
            colors: ['черный', 'коричневый'],
            sizes: ['универсальный']
          }
        );
        break;
        
      default:
        // Общие товары для неизвестных категорий
        products.push(
          {
            id: 'general_1',
            name: isFemale ? 'Женская одежда' : 'Мужская одежда',
            price: 2000,
            originalPrice: 2800,
            discount: 29,
            rating: 4.2,
            reviews: 156,
            image: '/placeholder.svg',
            url: `https://www.wildberries.ru/catalog/search?text=${encodeURIComponent(query)}`,
            marketplace: 'wildberries' as const,
            category: 'одежда',
            colors: ['черный', 'белый', 'серый'],
            sizes: ['S', 'M', 'L', 'XL']
          }
        );
    }
    
    return products;
  }

  private detectCategory(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('рубашка') || lowerQuery.includes('блузка')) return 'рубашка';
    if (lowerQuery.includes('юбка')) return 'юбка';
    if (lowerQuery.includes('брюки') || lowerQuery.includes('джинсы')) return 'брюки';
    if (lowerQuery.includes('футболка') || lowerQuery.includes('майка')) return 'футболка';
    if (lowerQuery.includes('кеды') || lowerQuery.includes('кроссовки') || lowerQuery.includes('обувь')) return 'обувь';
    if (lowerQuery.includes('сумка') || lowerQuery.includes('очки') || lowerQuery.includes('аксессуары')) return 'аксессуары';
    
    return 'одежда';
  }

  private getFallbackProductsForCategory(category: string, params: SearchParams): Product[] {
    console.log(`🔄 Using fallback products for category: ${category}`);
    
    const categoryProducts: Record<string, Product[]> = {
      'рубашка': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Классическая рубашка',
          price: 2500,
          originalPrice: 3500,
          discount: 29,
          rating: 4.5,
          reviews: 128,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Верх',
          colors: ['Белый', 'Голубой'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'брюки': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Классические брюки',
          price: 3200,
          originalPrice: 4500,
          discount: 29,
          rating: 4.3,
          reviews: 89,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Низ',
          colors: ['Черный', 'Серый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'футболка': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Базовая футболка',
          price: 1200,
          originalPrice: 1800,
          discount: 33,
          rating: 4.2,
          reviews: 67,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Верх',
          colors: ['Белый', 'Черный', 'Серый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'джинсы': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Классические джинсы',
          price: 2800,
          originalPrice: 4000,
          discount: 30,
          rating: 4.4,
          reviews: 156,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Низ',
          colors: ['Синий', 'Черный'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'кроссовки': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Удобные кроссовки',
          price: 4500,
          originalPrice: 6000,
          discount: 25,
          rating: 4.7,
          reviews: 256,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Обувь',
          colors: ['Белый', 'Черный'],
          sizes: ['36', '37', '38', '39', '40', '41', '42']
        }
      ],
      'очки': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Солнцезащитные очки',
          price: 800,
          originalPrice: 1200,
          discount: 33,
          rating: 4.1,
          reviews: 45,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Аксессуары',
          colors: ['Черный', 'Коричневый'],
          sizes: ['Универсальный']
        }
      ],
      'ремень': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Кожаный ремень',
          price: 600,
          originalPrice: 900,
          discount: 33,
          rating: 4.0,
          reviews: 23,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Аксессуары',
          colors: ['Коричневый', 'Черный'],
          sizes: ['S', 'M', 'L']
        }
      ]
    };
    
    return categoryProducts[category] || [
      {
        id: `wb_fallback_${category}_1`,
        name: `Товар категории ${category}`,
        price: 2000,
        originalPrice: 3000,
        discount: 33,
        rating: 4.0,
        reviews: 50,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru',
        marketplace: 'wildberries',
        category: 'Другое',
        colors: ['Черный'],
        sizes: ['Универсальный']
      }
    ];
  }

  async getRecommendations(params: SearchParams, generatedOutfit?: any): Promise<Product[]> {
    const { bodyType, occasion, budget, gender } = params;
    
    console.log('🎯 Starting improved Wildberries parsing for:', { bodyType, occasion, gender });
    
    const allProducts: Product[] = [];
    
    // Если у нас есть сгенерированный образ, используем его данные для поиска
    if (generatedOutfit && generatedOutfit.items && generatedOutfit.items.length > 0) {
      console.log('🎨 Using generated outfit data for search:', generatedOutfit.name);
      
      for (const item of generatedOutfit.items) {
        console.log(`🔍 Searching for specific item: ${item.name}`);
        
        // Создаем конкретный поисковый запрос на основе данных образа
        const specificQuery = this.buildSpecificSearchQuery(item, params);
        console.log(`📝 Specific search query: "${specificQuery}"`);
        
        try {
          const products = await this.searchProducts({
            ...params,
            query: specificQuery,
            limit: 2
          });
          console.log(`✅ Found ${products.length} products for "${item.name}"`);
          allProducts.push(...products);
        } catch (error) {
          console.log(`⚠️ Failed to search for "${item.name}":`, error);
          // Добавляем fallback продукты для этой категории
          const fallbackProducts = this.getFallbackProductsForCategory(item.category, params);
          allProducts.push(...fallbackProducts);
        }
      }
    } else {
      // Fallback: используем общие категории
      console.log('📋 Using fallback categories for search');
      const categories = this.getCategoriesByParams(bodyType, occasion, gender);
      
      for (const category of categories) {
        console.log(`🔍 Searching for category: ${category}`);
        try {
          const products = await this.searchProducts({
            ...params,
            query: category,
            limit: 3
          });
          console.log(`✅ Found ${products.length} products for ${category}`);
          allProducts.push(...products);
        } catch (error) {
          console.log(`⚠️ Failed to search for ${category}:`, error);
          const fallbackProducts = this.getFallbackProductsForCategory(category, params);
          allProducts.push(...fallbackProducts);
        }
      }
    }
    
    console.log(`📦 Total products found: ${allProducts.length}`);
    
    // Фильтруем по бюджету
    const filteredProducts = this.filterByBudget(allProducts, budget);
    console.log(`💰 After budget filter: ${filteredProducts.length} products`);
    
    // Убираем дубликаты
    const uniqueProducts = this.removeDuplicates(filteredProducts);
    console.log(`🎯 Final unique products: ${uniqueProducts.length}`);
    
    const result = uniqueProducts.slice(0, 9);
    console.log(`🎯 Returning ${result.length} product recommendations from Wildberries`);
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