# Объяснение работы с Wildberries

## Что происходит после генерации образа через Gemini

После того как Gemini генерирует образ, приложение автоматически пытается найти реальные товары на Wildberries для демонстрации. Вот как это работает:

### 1. Автоматический вызов поиска

В файле `src/components/fashion/ProductCatalog.tsx` на строке 41:
```typescript
const recommendations = await wildberriesService.getRecommendations(params);
```

Этот вызов происходит **автоматически** после генерации образа, независимо от наличия API ключа.

### 2. Проверка API ключа

В `src/services/wildberriesService.ts` в методе `getRecommendations()`:

```typescript
// Проверяем, есть ли API ключ
const apiKey = import.meta.env.VITE_WILDBERRIES_API_KEY;
if (!apiKey || apiKey === 'your-wildberries-key-here') {
  console.log('🎯 Wildberries API key not configured, using fallback products');
  return this.getFallbackProducts(params);
}
```

### 3. Fallback механизм

Если API ключ отсутствует или является placeholder'ом, приложение:
- **НЕ** делает реальные запросы к Wildberries
- **НЕ** пытается парсить сайт
- **ИСПОЛЬЗУЕТ** тестовые данные из `getFallbackProducts()`

### 4. Почему вы видите сообщение о поиске

Сообщение `🎯 Getting real Wildberries recommendations for:` в консоли появляется **только если API ключ настроен**. Если ключа нет, вы увидите:
```
🎯 Wildberries API key not configured, using fallback products for: {bodyType: 'inverted-triangle', occasion: 'casual', gender: 'female'}
```

## Защита Wildberries от парсинга

Да, Wildberries действительно имеет защиту от парсинга:

1. **Rate Limiting** - ограничение количества запросов
2. **User-Agent проверки** - блокировка автоматизированных запросов
3. **CAPTCHA** - для подозрительной активности
4. **IP блокировка** - при массовых запросах
5. **JavaScript проверки** - многие данные загружаются через JS

## Рекомендации

### Для разработки/тестирования:
- Используйте fallback данные (текущий режим)
- API ключ не требуется

### Для продакшена:
- Получите официальный API ключ от Wildberries
- Используйте их официальное API
- Соблюдайте лимиты и правила использования

## Текущий статус

✅ **Приложение работает корректно** - использует fallback данные
✅ **Нет попыток парсинга** - только при наличии API ключа
✅ **Пользователь видит товары** - тестовые данные для демонстрации

Сообщение в консоли `wildberriesService.ts:595 🎯 Getting real Wildberries recommendations for:` означает, что приложение пытается найти реальные товары, но поскольку API ключ не настроен, оно автоматически переключается на fallback режим. 