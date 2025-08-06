# Анализ проблемы с изображениями Wildberries

## Проблема
Изображения товаров с Wildberries не отображаются в приложении. Причины:

### 1. Блокировка прямых запросов
Wildberries блокирует прямые HTTP запросы к изображениям товаров. Все попытки загрузить изображения напрямую завершаются:
- **Timeout** - запросы зависают
- **ENOTFOUND** - домены не найдены
- **Socket hang up** - соединение прерывается

### 2. Неправильный формат URL
Попытки использовать различные форматы URL изображений не работают:
```
❌ https://images.wbstatic.net/c246x328/new/415946/415946071.jpg
❌ https://basket-415946.wbbasket.ru/vol415946/part41594/415946071/images/c246x328/1.jpg
❌ https://basket-4159.wbbasket.ru/vol4159/part41594/415946071/images/c246x328/1.jpg
```

### 3. CORS ограничения
Браузер блокирует загрузку изображений с Wildberries из-за политики CORS.

## Текущее решение

### 1. Placeholder изображения
Временно используем placeholder изображения (`/placeholder.svg`) для всех товаров:
```javascript
function getProductImageUrl(productId) {
  if (!productId) return '/placeholder.svg';
  console.log(`🖼️ Generated image URL for product ${productId}: /placeholder.svg`);
  return '/placeholder.svg';
}
```

### 2. Улучшенная обработка ошибок
В компоненте `ProductCatalog.tsx` добавлена обработка ошибок загрузки изображений:
```javascript
<img
  src={product.image}
  alt={product.name}
  className="w-full h-full object-cover rounded-lg transition-opacity duration-200"
  onError={(e) => {
    console.warn(`⚠️ Failed to load image for product ${product.id}:`, product.image);
    e.currentTarget.src = '/placeholder.svg';
    e.currentTarget.classList.add('opacity-50');
  }}
  onLoad={(e) => {
    e.currentTarget.classList.remove('opacity-50');
  }}
  loading="lazy"
/>
```

### 3. Прокси для изображений (заготовка)
Создан endpoint для проксирования изображений (пока не используется):
```
GET /api/wildberries/image/:productId
```

## Альтернативные решения

### 1. Использование Unsplash API
Можно интегрировать Unsplash API для получения тематических изображений:
```javascript
const unsplashImage = `https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=400&fit=crop&crop=center`;
```

### 2. Локальные изображения по категориям
Создать набор локальных изображений для каждой категории товаров.

### 3. Интеграция с другими маркетплейсами
Использовать изображения с других маркетплейсов, которые не блокируют прямые запросы.

## Статус
- ✅ Товары успешно загружаются
- ✅ Ссылки на товары работают
- ❌ Изображения не отображаются (используются placeholder)
- 🔄 Поиск правильного формата URL изображений продолжается

## Следующие шаги
1. Исследовать правильный формат URL изображений Wildberries
2. Протестировать прокси для изображений с правильными заголовками
3. Рассмотреть интеграцию с Unsplash API
4. Создать локальную библиотеку изображений по категориям 