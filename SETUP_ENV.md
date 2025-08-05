# Настройка переменных окружения

## Создание файла .env

1. Скопируйте файл `env.example` в `.env`:
```bash
cp env.example .env
```

2. Откройте файл `.env` и замените placeholder значения на реальные API ключи.

## Получение API ключей

### Google Gemini (рекомендуется)
1. Перейдите на [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Войдите в аккаунт Google
3. Нажмите "Create API Key"
4. Скопируйте ключ и вставьте в `.env`:
```
VITE_GEMINI_API_KEY=AIzaSyC...ваш_ключ_здесь
```

### OpenAI GPT-4
1. Перейдите на [OpenAI Platform](https://platform.openai.com/api-keys)
2. Войдите в аккаунт
3. Нажмите "Create new secret key"
4. Скопируйте ключ и вставьте в `.env`:
```
VITE_OPENAI_API_KEY=sk-...ваш_ключ_здесь
```

### Anthropic Claude
1. Перейдите на [Anthropic Console](https://console.anthropic.com/)
2. Войдите в аккаунт
3. Создайте новый API ключ
4. Скопируйте ключ и вставьте в `.env`:
```
VITE_CLAUDE_API_KEY=sk-ant-...ваш_ключ_здесь
```

### Cohere
1. Перейдите на [Cohere Dashboard](https://dashboard.cohere.ai/api-keys)
2. Войдите в аккаунт
3. Создайте новый API ключ
4. Скопируйте ключ и вставьте в `.env`:
```
VITE_COHERE_API_KEY=...ваш_ключ_здесь
```

## Пример файла .env

```env
# AI API Keys
VITE_GEMINI_API_KEY=AIzaSyC...ваш_реальный_ключ_gemini
VITE_OPENAI_API_KEY=sk-...ваш_реальный_ключ_openai
VITE_CLAUDE_API_KEY=sk-ant-...ваш_реальный_ключ_claude
VITE_COHERE_API_KEY=...ваш_реальный_ключ_cohere

# Wildberries API (опционально)
VITE_WILDBERRIES_API_KEY=...ваш_ключ_wildberries

# Настройки приложения
VITE_APP_NAME=Personal Stylist Simple
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:8081

# Настройки маркетплейсов
VITE_ENABLE_OZON=false
VITE_ENABLE_LAMODA=false
VITE_ENABLE_WILDBERRIES=true
```

## Проверка настроек

После создания файла `.env`:

1. Перезапустите сервер разработки:
```bash
npm run dev
```

2. Откройте консоль браузера (F12)
3. Найдите сообщения о статусе API ключей:
```
🔧 Environment Configuration:
🔑 API Keys Status:
  Gemini: ✅ Valid
  OpenAI: ❌ Missing/Invalid
  Claude: ❌ Missing/Invalid
  Cohere: ❌ Missing/Invalid
```

## Режимы работы

### Демо-режим (без API ключей)
- Приложение работает с симуляцией AI
- Показываются тестовые товары
- Все функции доступны для демонстрации

### Режим с API ключами
- Реальные AI рекомендации
- Подключение к маркетплейсам
- Полная функциональность

## Устранение проблем

### Ошибка 400 Bad Request (Gemini)
- Проверьте правильность API ключа
- Убедитесь, что ключ активен в Google AI Studio
- Попробуйте включить VPN (если API недоступен в вашем регионе)

### Ключ не загружается
- Убедитесь, что файл называется именно `.env` (не `.env.txt`)
- Проверьте, что файл находится в корне проекта
- Перезапустите сервер разработки

### CORS ошибки
- Используйте VPN для доступа к API
- Проверьте настройки прокси в `vite.config.ts` 