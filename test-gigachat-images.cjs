#!/usr/bin/env node

/**
 * Тест генерации изображений через GigaChat
 * Запуск: node test-gigachat-images.cjs
 */

const { createGigaChatService } = require('./src/services/gigaChatService.ts');

async function testImageGeneration() {
  console.log('🎨 Тестирование генерации изображений через GigaChat...\n');

  try {
    // Проверяем переменные окружения
    const clientId = process.env.VITE_GIGACHAT_CLIENT_ID;
    const clientSecret = process.env.VITE_GIGACHAT_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.log('❌ GigaChat API ключи не найдены в переменных окружения');
      console.log('Добавьте в файл .env:');
      console.log('VITE_GIGACHAT_CLIENT_ID=ваш_ключ');
      console.log('VITE_GIGACHAT_CLIENT_SECRET=ваш_секрет');
      return;
    }

    console.log('✅ GigaChat API ключи найдены');
    console.log(`Client ID: ${clientId.substring(0, 8)}...`);
    console.log(`Client Secret: ${clientSecret.substring(0, 8)}...\n`);

    // Создаем сервис
    const gigaChatService = createGigaChatService();
    
    if (!gigaChatService) {
      console.log('❌ Не удалось создать GigaChat сервис');
      return;
    }

    console.log('✅ GigaChat сервис создан');

    // Проверяем подключение
    console.log('\n🔍 Проверка подключения...');
    const isConnected = await gigaChatService.testConnection();
    
    if (!isConnected) {
      console.log('❌ Не удалось подключиться к GigaChat');
      return;
    }

    console.log('✅ Подключение к GigaChat успешно');

    // Проверяем поддержку генерации изображений
    console.log('\n🎨 Проверка поддержки генерации изображений...');
    const supportsImages = await gigaChatService.supportsImageGeneration();
    
    if (!supportsImages) {
      console.log('❌ GigaChat не поддерживает генерацию изображений');
      return;
    }

    console.log('✅ Генерация изображений поддерживается');

    // Тестируем генерацию изображения
    console.log('\n🚀 Тестирование генерации изображения...');
    
    const imageRequest = {
      prompt: 'Стильная женщина в элегантном платье, современный городской стиль',
      style: 'realistic',
      quality: 'high',
      size: '1024x1024',
      aspectRatio: '1:1',
      bodyType: 'hourglass',
      clothingStyle: 'elegant, modern',
      colorScheme: 'black, white, neutral'
    };

    console.log('📝 Запрос:', JSON.stringify(imageRequest, null, 2));

    const startTime = Date.now();
    const result = await gigaChatService.generateImage(imageRequest);
    const endTime = Date.now();

    console.log(`\n⏱️ Время генерации: ${endTime - startTime}ms`);
    console.log('📊 Результат:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('\n🎉 Генерация изображения успешна!');
      console.log(`🖼️ URL изображения: ${result.imageUrl}`);
      
      if (result.usage) {
        console.log(`💾 Использовано токенов: ${result.usage.totalTokens}`);
      }
    } else {
      console.log('\n❌ Ошибка генерации изображения');
      console.log(`🚨 ${result.error}`);
    }

  } catch (error) {
    console.error('\n💥 Ошибка тестирования:', error);
  }
}

// Загружаем переменные окружения из .env файла
require('dotenv').config();

// Запускаем тест
testImageGeneration().then(() => {
  console.log('\n🏁 Тестирование завершено');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Критическая ошибка:', error);
  process.exit(1);
});
