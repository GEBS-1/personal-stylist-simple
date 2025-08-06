// Скрипт для проверки доступных моделей Gemini
const https = require('https');
require('dotenv').config();

// Получаем API ключ из переменных окружения
const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.log('❌ VITE_GEMINI_API_KEY не найден в переменных окружения');
  console.log('💡 Добавьте API ключ в .env файл: VITE_GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

// Список моделей для тестирования
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash-exp',
  'gemini-1.5-pro-exp',
  'gemini-1.0-pro',
  'gemini-1.0-pro-latest',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest'
];

function testModel(modelName) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
    
    const postData = JSON.stringify({
      contents: [{
        parts: [{
          text: "Hello"
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 10
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${modelName} - Работает (${res.statusCode})`);
          resolve({ model: modelName, status: 'success', statusCode: res.statusCode });
        } else {
          console.log(`❌ ${modelName} - Ошибка ${res.statusCode}: ${data}`);
          resolve({ model: modelName, status: 'error', statusCode: res.statusCode, error: data });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${modelName} - Ошибка сети: ${err.message}`);
      resolve({ model: modelName, status: 'network_error', error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${modelName} - Таймаут`);
      req.destroy();
      resolve({ model: modelName, status: 'timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllModels() {
  console.log('🔍 Тестирование моделей Gemini...\n');
  
  const results = [];
  
  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Результаты тестирования:');
  console.log('========================');
  
  const workingModels = results.filter(r => r.status === 'success');
  const errorModels = results.filter(r => r.status === 'error');
  const networkErrors = results.filter(r => r.status === 'network_error');
  const timeouts = results.filter(r => r.status === 'timeout');
  
  if (workingModels.length > 0) {
    console.log('\n✅ Работающие модели:');
    workingModels.forEach(r => console.log(`   - ${r.model}`));
  }
  
  if (errorModels.length > 0) {
    console.log('\n❌ Модели с ошибками:');
    errorModels.forEach(r => console.log(`   - ${r.model} (${r.statusCode})`));
  }
  
  if (networkErrors.length > 0) {
    console.log('\n🌐 Ошибки сети:');
    networkErrors.forEach(r => console.log(`   - ${r.model}: ${r.error}`));
  }
  
  if (timeouts.length > 0) {
    console.log('\n⏰ Таймауты:');
    timeouts.forEach(r => console.log(`   - ${r.model}`));
  }
  
  console.log(`\n📈 Итого: ${workingModels.length}/${modelsToTest.length} моделей работают`);
  
  if (workingModels.length === 0) {
    console.log('\n💡 Рекомендации:');
    console.log('1. Проверьте правильность API ключа');
    console.log('2. Убедитесь, что у вас есть доступ к Gemini API');
    console.log('3. Проверьте лимиты запросов в Google AI Studio');
    console.log('4. Попробуйте создать новый API ключ');
  }
}

testAllModels().catch(console.error); 