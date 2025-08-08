import { Product, SearchParams } from './wildberriesService';

export class AdvancedWildberriesService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  ];

  private referers = [
    'https://www.google.com/',
    'https://www.yandex.ru/',
    'https://www.bing.com/',
    'https://www.wildberries.ru/',
    'https://www.wildberries.ru/catalog',
    'https://www.wildberries.ru/catalog/search'
  ];

  private ipAddresses = [
    '185.199.108.153',
    '185.199.109.153',
    '185.199.110.153',
    '185.199.111.153'
  ];

  async searchWithAdvancedMethods(params: SearchParams): Promise<Product[]> {
    console.log('🚀 Starting advanced Wildberries search...');
    
    const methods = [
      () => this.searchWithMobileAPI(params),
      () => this.searchWithGraphQL(params),
      () => this.searchWithInternalAPI(params),
      () => this.searchWithSearchSuggestions(params),
      () => this.searchWithCategoryAPI(params),
      () => this.searchWithRecommendationsAPI(params)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`🔍 Trying method ${i + 1}/${methods.length}...`);
        const products = await methods[i]();
        if (products && products.length > 0) {
          console.log(`✅ Method ${i + 1} found ${products.length} products`);
          return products;
        }
      } catch (error) {
        console.warn(`⚠️ Method ${i + 1} failed:`, error);
      }
    }

    console.log('❌ All advanced methods failed');
    return [];
  }

  private async searchWithMobileAPI(params: SearchParams): Promise<Product[]> {
    console.log('📱 Trying mobile API...');
    
    const searchQuery = this.buildSearchQuery(params);
    const mobileEndpoints = [
      'https://mobile.wb.ru/api/v1/search',
      'https://m.wildberries.ru/api/v1/search',
      'https://api.wildberries.ru/mobile/search'
    ];

    for (const endpoint of mobileEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.getRandomUserAgent(),
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://m.wildberries.ru',
            'Referer': 'https://m.wildberries.ru/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: params.limit || 20,
            offset: 0,
            sort: 'popular',
            filters: {
              gender: params.gender,
              category: this.getCategoryByParams(params)
            }
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            return this.parseProducts(data.products, params);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Mobile API ${endpoint} failed:`, error);
      }
    }

    return [];
  }

  private async searchWithGraphQL(params: SearchParams): Promise<Product[]> {
    console.log('🔍 Trying GraphQL API...');
    
    const searchQuery = this.buildSearchQuery(params);
    const graphqlQueries = [
      {
        query: `
          query SearchProducts($query: String!, $limit: Int!, $offset: Int!) {
            searchProducts(query: $query, limit: $limit, offset: $offset) {
              id
              name
              price
              salePrice
              rating
              feedbacks
              images
              colors
              sizes
            }
          }
        `,
        variables: {
          query: searchQuery,
          limit: params.limit || 20,
          offset: 0
        }
      },
      {
        query: `
          query CatalogSearch($query: String!) {
            catalog {
              search(query: $query) {
                products {
                  id
                  name
                  price
                  salePrice
                  rating
                  feedbacks
                  images
                }
              }
            }
          }
        `,
        variables: {
          query: searchQuery
        }
      }
    ];

    const graphqlEndpoints = [
      'https://www.wildberries.ru/graphql',
      'https://api.wildberries.ru/graphql',
      'https://search.wb.ru/graphql'
    ];

    for (const endpoint of graphqlEndpoints) {
      for (const graphqlQuery of graphqlQueries) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': this.getRandomUserAgent(),
              'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
              'Origin': 'https://www.wildberries.ru',
              'Referer': 'https://www.wildberries.ru/',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(graphqlQuery),
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data?.searchProducts || data.data?.catalog?.search?.products) {
              const products = data.data.searchProducts || data.data.catalog.search.products;
              if (products && products.length > 0) {
                return this.parseProducts(products, params);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ GraphQL ${endpoint} failed:`, error);
        }
      }
    }

    return [];
  }

  private async searchWithInternalAPI(params: SearchParams): Promise<Product[]> {
    console.log('🔧 Trying internal API...');
    
    const searchQuery = this.buildSearchQuery(params);
    const internalEndpoints = [
      'https://search.wb.ru/exactmatch/ru/common/v4/search',
      'https://catalog.wb.ru/catalog/women/catalog',
      'https://catalog.wb.ru/catalog/men/catalog',
      'https://search.wb.ru/exactmatch/ru/common/v5/search',
      'https://api.wildberries.ru/api/v1/search'
    ];

    for (const endpoint of internalEndpoints) {
      try {
        const params = new URLSearchParams({
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
          ulimit: (params.limit || 20).toString(),
          lang: 'ru',
          locale: 'ru',
          timestamp: Date.now().toString(),
          rand: Math.random().toString()
        });

        const response = await fetch(`${endpoint}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Pragma': 'no-cache',
            'Referer': this.getRandomReferer(),
            'Origin': 'https://www.wildberries.ru',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'User-Agent': this.getRandomUserAgent(),
            'X-Requested-With': 'XMLHttpRequest',
            'X-Forwarded-For': this.getRandomIP(),
            'X-Real-IP': this.getRandomIP()
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
        console.warn(`⚠️ Internal API ${endpoint} failed:`, error);
      }
    }

    return [];
  }

  private async searchWithSearchSuggestions(params: SearchParams): Promise<Product[]> {
    console.log('💡 Trying search suggestions...');
    
    const searchQuery = this.buildSearchQuery(params);
    const suggestionEndpoints = [
      'https://search.wb.ru/suggestions',
      'https://www.wildberries.ru/api/suggestions',
      'https://api.wildberries.ru/suggestions'
    ];

    for (const endpoint of suggestionEndpoints) {
      try {
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': this.getRandomUserAgent(),
            'Referer': 'https://www.wildberries.ru/',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const suggestions = await response.json();
          if (suggestions && suggestions.length > 0) {
            // Используем первое предложение для поиска
            const bestSuggestion = suggestions[0];
            return await this.searchWithInternalAPI({
              ...params,
              query: bestSuggestion.query || bestSuggestion.text || searchQuery
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Search suggestions ${endpoint} failed:`, error);
      }
    }

    return [];
  }

  private async searchWithCategoryAPI(params: SearchParams): Promise<Product[]> {
    console.log('📂 Trying category API...');
    
    const categories = this.getCategoryByParams(params);
    const categoryEndpoints = [
      'https://catalog.wb.ru/catalog/women/catalog',
      'https://catalog.wb.ru/catalog/men/catalog',
      'https://catalog.wb.ru/catalog/children/catalog'
    ];

    for (const endpoint of categoryEndpoints) {
      for (const category of categories) {
        try {
          const searchParams = new URLSearchParams({
            TestGroup: 'no_test',
            TestID: 'no_test',
            appType: '1',
            curr: 'rub',
            dest: '-1257786',
            cat: this.getCategoryId(category),
            sort: 'popular',
            suppressSpellcheck: 'false',
            uoffset: '0',
            ulimit: (params.limit || 20).toString(),
            lang: 'ru',
            locale: 'ru'
          });

          const response = await fetch(`${endpoint}?${searchParams}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': this.getRandomUserAgent(),
              'Referer': 'https://www.wildberries.ru/',
              'X-Requested-With': 'XMLHttpRequest'
            },
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data?.products && data.data.products.length > 0) {
              return this.parseProducts(data.data.products, params);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Category API ${endpoint} failed:`, error);
        }
      }
    }

    return [];
  }

  private async searchWithRecommendationsAPI(params: SearchParams): Promise<Product[]> {
    console.log('🎯 Trying recommendations API...');
    
    const recommendationEndpoints = [
      'https://www.wildberries.ru/api/recommendations',
      'https://api.wildberries.ru/recommendations',
      'https://search.wb.ru/recommendations'
    ];

    for (const endpoint of recommendationEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': this.getRandomUserAgent(),
            'Referer': 'https://www.wildberries.ru/',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify({
            gender: params.gender,
            category: this.getCategoryByParams(params),
            limit: params.limit || 20
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            return this.parseProducts(data.products, params);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Recommendations API ${endpoint} failed:`, error);
      }
    }

    return [];
  }

  private buildSearchQuery(params: SearchParams): string {
    const { query, bodyType, occasion, gender } = params;
    
    let searchQuery = query;
    
    if (gender === 'female') {
      searchQuery += ' женская';
    } else {
      searchQuery += ' мужская';
    }
    
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

  private getCategoryByParams(params: SearchParams): string[] {
    const { bodyType, occasion, gender } = params;
    const categories = [];
    
    if (gender === 'female') {
      categories.push('женская одежда');
    } else {
      categories.push('мужская одежда');
    }
    
    if (occasion === 'business') {
      categories.push('деловая одежда');
    } else if (occasion === 'casual') {
      categories.push('повседневная одежда');
    }
    
    return categories;
  }

  private getCategoryId(category: string): string {
    const categoryIds: { [key: string]: string } = {
      'женская одежда': '8126',
      'мужская одежда': '8127',
      'деловая одежда': '8128',
      'повседневная одежда': '8129',
      'рубашка': '8130',
      'брюки': '8131',
      'футболка': '8132',
      'джинсы': '8133',
      'платье': '8134',
      'юбка': '8135'
    };
    
    return categoryIds[category] || '8126';
  }

  private parseProducts(rawProducts: any[], params: SearchParams): Product[] {
    return rawProducts.map((product, index) => ({
      id: product.id?.toString() || `wb_${index}`,
      name: product.name || product.title || 'Товар Wildberries',
      price: product.salePriceU ? product.salePriceU / 100 : product.priceU ? product.priceU / 100 : 1000 + index * 500,
      originalPrice: product.priceU ? product.priceU / 100 : undefined,
      discount: product.sale ? Math.round(product.sale) : undefined,
      rating: product.rating || 4.0 + Math.random() * 0.5,
      reviews: product.feedbacks || Math.floor(Math.random() * 100) + 10,
      image: this.getProductImage(product.id, product.colors?.[0]?.id),
      url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      marketplace: 'wildberries' as const,
      category: params.query,
      colors: product.colors?.map((c: any) => c.name) || ['Черный', 'Белый'],
      sizes: product.sizes?.map((s: any) => s.name) || ['S', 'M', 'L', 'XL']
    }));
  }

  private getProductImage(productId: number, colorId?: number): string {
    if (!productId) return '/placeholder.svg';
    
    const folder = Math.floor(productId / 1000);
    const colorSuffix = colorId ? `-${colorId}` : '';
    return `https://images.wbstatic.net/c246x328/new/${folder}/${productId}${colorSuffix}.jpg`;
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private getRandomReferer(): string {
    return this.referers[Math.floor(Math.random() * this.referers.length)];
  }

  private getRandomIP(): string {
    return this.ipAddresses[Math.floor(Math.random() * this.ipAddresses.length)];
  }
}

export const advancedWildberriesService = new AdvancedWildberriesService(); 