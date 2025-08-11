import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Image as ImageIcon,
  Download,
  Share2,
  Edit3,
  Sparkles
} from 'lucide-react';
import { imageGenerationService, ImageGenerationRequest, ImageGenerationResponse } from '@/services/imageGenerationService';
import { env } from '@/config/env';

interface ImageGeneratorProps {
  analysisData: any;
  approvedOutfit?: any; // Добавляем approved outfit
  onImageGenerated?: (image: ImageGenerationResponse) => void;
}

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ 
  analysisData, 
  approvedOutfit,
  onImageGenerated 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResponse | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [imageSettings, setImageSettings] = useState({
    style: 'realistic' as const,
    quality: 'high' as const,
    size: '1024x1024' as const,
    aspectRatio: '1:1' as const
  });
  const [serviceStatus, setServiceStatus] = useState<'loading' | 'available' | 'error' | 'unavailable'>('loading');

  useEffect(() => {
    initializeImageService();
    generateInitialPrompt();
  }, [analysisData, approvedOutfit]);

  useEffect(() => {
    // Автоматически запускаем генерацию при наличии approved outfit
    if (approvedOutfit && !generatedImage && !isGenerating) {
      console.log('🎨 Auto-generating image for approved outfit:', approvedOutfit.name);
      generateImageFromOutfit();
    }
  }, [approvedOutfit]);

  const initializeImageService = async () => {
    console.log('🔍 Initializing Image Generation Service...');
    console.log('🔑 Environment check:', {
      env: {
        clientId: import.meta.env.VITE_GIGACHAT_CLIENT_ID ? '✅ Present' : '❌ Missing',
        clientSecret: import.meta.env.VITE_GIGACHAT_CLIENT_SECRET ? '✅ Present' : '❌ Missing'
      }
    });
    
    try {
      const availableProviders = imageGenerationService.getAvailableProviders();
      const currentProvider = imageGenerationService.getCurrentProvider();
      
      console.log(`✅ Available providers: ${availableProviders.join(', ')}`);
      console.log(`🎯 Current provider: ${currentProvider}`);
      
      if (availableProviders.length > 0) {
        setServiceStatus('available');
      } else {
        setServiceStatus('unavailable');
      }
    } catch (error) {
      console.error('Failed to initialize Image Service:', error);
      setServiceStatus('error');
    }
  };

  const generateInitialPrompt = () => {
    if (approvedOutfit) {
      // Используем данные из approved outfit для создания промпта
      generatePromptFromOutfit();
    } else if (analysisData) {
      // Используем базовые данные анализа
      generatePromptFromAnalysis();
    }
  };

  const generatePromptFromOutfit = (): string => {
    if (!approvedOutfit) {
      console.warn('⚠️ No approved outfit available for prompt generation');
      return '';
    }

    console.log('🔍 Generating prompt from outfit:', approvedOutfit);
    
    const { name, description, items, colorPalette, styleNotes } = approvedOutfit;
    const { gender } = analysisData || {};
    
    let prompt = `Стильный человек ${gender === 'female' ? 'женского' : 'мужского'} пола`;
    
    // Добавляем описание образа
    if (description) {
      prompt += ` в образе: ${description}`;
    } else if (name) {
      prompt += ` в образе: ${name}`;
    }
    
    // Добавляем детали одежды
    if (items && items.length > 0) {
      prompt += '. Одежда включает: ';
      items.forEach((item: any, index: number) => {
        prompt += `${item.name} ${item.colors ? `в цветах ${item.colors.join(', ')}` : ''}`;
        if (index < items.length - 1) prompt += ', ';
      });
    }
    
    // Добавляем цветовую палитру
    if (colorPalette && colorPalette.length > 0) {
      prompt += `. Цветовая палитра: ${colorPalette.join(', ')}`;
    }
    
    // Добавляем стилевые заметки
    if (styleNotes) {
      prompt += `. ${styleNotes}`;
    }
    
    prompt += '. Одежда должна быть современной, стильной и хорошо сидеть по фигуре.';
    
    console.log('📝 Generated prompt:', prompt);
    
    setCurrentPrompt(prompt);
    setCustomPrompt(prompt);
    
    return prompt;
  };

  const generatePromptFromAnalysis = () => {
    if (!analysisData) return;

    const { bodyType, stylePreferences, colorPreferences, gender, occasion } = analysisData;
    
    let prompt = `Стильный человек ${gender === 'female' ? 'женского' : 'мужского'} пола`;
    
    if (bodyType) {
      prompt += ` с типом фигуры "${bodyType}"`;
    }
    
    if (stylePreferences && stylePreferences.length > 0) {
      prompt += ` в стиле ${stylePreferences.join(', ')}`;
    }
    
    if (colorPreferences && colorPreferences.length > 0) {
      prompt += ` в цветах ${colorPreferences.join(', ')}`;
    }
    
    if (occasion) {
      prompt += ` для ${occasion}`;
    }
    
    prompt += '. Одежда должна быть современной, стильной и хорошо сидеть по фигуре.';
    
    setCurrentPrompt(prompt);
    setCustomPrompt(prompt);
  };

  const generateImageFromOutfit = async () => {
    if (!approvedOutfit) return;
    
    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Генерируем промпт на основе approved outfit и получаем его сразу
      const generatedPrompt = generatePromptFromOutfit();
      
      const request: ImageGenerationRequest = {
        prompt: generatedPrompt || customPrompt || currentPrompt,
        style: imageSettings.style,
        quality: imageSettings.quality,
        size: imageSettings.size,
        aspectRatio: imageSettings.aspectRatio
      };

      console.log('🎨 Auto-generating image for outfit:', approvedOutfit.name);
      console.log('📝 Prompt:', request.prompt);
      
      // Проверяем, что промпт не пустой
      if (!request.prompt || request.prompt.trim() === '') {
        console.warn('⚠️ Empty prompt detected, generating fallback prompt');
        request.prompt = `Стильный человек в образе: ${approvedOutfit.name || 'модный образ'}. ${approvedOutfit.description || ''}`;
      }
      
      const result = await imageGenerationService.generateImage(request);
      setGeneratedImage(result);
      
      if (onImageGenerated) {
        onImageGenerated(result);
      }
      
      console.log('✅ Auto image generation completed:', result);
      
    } catch (error) {
      console.error('❌ Auto image generation failed:', error);
      setGeneratedImage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!customPrompt.trim()) {
      alert('Пожалуйста, введите описание для генерации изображения');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const request: ImageGenerationRequest = {
        prompt: customPrompt,
        style: imageSettings.style,
        quality: imageSettings.quality,
        size: imageSettings.size,
        aspectRatio: imageSettings.aspectRatio
      };

      console.log('🎨 Generating image with request:', request);
      
      const result = await imageGenerationService.generateImage(request);
      setGeneratedImage(result);
      
      if (onImageGenerated) {
        onImageGenerated(result);
      }
      
      console.log('✅ Image generation completed:', result);
      
    } catch (error) {
      console.error('❌ Image generation failed:', error);
      setGeneratedImage({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImage = () => {
    setGeneratedImage(null);
    generateImage();
  };

  const editPrompt = () => {
    setCustomPrompt(currentPrompt);
  };

  const downloadImage = () => {
    if (!generatedImage?.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedImage.imageUrl;
    link.download = `stylist-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareImage = async () => {
    if (!generatedImage?.imageUrl) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Мой стильный образ',
          text: 'Посмотрите, какой образ создал для меня ИИ-стилист!',
          url: generatedImage.imageUrl
        });
      } else {
        // Fallback для браузеров без поддержки Web Share API
        await navigator.clipboard.writeText(generatedImage.imageUrl);
        // Здесь можно добавить toast уведомление
        alert('Ссылка на изображение скопирована в буфер обмена!');
      }
    } catch (error) {
      console.error('Failed to share image:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unavailable': return <Info className="w-4 h-4 text-blue-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступен';
      case 'unavailable': return 'Недоступен';
      case 'error': return 'Ошибка';
      default: return 'Проверка...';
    }
  };

  if (serviceStatus === 'unavailable') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Генерация изображений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Генерация изображений недоступна</h3>
            <p className="text-gray-600 mb-4">
              Для использования этой функции необходимо настроить API ключи для генерации изображений
            </p>
            <div className="text-sm text-gray-500">
              <p>Добавьте в файл .env один из вариантов:</p>
              <div className="space-y-2">
                <div>
                  <p className="font-medium">OpenAI DALL-E:</p>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    VITE_OPENAI_API_KEY=ваш_ключ
                  </code>
                </div>
                <div>
                  <p className="font-medium">GigaChat (только текст):</p>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    VITE_GIGACHAT_CLIENT_ID=ваш_ключ
                  </code>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Генерация изображений
          <Badge variant="secondary" className="ml-2">
            {getStatusIcon(serviceStatus)}
            {getStatusText(serviceStatus)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Настройки изображения */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="style">Стиль</Label>
            <Select 
              value={imageSettings.style} 
              onValueChange={(value: any) => setImageSettings(prev => ({ ...prev, style: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realistic">Реалистичный</SelectItem>
                <SelectItem value="artistic">Художественный</SelectItem>
                <SelectItem value="fashion">Модный</SelectItem>
                <SelectItem value="casual">Повседневный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quality">Качество</Label>
            <Select 
              value={imageSettings.quality} 
              onValueChange={(value: any) => setImageSettings(prev => ({ ...prev, quality: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Стандартное</SelectItem>
                <SelectItem value="high">Высокое</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="size">Размер</Label>
            <Select 
              value={imageSettings.size} 
              onValueChange={(value: any) => setImageSettings(prev => ({ ...prev, size: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">1024x1024</SelectItem>
                <SelectItem value="1792x1024">1792x1024</SelectItem>
                <SelectItem value="1024x1792">1024x1792</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="aspectRatio">Соотношение</Label>
            <Select 
              value={imageSettings.aspectRatio} 
              onValueChange={(value: any) => setImageSettings(prev => ({ ...prev, aspectRatio: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">Квадрат (1:1)</SelectItem>
                <SelectItem value="16:9">Горизонтальный (16:9)</SelectItem>
                <SelectItem value="9:16">Вертикальный (9:16)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Промпт */}
        <div>
          <Label htmlFor="prompt">Описание образа</Label>
          <div className="flex gap-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={editPrompt}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Использовать базовый
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCustomPrompt('')}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Очистить
            </Button>
          </div>
          <Textarea
            id="prompt"
            placeholder="Опишите желаемый образ..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-gray-500 mt-1">
            Опишите детально, как должен выглядеть образ. Можно указать стиль, цвета, детали одежды.
          </p>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button 
            onClick={generateImage} 
            disabled={isGenerating || !customPrompt.trim() || serviceStatus !== 'available'}
            className="flex-1"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Генерирую изображение...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Создать образ
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => onImageGenerated && onImageGenerated({ success: true, imageUrl: '/placeholder.svg', model: 'skipped' })}
            className="flex-1"
            size="lg"
          >
            Пропустить
          </Button>
        </div>

        {/* Результат генерации */}
        {generatedImage && (
          <div className="space-y-4">
            <Separator />
            
            {generatedImage.success ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Образ создан! ✨</h3>
                  <p className="text-gray-600">Ваш стильный лук готов</p>
                </div>
                
                <div className="relative group">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Сгенерированный образ"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={downloadImage}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Скачать
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={shareImage}
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Поделиться
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={regenerateImage}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Переделать
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGeneratedImage(null)}
                    className="flex-1"
                  >
                    Скрыть
                  </Button>
                </div>
                
                {generatedImage.usage && (
                  <div className="text-xs text-gray-500 text-center">
                    Использовано токенов: {generatedImage.usage.totalTokens}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-red-600 mb-2">Ошибка генерации</h3>
                <p className="text-gray-600 mb-4">{generatedImage.error}</p>
                <Button
                  variant="outline"
                  onClick={generateImage}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Попробовать снова
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
