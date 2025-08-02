import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, RefreshCw, ChevronRight, ShoppingBag, Palette, Star } from "lucide-react";
import { aiService, OutfitRequest, GeneratedOutfit } from "@/services/aiService";

interface OutfitGeneratorProps {
  analysisData?: any;
  onComplete?: () => void;
}

export const OutfitGenerator = ({ analysisData, onComplete }: OutfitGeneratorProps) => {
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [currentProvider, setCurrentProvider] = useState<string>('simulation');
  const { toast } = useToast();

  useEffect(() => {
    // Получаем текущий AI провайдер
    setCurrentProvider(aiService.getCurrentProvider());
  }, []);

  const generateOutfits = async () => {
    if (!analysisData) return;
    
    setIsGenerating(true);
    
    try {
      const request: OutfitRequest = {
        bodyType: analysisData.bodyType,
        measurements: {
          height: analysisData.measurements.height,
          chest: analysisData.measurements.chest,
          waist: analysisData.measurements.waist,
          hips: analysisData.measurements.hips,
          shoulders: analysisData.measurements.shoulders
        },
        stylePreferences: ['Кэжуал', 'Классический'], // Можно получать из StylePreferences
        colorPreferences: ['Нейтральные', 'Темные'], // Можно получать из StylePreferences
        occasion: selectedOccasion,
        season: 'all', // Можно определять по дате
        budget: 'medium'
      };

      // Генерируем 3 образа с новым AI сервисом
      const outfits: GeneratedOutfit[] = [];
      for (let i = 0; i < 3; i++) {
        const outfit = await aiService.generateOutfit(request);
        outfits.push(outfit);
      }
      setGeneratedOutfits(outfits);
      
      toast({
        title: "Образы сгенерированы",
        description: `Создано ${outfits.length} персональных луков`,
      });
      
      onComplete?.();
    } catch (error) {
      toast({
        title: "Ошибка генерации",
        description: "Не удалось создать образы. Попробуйте еще раз.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Генерация образов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysisData && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Учитываем ваши данные:</h4>
                <Badge variant="outline" className="text-xs">
                  AI: {currentProvider === 'gemini' ? 'Google Gemini' : 
                       currentProvider === 'openai' ? 'OpenAI GPT-4' : 
                       currentProvider === 'claude' ? 'Anthropic Claude' : 
                       currentProvider === 'cohere' ? 'Cohere' : 
                       currentProvider === 'local' ? 'Локальная модель' : 'Симуляция'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Тип фигуры: {analysisData.bodyType}</Badge>
                <Badge variant="outline">Рост: {analysisData.measurements.height} см</Badge>
              </div>
            </div>
          )}

          {/* Выбор повода */}
          <div className="space-y-4">
            <h4 className="font-medium">Выберите повод:</h4>
            <div className="flex gap-2">
              {['casual', 'business', 'evening'].map((occasion) => (
                <Button
                  key={occasion}
                  variant={selectedOccasion === occasion ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedOccasion(occasion)}
                >
                  {occasion === 'casual' && 'Повседневный'}
                  {occasion === 'business' && 'Деловой'}
                  {occasion === 'evening' && 'Вечерний'}
                </Button>
              ))}
            </div>
          </div>

          {generatedOutfits.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-medium mb-2">Готовы создать ваши образы?</h3>
              <p className="text-muted-foreground mb-6">
                ИИ подберет персональные луки с учетом типа фигуры и стилевых предпочтений
              </p>
              <Button 
                onClick={generateOutfits} 
                disabled={isGenerating || !analysisData}
                className="px-8"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Генерируем образы...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Сгенерировать образы
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {generatedOutfits.map((outfit) => (
                  <Card key={outfit.id} className="hover:shadow-lg smooth-transition">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{outfit.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{outfit.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {(outfit.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Предметы одежды */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" />
                          Предметы одежды
                        </h5>
                        {outfit.items.map((item, index) => (
                          <div key={index} className="text-sm bg-muted/50 rounded-lg p-3">
                            <div className="font-medium">{item.category}</div>
                            <div className="text-muted-foreground">{item.description}</div>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {item.style}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.price} ₽
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Цветовая палитра */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Цветовая палитра
                        </h5>
                        <div className="flex gap-2">
                          {outfit.colorPalette.map((color, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Стилевые заметки */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm flex items-center gap-2">
                          <Star className="w-4 h-4" />
                          Рекомендации
                        </h5>
                        <p className="text-sm text-muted-foreground">{outfit.styleNotes}</p>
                      </div>

                      {/* Общая стоимость */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Общая стоимость:</span>
                          <span className="text-lg font-bold text-primary">{outfit.totalPrice}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button onClick={generateOutfits} className="px-8" variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Сгенерировать новые образы
                </Button>

                <Button 
                  onClick={() => {
                    toast({
                      title: "Образы сохранены",
                      description: "Переходим к каталогу товаров",
                    });
                    onComplete?.();
                  }}
                  className="px-8"
                >
                  Перейти к каталогу товаров
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};