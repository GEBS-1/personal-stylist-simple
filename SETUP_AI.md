# Настройка ИИ-сервисов для Personal Stylist Pro

## 🚀 Этап 1: Получение API ключей

### 1.1 OpenAI API ключ

1. **Зарегистрируйтесь на OpenAI:**
   - Перейдите на [platform.openai.com](https://platform.openai.com)
   - Создайте аккаунт или войдите в существующий

2. **Получите API ключ:**
   - Войдите в [API Keys](https://platform.openai.com/api-keys)
   - Нажмите "Create new secret key"
   - Скопируйте ключ (начинается с `sk-`)

3. **Настройте переменные окружения:**
   ```bash
   # Создайте файл .env в корне проекта
   cp env.example .env
   ```
   
   Отредактируйте `.env`:
   ```
   REACT_APP_OPENAI_API_KEY=sk-your_actual_api_key_here
   ```

### 1.2 MediaPipe (опционально)

MediaPipe уже интегрирован в браузер, но можно настроить дополнительные модели:

```
REACT_APP_MEDIAPIPE_MODEL_PATH=https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task
```

## 🔧 Этап 2: Установка зависимостей

### 2.1 Установка пакетов

```bash
# Установите зависимости для ИИ-функций
npm install @mediapipe/tasks-vision @tensorflow/tfjs openai
```

### 2.2 Проверка установки

```bash
# Проверьте, что все установилось
npm list @mediapipe/tasks-vision @tensorflow/tfjs openai
```

## 🎯 Этап 3: Активация реальных ИИ-функций

### 3.1 Замена симуляции на реальный OpenAI API

В файле `src/services/openaiService.ts` замените симуляцию на реальный API:

```typescript
// Замените метод simulateGPTResponse на реальный API вызов
async generateOutfit(request: OutfitRequest): Promise<GeneratedOutfit> {
  if (!this.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Ты эксперт по стилю и модный консультант. Создавай детальные образы одежды.'
        },
        {
          role: 'user',
          content: this.createOutfitPrompt(request)
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
  });

  const data = await response.json();
  return this.parseGPTResponse(data, request);
}
```

### 3.2 Активация MediaPipe для анализа фото

В файле `src/components/fashion/PhotoAnalyzer.tsx` замените симуляцию:

```typescript
// Импорты для MediaPipe
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Замените simulatePoseAnalysis на реальный анализ
const analyzePhotoWithMediaPipe = async (imageFile: File): Promise<PoseLandmarks> => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "IMAGE"
  });

  // Анализ изображения
  const image = await createImageBitmap(imageFile);
  const results = poseLandmarker.detect(image);
  
  return this.convertLandmarksToMeasurements(results.landmarks[0]);
};
```

## 🧪 Этап 4: Тестирование

### 4.1 Тест OpenAI API

```bash
# Запустите приложение
npm run dev
```

1. Перейдите к разделу "Подбор образов"
2. Выберите повод и нажмите "Сгенерировать образы"
3. Проверьте, что образы создаются с помощью реального GPT-4

### 4.2 Тест MediaPipe

1. Перейдите к разделу "Анализ фигуры"
2. Загрузите фото в полный рост
3. Проверьте, что анализ выполняется с помощью MediaPipe

## 🔒 Безопасность

### Важные моменты:

1. **Никогда не коммитьте `.env` файл** в Git
2. **Добавьте `.env` в `.gitignore`**
3. **Используйте переменные окружения** для всех API ключей
4. **Ограничьте доступ** к API ключам

### Проверка .gitignore:

Убедитесь, что в `.gitignore` есть:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🚨 Устранение неполадок

### Проблема: "OpenAI API key not configured"
**Решение:** Проверьте, что файл `.env` создан и содержит правильный API ключ

### Проблема: "MediaPipe model not found"
**Решение:** Проверьте интернет-соединение и доступность CDN

### Проблема: "CORS error"
**Решение:** Для продакшена настройте прокси или используйте бэкенд

## 📊 Мониторинг использования

### OpenAI API:
- Следите за использованием в [OpenAI Dashboard](https://platform.openai.com/usage)
- Установите лимиты на расходы
- Мониторьте количество запросов

### MediaPipe:
- Бесплатный для использования в браузере
- Нет ограничений на количество запросов

## 🎉 Готово!

После выполнения всех шагов у вас будет полностью функциональный ИИ-стилист с:
- ✅ Реальным анализом фото через MediaPipe
- ✅ Генерацией образов через GPT-4
- ✅ Персональными рекомендациями
- ✅ Безопасной работой с API ключами 