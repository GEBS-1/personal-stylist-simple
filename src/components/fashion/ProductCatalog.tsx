import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingBag, Star, Heart, ExternalLink, TestTube, Loader2 } from "lucide-react";
import { wildberriesService, Product, SearchParams } from "@/services/wildberriesService";
import { BodyData } from "./ManualBodyInput";

interface ProductCatalogProps {
  analysisData: BodyData;
  generatedOutfit: any;
}

export default function ProductCatalog({ analysisData, generatedOutfit }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (analysisData && !isLoading) {
      loadRecommendations();
    }
  }, [analysisData]);

  const loadRecommendations = async () => {
    if (!analysisData) return;
    
    setIsLoading(true);
    
    try {
      const params: SearchParams = {
        query: 'одежда',
        bodyType: analysisData.bodyType,
        occasion: 'casual',
        budget: 'medium',
        gender: analysisData.gender
      };

      const recommendations = await wildberriesService.getRecommendations(params);
      setProducts(recommendations);
      
      toast({
        title: "Рекомендации загружены",
        description: `Найдено ${recommendations.length} товаров на Wildberries`,
      });
      
      // Показываем информацию о режиме работы
      if (recommendations.some(p => p.id.includes('fallback'))) {
        toast({
          title: "Режим демонстрации",
          description: "Показываем тестовые данные. Для реальных товаров настройте API ключи.",
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить рекомендации. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = async (category: string) => {
    if (!analysisData || isLoading || selectedCategory === category) return;
    
    setIsLoading(true);
    setSelectedCategory(category);
    
    try {
      const params: SearchParams = {
        query: category,
        bodyType: analysisData.bodyType,
        occasion: 'casual',
        budget: 'medium',
        gender: analysisData.gender
      };

      const categoryProducts = await wildberriesService.searchProducts(params);
      setProducts(categoryProducts);
      
    } catch (error) {
      console.error('Failed to load category products:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить товары категории.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    window.open(product.url, '_blank');
  };

  const categories = [
    { id: 'all', name: 'Все товары', icon: '🛍️' },
    { id: 'юбка', name: 'Юбки', icon: '👗' },
    { id: 'брюки', name: 'Брюки', icon: '👖' },
    { id: 'блуза', name: 'Блузы', icon: '👚' },
    { id: 'платье', name: 'Платья', icon: '👗' },
    { id: 'костюм', name: 'Костюмы', icon: '👔' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  // Добавляем функцию тестирования API
  const testWildberriesAPI = async () => {
    setIsLoading(true);
    try {
      const result = await wildberriesService.testAPI();
      
      if (result.success) {
        toast({
          title: "✅ API Test Successful",
          description: result.message,
        });
        console.log('🧪 API Test Result:', result.data);
      } else {
        toast({
          title: "❌ API Test Failed",
          description: result.message,
          variant: "destructive",
        });
        console.error('🧪 API Test Error:', result.data);
      }
    } catch (error) {
      toast({
        title: "❌ Test Error",
        description: `Failed to test API: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Заголовок и информация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Рекомендации Wildberries
            {products.some(p => p.id.includes('fallback')) && (
              <Badge variant="outline" className="text-xs">
                Демо режим
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Персональные рекомендации на основе ваших данных
          </div>
        </CardHeader>
        <CardContent>
          {analysisData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Тип фигуры:</span>
                <div className="font-medium">{analysisData.bodyType}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Пол:</span>
                <div className="font-medium">
                  {analysisData.gender === 'female' ? 'Женский' : 'Мужской'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Рост:</span>
                <div className="font-medium">{analysisData.height} см</div>
              </div>
              <div>
                <span className="text-muted-foreground">Размер обуви:</span>
                <div className="font-medium">{analysisData.shoeSize}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Категории */}
      <Card>
        <CardHeader>
          <CardTitle>Категории товаров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryClick(category.id)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Товары */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Товары</CardTitle>
            <Badge variant="secondary">
              {products.length} товаров
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Загружаем товары...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
              <p className="text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    {/* Изображение */}
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>

                    {/* Информация о товаре */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      
                      {/* Цена */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                        {product.discount && (
                          <Badge variant="destructive" className="text-xs">
                            -{product.discount}%
                          </Badge>
                        )}
                      </div>

                      {/* Рейтинг */}
                      {product.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating}</span>
                          {product.reviews && (
                            <span>({product.reviews})</span>
                          )}
                        </div>
                      )}

                      {/* Цвета */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex gap-1">
                          {product.colors.slice(0, 3).map((color, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                          {product.colors.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.colors.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Кнопка перехода */}
                      <Button
                        onClick={() => handleProductClick(product)}
                        className="w-full mt-3"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Перейти к товару
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Добавляем кнопку тестирования */}
      <div className="flex items-center justify-center mt-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={testWildberriesAPI}
          disabled={isLoading}
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test API
        </Button>
      </div>
    </div>
  );
};