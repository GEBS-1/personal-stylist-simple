import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Loader2, ExternalLink, Star } from "lucide-react";
import { realMarketplaceService, RealProduct } from "@/services/realMarketplaceService";

interface ProductCatalogProps {
  analysisData?: {
    bodyType: string;
    stylePreferences?: string[];
    budget?: string;
  };
}

export const ProductCatalog = ({ analysisData }: ProductCatalogProps) => {
  const [products, setProducts] = useState<RealProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string | null>(null);

  // Загрузка рекомендаций при изменении данных анализа
  useEffect(() => {
    if (analysisData?.bodyType) {
      loadRecommendations();
    }
  }, [analysisData]);

  const loadRecommendations = async () => {
    if (!analysisData) return;
    
    setIsLoading(true);
    try {
      const style = analysisData.stylePreferences?.[0] || 'casual';
      const budget = analysisData.budget || 'medium';
      
      const recommendations = await realMarketplaceService.getRecommendations(
        analysisData.bodyType,
        style,
        budget
      );
      
      setProducts(recommendations);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarketplaceClick = async (marketplace: string) => {
    setSelectedMarketplace(marketplace);
    setIsLoading(true);
    
    try {
      const filters = {
        category: 'blouse',
        colors: ['black', 'white'],
        priceRange: { min: 1000, max: 10000 }
      };
      
      const marketplaceProducts = await realMarketplaceService.searchProducts(filters, marketplace);
      setProducts(marketplaceProducts);
    } catch (error) {
      console.error(`Failed to load ${marketplace} products:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: RealProduct) => {
    console.log('🛒 Opening product link:', product.url);
    try {
      window.open(product.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Failed to open product link:', error);
      // Fallback: показываем информацию о товаре
      alert(`Товар: ${product.name}\nЦена: ${product.price} ₽\nМаркетплейс: ${product.marketplace}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Каталог товаров
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysisData && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2">Рекомендации для вашего типа фигуры:</h4>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Тип фигуры: {analysisData.bodyType}</Badge>
                <Badge variant="outline">Персональные рекомендации</Badge>
                {analysisData.stylePreferences && (
                  <Badge variant="outline">Стиль: {analysisData.stylePreferences[0]}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Маркетплейсы */}
          <div className="grid md:grid-cols-3 gap-4">
            <Button 
              variant={selectedMarketplace === 'ozon' ? 'default' : 'outline'}
              onClick={() => handleMarketplaceClick('ozon')}
              disabled={isLoading}
              className="h-16"
            >
              {isLoading && selectedMarketplace === 'ozon' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2" />
              )}
              Ozon
            </Button>
            <Button 
              variant={selectedMarketplace === 'wildberries' ? 'default' : 'outline'}
              onClick={() => handleMarketplaceClick('wildberries')}
              disabled={isLoading}
              className="h-16"
            >
              {isLoading && selectedMarketplace === 'wildberries' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2" />
              )}
              Wildberries
            </Button>
            <Button 
              variant={selectedMarketplace === 'lamoda' ? 'default' : 'outline'}
              onClick={() => handleMarketplaceClick('lamoda')}
              disabled={isLoading}
              className="h-16"
            >
              {isLoading && selectedMarketplace === 'lamoda' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2" />
              )}
              Lamoda
            </Button>
          </div>

          {/* Продукты */}
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p>Загружаем товары...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[3/4] bg-muted relative">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2">
                      {product.marketplace}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg">{product.price} ₽</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{product.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {product.colors.slice(0, 3).map((color) => (
                        <Badge key={color} variant="outline" className="text-xs">
                          {color}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleProductClick(product)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Перейти к товару
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-medium mb-2">Выберите маркетплейс</h3>
              <p className="text-muted-foreground">
                Нажмите на кнопку маркетплейса выше, чтобы увидеть товары
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};