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
  const { toast } = useToast();

  useEffect(() => {
    if (analysisData && generatedOutfit && !isLoading) {
      loadOutfitProducts();
    }
  }, [analysisData, generatedOutfit]);

  const loadOutfitProducts = async () => {
    if (!analysisData || !generatedOutfit) return;
    
    setIsLoading(true);
    
    try {
      const params: SearchParams = {
        query: 'outfit-based',
        bodyType: analysisData.bodyType,
        occasion: 'casual',
        budget: 'medium',
        gender: analysisData.gender
      };

      console.log('🎨 Loading products for generated outfit:', generatedOutfit.name);
      const outfitProducts = await wildberriesService.getRecommendations(params, generatedOutfit);
      setProducts(outfitProducts);
      
      if (outfitProducts.length > 0) {
        toast({
          title: "Товары подобраны!",
          description: `Найдено ${outfitProducts.length} товаров для вашего образа "${generatedOutfit.name}"`,
        });
      } else {
        toast({
          title: "Нет товаров",
          description: "Не удалось подобрать товары для данного образа",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Failed to load outfit products:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить товары для образа",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    window.open(product.url, '_blank');
  };

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
            Товары для образа
            {products.some(p => p.id.includes('fallback')) && (
              <Badge variant="outline" className="text-xs">
                Демо режим
              </Badge>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {generatedOutfit ? (
              <>
                <div className="font-medium mb-2">{generatedOutfit.name}</div>
                <div className="mb-2">{generatedOutfit.description}</div>
                {generatedOutfit.colorPalette && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Цветовая палитра:</span>
                    <div className="flex gap-1">
                      {generatedOutfit.colorPalette.map((color: string, index: number) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: color.replace(/"/g, '') }}
                          title={color.replace(/"/g, '')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              "Персональные рекомендации на основе ваших данных"
            )}
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

      {/* Товары */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Подобранные товары</CardTitle>
            <Badge variant="secondary">
              {products.length} товаров
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Подбираем товары для вашего образа...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Товары не найдены</h3>
              <p className="text-muted-foreground">
                {generatedOutfit ? 
                  "Не удалось подобрать товары для данного образа. Попробуйте другой образ." :
                  "Сначала создайте образ, чтобы увидеть подобранные товары"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleProductClick(product)}>
                  <CardContent className="p-4">
                    {/* Изображение */}
                    <div className="aspect-square bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
                        onError={(e) => {
                          console.warn(`⚠️ Failed to load image for product ${product.id}:`, product.image);
                          e.currentTarget.src = '/placeholder.svg';
                          e.currentTarget.classList.add('opacity-50');
                        }}
                        onLoad={(e) => {
                          e.currentTarget.classList.remove('opacity-50');
                        }}
                        loading="lazy"
                      />
                    </div>

                    {/* Информация о товаре */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                      
                      {/* Цена */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{formatPrice(product.price)}</span>
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

                      {/* Размеры */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.sizes.slice(0, 4).map((size) => (
                            <Badge key={size} variant="outline" className="text-xs">
                              {size}
                            </Badge>
                          ))}
                          {product.sizes.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.sizes.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Цвета */}
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Цвета:</span>
                          <div className="flex gap-1">
                            {product.colors.slice(0, 3).map((color, index) => (
                              <div
                                key={index}
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: color.toLowerCase() }}
                                title={color}
                              />
                            ))}
                            {product.colors.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{product.colors.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Кнопка покупки */}
                      <Button 
                        className="w-full mt-3" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductClick(product);
                        }}
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