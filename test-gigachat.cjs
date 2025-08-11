// Тестирование GigaChat API
const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = require('node-fetch');

// Создаем HTTPS агент, который игнорирует SSL сертификаты
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Загружаем переменные окружения
const envPath = path.join(__dirname, '.env');
let clientId = '';
let clientSecret = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const clientIdMatch = envContent.match(/VITE_GIGACHAT_CLIENT_ID=(.+)/);
  const clientSecretMatch = envContent.match(/VITE_GIGACHAT_CLIENT_SECRET=(.+)/);
  
  if (clientIdMatch) clientId = clientIdMatch[1].trim();
  if (clientSecretMatch) clientSecret = clientSecretMatch[1].trim();
}

if (!clientId || !clientSecret) {
  console.log('❌ GigaChat credentials not found in .env file');
  console.log('💡 Add the following to your .env file:');
  console.log('VITE_GIGACHAT_CLIENT_ID=your_client_id_here');
  console.log('VITE_GIGACHAT_CLIENT_SECRET=your_client_secret_here');
  process.exit(1);
}

// Конфигурация GigaChat
const config = {
  clientId,
  clientSecret,
  scope: 'GIGACHAT_API_PERS',
  authUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
  apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1'
};

// Генерация уникального RqUID
function generateRqUID() {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Получение токена доступа
async function getAccessToken() {
  console.log('🔐 Getting GigaChat access token...');
  
  try {
    const authData = new URLSearchParams({
      scope: config.scope
    });

    const response = await fetch(config.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'RqUID': generateRqUID(),
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`
      },
      body: authData.toString(),
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GigaChat auth failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token in GigaChat response');
    }

    console.log('✅ GigaChat access token obtained successfully');
    return data.access_token;

  } catch (error) {
    console.error('❌ Failed to get GigaChat access token:', error);
    throw error;
  }
}

// Тестирование подключения
async function testConnection() {
  try {
    console.log('🔍 Testing GigaChat connection...');
    
    const token = await getAccessToken();
    
    const response = await fetch(`${config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'RqUID': generateRqUID()
      },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];
    
    console.log(`✅ GigaChat connection test: SUCCESS`);
    console.log(`📊 Available models: ${models.length}`);
    
    if (models.length > 0) {
      models.forEach(model => {
        console.log(`   - ${model.id}: ${model.object}`);
      });
    }
    
    return { success: true, models, token };

  } catch (error) {
    console.error('❌ GigaChat connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Тестирование генерации текста
async function testTextGeneration(token) {
  try {
    console.log('\n🤖 Testing GigaChat text generation...');
    
    const messages = [
      {
        role: 'user',
        content: 'Создай простой образ одежды для женщины в стиле casual на весну. Ответь в формате JSON с полями: name, description, items (массив с полями category, name, price), totalPrice.'
      }
    ];

    const requestBody = {
      model: 'GigaChat:latest',
      messages,
      temperature: 0.7,
      maxTokens: 1000,
      stream: false
    };

    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'RqUID': generateRqUID()
      },
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GigaChat API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from GigaChat');
    }

    console.log('✅ GigaChat text generation test: SUCCESS');
    console.log(`📝 Response length: ${content.length} characters`);
    console.log(`🔢 Total tokens: ${data.usage.totalTokens}`);
    console.log('\n📄 Response preview:');
    console.log(content.substring(0, 200) + '...');
    
    // Проверяем, что ответ содержит JSON
    try {
      JSON.parse(content);
      console.log('✅ Response contains valid JSON');
    } catch (e) {
      console.log('⚠️ Response is not valid JSON (this might be expected)');
    }
    
    return { success: true, content, usage: data.usage };

  } catch (error) {
    console.error('❌ GigaChat text generation test failed:', error);
    return { success: false, error: error.message };
  }
}

// Основная функция тестирования
async function runTests() {
  console.log('🧪 Starting GigaChat API tests...\n');
  
  // Тест подключения
  const connectionTest = await testConnection();
  
  if (!connectionTest.success) {
    console.log('\n❌ Connection test failed, stopping tests');
    return;
  }
  
  // Тест генерации текста
  const generationTest = await testTextGeneration(connectionTest.token);
  
  // Сводка результатов
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  console.log(`🔗 Connection: ${connectionTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🤖 Generation: ${generationTest.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (connectionTest.models) {
    console.log(`📊 Available models: ${connectionTest.models.length}`);
  }
  
  if (generationTest.usage) {
    console.log(`🔢 Tokens used: ${generationTest.usage.totalTokens}`);
  }
  
  if (connectionTest.success && generationTest.success) {
    console.log('\n🎉 All tests passed! GigaChat is ready to use.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the configuration.');
  }
}

// Запускаем тесты
runTests().catch(console.error);
