import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit3, Save, X, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OutfitItem {
  category: string;
  name: string;
  description: string;
  colors: string[];
  style: string;
  fit: string;
  size: string;
}

interface GeneratedOutfit {
  name: string;
  description: string;
  items: OutfitItem[];
  styleNotes: string;
  colorPalette: string[];
  whyItWorks: string;
}

interface OutfitDisplayProps {
  outfit: GeneratedOutfit;
  onEdit: (editedOutfit: GeneratedOutfit) => void;
  onApprove: () => void;
  onRegenerate: () => void;
}

export const OutfitDisplay = ({ 
  outfit, 
  onEdit, 
  onApprove, 
  onRegenerate 
}: OutfitDisplayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutfit, setEditedOutfit] = useState<GeneratedOutfit>(outfit);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedOutfit(outfit);
  };

  const handleSave = () => {
    onEdit(editedOutfit);
    setIsEditing(false);
    toast({
      title: "Образ обновлен",
      description: "Ваши изменения сохранены",
    });
  };

  const handleCancel = () => {
    setEditedOutfit(outfit);
    setIsEditing(false);
  };

  const handleItemEdit = (index: number, field: keyof OutfitItem, value: string) => {
    const newItems = [...editedOutfit.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedOutfit({ ...editedOutfit, items: newItems });
  };

  const handleItemEditArray = (index: number, field: 'colors', value: string) => {
    const newItems = [...editedOutfit.items];
    const colors = value.split(',').map(c => c.trim());
    newItems[index] = { ...newItems[index], [field]: colors };
    setEditedOutfit({ ...editedOutfit, items: newItems });
  };

  const handleTextEdit = (field: keyof GeneratedOutfit, value: string) => {
    setEditedOutfit({ ...editedOutfit, [field]: value });
  };

  const renderItem = (item: OutfitItem, index: number) => {
    if (isEditing) {
      return (
        <Card key={index} className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{item.category}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newItems = editedOutfit.items.filter((_, i) => i !== index);
                  setEditedOutfit({ ...editedOutfit, items: newItems });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Название:</label>
              <Textarea
                value={item.name}
                onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Описание:</label>
              <Textarea
                value={item.description}
                onChange={(e) => handleItemEdit(index, 'description', e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Цвета (через запятую):</label>
                <Textarea
                  value={item.colors.join(', ')}
                  onChange={(e) => handleItemEditArray(index, 'colors', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Размер:</label>
                <Textarea
                  value={item.size}
                  onChange={(e) => handleItemEdit(index, 'size', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Стиль:</label>
                <Textarea
                  value={item.style}
                  onChange={(e) => handleItemEdit(index, 'style', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Посадка:</label>
                <Textarea
                  value={item.fit}
                  onChange={(e) => handleItemEdit(index, 'fit', e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{item.category}</Badge>
            <Badge variant="outline">{item.size}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
          <p className="text-gray-600 mb-3">{item.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {item.colors.map((color, colorIndex) => (
              <Badge key={colorIndex} variant="outline" className="text-xs">
                {color}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 text-sm text-gray-500">
            <span>Стиль: {item.style}</span>
            <span>•</span>
            <span>Посадка: {item.fit}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и описание образа */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">
                {isEditing ? (
                  <Textarea
                    value={editedOutfit.name}
                    onChange={(e) => handleTextEdit('name', e.target.value)}
                    className="text-2xl font-bold border-none p-0 resize-none"
                    rows={1}
                  />
                ) : (
                  outfit.name
                )}
              </CardTitle>
              {isEditing ? (
                <Textarea
                  value={editedOutfit.description}
                  onChange={(e) => handleTextEdit('description', e.target.value)}
                  className="text-gray-600 border-none p-0 resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-gray-600">{outfit.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Отмена
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Рекомендации по стилю */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Рекомендации по стилю</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedOutfit.styleNotes}
              onChange={(e) => handleTextEdit('styleNotes', e.target.value)}
              className="min-h-[100px]"
              placeholder="Введите рекомендации по стилю..."
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">{outfit.styleNotes}</p>
          )}
        </CardContent>
      </Card>

      {/* Предметы одежды */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Предметы образа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editedOutfit.items.map((item, index) => renderItem(item, index))}
          </div>
          
          {isEditing && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                const newItem: OutfitItem = {
                  category: "Новый предмет",
                  name: "Название",
                  description: "Описание",
                  colors: ["черный"],
                  style: "casual",
                  fit: "стандартный",
                  size: "M"
                };
                setEditedOutfit({
                  ...editedOutfit,
                  items: [...editedOutfit.items, newItem]
                });
              }}
            >
              + Добавить предмет
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Цветовая палитра */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Цветовая палитра</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedOutfit.colorPalette.join(', ')}
              onChange={(e) => handleTextEdit('colorPalette', e.target.value)}
              placeholder="Введите цвета через запятую..."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {outfit.colorPalette.map((color, index) => (
                <Badge key={index} variant="outline">
                  {color}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Почему образ подходит */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Почему образ подходит</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedOutfit.whyItWorks}
              onChange={(e) => handleTextEdit('whyItWorks', e.target.value)}
              className="min-h-[100px]"
              placeholder="Объясните, почему образ подходит..."
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">{outfit.whyItWorks}</p>
          )}
        </CardContent>
      </Card>

      {/* Кнопки действий */}
      <div className="flex gap-4 justify-center">
        <Button onClick={onRegenerate} variant="outline" size="lg">
          <RefreshCw className="h-5 w-5 mr-2" />
          Сгенерировать новый образ
        </Button>
        <Button onClick={onApprove} size="lg">
          <Search className="h-5 w-5 mr-2" />
          Одобрить образ
        </Button>
      </div>
    </div>
  );
};
