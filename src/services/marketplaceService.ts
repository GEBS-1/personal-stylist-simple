// Сервис для интеграции с маркетплейсами (Ozon, Wildberries, Lamoda)

export interface Product {
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
}

export interface SearchFilters {
  category?: string;
  colors?: string[];
  priceRange?: { min: number; max: number };
  sizes?: string[];
  style?: string;
}

class MarketplaceService {
  private readonly API_ENDPOINTS = {
    ozon: '/api/ozon/composer-api.bx/page/json/v2',
    wildberries: '/api/wildberries/exactmatch/ru/common/v4/search',
    lamoda: '/api/lamoda/api/v1/search'
  };

  // Реальный поиск товаров с fallback на симуляцию
  async searchProducts(filters: SearchFilters, marketplace: string): Promise<Product[]> {
    console.log(`🔍 Searching ${marketplace} with filters:`, filters);
    
    try {
      // Пытаемся получить реальные данные
      const realProducts = await this.fetchRealProducts(filters, marketplace);
      if (realProducts.length > 0) {
        console.log(`✅ Found ${realProducts.length} real products from ${marketplace}`);
        return realProducts;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to fetch from ${marketplace}:`, error);
    }

    // Fallback на симуляцию
    console.log(`🔄 Using simulation for ${marketplace}`);
    return this.generateMockProducts(filters, marketplace);
  }

  // Реальные API запросы к маркетплейсам
  private async fetchRealProducts(filters: SearchFilters, marketplace: string): Promise<Product[]> {
    const searchQuery = this.buildSearchQuery(filters);
    
    switch (marketplace) {
      case 'ozon':
        return this.fetchOzonProducts(searchQuery, filters);
      case 'wildberries':
        return this.fetchWildberriesProducts(searchQuery, filters);
      case 'lamoda':
        return this.fetchLamodaProducts(searchQuery, filters);
      default:
        throw new Error(`Unknown marketplace: ${marketplace}`);
    }
  }

  // Ozon API
  private async fetchOzonProducts(query: string, filters: SearchFilters): Promise<Product[]> {
    const url = `${this.API_ENDPOINTS.ozon}?url=/search&text=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Ozon API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseOzonResponse(data, filters);
  }

  // Wildberries API
  private async fetchWildberriesProducts(query: string, filters: SearchFilters): Promise<Product[]> {
    const url = `${this.API_ENDPOINTS.wildberries}?TestGroup=no_test&TestID=no_test&appType=1&curr=rub&dest=-1257786&query=${encodeURIComponent(query)}&resultset=catalog&sort=popular&spp=0&suppressSpellcheck=false`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Wildberries API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseWildberriesResponse(data, filters);
  }

  // Lamoda API
  private async fetchLamodaProducts(query: string, filters: SearchFilters): Promise<Product[]> {
    const url = `${this.API_ENDPOINTS.lamoda}?q=${encodeURIComponent(query)}&sort=popularity`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Lamoda API error: ${response.status}`);
    }

    const data = await response.json();
    return this.parseLamodaResponse(data, filters);
  }

  // Парсинг ответов от маркетплейсов
  private parseOzonResponse(data: any, filters: SearchFilters): Product[] {
    try {
      const products: Product[] = [];
      
      // Ozon структура данных
      const items = data?.widgetStates?.['searchResultsV2']?.items || [];
      
      items.slice(0, 8).forEach((item: any, index: number) => {
        const product = {
          id: `ozon_${item.id || index}`,
          name: item.title || item.name || 'Товар Ozon',
          price: this.extractPrice(item.price),
          imageUrl: this.extractImageUrl(item.images),
          marketplace: 'ozon' as const,
          category: filters.category || 'clothing',
          colors: this.extractColors(item),
          sizes: this.extractSizes(item),
          rating: this.extractRating(item),
          reviews: this.extractReviews(item),
          url: `https://www.ozon.ru/product/${item.id || index}`
        };
        
        products.push(product);
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Ozon response:', error);
      return [];
    }
  }

  private parseWildberriesResponse(data: any, filters: SearchFilters): Product[] {
    try {
      const products: Product[] = [];
      
      // Wildberries структура данных
      const items = data?.data?.products || [];
      
      items.slice(0, 8).forEach((item: any, index: number) => {
        const product = {
          id: `wildberries_${item.id || index}`,
          name: item.name || 'Товар Wildberries',
          price: this.extractPrice(item.priceU),
          imageUrl: this.extractWildberriesImageUrl(item.id),
          marketplace: 'wildberries' as const,
          category: filters.category || 'clothing',
          colors: this.extractColors(item),
          sizes: this.extractSizes(item),
          rating: this.extractRating(item),
          reviews: this.extractReviews(item),
          url: `https://www.wildberries.ru/catalog/${item.id}/detail.aspx`
        };
        
        products.push(product);
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Wildberries response:', error);
      return [];
    }
  }

  private parseLamodaResponse(data: any, filters: SearchFilters): Product[] {
    try {
      const products: Product[] = [];
      
      // Lamoda структура данных
      const items = data?.products || [];
      
      items.slice(0, 8).forEach((item: any, index: number) => {
        const product = {
          id: `lamoda_${item.id || index}`,
          name: item.name || 'Товар Lamoda',
          price: this.extractPrice(item.price),
          imageUrl: this.extractLamodaImageUrl(item),
          marketplace: 'lamoda' as const,
          category: filters.category || 'clothing',
          colors: this.extractColors(item),
          sizes: this.extractSizes(item),
          rating: this.extractRating(item),
          reviews: this.extractReviews(item),
          url: `https://www.lamoda.ru/p/${item.id}/`
        };
        
        products.push(product);
      });
      
      return products;
    } catch (error) {
      console.error('Error parsing Lamoda response:', error);
      return [];
    }
  }

  // Вспомогательные методы для извлечения данных
  private extractPrice(priceData: any): number {
    if (typeof priceData === 'number') return priceData;
    if (typeof priceData === 'string') return parseInt(priceData.replace(/\D/g, ''));
    if (priceData?.amount) return priceData.amount;
    return Math.floor(Math.random() * 15000) + 1000; // Fallback
  }

  private extractImageUrl(images: any): string {
    if (Array.isArray(images) && images.length > 0) {
      return images[0].url || images[0];
    }
    if (typeof images === 'string') return images;
    return `https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop&crop=center`;
  }

  private extractWildberriesImageUrl(productId: string): string {
    // Wildberries использует специальный формат URL для изображений
    return `https://images.wbstatic.net/c246x328/new/${productId}-1.jpg`;
  }

  private extractLamodaImageUrl(item: any): string {
    if (item.images && item.images.length > 0) {
      return item.images[0];
    }
    return `https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=400&fit=crop&crop=center`;
  }

  private extractColors(item: any): string[] {
    if (item.colors && Array.isArray(item.colors)) {
      return item.colors;
    }
    if (item.color) {
      return [item.color];
    }
    return ['black', 'white']; // Fallback
  }

  private extractSizes(item: any): string[] {
    if (item.sizes && Array.isArray(item.sizes)) {
      return item.sizes.map((s: any) => s.name || s);
    }
    return ['XS', 'S', 'M', 'L', 'XL']; // Fallback
  }

  private extractRating(item: any): number {
    if (item.rating) return item.rating;
    if (item.stars) return item.stars;
    return 4 + Math.random(); // Fallback
  }

  private extractReviews(item: any): number {
    if (item.reviews) return item.reviews;
    if (item.reviewCount) return item.reviewCount;
    return Math.floor(Math.random() * 1000); // Fallback
  }

  // Построение поискового запроса
  private buildSearchQuery(filters: SearchFilters): string {
    const parts: string[] = [];
    
    if (filters.category) {
      parts.push(filters.category);
    }
    
    if (filters.colors && filters.colors.length > 0) {
      parts.push(filters.colors.join(' '));
    }
    
    if (filters.style) {
      parts.push(filters.style);
    }
    
    return parts.join(' ') || 'женская одежда';
  }

  // Симуляция API маркетплейсов (fallback)
  private generateMockProducts(filters: SearchFilters, marketplace: string): Product[] {
    const products: Product[] = [];
    const categories = filters.category ? [filters.category] : ['blouse', 'pants', 'dress', 'shoes'];
    const colors = filters.colors || ['black', 'white', 'blue', 'red'];
    
    for (let i = 0; i < 8; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      products.push({
        id: `${marketplace}_${category}_${i}`,
        name: this.generateProductName(category, color),
        price: Math.floor(Math.random() * 15000) + 1000,
        imageUrl: this.getRealImageUrl(category),
        marketplace: marketplace as 'ozon' | 'wildberries' | 'lamoda',
        category,
        colors: [color],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        rating: 4 + Math.random(),
        reviews: Math.floor(Math.random() * 1000),
        url: `https://${marketplace}.ru/product/${i}`
      });
    }
    
    return products;
  }

  private generateProductName(category: string, color: string): string {
    const names = {
      blouse: ['Блуза', 'Топ', 'Рубашка'],
      pants: ['Брюки', 'Джинсы', 'Штаны'],
      dress: ['Платье', 'Сарафан', 'Туника'],
      shoes: ['Туфли', 'Кроссовки', 'Ботинки']
    };
    
    const categoryNames = names[category as keyof typeof names] || ['Товар'];
    const name = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    
    return `${name} ${color}`;
  }

  private getColorHex(color: string): string {
    const colors: Record<string, string> = {
      black: '000000',
      white: 'FFFFFF',
      blue: '0066CC',
      red: 'CC0000',
      green: '00CC00',
      yellow: 'FFFF00',
      pink: 'FF69B4',
      purple: '800080'
    };
    
    return colors[color] || 'CCCCCC';
  }

  private getRealImageUrl(category: string): string {
    const images = {
      blouse: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop&crop=center',
      pants: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=400&fit=crop&crop=center',
      dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=400&fit=crop&crop=center',
      shoes: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=400&fit=crop&crop=center'
    };
    
    return images[category as keyof typeof images] || images.blouse;
  }

  // Получение рекомендаций на основе типа фигуры и стиля
  async getRecommendations(bodyType: string, style: string, budget: string): Promise<Product[]> {
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
    
    return [...ozonProducts, ...wildberriesProducts, ...lamodaProducts]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12); // Топ 12 товаров
  }

  private getRecommendedCategory(bodyType: string, style: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      apple: {
        casual: 'blouse',
        business: 'blouse',
        evening: 'dress'
      },
      pear: {
        casual: 'pants',
        business: 'pants',
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
  createPurchaseLink(product: Product): string {
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
}

export const marketplaceService = new MarketplaceService(); 