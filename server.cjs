// Express.js прокси сервер для Personal Stylist Pro
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Создаем HTTPS агент, который игнорирует SSL сертификаты
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Конфигурация GigaChat
const config = {
  clientId,
  clientSecret,
  scope: 'GIGACHAT_API_PERS',
  authUrl: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
  apiUrl: 'https://gigachat.devices.sberbank.ru/api/v1'
};

// Генерация уникального RqUID
function generateUUID() {
  return `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Получение токена доступа GigaChat
async function getGigaChatToken() {
  try {
    const authData = new URLSearchParams({
      scope: config.scope
    });

    const response = await fetch(config.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'RqUID': generateUUID(),
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

    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to get GigaChat token:', error);
    throw error;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Тестирование GigaChat API
app.get('/api/gigachat/test', async (req, res) => {
  try {
    console.log('🧪 Testing GigaChat API...');
    
    const token = await getGigaChatToken();
    
    const response = await fetch(`${config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'RqUID': generateUUID()
      },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];
    
    res.json({
      success: true,
      models,
      modelCount: models.length
    });
    
  } catch (error) {
    console.error('❌ GigaChat test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Тест подключения GigaChat
app.get('/api/gigachat/test', async (req, res) => {
  try {
    const token = await getGigaChatToken();
    
    const response = await fetch(`${config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'RqUID': generateUUID()
      },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    res.json({ success: true, message: 'GigaChat connection successful' });
    
  } catch (error) {
    console.error('❌ GigaChat test failed:', error);
    res.json({ 
      success: false, 
      fallback: true,
      error: error.message 
    });
  }
});

// Получение моделей GigaChat
app.get('/api/gigachat/models', async (req, res) => {
  try {
    const token = await getGigaChatToken();
    
    const response = await fetch(`${config.apiUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'RqUID': generateUUID()
      },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Failed to get GigaChat models:', error);
    // Возвращаем fallback модели вместо ошибки
    res.json([
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo (Fallback)',
        description: 'Fallback model for development',
        capabilities: ['chat', 'completion']
      },
      {
        id: 'gpt-4',
        name: 'GPT-4 (Fallback)',
        description: 'Advanced fallback model',
        capabilities: ['chat', 'completion', 'analysis']
      }
    ]);
  }
});

// Получение возможностей GigaChat
app.get('/api/gigachat/capabilities', async (req, res) => {
  try {
    const token = await getGigaChatToken();
    
    const response = await fetch(`${config.apiUrl}/capabilities`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'RqUID': generateUUID()
      },
      agent: httpsAgent
    });

    if (!response.ok) {
      throw new Error(`Failed to get capabilities: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ Failed to get GigaChat capabilities:', error);
    // Возвращаем fallback capabilities
    res.json({
      models: [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          capabilities: ['chat', 'completion', 'analysis']
        },
        {
          id: 'gpt-4',
          name: 'GPT-4',
          capabilities: ['chat', 'completion', 'analysis', 'reasoning']
        }
      ],
      features: ['chat', 'completion', 'analysis', 'reasoning']
    });
  }
});

// Чат с GigaChat
app.post('/api/gigachat/chat', async (req, res) => {
  try {
    const { messages, model = 'GigaChat:latest', temperature = 0.7, maxTokens = 1000 } = req.body;
    
    console.log('🤖 GigaChat chat request:', { model, temperature, maxTokens });
    
    const token = await getGigaChatToken();
    
    const requestBody = {
      model,
      messages,
      temperature,
      maxTokens,
      stream: false
    };

    const response = await fetch(`${config.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'RqUID': generateUUID()
      },
      body: JSON.stringify(requestBody),
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GigaChat API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ GigaChat chat failed:', error);
    // Возвращаем fallback ответ
    const { messages, model = 'GigaChat:latest' } = req.body;
    const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : { content: 'Привет' };
    res.json({
      id: 'fallback-chat-id',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: `Извините, но GigaChat временно недоступен. Это fallback ответ для: "${lastMessage.content}". В реальном приложении здесь был бы ответ от GigaChat API.`
          },
          finish_reason: 'stop'
        }
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    });
  }
});

// Генерация изображений через DALL-E
app.post('/api/dalle/image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;
    
    console.log('🎨 Generating image with DALL-E...');
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`📏 Size: ${size}`);
    console.log(`⚡ Quality: ${quality}`);
    
    // Проверяем наличие API ключа
    const openaiKey = process.env.VITE_OPENAI_API_KEY;
    if (!openaiKey) {
      console.log('⚠️ OpenAI API key not found, using fallback');
      return res.json({
        success: true,
        imageUrl: '/placeholder.svg',
        model: 'dalle-fallback',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    }
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: size,
        quality: quality === 'high' ? 'hd' : 'standard',
        response_format: 'url'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ DALL-E generation failed: ${response.status} - ${errorText}`);
      
      return res.json({
        success: true,
        imageUrl: '/placeholder.svg',
        model: 'dalle-fallback',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    }
    
    const data = await response.json();
    
    if (data.data && data.data[0]?.url) {
      console.log('✅ DALL-E image generated successfully');
      res.json({
        success: true,
        imageUrl: data.data[0].url,
        model: 'dalle',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    } else {
      console.warn('⚠️ No image URL in DALL-E response, using fallback');
      res.json({
        success: true,
        imageUrl: '/placeholder.svg',
        model: 'dalle-fallback',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    }
    
  } catch (error) {
    console.error('❌ DALL-E generation error:', error);
    res.json({
      success: true,
      imageUrl: '/placeholder.svg',
      model: 'dalle-fallback',
      error: error.message,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    });
  }
});

// Генерация изображений через GigaChat
app.post('/api/gigachat/image', async (req, res) => {
  try {
    const { prompt, style = 'realistic', quality = 'standard', size = '1024x1024' } = req.body;
    
    console.log('🎨 Generating image with GigaChat...');
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🎨 Style: ${style}`);
    console.log(`⚡ Quality: ${quality}`);
    console.log(`📏 Size: ${size}`);
    
    // Получаем токен доступа
    const token = await getGigaChatToken();
    
    // Формируем промпт для генерации изображения
    const imagePrompt = `Создай изображение: ${prompt}. 
    Стиль: ${style === 'realistic' ? 'фотографическое качество, реалистичный стиль' : 
           style === 'artistic' ? 'художественный стиль, творческий подход' :
           style === 'fashion' ? 'стиль fashion-фотографии, профессиональная съемка' :
           'естественный вид, повседневная фотография'}. 
    Качество: ${quality === 'high' ? 'высокое' : 'стандартное'}. 
    Размер: ${size}. 
    Изображение должно быть реалистичным и качественным.`;
    
    // Отправляем запрос на генерацию изображения
    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'RqUID': generateUUID()
      },
      body: JSON.stringify({
        model: 'GigaChat:latest',
        prompt: imagePrompt,
        n: 1,
        size: size,
        quality: quality === 'high' ? 'hd' : 'standard',
        response_format: 'url'
      }),
      agent: httpsAgent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GigaChat image generation failed: ${response.status} - ${errorText}`);
      
      // Возвращаем fallback изображение
      return res.json({
        success: true,
        imageUrl: '/placeholder.svg',
        model: 'gigachat-fallback',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    }
    
    const data = await response.json();
    
    if (data.data && data.data[0]?.url) {
      console.log('✅ Image generated successfully');
      res.json({
        success: true,
        imageUrl: data.data[0].url,
        model: 'gigachat',
        usage: data.usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    } else {
      console.warn('⚠️ No image URL in response, using fallback');
      res.json({
        success: true,
        imageUrl: '/placeholder.svg',
        model: 'gigachat-fallback',
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
        }
      });
    }
    
  } catch (error) {
    console.error('❌ GigaChat image generation error:', error);
    res.json({
      success: true,
      imageUrl: '/placeholder.svg',
      model: 'gigachat-fallback',
      error: error.message,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    });
  }
});

// Прокси для поиска Wildberries
app.get('/api/wildberries/search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.query;
    
    console.log(`🔍 Wildberries search: ${query}`);
    
    // Используем улучшенный поисковый запрос
    const searchQuery = query || 'женская одежда';
    
    const response = await fetch(`https://search.wb.ru/exactmatch/ru/common/v4/search?TestGroup=no_test&TestID=no_test&appType=1&curr=rub&dest=12358386&query=${encodeURIComponent(searchQuery)}&resultset=catalog&sort=popular&spp=0&suppressSpellcheck=false&uclusters=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Wildberries API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.data?.products || [];
    
    const processedProducts = products.slice(0, limit).map((product, index) => ({
      id: product.id?.toString() || `wb_${index}`,
      name: product.name || 'Товар Wildberries',
      price: product.salePriceU ? product.salePriceU / 100 : product.priceU ? product.priceU / 100 : 0,
      originalPrice: product.priceU ? product.priceU / 100 : undefined,
      discount: product.sale ? Math.round(product.sale) : undefined,
      rating: product.rating || 4.0,
      reviews: product.feedbacks || 0,
      image: getProductImageUrl(product.id),
      url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      marketplace: 'wildberries',
      colors: product.colors?.map((c) => c.name) || [],
      sizes: product.sizes?.map((s) => s.name) || []
    }));

    res.json({
      success: true,
      products: processedProducts,
      total: data.data?.total || 0
    });

  } catch (error) {
    console.error('❌ Wildberries search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      products: []
    });
  }
});

// Прокси для каталога Wildberries
app.get('/api/wildberries/catalog', async (req, res) => {
  try {
    const { category = 'women', limit = 20 } = req.query;
    
    console.log(`📂 Wildberries catalog: ${category}`);
    
    const response = await fetch(`https://catalog.wb.ru/catalog/women/catalog?TestGroup=no_test&TestID=no_test&appType=1&cat=8126&curr=rub&dest=12358386&sort=popular&spp=0&suppressSpellcheck=false`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Catalog API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.data?.products || [];
    
    const processedProducts = products.slice(0, limit).map((product, index) => ({
      id: product.id?.toString() || `wb_cat_${index}`,
      name: product.name || 'Товар Wildberries',
      price: product.salePriceU ? product.salePriceU / 100 : product.priceU ? product.priceU / 100 : 0,
      originalPrice: product.priceU ? product.priceU / 100 : undefined,
      discount: product.sale ? Math.round(product.sale) : undefined,
      rating: product.rating || 4.0,
      reviews: product.feedbacks || 0,
      image: getProductImageUrl(product.id),
      url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      marketplace: 'wildberries',
      category: category,
      colors: product.colors?.map((c) => c.name) || [],
      sizes: product.sizes?.map((s) => s.name) || []
    }));

    res.json({
      success: true,
      products: processedProducts,
      total: data.data?.total || 0
    });

  } catch (error) {
    console.error('❌ Catalog proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      products: []
    });
  }
});

// Прокси для изображений Wildberries
app.get('/api/wildberries/image/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const vol = Math.floor(productId / 100000);
    const part = Math.floor(productId / 10000);
    
    const imageUrl = `https://basket-${vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/c246x328/1.jpg`;
    
    console.log(`🖼️ Proxying image: ${imageUrl}`);
    
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Referer': 'https://www.wildberries.ru/',
        'Origin': 'https://www.wildberries.ru'
      }
    });
    
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=3600');
      res.send(Buffer.from(buffer));
    } else {
      console.warn(`⚠️ Image not found: ${imageUrl}`);
      res.status(404).json({ error: 'Image not found' });
    }
    
  } catch (error) {
    console.error('❌ Image proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Функция для получения URL изображения товара
function getProductImageUrl(productId) {
  if (!productId) return '/placeholder.svg';
  
  const vol = Math.floor(productId / 100000);
  const part = Math.floor(productId / 10000);
  
  return `https://basket-${vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/c246x328/1.jpg`;
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GigaChat:`);
  console.log(`     GET /api/gigachat/test`);
  console.log(`     GET /api/gigachat/models`);
  console.log(`     GET /api/gigachat/capabilities`);
  console.log(`     POST /api/gigachat/chat`);
  console.log(`     POST /api/gigachat/image`);
  console.log(`     POST /api/dalle/image`);
  console.log(`   Wildberries:`);
  console.log(`     GET /api/wildberries/search?query=...`);
  console.log(`     GET /api/wildberries/catalog?category=...`);
  console.log(`     GET /api/wildberries/image/:productId`);
  console.log(`   Health:`);
  console.log(`     GET /api/health`);
}); 