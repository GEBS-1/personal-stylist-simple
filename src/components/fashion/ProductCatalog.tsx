import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";

interface ProductCatalogProps {
  analysisData?: any;
}

export const ProductCatalog = ({ analysisData }: ProductCatalogProps) => {
  return (
    <div className="max-w-4xl mx-auto">
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
              <div className="flex gap-2">
                <Badge variant="secondary">Тип фигуры: {analysisData.bodyType}</Badge>
                <Badge variant="outline">Персональные рекомендации</Badge>
              </div>
            </div>
          )}

          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-medium mb-2">Каталог товаров</h3>
            <p className="text-muted-foreground mb-6">
              Интеграция с маркетплейсами для подбора идеальных вещей
            </p>
            <div className="grid md:grid-cols-3 gap-4 max-w-md mx-auto mb-4">
              <Button variant="outline" disabled>Ozon</Button>
              <Button variant="outline" disabled>Wildberries</Button>
              <Button variant="outline" disabled>Lamoda</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Интеграция будет добавлена в следующей версии
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};