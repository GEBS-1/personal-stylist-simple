import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  User, 
  Shirt, 
  Sparkles, 
  ChevronRight,
  Upload,
  Calculator,
  Palette,
  ShoppingBag
} from "lucide-react";
import { BodyAnalysis } from "@/components/fashion/BodyAnalysis";
import { StylePreferences } from "@/components/fashion/StylePreferences";
import { OutfitGenerator } from "@/components/fashion/OutfitGenerator";
import { ProductCatalog } from "@/components/fashion/ProductCatalog";

interface AnalysisData {
  bodyType: string;
  measurements: any;
}

const Index = () => {
  const [activeStep, setActiveStep] = useState<'analysis' | 'preferences' | 'outfits' | 'catalog'>('analysis');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleStepComplete = (stepId: string, data?: any) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    if (stepId === 'analysis' && data) {
      setAnalysisData(data);
      // НЕ переходим автоматически к следующему шагу
      // Пользователь сам решит, когда готов
    } else if (stepId === 'preferences') {
      setActiveStep('outfits');
    } else if (stepId === 'outfits') {
      setActiveStep('catalog');
    }
  };

  // Функция для перехода к следующему шагу после анализа
  const handleContinueFromAnalysis = () => {
    setActiveStep('preferences');
  };

  // Сохраняем данные при переходе между шагами
  const handleStepChange = (step: 'analysis' | 'preferences' | 'outfits' | 'catalog') => {
    setActiveStep(step);
  };

  const handleStartAnalysis = () => {
    setActiveStep('analysis');
    // Прокрутить к разделу анализа фото
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
      title: 'Анализ фигуры',
      description: 'Определение типа фигуры и параметров',
      icon: Camera,
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
      id: 'catalog',
      title: 'Каталог товаров',
      description: 'Рекомендуемые товары из маркетплейсов',
      icon: ShoppingBag,
      completed: completedSteps.has('catalog')
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
            Персональный подбор одежды на основе анализа вашей фигуры, стиля и предпочтений
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Camera className="w-4 h-4 mr-2" />
              Анализ фото
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              ИИ-рекомендации
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Интеграция с маркетплейсами
            </Badge>
          </div>
          <Button 
            size="lg" 
            className="elegant-shadow"
            onClick={handleStartAnalysis}
          >
            Начать стилизацию
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
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
                <h2 className="font-display text-3xl font-bold mb-4">Анализ фигуры</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Загрузите фото или введите параметры вручную для определения типа фигуры
                </p>
              </div>
                                           <BodyAnalysis 
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
                onComplete={() => handleStepComplete('outfits')} 
              />
            </TabsContent>

            <TabsContent value="catalog" className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="font-display text-3xl font-bold mb-4">Каталог товаров</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Рекомендуемые товары из Ozon, Wildberries и Lamoda
                </p>
              </div>
              <ProductCatalog analysisData={analysisData} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Возможности платформы</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Полный цикл персонального стайлинга с использованием ИИ-технологий
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <Upload className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Анализ фото</CardTitle>
                <CardDescription>
                  Автоматический анализ фигуры через MediaPipe с определением ключевых точек тела
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <Calculator className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Ручной ввод</CardTitle>
                <CardDescription>
                  Возможность ввода параметров вручную с интеллектуальным размерным калькулятором
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <User className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Типирование фигуры</CardTitle>
                <CardDescription>
                  Определение типа фигуры по стандартной классификации (яблоко, груша и др.)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <Palette className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Цветотип</CardTitle>
                <CardDescription>
                  Анализ цветотипа по сезону и подбор подходящей цветовой палитры
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <Sparkles className="w-12 h-12 text-primary mb-4" />
                <CardTitle>ИИ-генерация</CardTitle>
                <CardDescription>
                  Создание образов с помощью GPT-4 с учетом всех персональных параметров
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card smooth-transition hover:elegant-shadow">
              <CardHeader>
                <ShoppingBag className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Интеграция</CardTitle>
                <CardDescription>
                  Подбор товаров из популярных маркетплейсов с учетом размерных сеток
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
