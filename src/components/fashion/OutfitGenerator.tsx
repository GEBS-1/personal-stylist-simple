import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { wildberriesService } from '@/services/wildberriesService';
import { OutfitDisplay } from './OutfitDisplay';

interface OutfitGeneratorProps {
  analysisData: any;
  onComplete: (outfit: any) => void;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ analysisData, onComplete }) => {
  const [isGenerating, setIsGenerating] = useState(true); // Начинаем с генерации
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
    // Автоматически генерируем образ при загрузке компонента
    generateOutfit();
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
      // УБИРАЕМ onComplete(outfit) - пользователь должен сначала одобрить образ
      setCurrentProvider(await aiService.getCurrentProvider());
    } catch (error) {
      console.error('Error generating outfit:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOutfitEdit = (editedOutfit: any) => {
    setGeneratedOutfit(editedOutfit);
    // НЕ вызываем onComplete здесь - пользователь еще не одобрил образ
  };

  const handleSearchProducts = () => {
    // Только после одобрения образа переходим к поиску товаров
    onComplete(generatedOutfit);
  };

  const handleRegenerate = () => {
    setGeneratedOutfit(null);
    generateOutfit();
  };

  const handleApproveOutfit = () => {
    // Пользователь одобрил образ - переходим к поиску товаров
    onComplete(generatedOutfit);
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

  // Если образ уже сгенерирован, показываем его для одобрения
  if (generatedOutfit) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ваш персональный образ готов!</h2>
          <p className="text-gray-600 mb-4">
            ИИ создал образ специально для вас на основе ваших данных. 
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Что дальше?</h3>
            <ol className="text-left text-blue-700 space-y-1">
              <li>1. Просмотрите созданный образ ниже</li>
              <li>2. При необходимости отредактируйте детали</li>
              <li>3. Нажмите "Одобрить образ" когда будете довольны результатом</li>
              <li>4. После одобрения мы найдем товары для вашего образа</li>
            </ol>
          </div>
        </div>
        
        <OutfitDisplay
          outfit={generatedOutfit}
          onEdit={handleOutfitEdit}
          onApprove={handleApproveOutfit}
          onRegenerate={handleRegenerate}
        />
      </div>
    );
  }

  // Показываем процесс генерации
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Создание вашего образа</h2>
        <p className="text-gray-600">
          ИИ анализирует ваши данные и создает персональный образ...
        </p>
      </div>

      {/* Статус системы */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Статус системы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.ai)}
              <span className="font-medium">AI сервис</span>
            </div>
            <Badge variant={systemStatus.ai === 'available' ? 'default' : 'secondary'}>
              {getStatusText(systemStatus.ai)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(systemStatus.products)}
              <span className="font-medium">Поиск товаров</span>
            </div>
            <Badge variant={systemStatus.products === 'available' ? 'default' : 'secondary'}>
              {getStatusText(systemStatus.products)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Информация о пользователе */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ваши данные для генерации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Пол:</span>
              <p className="font-medium">{analysisData?.gender === 'female' ? 'Женский' : 'Мужской'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Тип фигуры:</span>
              <p className="font-medium">{analysisData?.bodyType || 'Не указан'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Рост:</span>
              <p className="font-medium">{analysisData?.height || 'Не указан'} см</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Стиль:</span>
              <p className="font-medium">{analysisData?.stylePreferences?.join(', ') || 'Не указан'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Индикатор генерации */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 p-6 bg-blue-50 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-800">Генерируем образ...</h3>
            <p className="text-sm text-blue-600">Это может занять несколько секунд</p>
          </div>
        </div>
      </div>
    </div>
  );
};