import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { wildberriesService } from '@/services/wildberriesService';

interface OutfitGeneratorProps {
  analysisData: any;
  onComplete: (outfit: any) => void;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ analysisData, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [currentProvider, setCurrentProvider] = useState<string>('simulation');
  const [systemStatus, setSystemStatus] = useState<{
    ai: 'loading' | 'available' | 'error' | 'simulation';
    products: 'loading' | 'available' | 'error' | 'simulation';
  }>({
    ai: 'loading',
    products: 'loading'
  });

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setSystemStatus(prev => ({ ...prev, ai: 'loading', products: 'loading' }));
    
    try {
      // Проверяем AI сервис
      const aiProvider = await aiService.getCurrentProvider();
      setCurrentProvider(aiProvider);
      setSystemStatus(prev => ({ 
        ...prev, 
        ai: aiProvider === 'simulation' ? 'simulation' : 'available' 
      }));
      
      // Проверяем сервис товаров
      try {
        const testResult = await wildberriesService.testAPI();
        setSystemStatus(prev => ({ 
          ...prev, 
          products: testResult.success ? 'available' : 'simulation' 
        }));
      } catch (error) {
        setSystemStatus(prev => ({ ...prev, products: 'simulation' }));
      }
    } catch (error) {
      setSystemStatus({ ai: 'simulation', products: 'simulation' });
    }
  };

  const generateOutfit = async () => {
    setIsGenerating(true);
    try {
      // Преобразуем analysisData в формат OutfitRequest
      const outfitRequest = {
        bodyType: analysisData?.bodyType || 'hourglass',
        measurements: {
          height: analysisData?.height || 165,
          weight: analysisData?.weight || 60,
          gender: analysisData?.gender || 'female',
          season: analysisData?.season || 'spring',
          shoeSize: analysisData?.shoeSize || 38
        },
        stylePreferences: analysisData?.stylePreferences || ['casual'],
        colorPreferences: analysisData?.colorPreferences || ['black', 'white'],
        occasion: analysisData?.occasion || 'casual',
        season: analysisData?.season || 'spring',
        budget: analysisData?.budget || 'medium'
      };
      
      const outfit = await aiService.generateOutfit(outfitRequest);
      setGeneratedOutfit(outfit);
      setCurrentProvider(await aiService.getCurrentProvider());
    } catch (error) {
      console.error('Error generating outfit:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'simulation': return <Info className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступен';
      case 'simulation': return 'Демо-режим';
      case 'error': return 'Ошибка';
      default: return 'Проверка...';
    }
  };

  return (
    <div className="space-y-4">
      {/* Системный статус */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Статус системы
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={checkSystemStatus}
              className="ml-auto h-6 w-6 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.ai)}
              <span>ИИ: {getStatusText(systemStatus.ai)}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(systemStatus.products)}
              <span>Товары: {getStatusText(systemStatus.products)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Уведомление о демо-режиме */}
      {currentProvider === 'simulation' && (
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-700 mb-2 font-medium">
            🎭 Демо-режим активен
          </p>
          <p className="text-xs text-blue-600 mb-2">
            {currentProvider === 'simulation' && (
              <>
                <span className="font-medium">Причина:</span> Gemini API превысил лимиты запросов (429 ошибка)
              </>
            )}
          </p>
          <p className="text-xs text-blue-500 mb-2">
            Образы создаются на основе ваших данных с помощью симуляции
          </p>
          <div className="text-xs text-blue-400">
            <p>💡 Для использования реального ИИ:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Проверьте лимиты в Google AI Studio</li>
              <li>Подождите некоторое время</li>
              <li>Используйте другой API ключ</li>
            </ul>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Генерация образа</span>
            {currentProvider !== 'simulation' && (
              <Badge variant="secondary" className="text-xs">
                {currentProvider === 'gemini' ? 'Gemini AI' : currentProvider}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!generatedOutfit ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Нажмите кнопку ниже, чтобы сгенерировать персональный образ на основе ваших данных
              </p>
              <Button 
                onClick={generateOutfit} 
                disabled={isGenerating}
                className="min-w-48"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Генерация образа...
                  </>
                ) : (
                  'Сгенерировать образ'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-green-800">{generatedOutfit.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {currentProvider === 'simulation' ? 'Демо' : 'AI'}
                  </Badge>
                </div>
                <p className="text-sm text-green-700 mb-4 leading-relaxed">{generatedOutfit.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-xs bg-white">
                    {generatedOutfit.occasion}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white">
                    {generatedOutfit.season}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white">
                    {generatedOutfit.totalPrice}
                  </Badge>
                </div>
                <div className="text-xs text-green-600">
                  ✅ Образ успешно сгенерирован! Теперь вы можете его одобрить или создать новый.
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium mb-3 text-gray-800">Элементы образа:</h4>
                <div className="space-y-3">
                  {generatedOutfit.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-md">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-700">{item.category}:</span>
                          <span className="text-xs text-gray-500">{item.price}</span>
                        </div>
                        <span className="text-sm text-gray-600">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={generateOutfit} 
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Генерация нового образа...
                    </>
                  ) : (
                    'Сгенерировать новый образ'
                  )}
                </Button>
                
                <Button 
                  onClick={() => onComplete(generatedOutfit)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Продолжить к одобрению
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};