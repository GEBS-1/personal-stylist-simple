import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { aiService } from "@/services/aiService";

export const TestGemini = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('simulation');
  const { toast } = useToast();

  const testGemini = async () => {
    setIsTesting(true);
    setResult(null);
    
    try {
      // Получаем текущий провайдер
      const provider = aiService.getCurrentProvider();
      setCurrentProvider(provider);
      
      // Тестовый запрос
      const testRequest = {
        bodyType: 'hourglass',
        measurements: {
          height: 170,
          chest: 90,
          waist: 70,
          hips: 95,
          shoulders: 40
        },
        stylePreferences: ['Кэжуал', 'Элегантный'],
        colorPreferences: ['Черный', 'Белый'],
        occasion: 'casual',
        season: 'summer',
        budget: 'medium'
      };

      const outfit = await aiService.generateOutfit(testRequest);
      setResult(outfit);
      
      toast({
        title: "Тест успешен!",
        description: `Использован провайдер: ${provider}`,
      });
      
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Ошибка теста",
        description: `Ошибка: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Тест Gemini API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={testGemini} 
              disabled={isTesting}
              className="px-6"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Тестируем...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Запустить тест
                </>
              )}
            </Button>
            
            <Badge variant="outline">
              Текущий провайдер: {currentProvider === 'gemini' ? 'Google Gemini' : 
                                 currentProvider === 'openai' ? 'OpenAI GPT-4' : 
                                 currentProvider === 'claude' ? 'Anthropic Claude' : 
                                 currentProvider === 'cohere' ? 'Cohere' : 
                                 currentProvider === 'local' ? 'Локальная модель' : 'Симуляция'}
            </Badge>
          </div>

          {result && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Результат теста:</h4>
              <div>
                <strong>Название:</strong> {result.name}
              </div>
              <div>
                <strong>Описание:</strong> {result.description}
              </div>
              <div>
                <strong>Предметы:</strong> {result.items?.length || 0} шт.
              </div>
              <div>
                <strong>Цвета:</strong> {result.colorPalette?.join(', ')}
              </div>
              <div>
                <strong>Стоимость:</strong> {result.totalPrice}
              </div>
              <div>
                <strong>Уверенность:</strong> {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Этот тест проверит:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Подключение к Gemini API</li>
              <li>Генерацию образов</li>
              <li>Парсинг JSON ответа</li>
              <li>Скорость работы</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 