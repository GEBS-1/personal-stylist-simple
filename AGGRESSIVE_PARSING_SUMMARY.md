# Агрессивный парсинг Wildberries - Реализованные методы

## 🎯 Что мы реализовали

### 1. Многоуровневая система парсинга

Приложение теперь использует **5 уровней** попыток получения данных:

1. **Основной API с обходом блокировки** - множественные endpoints + ротация User-Agent
2. **Альтернативные API** - каталоги + мобильный API
3. **Веб-скрапинг** - парсинг HTML страниц
4. **Поиск по ключевым словам** - локальная база товаров
5. **Fallback данные** - тестовые товары

### 2. Методы обхода блокировки

#### Ротация User-Agent
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit...',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit...'
];
```

#### Множественные endpoints
- `https://search.wb.ru/exactmatch/ru/common/v4/search`
- `https://search.wb.ru/exactmatch/ru/common/v5/search`
- `https://search.wb.ru/exactmatch/ru/common/v3/search`

#### Расширенные заголовки
- `Sec-Ch-Ua`, `Sec-Fetch-*` заголовки
- `X-Requested-With: XMLHttpRequest`
- `DNT: 1`, `Cache-Control: no-cache`

#### Случайные параметры
- `timestamp: Date.now()`
- `rand: Math.random()`

### 3. Веб-скрапинг

#### Парсинг HTML страниц
- Поиск `window.__INITIAL_STATE__`
- Извлечение JSON данных из HTML
- Парсинг карточек товаров

#### Мобильный API
- `https://mobile.wb.ru/api/v1/search`
- Мобильный User-Agent

### 4. Каталоги Wildberries

#### Разные категории
- `https://catalog.wb.ru/catalog/men/catalog`
- `https://catalog.wb.ru/catalog/women/catalog`
- `https://catalog.wb.ru/catalog/children/catalog`
- `https://catalog.wb.ru/catalog/sport/catalog`

## 🔧 Как это работает

### Последовательность попыток:

1. **API v4** → если не работает
2. **API v5** → если не работает  
3. **API v3** → если не работает
4. **Каталог мужской** → если не работает
5. **Каталог женский** → если не работает
6. **Каталог детский** → если не работает
7. **Каталог спорт** → если не работает
8. **Мобильный API** → если не работает
9. **Веб-скрапинг** → если не работает
10. **Локальная база** → если не работает
11. **Fallback данные** → всегда работает

### Логирование

Каждый шаг подробно логируется:
```
🔍 Step 1: Trying main API with bypass...
🔍 Trying endpoint: https://search.wb.ru/exactmatch/ru/common/v4/search
📡 Response status: 200 for https://search.wb.ru/exactmatch/ru/common/v4/search
✅ Found 15 real products from https://search.wb.ru/exactmatch/ru/common/v4/search
```

## 🚀 Запуск

### В браузере
Приложение автоматически использует агрессивный парсинг при генерации образа.

### Тестирование
```bash
node test-wildberries-parsing.js
```

## 📊 Ожидаемые результаты

### Успешный парсинг:
- Реальные товары с Wildberries
- Актуальные цены и описания
- Реальные изображения

### При блокировке:
- Автоматический переход к следующему методу
- Подробное логирование ошибок
- Graceful fallback к тестовым данным

## ⚠️ Важные моменты

1. **Rate Limiting** - приложение делает паузы между запросами
2. **Таймауты** - каждый запрос имеет ограничение по времени
3. **Обработка ошибок** - все ошибки обрабатываются gracefully
4. **Кэширование** - результаты кэшируются на 5 минут

## 🎯 Результат

Теперь приложение будет **активно пытаться** получить реальные данные с Wildberries, используя все доступные методы обхода блокировки, вместо простого fallback на тестовые данные. 