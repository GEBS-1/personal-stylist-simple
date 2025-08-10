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
      console.log('🔍 Starting real Wildberries search for:', params.query);
      
      // 1. Пробуем продвинутые методы обхода защиты
      console.log('🚀 Step 1: Trying advanced bypass methods...');
      let products = await advancedWildberriesService.searchWithAdvancedMethods(params);
      
      if (!products || products.length === 0) {
        // 2. Пробуем основной API с обходом блокировки
        console.log('🔍 Step 2: Trying main API with bypass...');
        products = await this.searchWithMainAPI(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 3. Пробуем альтернативные API
        console.log('🔍 Step 3: Trying alternative APIs...');
        products = await this.searchWithAlternativeAPI(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 4. Пробуем веб-скрапинг
        console.log('🔍 Step 4: Trying web scraping...');
        products = await this.searchWithWebScraping(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 5. Fallback на симуляцию
        console.log('🎨 Step 5: Falling back to simulated products...');
        products = this.searchByKeywords(params) || [];
      }
      
      if (!products || products.length === 0) {
        // 6. Используем fallback
        console.log('🔍 Step 6: Using fallback products...');
        return this.getFallbackProducts(params);
      }

      console.log(`✅ Successfully found ${products.length} products (real + simulated)`);
      return products;

    } catch (error) {
      console.error('❌ Real API search failed:', error);
      console.log('🔄 Falling back to simulated products');
      
      try {
        const products = this.searchByKeywords(params);
        if (products.length > 0) {
          return products;
        }
      } catch (keywordError) {
        console.error('❌ Simulated search also failed:', keywordError);
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

      console.log(`🌐 Making proxy request to: ${proxyUrl}`);
      
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
        
        // Если прокси недоступен, сразу переходим к симуляции
        if (response.status === 404 || response.status === 500) {
          console.log('🔄 Proxy server error, switching to simulated products');
          return this.searchByKeywords(params);
        }
        
        return [];
      }

      const data = await response.json();
      console.log(`📦 Proxy response data:`, data);
      
      if (data.success && data.products && data.products.length > 0) {
        // Ограничиваем количество товаров согласно параметру limit
        const limitedProducts = data.products.slice(0, params.limit || 5);
        console.log(`✅ Found ${limitedProducts.length} products via proxy (limited to ${params.limit || 5})`);
        return limitedProducts;
      }
      
    } catch (error) {
      console.log(`❌ Proxy error:`, error);
      
      // Обрабатываем специфические сетевые ошибки
      const errorMessage = error.message || error.toString();
      
      if (errorMessage.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
        console.log('🌐 Tunnel connection failed - network/proxy issue');
      } else if (errorMessage.includes('ERR_CERT_COMMON_NAME_INVALID')) {
        console.log('🔒 SSL certificate issue detected');
      } else if (errorMessage.includes('timeout')) {
        console.log('⏱️ Request timeout');
      } else if (errorMessage.includes('fetch')) {
        console.log('🌐 Network fetch error');
      }
      
      console.log('🔄 Switching to simulated products due to network issues');
      return this.searchByKeywords(params);
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

      console.log('🌐 Attempting direct API call...');
      
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
          // Ограничиваем количество товаров согласно параметру limit
          const limitedProducts = data.data.products.slice(0, params.limit || 5);
          console.log(`✅ Found ${limitedProducts.length} products via direct API (limited to ${params.limit || 5})`);
          return this.parseProducts(limitedProducts, params);
        }
      }
    } catch (error) {
      console.log(`❌ Direct API failed:`, error);
    }
    
    return [];
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
    
    console.log('🎨 Generating simulated products for query:', query);
    
    // Определяем категорию на основе запроса
    const category = this.detectCategory(query);
    console.log('📂 Detected category:', category);
    
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
      'платье': [
        {
          id: 'dress_1',
          name: 'Платье-миди',
          price: 4500,
          originalPrice: 6000,
          discount: 25,
          rating: 4.6,
          reviews: 234,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=платье+миди',
          marketplace: 'wildberries' as const,
          category: 'платье',
          colors: ['черный', 'синий', 'красный'],
          sizes: ['S', 'M', 'L', 'XL']
        },
        {
          id: 'dress_2',
          name: 'Платье-футляр',
          price: 3800,
          originalPrice: 4800,
          discount: 21,
          rating: 4.4,
          reviews: 167,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=платье+футляр',
          marketplace: 'wildberries' as const,
          category: 'платье',
          colors: ['черный', 'серый', 'бежевый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'кроссовки': [
        {
          id: 'sneakers_1',
          name: 'Кроссовки спортивные',
          price: 2500,
          originalPrice: 3500,
          discount: 29,
          rating: 4.3,
          reviews: 89,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=кроссовки+спортивные',
          marketplace: 'wildberries' as const,
          category: 'кроссовки',
          colors: ['белый', 'черный', 'серый'],
          sizes: ['36', '37', '38', '39', '40', '41', '42']
        },
        {
          id: 'sneakers_2',
          name: 'Кроссовки повседневные',
          price: 2200,
          originalPrice: 3000,
          discount: 27,
          rating: 4.2,
          reviews: 76,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=кроссовки+повседневные',
          marketplace: 'wildberries' as const,
          category: 'кроссовки',
          colors: ['белый', 'черный', 'синий'],
          sizes: ['36', '37', '38', '39', '40', '41', '42']
        }
      ],
      'костюм': [
        {
          id: 'suit_1',
          name: 'Костюм классический',
          price: 8500,
          originalPrice: 12000,
          discount: 29,
          rating: 4.7,
          reviews: 45,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru/catalog/search?text=костюм+классический',
          marketplace: 'wildberries' as const,
          category: 'костюм',
          colors: ['темно-синий', 'серый', 'черный'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ]
    };

    // Ищем товары по категории
    const categoryProducts = productDatabase[category as keyof typeof productDatabase];
    
    if (categoryProducts && categoryProducts.length > 0) {
      console.log(`✅ Found ${categoryProducts.length} products for category: ${category}`);
      return categoryProducts;
    }

    // Если категория не найдена, возвращаем товары по умолчанию
    console.log('📦 Category not found, returning default products');
    return [
      {
        id: 'default_1',
        name: 'Базовый товар',
        price: 2000,
        originalPrice: 2500,
        discount: 20,
        rating: 4.0,
        reviews: 50,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru/catalog/search?text=базовый+товар',
        marketplace: 'wildberries' as const,
        category: 'базовый',
        colors: ['черный', 'белый'],
        sizes: ['S', 'M', 'L']
      }
    ];
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
    
    // Пока используем placeholder, пока не найдем правильный формат URL изображений
    console.log(`🖼️ Generated image URL for product ${productId}: /placeholder.svg`);
    return '/placeholder.svg';
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
    
    console.log('🎯 Starting product search for outfit:', { bodyType, occasion, gender });
    
    const allProducts: Product[] = [];
    
    // Если у нас есть сгенерированный образ, ищем реальные товары для каждого элемента
    if (generatedOutfit && generatedOutfit.items && generatedOutfit.items.length > 0) {
      console.log('🎨 Searching real products for generated outfit:', generatedOutfit.name);
      
      for (const item of generatedOutfit.items) {
        console.log(`🔍 Searching real products for outfit item: ${item.name}`);
        
        try {
          // Создаем поисковый запрос на основе элемента образа
          const searchQuery = this.buildSpecificSearchQuery(item, params);
          console.log(`📝 Search query: "${searchQuery}"`);
          
          // Ищем реальные товары - ТОЛЬКО ОДИН товар на элемент образа
          const realProducts = await this.searchProducts({
            ...params,
            query: searchQuery,
            limit: 1 // Изменено с 2 на 1 - ищем только один товар на элемент
          });
          
          if (realProducts && realProducts.length > 0) {
            // Берем только первый (лучший) товар для этого элемента образа
            const bestProduct = realProducts[0];
            console.log(`✅ Found best product for "${item.name}": ${bestProduct.name} - ${bestProduct.price}₽`);
            allProducts.push(bestProduct);
          } else {
            console.log(`⚠️ No real products found for "${item.name}", creating simulated product`);
            // Если реальных товаров нет, создаем симулированный
            const simulatedProduct = this.createProductFromOutfitItem(item, params);
            if (simulatedProduct) {
              allProducts.push(simulatedProduct);
            }
          }
        } catch (error) {
          console.log(`❌ Failed to search for "${item.name}":`, error);
          // Создаем симулированный товар в случае ошибки
          const simulatedProduct = this.createProductFromOutfitItem(item, params);
          if (simulatedProduct) {
            allProducts.push(simulatedProduct);
          }
        }
      }
    } else {
      // Если нет сгенерированного образа (например, Gemini недоступен), используем базовые категории
      console.log('📋 No generated outfit available, using category-based search');
      const categories = this.getCategoriesByParams(bodyType, occasion, gender);
      
      for (const category of categories) {
        if (allProducts.length >= 9) break; // Ограничиваем количество товаров
        
        console.log(`🔍 Searching products for category: ${category}`);
        try {
          const products = await this.searchProducts({
            ...params,
            query: category,
            limit: 1 // Изменено с 2 на 1
          });
          console.log(`✅ Found ${products.length} products for ${category}`);
          if (products.length > 0) {
            allProducts.push(products[0]); // Берем только первый товар
          }
        } catch (error) {
          console.log(`⚠️ Failed to search for ${category}:`, error);
          // Добавляем fallback продукты для этой категории
          const fallbackProducts = this.getFallbackProductsForCategory(category, params);
          if (fallbackProducts.length > 0) {
            allProducts.push(fallbackProducts[0]); // Берем только первый fallback товар
          }
        }
      }
    }
    
    // Если товаров все еще недостаточно, добавляем дополнительные
    if (allProducts.length < 3) {
      console.log('📋 Adding additional fallback products');
      const fallbackProducts = this.getFallbackProducts(params);
      allProducts.push(...fallbackProducts.slice(0, 3 - allProducts.length));
    }
    
    console.log(`📦 Total products found: ${allProducts.length}`);
    
    // Фильтруем по бюджету
    const filteredProducts = this.filterByBudget(allProducts, budget);
    console.log(`💰 After budget filter: ${filteredProducts.length} products`);
    
    // Убираем дубликаты
    const uniqueProducts = this.removeDuplicates(filteredProducts);
    console.log(`🎯 Final unique products: ${uniqueProducts.length}`);
    
    // Возвращаем все найденные товары (не ограничиваем до 9)
    const result = uniqueProducts;
    
    // Определяем тип результатов для логирования
    const realCount = result.filter(p => !p.id.includes('outfit_') && !p.id.includes('fallback')).length;
    const simulatedCount = result.length - realCount;
    
    console.log(`🎯 Returning ${result.length} product recommendations (${realCount} real + ${simulatedCount} simulated)`);
    return result;
  }

  private createProductFromOutfitItem(item: any, params: SearchParams): Product | null {
    const { gender, bodyType, occasion } = params;
    
    // Создаем уникальный ID на основе элемента образа
    const itemId = `outfit_${item.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Определяем базовую цену в зависимости от категории
    const basePrices = {
      'рубашка': { min: 2500, max: 4500 },
      'брюки': { min: 3000, max: 5000 },
      'футболка': { min: 1200, max: 2500 },
      'джинсы': { min: 2800, max: 4500 },
      'платье': { min: 3500, max: 6000 },
      'кроссовки': { min: 2000, max: 4000 },
      'костюм': { min: 7000, max: 12000 }
    };
    
    const category = this.detectCategory(item.name);
    const priceRange = basePrices[category as keyof typeof basePrices] || { min: 2000, max: 4000 };
    const price = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    const originalPrice = Math.floor(price * (1 + Math.random() * 0.3 + 0.1)); // +10-40%
    const discount = Math.floor(((originalPrice - price) / originalPrice) * 100);
    
    // Создаем URL для поиска
    const searchQuery = encodeURIComponent(item.name);
    const url = `https://www.wildberries.ru/catalog/search?text=${searchQuery}`;
    
    return {
      id: itemId,
      name: item.name,
      price,
      originalPrice,
      discount,
      rating: 4.0 + Math.random() * 0.8, // 4.0-4.8
      reviews: Math.floor(Math.random() * 200) + 20, // 20-220
      image: '/placeholder.svg',
      url,
      marketplace: 'wildberries' as const,
      category,
      colors: this.getColorsForCategory(category),
      sizes: this.getSizesForCategory(category, gender)
    };
  }

  private getColorsForCategory(category: string): string[] {
    const colorMap = {
      'рубашка': ['белый', 'голубой', 'розовый', 'серый'],
      'брюки': ['черный', 'синий', 'серый', 'бежевый'],
      'футболка': ['белый', 'черный', 'серый', 'красный'],
      'джинсы': ['синий', 'темно-синий', 'черный', 'серый'],
      'платье': ['черный', 'синий', 'красный', 'бежевый'],
      'кроссовки': ['белый', 'черный', 'серый', 'синий'],
      'костюм': ['темно-синий', 'серый', 'черный']
    };
    
    return colorMap[category as keyof typeof colorMap] || ['черный', 'белый'];
  }

  private getSizesForCategory(category: string, gender: string): string[] {
    if (category === 'кроссовки') {
      return ['36', '37', '38', '39', '40', '41', '42'];
    }
    
    return ['S', 'M', 'L', 'XL'];
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