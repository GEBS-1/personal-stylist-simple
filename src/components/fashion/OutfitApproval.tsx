import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Edit3, 
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  MessageSquare
} from 'lucide-react';

interface OutfitItem {
  category: string;
  name: string;
  description: string;
  colors: string[];
  style: string;
  fit: string;
  price: string;
}

interface GeneratedOutfit {
  id: string;
  name: string;
  description: string;
  occasion: string;
  season: string;
  items: OutfitItem[];
  totalPrice: string;
  styleNotes: string;
  colorPalette: string[];
  confidence: number;
}

interface OutfitApprovalProps {
  outfit: GeneratedOutfit;
  onApprove: (outfit: GeneratedOutfit) => void;
  onRegenerate: () => void;
  onEdit: (outfit: GeneratedOutfit) => void;
  onReject: () => void;
}

export const OutfitApproval: React.FC<OutfitApprovalProps> = ({
  outfit,
  onApprove,
  onRegenerate,
  onEdit,
  onReject
}) => {
  const [feedback, setFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutfit, setEditedOutfit] = useState<GeneratedOutfit>(outfit);

  const handleApprove = () => {
    onApprove(editedOutfit);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onEdit(editedOutfit);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedOutfit(outfit);
  };

  const handleItemEdit = (index: number, field: keyof OutfitItem, value: string) => {
    const updatedItems = [...editedOutfit.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditedOutfit({ ...editedOutfit, items: updatedItems });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Отличное';
    if (confidence >= 0.7) return 'Хорошее';
    return 'Требует доработки';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Одобрение AI-образа
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getConfidenceColor(outfit.confidence)}>
            {getConfidenceText(outfit.confidence)} ({Math.round(outfit.confidence * 100)}%)
          </Badge>
          <Badge variant="secondary">{outfit.occasion}</Badge>
          <Badge variant="secondary">{outfit.season}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Основная информация об образе */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Название образа</Label>
            {isEditing ? (
              <Textarea
                value={editedOutfit.name}
                onChange={(e) => setEditedOutfit({ ...editedOutfit, name: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-lg font-semibold mt-1">{outfit.name}</p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium">Описание</Label>
            {isEditing ? (
              <Textarea
                value={editedOutfit.description}
                onChange={(e) => setEditedOutfit({ ...editedOutfit, description: e.target.value })}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-gray-600 mt-1">{outfit.description}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Предметы одежды */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Предметы одежды</Label>
          <div className="grid gap-4">
            {editedOutfit.items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                                     <div className="flex items-center gap-2">
                     <Badge variant="outline">{item.category}</Badge>
                   </div>
                  
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Название</Label>
                        <Textarea
                          value={item.name}
                          onChange={(e) => handleItemEdit(index, 'name', e.target.value)}
                          className="text-sm"
                          rows={1}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Описание</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => handleItemEdit(index, 'description', e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Цвета</Label>
                          <Textarea
                            value={item.colors.join(', ')}
                            onChange={(e) => handleItemEdit(index, 'colors', e.target.value.split(', '))}
                            className="text-sm"
                            rows={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Стиль</Label>
                          <Textarea
                            value={item.style}
                            onChange={(e) => handleItemEdit(index, 'style', e.target.value)}
                            className="text-sm"
                            rows={1}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Цвета:</span>
                        <div className="flex gap-1">
                          {item.colors.map((color, colorIndex) => (
                            <Badge key={colorIndex} variant="secondary" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Стиль:</span>
                        <Badge variant="outline" className="text-xs">{item.style}</Badge>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Separator />

        {/* Дополнительная информация */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Цветовая палитра</Label>
            <div className="flex gap-2 mt-2">
              {editedOutfit.colorPalette.map((color, index) => (
                <Badge key={index} variant="secondary">
                  {color}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Рекомендации по стилю</Label>
            {isEditing ? (
              <Textarea
                value={editedOutfit.styleNotes}
                onChange={(e) => setEditedOutfit({ ...editedOutfit, styleNotes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-gray-600 mt-1">{outfit.styleNotes}</p>
            )}
          </div>
          

        </div>

        <Separator />

        {/* Обратная связь */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Обратная связь (опционально)</Label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Расскажите, что вам нравится или не нравится в этом образе..."
            rows={3}
          />
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSaveEdit} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Сохранить изменения
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Отменить
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleApprove} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <ThumbsUp className="w-4 h-4" />
                Одобрить образ
              </Button>
              <Button variant="outline" onClick={handleEdit} className="flex items-center gap-2">
                <Edit3 className="w-4 h-4" />
                Редактировать
              </Button>
              <Button variant="outline" onClick={onRegenerate} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Перегенерировать
              </Button>
              <Button variant="outline" onClick={onReject} className="flex items-center gap-2 text-red-600 hover:text-red-700">
                <ThumbsDown className="w-4 h-4" />
                Отклонить
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};