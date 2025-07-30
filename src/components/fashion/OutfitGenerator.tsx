import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const OutfitGenerator = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Генерация образов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">ИИ-генерация образов будет доступна после завершения анализа фигуры</p>
            <Button disabled>Генерировать образы</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};