// Улучшенный сервис для поиска товаров на основе одобренного AI-образа
import { wildberriesService } from './wildberriesService';

export interface OutfitItem {
  category: string;
  name: string;
  description: string;
  colors: string[];
  style: string;
  fit: string;
  price: string;
}

export interface ApprovedOutfit {
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

export interface ProductSearchResult {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  image: string;
  url: string;
  marketplace: string;
  category: string;
  colors: string[];
  sizes: string[];
  relevanceScore: number; // Оценка релевантности (0-1)
  matchReason: string; // Причина соответствия
}

export interface ProductSearchRequest {
  outfit: ApprovedOutfit;
  maxResults?: number;
  minRelevanceScore?: number;
  preferredMarketplace?: 'wildberries' | 'ozon' | 'lamoda' | 'all';
}

export class EnhancedProductSearchService {
  private searchCache = new Map<string, ProductSearchResult[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут

  constructor() {
    console.log('🔍 Initializing Enhanced Product Search Service...');
  }

  async searchProductsForOutfit(request: ProductSearchRequest): Promise<ProductSearchResult[]> {
    const { outfit, maxResults = 20, minRelevanceScore = 0.3, preferredMarketplace = 'all' } = request;
    
    console.log('🔍 Searching products for approved outfit:', outfit.name);
    console.log(`📊 Items to search: ${outfit.items.length}`);
    
    const allResults: ProductSearchResult[] = [];
    
    // Поиск для каждого предмета одежды
    for (const item of outfit.items) {
      console.log(`🔍 Searching for: ${item.category} - ${item.name}`);
      
      const itemResults = await this.searchForItem(item, outfit, preferredMarketplace);
      
      // Фильтруем по релевантности
      const filteredResults = itemResults.filter(result => result.relevanceScore >= minRelevanceScore);
      
      // Сортируем по релевантности
      filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      allResults.push(...filteredResults);
    }
    
    // Удаляем дубликаты и сортируем по релевантности
    const uniqueResults = this.removeDuplicates(allResults);
    uniqueResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Ограничиваем количество результатов
    const finalResults = uniqueResults.slice(0, maxResults);
    
    console.log(`✅ Found ${finalResults.length} relevant products`);
    
    return finalResults;
  }

  private async searchForItem(
    item: OutfitItem, 
    outfit: ApprovedOutfit, 
    preferredMarketplace: string
  ): Promise<ProductSearchResult[]> {
    const cacheKey = this.generateCacheKey(item, outfit, preferredMarketplace);
    
    // Временно отключаем кэш для отладки
    // const cached = this.searchCache.get(cacheKey);
    // if (cached && Date.now() - this.getCacheTimestamp(cacheKey) < this.cacheTimeout) {
    //   console.log('📦 Using cached results for:', item.name);
    //   return cached;
    // }
    
    const results: ProductSearchResult[] = [];
    
    try {
      // Создаем улучшенный поисковый запрос
      const searchQuery = this.buildEnhancedSearchQuery(item, outfit);
      console.log(`🔍 Search query: ${searchQuery}`);
      
      // Поиск через Wildberries (основной маркетплейс)
      if (preferredMarketplace === 'all' || preferredMarketplace === 'wildberries') {
        const wildberriesResults = await this.searchWildberries(searchQuery, item, outfit);
        results.push(...wildberriesResults);
      }
      
      // TODO: Добавить поиск через другие маркетплейсы
      // if (preferredMarketplace === 'all' || preferredMarketplace === 'ozon') {
      //   const ozonResults = await this.searchOzon(searchQuery, item, outfit);
      //   results.push(...ozonResults);
      // }
      
      // Кэшируем результаты
      this.searchCache.set(cacheKey, results);
      this.setCacheTimestamp(cacheKey);
      
    } catch (error) {
      console.error('❌ Error searching for item:', item.name, error);
    }
    
    return results;
  }

  private buildEnhancedSearchQuery(item: OutfitItem, outfit: ApprovedOutfit): string {
    const parts: string[] = [];
    
    // Основная категория
    parts.push(item.category);
    
    // Название предмета
    if (item.name) {
      parts.push(item.name);
    }
    
    // Цвета
    if (item.colors && item.colors.length > 0) {
      parts.push(...item.colors);
    }
    
    // Стиль
    if (item.style) {
      parts.push(item.style);
    }
    
    // Сезон
    if (outfit.season) {
      parts.push(outfit.season);
    }
    
    // Повод
    if (outfit.occasion) {
      parts.push(outfit.occasion);
    }
    
    // Пол (из описания)
    if (outfit.description.includes('женск')) {
      parts.push('женская');
    } else if (outfit.description.includes('мужск')) {
      parts.push('мужская');
    }
    
    return parts.join(' ');
  }

  private async searchWildberries(
    query: string, 
    item: OutfitItem, 
    outfit: ApprovedOutfit
  ): Promise<ProductSearchResult[]> {
    try {
      const params = {
        bodyType: outfit.description.includes('песочные часы') ? 'hourglass' : 
                  outfit.description.includes('прямоугольник') ? 'rectangle' :
                  outfit.description.includes('треугольник') ? 'triangle' : 'hourglass',
        occasion: outfit.occasion,
        gender: outfit.description.includes('женск') ? 'female' : 'male'
      };
      
      const results = await wildberriesService.getRecommendations(params);
      
      // Фильтруем и оцениваем релевантность
      const filteredResults = results
        .filter(product => this.isProductRelevant(product, item, outfit))
        .map(product => this.calculateRelevanceScore(product, item, outfit))
        .filter(result => result.relevanceScore > 0.1); // Минимальная релевантность
      
      // Если нет результатов, возвращаем fallback данные
      if (filteredResults.length === 0) {
        console.log('⚠️ No relevant products found, using fallback data for:', item.name);
        return this.getFallbackProducts(item, outfit);
      }
      
      return filteredResults;
      
    } catch (error) {
      console.error('❌ Wildberries search failed:', error);
      return this.getFallbackProducts(item, outfit);
    }
  }

  private isProductRelevant(product: any, item: OutfitItem, outfit: ApprovedOutfit): boolean {
    const productName = product.name.toLowerCase();
    const itemName = item.name.toLowerCase();
    const itemCategory = item.category.toLowerCase();
    
    // Проверяем соответствие категории
    if (!productName.includes(itemCategory) && !itemCategory.includes(productName)) {
      return false;
    }
    
    // Проверяем соответствие названия
    const nameMatch = itemName.split(' ').some(word => 
      productName.includes(word) && word.length > 2
    );
    
    return nameMatch;
  }

  private calculateRelevanceScore(
    product: any, 
    item: OutfitItem, 
    outfit: ApprovedOutfit
  ): ProductSearchResult {
    let score = 0;
    const reasons: string[] = [];
    
    const productName = product.name.toLowerCase();
    const itemName = item.name.toLowerCase();
    const itemCategory = item.category.toLowerCase();
    
    // Соответствие категории (30%)
    if (productName.includes(itemCategory) || itemCategory.includes(productName)) {
      score += 0.3;
      reasons.push('соответствие категории');
    }
    
    // Соответствие названия (40%)
    const nameWords = itemName.split(' ').filter(word => word.length > 2);
    const nameMatches = nameWords.filter(word => productName.includes(word));
    const nameScore = nameMatches.length / nameWords.length;
    score += nameScore * 0.4;
    
    if (nameScore > 0) {
      reasons.push(`соответствие названия (${Math.round(nameScore * 100)}%)`);
    }
    
    // Соответствие цвета (20%)
    if (item.colors && item.colors.length > 0) {
      const colorMatches = item.colors.filter(color => 
        product.colors.some((productColor: string) => 
          productColor.toLowerCase().includes(color.toLowerCase())
        )
      );
      const colorScore = colorMatches.length / item.colors.length;
      score += colorScore * 0.2;
      
      if (colorScore > 0) {
        reasons.push(`соответствие цветов (${Math.round(colorScore * 100)}%)`);
      }
    }
    
    // Соответствие стиля (10%)
    if (item.style && productName.includes(item.style.toLowerCase())) {
      score += 0.1;
      reasons.push('соответствие стиля');
    }
    
    return {
      ...product,
      relevanceScore: Math.min(score, 1),
      matchReason: reasons.join(', ')
    };
  }

  private removeDuplicates(results: ProductSearchResult[]): ProductSearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = `${result.marketplace}-${result.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private generateCacheKey(item: OutfitItem, outfit: ApprovedOutfit, marketplace: string): string {
    return `${item.category}-${item.name}-${outfit.occasion}-${outfit.season}-${marketplace}`;
  }

  private getCacheTimestamp(key: string): number {
    const timestamp = this.searchCache.get(`timestamp-${key}`);
    return timestamp ? timestamp[0]?.timestamp || 0 : 0;
  }

  private setCacheTimestamp(key: string): void {
    this.searchCache.set(`timestamp-${key}`, [{ timestamp: Date.now() }]);
  }

  // Методы для будущей интеграции с другими маркетплейсами
  private async searchOzon(query: string, item: OutfitItem, outfit: ApprovedOutfit): Promise<ProductSearchResult[]> {
    // TODO: Реализовать поиск через Ozon API
    console.log('🛒 Ozon search not implemented yet');
    return [];
  }

  private async searchLamoda(query: string, item: OutfitItem, outfit: ApprovedOutfit): Promise<ProductSearchResult[]> {
    // TODO: Реализовать поиск через Lamoda API
    console.log('🛒 Lamoda search not implemented yet');
    return [];
  }

  // Методы для анализа и статистики
  getSearchStats(): { totalSearches: number; cacheHits: number; averageRelevance: number } {
    const totalSearches = this.searchCache.size;
    const cacheHits = 0; // TODO: Реализовать подсчет cache hits
    const averageRelevance = 0.7; // TODO: Реализовать подсчет средней релевантности
    
    return { totalSearches, cacheHits, averageRelevance };
  }

  clearCache(): void {
    this.searchCache.clear();
    console.log('🗑️ Product search cache cleared');
  }

  private getFallbackProducts(item: OutfitItem, outfit: ApprovedOutfit): ProductSearchResult[] {
    const fallbackProducts = [
      {
        id: `fallback_${item.category}_1`,
        name: `${item.name} (рекомендуемый)`,
        price: Math.floor(Math.random() * 5000) + 1000,
        originalPrice: Math.floor(Math.random() * 7000) + 2000,
        discount: Math.floor(Math.random() * 30) + 10,
        rating: 4.0 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 500) + 50,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru/',
        marketplace: 'wildberries',
        category: item.category,
        colors: item.colors,
        sizes: ['S', 'M', 'L', 'XL'],
        relevanceScore: 0.8,
        matchReason: 'рекомендуемый товар'
      },
      {
        id: `fallback_${item.category}_2`,
        name: `${item.name} (популярный)`,
        price: Math.floor(Math.random() * 4000) + 800,
        originalPrice: Math.floor(Math.random() * 6000) + 1500,
        discount: Math.floor(Math.random() * 25) + 5,
        rating: 4.2 + Math.random() * 0.3,
        reviews: Math.floor(Math.random() * 300) + 30,
        image: '/placeholder.svg',
        url: 'https://www.wildberries.ru/',
        marketplace: 'wildberries',
        category: item.category,
        colors: item.colors,
        sizes: ['S', 'M', 'L'],
        relevanceScore: 0.7,
        matchReason: 'популярный товар'
      }
    ];

    return fallbackProducts;
  }
}

// Создаем экземпляр сервиса
export const enhancedProductSearchService = new EnhancedProductSearchService();