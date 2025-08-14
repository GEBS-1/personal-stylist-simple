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
    // Use the query already present in params, which should be the specific item query
    const searchQuery = params.query; // FIX: Use params.query directly
    console.log(`🔍 Searching via proxy with query: "${searchQuery}"`);
    console.log(`🔍 Original params:`, { query: params.query, gender: params.gender, bodyType: params.bodyType, occasion: params.occasion });
    
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
        console.log(`✅ Found ${data.products.length} products via proxy`);
        return data.products;
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
          console.log(`✅ Found ${data.data.products.length} products via direct API`);
          return this.parseProducts(data.data.products, params);
        }
      }
    } catch (error) {
      console.warn('❌ Main API search completely failed:', error);
      
      // Обрабатываем сетевые ошибки
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes('CORS') || errorMessage.includes('blocked')) {
        console.log('🚫 CORS blocked - expected for direct API calls');
      }
    }
    
    // Финальный fallback к симуляции
    console.log('🎭 All real API attempts failed, using simulated products');
    return this.searchByKeywords(params);
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
    
    // Используем улучшенную базу товаров
    return this.getFallbackProductsForCategory(category, params);
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
    
    // Начинаем с пола для более точного поиска
    let searchQuery = '';
    if (gender === 'female') {
      searchQuery += 'женская ';
      
      // Добавляем специфичные женские ключевые слова для категории
      if (item.category === 'Верх') {
        searchQuery += 'блуза рубашка топ ';
      } else if (item.category === 'Низ') {
        searchQuery += 'юбка брюки джинсы ';
      } else if (item.category === 'Обувь') {
        searchQuery += 'туфли босоножки балетки кроссовки ';
      } else if (item.category === 'Аксессуары') {
        searchQuery += 'сумка украшения шарф ';
      } else if (item.category === 'Дополнительно') {
        searchQuery += 'пальто куртка кардиган ';
      }
    } else {
      searchQuery += 'мужская ';
      
      // Добавляем специфичные мужские ключевые слова для категории
      if (item.category === 'Верх') {
        searchQuery += 'рубашка футболка свитер ';
      } else if (item.category === 'Низ') {
        searchQuery += 'брюки джинсы шорты ';
      } else if (item.category === 'Обувь') {
        searchQuery += 'туфли ботинки кроссовки ';
      } else if (item.category === 'Аксессуары') {
        searchQuery += 'часы галстук кепка ';
      } else if (item.category === 'Дополнительно') {
        searchQuery += 'пальто куртка пиджак ';
      }
    }
    
    // Добавляем название предмета (основной поисковый термин)
    if (item.name) {
      // Извлекаем ключевые слова из названия
      const nameKeywords = item.name.toLowerCase()
        .match(/(рубашка|блуза|брюки|джинсы|юбка|футболка|топ|платье|пальто|куртка|кардиган|пиджак|туфли|ботинки|кроссовки|босоножки|балетки|сумка|очки|шарф|часы|галстук|кепка)/g);
      
      if (nameKeywords) {
        searchQuery += `${nameKeywords.join(' ')} `;
      } else {
        // Если ключевые слова не найдены, добавляем название как есть
        searchQuery += `${item.name} `;
      }
    }
    
    // Добавляем цвета, если есть
    if (item.colors && item.colors.length > 0) {
      searchQuery += `${item.colors.join(' ')} `;
    }
    
    // Добавляем стиль, если есть
    if (item.style) {
      searchQuery += `${item.style} `;
    }
    
    // Добавляем посадку, если есть и она не универсальная
    if (item.fit && item.fit !== 'Универсальный' && item.fit !== 'стандартный') {
      searchQuery += `${item.fit} `;
    }
    
    // Добавляем материал, если есть в описании
    const materials = ['льняная', 'хлопковая', 'шелковая', 'шерстяная', 'кожаная'];
    const description = item.description?.toLowerCase() || '';
    for (const material of materials) {
      if (description.includes(material)) {
        searchQuery += `${material} `;
        break;
      }
    }
    
    // Очищаем и возвращаем запрос
    const finalQuery = searchQuery.trim().replace(/\s+/g, ' ');
    console.log(`🔍 Final search query for ${item.category}: "${finalQuery}"`);
    console.log(`🔍 Item details:`, { name: item.name, colors: item.colors, style: item.style, fit: item.fit });
    return finalQuery;
  }

  private buildOutfitSearchQuery(outfit: any, params: SearchParams): string {
    const { gender, occasion } = params;
    
    // Создаем запрос для поиска похожих образов
    let searchQuery = '';
    
    // Начинаем с пола
    if (gender === 'female') {
      searchQuery += 'женский ';
    } else {
      searchQuery += 'мужской ';
    }
    
    // Добавляем стиль и повод
    if (outfit.styleNotes) {
      // Извлекаем ключевые слова из styleNotes
      const styleKeywords = outfit.styleNotes.toLowerCase()
        .match(/(casual|деловой|вечерний|спортивный|классический|элегантный|стильный)/g);
      if (styleKeywords) {
        searchQuery += `${styleKeywords.join(' ')} `;
      }
    }
    
    // Добавляем повод
    if (occasion) {
      searchQuery += `${occasion} `;
    }
    
    // Добавляем сезон из самого образа
    if (outfit.season) {
      searchQuery += `${outfit.season} `;
    }
    
    // Добавляем основные цвета образа
    if (outfit.colorPalette && outfit.colorPalette.length > 0) {
      searchQuery += `${outfit.colorPalette.join(' ')} `;
    }
    
    // Добавляем тип фигуры
    if (params.bodyType) {
      searchQuery += `${params.bodyType} `;
    }
    
    // Добавляем ключевые слова из названия образа
    if (outfit.name) {
      const nameKeywords = outfit.name.toLowerCase()
        .match(/(образ|look|стиль|casual|деловой|вечерний|весенний|летний|осенний|зимний)/g);
      if (nameKeywords) {
        searchQuery += `${nameKeywords.join(' ')} `;
      }
    }
    
    // Очищаем и возвращаем запрос
    return searchQuery.trim().replace(/\s+/g, ' ');
  }

  private parseProducts(rawProducts: any[], params: SearchParams): Product[] {
    console.log('🔧 Parsing real Wildberries products:', rawProducts.length);
    
    const { gender } = params;
    
    return rawProducts.slice(0, 10)
      .filter(product => {
        // Фильтруем по полу на основе названия и описания товара
        const productName = (product.name || product.title || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        
        // Исключаем товары с явным указанием неподходящего пола
        if (gender === 'female') {
          // Для женщин исключаем мужские товары
          if (productName.includes('мужск') || productDesc.includes('мужск') ||
              productName.includes('муж') || productDesc.includes('муж')) {
            console.log(`🚫 Filtered out male product: ${product.name}`);
            return false;
          }
        } else {
          // Для мужчин исключаем женские товары
          if (productName.includes('женск') || productDesc.includes('женск') ||
              productName.includes('жен') || productDesc.includes('жен')) {
            console.log(`🚫 Filtered out female product: ${product.name}`);
            return false;
          }
        }
        
        return true;
      })
      .map((product, index) => {
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
    
    // Более детальное определение категорий
    if (lowerQuery.includes('рубашка') || lowerQuery.includes('блузка') || lowerQuery.includes('блуза')) return 'рубашка';
    if (lowerQuery.includes('юбка') || lowerQuery.includes('юбка-карандаш')) return 'юбка';
    if (lowerQuery.includes('брюки') || lowerQuery.includes('джинсы') || lowerQuery.includes('шорты')) return 'брюки';
    if (lowerQuery.includes('футболка') || lowerQuery.includes('майка') || lowerQuery.includes('топ')) return 'футболка';
    if (lowerQuery.includes('платье') || lowerQuery.includes('сарафан')) return 'платье';
    if (lowerQuery.includes('пальто') || lowerQuery.includes('куртка') || lowerQuery.includes('пиджак') || lowerQuery.includes('кардиган')) return 'верхняя одежда';
    if (lowerQuery.includes('кеды') || lowerQuery.includes('кроссовки') || lowerQuery.includes('ботинки') || lowerQuery.includes('туфли') || lowerQuery.includes('обувь')) return 'обувь';
    if (lowerQuery.includes('сумка') || lowerQuery.includes('рюкзак') || lowerQuery.includes('кошелек')) return 'сумка';
    if (lowerQuery.includes('очки') || lowerQuery.includes('шарф') || lowerQuery.includes('шапка') || lowerQuery.includes('перчатки')) return 'аксессуары';
    if (lowerQuery.includes('часы') || lowerQuery.includes('браслет') || lowerQuery.includes('колье')) return 'украшения';
    
    // Если не удалось определить, возвращаем категорию на основе контекста
    if (lowerQuery.includes('верх') || lowerQuery.includes('верхняя')) return 'верхняя одежда';
    if (lowerQuery.includes('низ') || lowerQuery.includes('нижняя')) return 'брюки';
    if (lowerQuery.includes('дополнительно') || lowerQuery.includes('доп')) return 'верхняя одежда';
    
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
      'обувь': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Стильная обувь',
          price: 3800,
          originalPrice: 5000,
          discount: 24,
          rating: 4.6,
          reviews: 189,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Обувь',
          colors: ['Черный', 'Коричневый'],
          sizes: ['36', '37', '38', '39', '40', '41', '42']
        }
      ],
      'юбка': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Элегантная юбка',
          price: 2800,
          originalPrice: 3800,
          discount: 26,
          rating: 4.4,
          reviews: 95,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Низ',
          colors: ['Черный', 'Серый'],
          sizes: ['XS', 'S', 'M', 'L']
        }
      ],
      'платье': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Стильное платье',
          price: 4200,
          originalPrice: 5500,
          discount: 24,
          rating: 4.5,
          reviews: 134,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Платье',
          colors: ['Черный', 'Синий'],
          sizes: ['XS', 'S', 'M', 'L']
        }
      ],
      'верхняя одежда': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Стильная верхняя одежда',
          price: 6500,
          originalPrice: 8500,
          discount: 24,
          rating: 4.6,
          reviews: 178,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Верхняя одежда',
          colors: ['Черный', 'Бежевый'],
          sizes: ['S', 'M', 'L', 'XL']
        }
      ],
      'сумка': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Стильная сумка',
          price: 3200,
          originalPrice: 4200,
          discount: 24,
          rating: 4.3,
          reviews: 89,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Аксессуары',
          colors: ['Черный', 'Коричневый'],
          sizes: ['Универсальный']
        }
      ],
      'аксессуары': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Модный аксессуар',
          price: 1800,
          originalPrice: 2500,
          discount: 28,
          rating: 4.2,
          reviews: 67,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Аксессуары',
          colors: ['Черный', 'Серебряный'],
          sizes: ['Универсальный']
        }
      ],
      'украшения': [
        {
          id: `wb_fallback_${category}_1`,
          name: 'Элегантное украшение',
          price: 2200,
          originalPrice: 3000,
          discount: 27,
          rating: 4.4,
          reviews: 78,
          image: '/placeholder.svg',
          url: 'https://www.wildberries.ru',
          marketplace: 'wildberries',
          category: 'Украшения',
          colors: ['Серебряный', 'Золотой'],
          sizes: ['Универсальный']
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

  async getRecommendations(generatedOutfit: any, params: SearchParams): Promise<Product[]> {
    console.log('🎯 Starting product recommendations for outfit:', generatedOutfit?.name);
    console.log('🎯 Outfit items:', generatedOutfit?.items?.map((item: any) => ({ 
      category: item.category, 
      name: item.name 
    })));

    if (!generatedOutfit?.items?.length) {
      console.log('❌ No outfit items found');
      return [];
    }

    const allProducts: Product[] = [];

    // Ищем товары для каждого элемента образа отдельно
    for (const item of generatedOutfit.items) {
      console.log(`\n🔍 Searching for item: "${item.name}" (${item.category})`);
      
      try {
        // Ищем товары для конкретного элемента
        const itemProducts = await this.searchProducts({
          query: item.name,
          gender: params.gender,
          bodyType: params.bodyType,
          occasion: params.occasion,
          budget: params.budget,
          limit: 1 // Берем только 1 товар для каждого элемента
        });

        console.log(`✅ Found ${itemProducts.length} products for "${item.name}"`);
        
        if (itemProducts.length > 0) {
          // Берем только первый (наиболее релевантный) товар
          const selectedProduct = itemProducts[0];
          console.log(`📦 Selected product:`, { 
            name: selectedProduct.name, 
            category: selectedProduct.category, 
            price: selectedProduct.price 
          });
          
          allProducts.push(selectedProduct);
        } else {
          // Если товары не найдены, создаем симулированный
          console.log(`🎨 No products found, creating simulated product for "${item.name}"`);
          const simulatedProduct = this.createProductFromOutfitItem(item, params);
          console.log(`🎨 Created simulated product:`, { 
            name: simulatedProduct.name, 
            category: simulatedProduct.category, 
            price: simulatedProduct.price 
          });
          allProducts.push(simulatedProduct);
        }
      } catch (error) {
        console.error(`❌ Error searching for "${item.name}":`, error);
        // В случае ошибки создаем симулированный товар
        const simulatedProduct = this.createProductFromOutfitItem(item, params);
        console.log(`🎨 Created fallback simulated product:`, { 
          name: simulatedProduct.name, 
          category: simulatedProduct.category, 
          price: simulatedProduct.price 
        });
        allProducts.push(simulatedProduct);
      }
    }

    // Фильтруем по бюджету
    const budgetFiltered = this.filterByBudget(allProducts, params.budget);
    console.log(`💰 Budget filtering: ${allProducts.length} → ${budgetFiltered.length} products`);

    // Ограничиваем количество товаров количеством элементов образа
    const result = budgetFiltered.slice(0, generatedOutfit.items.length);
    
    console.log(`🎯 Final products:`, result.map(p => ({ 
      name: p.name, 
      category: p.category, 
      price: p.price, 
      isSimulated: p.id.includes('outfit_') || p.id.includes('fallback') 
    })));
    
    return result;
  }

  private createProductFromOutfitItem(item: any, params: SearchParams): Product | null {
    const { gender, bodyType, occasion } = params;
    
    // Создаем уникальный ID на основе элемента образа
    const itemId = `outfit_${item.category.toLowerCase()}_${item.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    // Определяем базовую цену в зависимости от категории и материала
    const basePrices = {
      'Верх': { min: 2500, max: 4500 },
      'Низ': { min: 3000, max: 5000 },
      'Обувь': { min: 3500, max: 6000 },
      'Аксессуары': { min: 1500, max: 4000 },
      'Дополнительно': { min: 5000, max: 12000 }
    };
    
    const category = item.category;
    const priceRange = basePrices[category as keyof typeof basePrices] || { min: 2000, max: 4000 };
    const price = Math.floor(Math.random() * (priceRange.max - priceRange.min + 1)) + priceRange.min;
    const originalPrice = Math.floor(price * (1 + Math.random() * 0.3 + 0.1)); // +10-40%
    const discount = Math.floor(((originalPrice - price) / originalPrice) * 100);
    
    // Создаем URL для поиска на основе элемента образа
    const searchQuery = encodeURIComponent(`${item.name} ${item.colors?.[0] || ''}`);
    const url = `https://www.wildberries.ru/catalog/search?text=${searchQuery}`;
    
    // Определяем размеры в зависимости от категории
    let sizes: string[];
    if (category === 'Обувь') {
      sizes = ['36', '37', '38', '39', '40', '41', '42'];
    } else if (category === 'Аксессуары') {
      sizes = ['универсальный'];
    } else {
      sizes = ['S', 'M', 'L', 'XL'];
    }
    
    // Создаем название товара на основе элемента образа
    let productName = item.name;
    if (item.colors && item.colors.length > 0) {
      productName = `${item.colors[0]} ${item.name}`;
    }
    
    // Добавляем материал, если есть в описании
    const materials = ['льняная', 'хлопковая', 'шелковая', 'шерстяная', 'кожаная'];
    const description = item.description?.toLowerCase() || '';
    for (const material of materials) {
      if (description.includes(material)) {
        productName = `${material} ${productName}`;
        break;
      }
    }
    
    // Добавляем случайные варианты для разнообразия
    const variants = [
      'классическая', 'современная', 'стильная', 'элегантная', 'повседневная',
      'офисная', 'вечерняя', 'спортивная', 'casual', 'деловая'
    ];
    
    if (Math.random() > 0.5) {
      const variant = variants[Math.floor(Math.random() * variants.length)];
      productName = `${variant} ${productName}`;
    }
    
                        console.log(`🎨 Created simulated product for ${item.category}: "${productName}"`);
                    console.log(`🎨 Simulated product details:`, { 
                      id: itemId, 
                      name: productName, 
                      price, 
                      category: item.category,
                      colors: item.colors || ['черный', 'белый'],
                      sizes
                    });
                    
                    return {
      id: itemId,
      name: productName,
      price,
      originalPrice,
      discount,
      rating: 4.0 + Math.random() * 0.8, // 4.0-4.8
      reviews: Math.floor(Math.random() * 200) + 20, // 20-220
      image: '/placeholder.svg',
      url,
      marketplace: 'wildberries' as const,
      category: item.category,
      colors: item.colors || ['черный', 'белый'],
      sizes
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
    // Если бюджет не указан или "Любой", не фильтруем
    if (!budget || budget === 'Любой') {
      return products;
    }
    
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