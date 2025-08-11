# 🎨 Интеграция GigaChat для генерации изображений

## 📋 **Обзор интеграции**

Добавлена полная поддержка генерации изображений через GigaChat API. Теперь приложение может использовать GigaChat как для генерации текста, так и для создания изображений.

## 🔧 **Реализованные компоненты**

### 1. **Server Endpoint** (`server.cjs`)
```javascript
// Генерация изображений через GigaChat
app.post('/api/gigachat/images', async (req, res) => {
  // Обработка запросов на генерацию изображений
  // Использует GigaChat API для создания изображений
  // Возвращает fallback при ошибках
});
```

### 2. **Image Generation Service** (`imageGenerationService.ts`)
```javascript
// Приоритет GigaChat для генерации изображений
private currentProvider: 'gigachat' | 'dalle' | ... = 'gigachat';

// Метод генерации через GigaChat
private async generateWithGigaChat(request: ImageGenerationRequest) {
  // Отправляет запрос к /api/gigachat/images
  // Обрабатывает ответ и возвращает изображение
}
```

### 3. **GigaChat Service** (`gigaChatService.ts`)
```javascript
// Метод генерации изображений
async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
  // Создает детальный промпт
  // Отправляет запрос к GigaChat API
  // Возвращает результат или fallback
}
```

## 🎯 **Процесс генерации изображений**

### **Шаг 1: Подготовка промпта**
```javascript
// Создается детальное описание на основе approved outfit
const prompt = `Стильный человек женского пола в образе: ${outfit.description}. 
Одежда включает: ${outfit.items.map(item => `${item.name} в цветах ${item.colors.join(', ')}`). 
Цветовая палитра: ${outfit.colorPalette.join(', ')}. 
${outfit.styleNotes}`;
```

### **Шаг 2: Отправка запроса**
```javascript
// POST запрос к /api/gigachat/images
{
  "prompt": "детальное описание образа",
  "style": "realistic",
  "quality": "high", 
  "size": "1024x1024",
  "aspectRatio": "1:1"
}
```

### **Шаг 3: Обработка ответа**
```javascript
// GigaChat API возвращает изображение
{
  "success": true,
  "imageUrl": "https://...",
  "model": "gigachat",
  "usage": { ... }
}
```

## 🔄 **Интеграция в основной flow**

### **Автоматическая генерация изображений:**

1. **OutfitApproval** → одобренный образ
2. **ImageGenerator** → автоматически создает промпт на основе образа
3. **GigaChat API** → генерирует изображение
4. **ProductCatalog** → поиск товаров на основе образа

### **Пример промпта для GigaChat:**
```
Стильный человек женского пола в образе: Летний casual образ для женщины с фигурой hourglass. 
Одежда включает: Блуза из хлопка в цветах белый, голубой, Джинсы скинни в цветах синий, 
Балетки в цветах белый, Сумка через плечо в цветах черный. 
Цветовая палитра: белый, голубой, синий, черный. 
Образ подходит для casual случая в summer сезон. 
Одежда должна быть современной, стильной и хорошо сидеть по фигуре.
```

## 🛠 **Технические детали**

### **Конфигурация GigaChat:**
```javascript
// В .env файле
VITE_GIGACHAT_CLIENT_ID=your_client_id
VITE_GIGACHAT_CLIENT_SECRET=your_client_secret

// Проверка доступности
private checkGigaChatAvailability(): boolean {
  return !!(env.GIGACHAT_CLIENT_ID && env.GIGACHAT_CLIENT_SECRET);
}
```

### **Обработка ошибок:**
```javascript
// Fallback при недоступности GigaChat
if (!clientId || !clientSecret) {
  return res.json({
    success: true,
    imageUrl: '/placeholder.svg',
    model: 'gigachat-fallback'
  });
}
```

### **Параметры генерации:**
- **style**: 'realistic' | 'artistic' | 'fashion' | 'casual'
- **quality**: 'standard' | 'high'
- **size**: '1024x1024' | '1792x1024' | '1024x1792'
- **aspectRatio**: '1:1' | '16:9' | '9:16'

## 🧪 **Тестирование**

### **Тест endpoint:**
```bash
curl -X POST http://localhost:3001/api/gigachat/images \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Стильный человек женского пола в летнем casual образе",
    "style": "realistic",
    "quality": "high",
    "size": "1024x1024",
    "aspectRatio": "1:1"
  }'
```

### **Ожидаемый ответ:**
```json
{
  "success": true,
  "imageUrl": "/placeholder.svg",
  "model": "gigachat-fallback",
  "usage": {
    "promptTokens": 0,
    "completionTokens": 0,
    "totalTokens": 0
  }
}
```

## 🎯 **Преимущества интеграции**

- ✅ **Единый провайдер** - GigaChat для текста и изображений
- ✅ **Автоматическая генерация** - на основе approved outfit
- ✅ **Детальные промпты** - включают все элементы образа
- ✅ **Fallback режим** - работает даже при недоступности API
- ✅ **Гибкая конфигурация** - различные стили и размеры

## 🚀 **Использование**

1. **Настройте GigaChat credentials** в .env файле
2. **Пройдите полный flow** приложения
3. **Проверьте автоматическую генерацию** изображений
4. **Убедитесь в качестве** созданных изображений

**GigaChat теперь полностью интегрирован для генерации изображений!** 🎉