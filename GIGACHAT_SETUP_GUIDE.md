# 🤖 Руководство по настройке GigaChat

## 📋 Обзор

GigaChat - это российская языковая модель от Сбера, которая отлично подходит для генерации рекомендаций по стилю одежды. Она доступна в России и не имеет географических ограничений.

## 🔑 Получение API ключей

### 1. Регистрация в GigaChat
1. Перейдите на [GigaChat Developer Portal](https://developers.sber.ru/portal/products/gigachat)
2. Зарегистрируйтесь или войдите в аккаунт
3. Создайте новое приложение
4. Получите `Client ID` и `Client Secret`

### 2. Настройка переменных окружения
Добавьте в файл `.env`:

```bash
# GigaChat API (Сбер)
VITE_GIGACHAT_CLIENT_ID=your_client_id_here
VITE_GIGACHAT_CLIENT_SECRET=your_client_secret_here
```

## 🧪 Тестирование подключения

### Запуск тестов
```bash
node test-gigachat.cjs
```

### Ожидаемый результат:
```
🧪 Starting GigaChat API tests...

🔐 Getting GigaChat access token...
✅ GigaChat access token obtained successfully

🔍 Testing GigaChat connection...
✅ GigaChat connection test: SUCCESS
📊 Available models: 2
   - GigaChat:latest: model
   - GigaChat:latest: model

🤖 Testing GigaChat text generation...
✅ GigaChat text generation test: SUCCESS
📝 Response length: 450 characters
🔢 Total tokens: 156

📄 Response preview:
{
  "name": "Весенний повседневный образ",
  "description": "Легкий и комфортный образ для весенних дней",
  "items": [
    {
      "category": "Верх",
      "name": "Блузка хлопковая",
      "price": "2000-4000"
    }
  ],
  "totalPrice": "8000-15000"
}...

📊 Test Results Summary:
==================================================
🔗 Connection: ✅ SUCCESS
🤖 Generation: ✅ SUCCESS
📊 Available models: 2
🔢 Tokens used: 156

🎉 All tests passed! GigaChat is ready to use.
```

## 🔧 Интеграция в систему

### Автоматическое переключение
Система автоматически тестирует доступность GigaChat и переключается на него, если он доступен:

```typescript
// Приоритет провайдеров
const providers = [
  'gigachat',    // 🥇 Первый приоритет
  'openai',      // 🥈 Второй приоритет  
  'gemini',      // 🥉 Третий приоритет
  'simulation'   // 🎭 Fallback
];
```

### Использование в коде
```typescript
import { aiService } from '@/services/aiService';

// Генерация образа с GigaChat
const outfit = await aiService.generateOutfit(request);
console.log('Provider used:', aiService.getCurrentProvider()); // 'gigachat'
```

## 📊 Преимущества GigaChat

### ✅ **Доступность**
- Доступен в России без ограничений
- Нет географических блокировок
- Стабильная работа

### ✅ **Качество**
- Хорошее понимание русского языка
- Качественные рекомендации по стилю
- Поддержка JSON формата

### ✅ **Лимиты**
- Щедрые лимиты для бесплатного использования
- Нет жестких ограничений по запросам
- Стабильная работа без сбоев

### ✅ **Интеграция**
- Простая настройка
- Автоматическое переключение
- Fallback на симуляцию при проблемах

## 🔄 Процесс работы

### 1. **Инициализация**
```typescript
// Создание сервиса GigaChat
const gigaChatService = createGigaChatService();
```

### 2. **Аутентификация**
```typescript
// Получение токена доступа
const token = await gigaChatService.getAccessToken();
```

### 3. **Генерация контента**
```typescript
// Отправка запроса
const response = await gigaChatService.generateText(prompt, {
  model: 'GigaChat:latest',
  temperature: 0.7,
  maxTokens: 1500
});
```

### 4. **Обработка ответа**
```typescript
// Парсинг и адаптация
const outfit = this.parseResponse(response, request);
```

## 🛠️ Конфигурация

### Настройки по умолчанию
```typescript
const config = {
  scope: 'GIGACHAT_API_PERS',
  authUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
  apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1',
  model: 'GigaChat:latest',
  temperature: 0.7,
  maxTokens: 1500
};
```

### Доступные модели
- `GigaChat:latest` - последняя версия модели
- `GigaChat:latest` - основная модель (рекомендуется)

## 📈 Метрики и мониторинг

### Логирование
```typescript
console.log('🤖 Generating outfit with GigaChat...');
console.log('✅ GigaChat response received:', response.substring(0, 100) + '...');
console.log(`🔢 Total tokens: ${data.usage.totalTokens}`);
```

### Метрики производительности
- Время ответа
- Количество токенов
- Успешность запросов
- Автоматическое переключение

## 🔧 Устранение неполадок

### Проблема: "Credentials not found"
```bash
❌ GigaChat credentials not found in .env file
```
**Решение**: Добавьте переменные окружения в `.env`

### Проблема: "Auth failed"
```bash
❌ GigaChat auth failed: 401 - Invalid credentials
```
**Решение**: Проверьте правильность Client ID и Client Secret

### Проблема: "Connection failed"
```bash
❌ GigaChat connection test failed: Network error
```
**Решение**: Проверьте интернет-соединение и доступность API

### Проблема: "Empty response"
```bash
❌ Empty response from GigaChat
```
**Решение**: Попробуйте другой промпт или уменьшите maxTokens

## 🎯 Рекомендации по использованию

### Для разработчиков:
1. **Тестируйте подключение** перед использованием
2. **Мониторьте токены** для оптимизации
3. **Используйте fallback** на симуляцию
4. **Логируйте ошибки** для отладки

### Для пользователей:
1. **GigaChat работает стабильно** в России
2. **Качество рекомендаций** высокое
3. **Нет ограничений** по географии
4. **Быстрые ответы** без задержек

## 🔮 Планы развития

### Краткосрочные:
- [ ] Оптимизация промптов для GigaChat
- [ ] Улучшение обработки ошибок
- [ ] Кэширование токенов

### Долгосрочные:
- [ ] Поддержка стриминга
- [ ] Интеграция с другими российскими моделями
- [ ] Машинное обучение на основе GigaChat

## 💡 Заключение

GigaChat - отличная альтернатива зарубежным AI моделям для российского рынка:

✅ **Доступен в России** без ограничений  
✅ **Высокое качество** рекомендаций  
✅ **Простая интеграция** в систему  
✅ **Стабильная работа** без сбоев  

Система автоматически использует GigaChat как приоритетный провайдер и обеспечивает отличное качество рекомендаций! 🤖✨
