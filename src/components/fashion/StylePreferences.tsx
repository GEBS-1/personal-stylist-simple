import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Palette, Shirt, DollarSign, ChevronRight, User, Ruler, Scale } from "lucide-react";
import { BodyData } from "./ManualBodyInput";

interface StylePreferencesProps {
  analysisData?: BodyData;
  onComplete?: () => void;
}

export const StylePreferences = ({ analysisData, onComplete }: StylePreferencesProps) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const { toast } = useToast();

  const styles = ['Минимализм', 'Кэжуал', 'Классический', 'Бохо', 'Спортивный'];
  const colors = ['Нейтральные', 'Яркие', 'Пастельные', 'Темные', 'Принты'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5" />
            Стилевые предпочтения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">Предпочитаемые стили:</h3>
            <div className="flex flex-wrap gap-2">
              {styles.map((style) => (
                <Badge
                  key={style}
                  variant={selectedStyles.includes(style) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedStyles(prev =>
                      prev.includes(style)
                        ? prev.filter(s => s !== style)
                        : [...prev, style]
                    );
                  }}
                >
                  {style}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Цветовые предпочтения:</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <Badge
                  key={color}
                  variant={selectedColors.includes(color) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedColors(prev =>
                      prev.includes(color)
                        ? prev.filter(c => c !== color)
                        : [...prev, color]
                    );
                  }}
                >
                  {color}
                </Badge>
              ))}
            </div>
          </div>

          {/* Информация о введенных данных */}
          {analysisData && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Ваши данные
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Рост:</span>
                  <div className="font-medium flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {analysisData.height} см
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Вес:</span>
                  <div className="font-medium flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    {analysisData.weight} кг
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Пол:</span>
                  <div className="font-medium">
                    {analysisData.gender === 'female' ? 'Женский' : 'Мужской'}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Тип фигуры:</span>
                  <div className="font-medium">{analysisData.bodyType}</div>
                </div>
              </div>
            </div>
          )}

          {/* Кнопка продолжения */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => {
                toast({
                  title: "Предпочтения сохранены",
                  description: "Переходим к генерации образов",
                });
                onComplete?.();
              }}
              disabled={selectedStyles.length === 0 || selectedColors.length === 0}
              className="px-8"
            >
              Продолжить к генерации образов
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};