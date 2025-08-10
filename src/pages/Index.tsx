import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Sparkles, 
  ChevronRight,
  Calculator,
  Palette,
  ShoppingBag,
  Image as ImageIcon
} from "lucide-react";
import { ManualBodyInput, BodyData } from "@/components/fashion/ManualBodyInput";
import { StylePreferences } from "@/components/fashion/StylePreferences";
import { OutfitGenerator } from "@/components/fashion/OutfitGenerator";
import { ImageGenerator } from "@/components/fashion/ImageGenerator";
import ProductCatalog from "@/components/fashion/ProductCatalog";
import TestAPI from "@/components/TestAPI";
import { TestEnv } from "@/components/TestEnv";
import { logConfig } from "@/config/env";

interface AnalysisData extends BodyData {
  bodyType: string;
  measurements?: any;
}

const Index = () => {
  console.log('🎯 Index component is rendering...');
  
  const [activeStep, setActiveStep] = useState<'analysis' | 'preferences' | 'outfits' | 'images' | 'catalog' | 'test'>('analysis');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [generatedOutfit, setGeneratedOutfit] = useState<any>(null);
  const [generatedImage, setGeneratedImage] = useState<any>(null);

  useEffect(() => {
    // Логируем конфигурацию при загрузке
    logConfig();
  }, []);

  const handleStepComplete = (stepId: string, data?: any) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    if (stepId === 'analysis' && data) {
      setAnalysisData(data);
    } else if (stepId === 'preferences') {
      setActiveStep('outfits');
    } else if (stepId === 'outfits') {
      setActiveStep('images');
    } else if (stepId === 'images') {
      setActiveStep('catalog');
    }
    
    // Сохраняем сгенерированные данные
    if (stepId === 'outfits' && data) {
      setGeneratedOutfit(data);
    } else if (stepId === 'images' && data) {
      setGeneratedImage(data);
    }
  };

  const handleContinueFromAnalysis = () => {
    setActiveStep('preferences');
  };

  const handleStepChange = (step: 'analysis' | 'preferences' | 'outfits' | 'images' | 'catalog' | 'test') => {
    setActiveStep(step);
  };

  const handleStartAnalysis = () => {
    setActiveStep('analysis');
    setTimeout(() => {
      const analysisSection = document.querySelector('[data-step="analysis"]');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const steps = [
    {
      id: 'analysis',
      title: 'Ввод данных',
      description: 'Ручной ввод параметров фигуры',
      icon: User,
      completed: completedSteps.has('analysis')
    },
    {
      id: 'preferences',
      title: 'Стилевые предпочтения',
      description: 'Ваш стиль и цветовые предпочтения',
      icon: Palette,
      completed: completedSteps.has('preferences')
    },
    {
      id: 'outfits',
      title: 'Подбор образов',
      description: 'ИИ-генерация персональных луков',
      icon: Sparkles,
      completed: completedSteps.has('outfits')
    },
    {
      id: 'images',
      title: 'Генерация изображений',
      description: 'Создание реалистичных образов',
      icon: ImageIcon,
      completed: completedSteps.has('images')
    },
    {
      id: 'catalog',
      title: 'Каталог товаров',
      description: 'Рекомендуемые товары из маркетплейсов',
      icon: ShoppingBag,
      completed: completedSteps.has('catalog')
    },
    {
      id: 'test',
      title: 'Тест API',
      description: 'Проверка подключения сервисов',
      icon: Calculator,
      completed: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="hero-gradient py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground mb-6">
            Ваш <span className="text-primary">ИИ-стилист</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Персональный подбор одежды с генерацией реалистичных изображений
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <User className="w-4 h-4 mr-2" />
              Ручной ввод данных
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              ИИ-рекомендации
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <ImageIcon className="w-4 h-4 mr-2" />
              Генерация изображений
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Интеграция с маркетплейсами
            </Badge>
          </div>
          <Button 
            size="lg" 
            onClick={handleStartAnalysis}
            className="elegant-shadow smooth-transition"
          >
            Начать подбор
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Демо-режим:</strong> Приложение работает с тестовыми данными. 
              Для реальных рекомендаций и генерации изображений настройте API ключи в файле .env
            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-12 px-6 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="flex space-x-8 overflow-x-auto pb-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === activeStep;
                const isCompleted = step.completed;
                
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepChange(step.id as any)}
                    className={`flex flex-col items-center space-y-2 min-w-0 smooth-transition ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center smooth-transition ${
                      isActive 
                        ? 'border-primary bg-primary text-primary-foreground' 
                        : isCompleted
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-muted-foreground max-w-24">{step.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeStep} className="space-y-8">
            <TabsContent value="analysis" className="space-y-8" data-step="analysis">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Ввод данных о фигуре</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Введите ваши параметры для точного подбора одежды
                </p>
              </div>
              <ManualBodyInput 
                onComplete={(data) => handleStepComplete('analysis', data)}
                onContinue={handleContinueFromAnalysis}
                analysisData={analysisData}
              />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Стилевые предпочтения</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Расскажите о ваших предпочтениях в стиле, цветах и бюджете
                </p>
              </div>
              <StylePreferences 
                analysisData={analysisData}
                onComplete={() => handleStepComplete('preferences')} 
              />
            </TabsContent>

            <TabsContent value="outfits" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Подбор образов</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  ИИ создаст персональные образы на основе ваших данных
                </p>
              </div>
              <OutfitGenerator 
                analysisData={analysisData}
                onComplete={(outfit) => handleStepComplete('outfits', outfit)} 
              />
            </TabsContent>

            <TabsContent value="images" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Генерация изображений</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Создайте реалистичные изображения ваших образов с помощью ИИ
                </p>
              </div>
              <ImageGenerator 
                analysisData={analysisData}
                onImageGenerated={(image) => handleStepComplete('images', image)} 
              />
            </TabsContent>

            <TabsContent value="catalog" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Каталог товаров</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Рекомендуемые товары из Ozon, Wildberries и Lamoda
                </p>
              </div>
              <ProductCatalog analysisData={analysisData} generatedOutfit={generatedOutfit} />
            </TabsContent>

            <TabsContent value="test" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Тестирование API</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Проверка подключения к AI сервисам и маркетплейсам
                </p>
              </div>
              <TestAPI />
              
              <div className="mt-8">
                <TestEnv />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Index;
