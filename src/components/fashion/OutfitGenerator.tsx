import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";

interface OutfitGeneratorProps {
  analysisData?: any;
  onComplete?: () => void;
}

export const OutfitGenerator = ({ analysisData, onComplete }: OutfitGeneratorProps) => {
  const [generatedOutfits, setGeneratedOutfits] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateOutfits = async () => {
    setIsGenerating(true);
    
    // Симуляция генерации образов
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockOutfits = [
      {
        id: 1,
        title: "Деловой стиль",
        description: "Элегантный образ для офиса",
        items: ["Белая блузка", "Черные брюки", "Классические туфли"],
        colors: ["white", "black"]
      },
      {
        id: 2,
        title: "Кэжуал",
        description: "Комфортный повседневный образ",
        items: ["Джинсы", "Базовая футболка", "Кроссовки"],
        colors: ["blue", "white"]
      },
      {
        id: 3,
        title: "Вечерний образ",
        description: "Стильный лук для особых случаев",
        items: ["Маленькое черное платье", "Высокие каблуки", "Клатч"],
        colors: ["black", "gold"]
      }
    ];
    
    setGeneratedOutfits(mockOutfits);
    setIsGenerating(false);
    
    toast({
      title: "Образы сгенерированы",
      description: "Созданы персональные луки на основе вашего типа фигуры",
    });
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
              <h4 className="font-medium mb-2">Учитываем ваши данные:</h4>
              <div className="flex gap-2">
                <Badge variant="secondary">Тип фигуры: {analysisData.bodyType}</Badge>
                <Badge variant="outline">Рост: {analysisData.measurements.height} см</Badge>
              </div>
            </div>
          )}

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
                    <CardContent className="pt-6">
                      <h3 className="font-medium mb-2">{outfit.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{outfit.description}</p>
                      <div className="space-y-2">
                        {outfit.items.map((item: string, index: number) => (
                          <div key={index} className="text-sm bg-muted/50 rounded px-2 py-1">
                            {item}
                          </div>
                        ))}
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