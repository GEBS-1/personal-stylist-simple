# Быстрая настройка переменных окружения

## Шаг 1: Создайте файл .env

Создайте файл `.env` в корне проекта со следующим содержимым:

```env
# AI API Keys
# Получите ключи на соответствующих сайтах

# OpenAI GPT-4 (https://platform.openai.com/api-keys)
VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Google Gemini (https://makersuite.google.com/app/apikey)
VITE_GEMINI_API_KEY=AIzaSyA1tDl1e3ZQiWve5ceNBWEc56Aj7x1H8h8

# Anthropic Claude (https://console.anthropic.com/)
VITE_CLAUDE_API_KEY=sk-ant-your-claude-key-here

# Cohere (https://dashboard.cohere.ai/api-keys)
VITE_COHERE_API_KEY=your-cohere-key-here

# Wildberries API (опционально)
VITE_WILDBERRIES_API_KEY=your-wildberries-key-here

# Настройки приложения
VITE_APP_NAME=Personal Stylist Simple
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:8081

# Настройки маркетплейсов
VITE_ENABLE_OZON=false
VITE_ENABLE_LAMODA=false
VITE_ENABLE_WILDBERRIES=true
```

## Шаг 2: Получите API ключи

### Для Gemini (рекомендуется для начала):
1. Перейдите на https://makersuite.google.com/app/apikey
2. Создайте новый API ключ
3. Замените `AIzaSyA1tDl1e3ZQiWve5ceNBWEc56Aj7x1H8h8` на ваш ключ

### Для OpenAI:
1. Перейдите на https://platform.openai.com/api-keys
2. Создайте новый API ключ
3. Замените `sk-your-openai-key-here` на ваш ключ

### Для других провайдеров:
- Claude: https://console.anthropic.com/
- Cohere: https://dashboard.cohere.ai/api-keys

## Шаг 3: Перезапустите приложение

После создания файла `.env` перезапустите приложение:

```bash
npm run dev
```

## Текущий статус

Из консоли видно, что:
- ✅ Gemini API работает (ключ настроен)
- ❌ OpenAI API не настроен
- ❌ Claude API не настроен  
- ❌ Cohere API не настроен
- ❌ Wildberries API не настроен (но есть fallback)

## Рекомендации

1. **Для начала**: Используйте только Gemini API - он уже настроен и работает
2. **Для продакшена**: Настройте дополнительные API ключи для резервирования
3. **Wildberries**: Можно оставить как есть - приложение будет использовать fallback данные

## Проверка

После настройки в консоли должны появиться:
```
🔑 API Keys Status:
  Gemini: ✅ Valid
  OpenAI: ✅ Valid (если настроен)
  Claude: ✅ Valid (если настроен)
  Cohere: ✅ Valid (если настроен)
  Wildberries: ✅ Valid (если настроен)
``` 