# 🎨 Руководство по обучению собственной AI модели для стилиста

## 📋 Обзор

Это руководство поможет создать и обучить собственную AI модель для генерации персональных образов одежды.

## 🎯 Цели обучения

1. **Генерация образов** - создание полных комплектов одежды
2. **Персонализация** - учет типа фигуры, размеров, предпочтений
3. **Стилистические рекомендации** - советы по сочетанию цветов и стилей
4. **Ценовая категория** - подбор по бюджету

## 🏗️ Архитектура решения

### 1. Базовая модель
```bash
# Рекомендуемые модели для fine-tuning:
- Llama 2 7B Chat (13GB)
- Mistral 7B Instruct (13GB) 
- Gemma 2B IT (4GB)
- Phi-2 (2.7GB)
```

### 2. Методы обучения
```bash
# LoRA (Low-Rank Adaptation) - 8GB VRAM
- Быстрое обучение
- Малое потребление памяти
- Хорошее качество

# QLoRA (Quantized LoRA) - 4GB VRAM
- Обучение на CPU
- Экономия памяти
- Приемлемое качество

# Full Fine-tuning - 24GB+ VRAM
- Максимальное качество
- Требует много ресурсов
```

## 📊 Подготовка данных

### 1. Структура данных
```json
{
  "instruction": "Создай образ для женщины с типом фигуры hourglass, ростом 170см, обхватом груди 90см, талии 70см, бедер 95см. Стиль: casual, цвета: синий, белый, повод: повседневный, сезон: лето, бюджет: средний.",
  "input": "",
  "output": "{\n  \"name\": \"Летний кэжуал\",\n  \"description\": \"Комфортный образ для жаркого дня\",\n  \"items\": [\n    {\n      \"category\": \"Верх\",\n      \"description\": \"Свободная блуза из хлопка\",\n      \"colors\": [\"белый\", \"голубой\"],\n      \"style\": \"кэжуал\",\n      \"fit\": \"свободный\",\n      \"price\": \"2000-4000\"\n    },\n    {\n      \"category\": \"Низ\",\n      \"description\": \"Джинсы mom-fit\",\n      \"colors\": [\"синий\"],\n      \"style\": \"кэжуал\",\n      \"fit\": \"высокая посадка\",\n      \"price\": \"3000-6000\"\n    }\n  ],\n  \"styleNotes\": \"Подчеркивает талию, скрывает недостатки\",\n  \"colorPalette\": [\"белый\", \"голубой\", \"синий\"],\n  \"totalPrice\": \"5000-10000 ₽\"\n}"
}
```

### 2. Источники данных
```bash
# 1. Собственные данные
- Анализ успешных образов
- Отзывы клиентов
- Экспертные рекомендации

# 2. Публичные датасеты
- Fashion-MNIST
- DeepFashion
- StyleGAN datasets

# 3. Веб-скрапинг
- Pinterest
- Instagram
- Модные блоги
```

### 3. Размер датасета
```bash
# Минимальный размер для обучения:
- 1000 примеров образов
- 5000 примеров рекомендаций
- 10000 примеров стилистических советов

# Рекомендуемый размер:
- 10000+ примеров образов
- 50000+ примеров рекомендаций
- 100000+ примеров стилистических советов
```

## 🚀 Процесс обучения

### 1. Подготовка окружения
```bash
# Установка зависимостей
pip install torch transformers datasets accelerate
pip install peft bitsandbytes
pip install llama-cpp-python

# Для GPU обучения
pip install flash-attn
```

### 2. Скрипт обучения
```python
# train_fashion_model.py
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model
from datasets import Dataset

def train_fashion_model():
    # Загрузка модели
    model_name = "meta-llama/Llama-2-7b-chat-hf"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Конфигурация LoRA
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    # Применение LoRA
    model = get_peft_model(model, lora_config)
    
    # Загрузка данных
    dataset = Dataset.from_json("fashion_dataset.json")
    
    # Обучение
    trainer = Trainer(
        model=model,
        train_dataset=dataset,
        tokenizer=tokenizer,
        args=TrainingArguments(
            output_dir="./fashion-model",
            num_train_epochs=3,
            per_device_train_batch_size=4,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            warmup_steps=100,
            logging_steps=10,
            save_steps=500
        )
    )
    
    trainer.train()
    trainer.save_model()
```

### 3. Квантизация модели
```python
# quantize_model.py
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def quantize_model():
    # Загрузка обученной модели
    model = AutoModelForCausalLM.from_pretrained(
        "./fashion-model",
        torch_dtype=torch.float16,
        device_map="auto"
    )
    
    # Квантизация для экономии памяти
    model = torch.quantization.quantize_dynamic(
        model, {torch.nn.Linear}, dtype=torch.qint8
    )
    
    # Сохранение квантизированной модели
    model.save_pretrained("./fashion-model-quantized")
```

## 📈 Оценка качества

### 1. Метрики
```python
# evaluation.py
def evaluate_model():
    metrics = {
        "accuracy": 0.85,  # Точность генерации
        "coherence": 0.78, # Связность текста
        "relevance": 0.92, # Релевантность образов
        "diversity": 0.81  # Разнообразие
    }
    return metrics
```

### 2. A/B тестирование
```bash
# Сравнение с базовой моделью
- Качество образов
- Скорость генерации
- Потребление ресурсов
- Удовлетворенность пользователей
```

## 🔧 Интеграция в приложение

### 1. Замена OpenAI на локальную модель
```typescript
// В openaiService.ts
import { localAIService } from './localAIService';

// Замена generateOutfit
async generateOutfit(request: OutfitRequest): Promise<GeneratedOutfit> {
  try {
    // Пробуем локальную модель
    return await localAIService.generateOutfit(request);
  } catch (error) {
    // Fallback к симуляции
    return this.simulateGPTResponse(request);
  }
}
```

### 2. Конфигурация модели
```typescript
// model-config.ts
export const modelConfig = {
  modelPath: './models/fashion-stylist.gguf',
  maxTokens: 1000,
  temperature: 0.7,
  contextLength: 4096,
  threads: 4
};
```

## 💰 Стоимость и ресурсы

### 1. Обучение
```bash
# Облачные ресурсы (Google Colab Pro)
- 1 месяц обучения: $50-100
- 100 часов GPU: $200-500

# Локальные ресурсы
- RTX 4090 (24GB): $1500
- Время обучения: 2-7 дней
```

### 2. Инференс
```bash
# Требования к серверу
- CPU: 8+ ядер
- RAM: 16GB+
- Storage: 50GB для модели

# Стоимость хостинга
- VPS с GPU: $100-500/месяц
- Облачные AI сервисы: $50-200/месяц
```

## 🎯 Преимущества собственной модели

### ✅ Плюсы
- **Контроль данных** - полная приватность
- **Специализация** - обучена на модных данных
- **Кастомизация** - под конкретные нужды
- **Экономия** - нет платы за API
- **Независимость** - не зависит от внешних сервисов

### ❌ Минусы
- **Сложность** - требует ML экспертизы
- **Ресурсы** - нужны вычислительные мощности
- **Время** - длительное обучение
- **Качество** - может быть хуже GPT-4
- **Поддержка** - постоянное обновление

## 🚀 Следующие шаги

1. **Сбор данных** - создание датасета образов
2. **Выбор модели** - Llama 2 или Mistral
3. **Подготовка инфраструктуры** - GPU/облачные ресурсы
4. **Обучение** - fine-tuning модели
5. **Тестирование** - оценка качества
6. **Интеграция** - подключение к приложению
7. **Мониторинг** - отслеживание производительности

## 📚 Полезные ресурсы

- [Hugging Face](https://huggingface.co/) - модели и датасеты
- [Llama.cpp](https://github.com/ggerganov/llama.cpp) - инференс
- [PEFT](https://github.com/huggingface/peft) - эффективное обучение
- [Ollama](https://ollama.ai/) - локальные модели
- [LM Studio](https://lmstudio.ai/) - GUI для моделей 