import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Ruler, 
  Scale, 
  Heart,
  Sun,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export interface BodyData {
  height: number;
  weight: number;
  gender: 'male' | 'female';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  shoeSize: number;
  bodyType: 'hourglass' | 'inverted-triangle' | 'triangle' | 'rectangle' | 'circle' | 'diamond';
}

interface ManualBodyInputProps {
  onComplete: (data: BodyData) => void;
  onContinue: () => void;
  analysisData?: BodyData | null;
}

const bodyTypes = [
  {
    id: 'hourglass',
    name: 'Песочные часы',
    icon: '⏳',
    description: 'Определенная талия, грудь ≈ бедра',
    characteristics: 'Плечи и бедра примерно одинаковой ширины, талия четко выражена'
  },
  {
    id: 'inverted-triangle',
    name: 'Перевернутый треугольник',
    icon: '🔻',
    description: 'Широкие плечи, узкие бедра',
    characteristics: 'Плечи шире бедер, талия может быть не очень выражена'
  },
  {
    id: 'triangle',
    name: 'Треугольник',
    icon: '🔺',
    description: 'Узкие плечи, широкие бедра',
    characteristics: 'Бедра шире плеч, талия может быть выражена'
  },
  {
    id: 'rectangle',
    name: 'Прямоугольник',
    icon: '⬜',
    description: 'Прямая фигура, плечи ≈ талия ≈ бедра',
    characteristics: 'Плечи, талия и бедра примерно одинаковой ширины'
  },
  {
    id: 'circle',
    name: 'Круг',
    icon: '⭕',
    description: 'Полнота в средней части',
    characteristics: 'Полнота сосредоточена в области талии и живота'
  },
  {
    id: 'diamond',
    name: 'Ромб',
    icon: '💎',
    description: 'Широкая средняя часть, узкие плечи и бедра',
    characteristics: 'Широкая талия, узкие плечи и бедра'
  }
];

export const ManualBodyInput = ({ onComplete, onContinue, analysisData }: ManualBodyInputProps) => {
  const [formData, setFormData] = useState<BodyData>({
    height: analysisData?.height || 165,
    weight: analysisData?.weight || 60,
    gender: analysisData?.gender || 'female',
    season: analysisData?.season || 'spring',
    shoeSize: analysisData?.shoeSize || 38,
    bodyType: analysisData?.bodyType || 'hourglass'
  });

  const [errors, setErrors] = useState<Partial<BodyData>>({});
  const [isValid, setIsValid] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<BodyData> = {};

    if (!formData.height || formData.height < 120 || formData.height > 220) {
      newErrors.height = 'Рост должен быть от 120 до 220 см';
    }

    if (!formData.weight || formData.weight < 30 || formData.weight > 200) {
      newErrors.weight = 'Вес должен быть от 30 до 200 кг';
    }

    if (!formData.shoeSize || formData.shoeSize < 30 || formData.shoeSize > 50) {
      newErrors.shoeSize = 'Размер обуви должен быть от 30 до 50';
    }

    setErrors(newErrors);
    const isValidForm = Object.keys(newErrors).length === 0;
    setIsValid(isValidForm);
    return isValidForm;
  };

  const handleInputChange = (field: keyof BodyData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Валидируем при каждом изменении
    setTimeout(() => validateForm(), 100);
  };

  const handleSaveAndContinue = () => {
    if (validateForm()) {
      onComplete(formData);
      onContinue();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Основные параметры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Основные параметры
          </CardTitle>
          <CardDescription>
            Введите ваши базовые параметры для точного подбора одежды
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Рост */}
            <div className="space-y-2">
              <Label htmlFor="height" className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Рост (см)
              </Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange('height', Number(e.target.value))}
                placeholder="165"
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.height}
                </p>
              )}
            </div>

            {/* Вес */}
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Вес (кг)
              </Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                placeholder="60"
                className={errors.weight ? 'border-red-500' : ''}
              />
              {errors.weight && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.weight}
                </p>
              )}
            </div>

            {/* Пол */}
            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Пол
              </Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Женский</SelectItem>
                  <SelectItem value="male">Мужской</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Размер обуви */}
            <div className="space-y-2">
              <Label htmlFor="shoeSize" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Размер обуви
              </Label>
              <Input
                id="shoeSize"
                type="number"
                value={formData.shoeSize}
                onChange={(e) => handleInputChange('shoeSize', Number(e.target.value))}
                placeholder="38"
                className={errors.shoeSize ? 'border-red-500' : ''}
              />
              {errors.shoeSize && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.shoeSize}
                </p>
              )}
            </div>

            {/* Сезон */}
            <div className="space-y-2">
              <Label htmlFor="season" className="flex items-center gap-2">
                <Sun className="w-4 h-4" />
                Любимый сезон
              </Label>
              <Select value={formData.season} onValueChange={(value) => handleInputChange('season', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spring">Весна</SelectItem>
                  <SelectItem value="summer">Лето</SelectItem>
                  <SelectItem value="autumn">Осень</SelectItem>
                  <SelectItem value="winter">Зима</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Тип фигуры */}
      <Card>
        <CardHeader>
          <CardTitle>Тип фигуры</CardTitle>
          <CardDescription>
            Выберите тип фигуры, который наиболее точно описывает вашу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bodyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleInputChange('bodyType', type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  formData.bodyType === type.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium">{type.name}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{type.characteristics}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Предварительный просмотр */}
      <Card>
        <CardHeader>
          <CardTitle>Предварительный просмотр</CardTitle>
          <CardDescription>
            Проверьте введенные данные перед продолжением
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Рост</div>
              <div className="font-medium">{formData.height} см</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Вес</div>
              <div className="font-medium">{formData.weight} кг</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Пол</div>
              <div className="font-medium">
                {formData.gender === 'female' ? 'Женский' : 'Мужской'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Размер обуви</div>
              <div className="font-medium">{formData.shoeSize}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Сезон</div>
              <div className="font-medium">
                {formData.season === 'spring' && 'Весна'}
                {formData.season === 'summer' && 'Лето'}
                {formData.season === 'autumn' && 'Осень'}
                {formData.season === 'winter' && 'Зима'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Тип фигуры</div>
              <div className="font-medium">
                {bodyTypes.find(t => t.id === formData.bodyType)?.name}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Кнопка действий */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveAndContinue}
          disabled={!isValid}
          className="min-w-48"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Сохранить данные и продолжить
        </Button>
      </div>

      {/* Статус валидации */}
      {!isValid && Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Пожалуйста, исправьте ошибки в форме</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 