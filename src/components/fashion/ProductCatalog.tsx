import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export const ProductCatalog = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Каталог товаров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Интеграция с маркетплейсами будет доступна в следующих обновлениях</p>
            <Button disabled>Просмотреть товары</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};