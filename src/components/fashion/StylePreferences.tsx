import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette, Shirt, DollarSign } from "lucide-react";

export const StylePreferences = () => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

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
        </CardContent>
      </Card>
    </div>
  );
};