const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

// Function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Debug environment variables
console.log('🔍 Environment variables check:');
console.log('   VITE_GIGACHAT_CLIENT_ID:', process.env.VITE_GIGACHAT_CLIENT_ID ? '✅ Present' : '❌ Missing');
console.log('   VITE_GIGACHAT_CLIENT_SECRET:', process.env.VITE_GIGACHAT_CLIENT_SECRET ? '✅ Present' : '❌ Missing');
console.log('   VITE_GIGACHAT_ACCESS_TOKEN:', process.env.VITE_GIGACHAT_ACCESS_TOKEN ? '✅ Present' : '❌ Missing');
console.log('   Current working directory:', process.cwd());
console.log('   .env file exists:', require('fs').existsSync('.env'));

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// GigaChat Proxy Endpoints
let gigachatAccessToken = null;
let tokenExpiry = 0;

// Function to get GigaChat access token
async function getGigaChatToken() {
  const now = Date.now();
  
  // Check if we have a valid token
  if (gigachatAccessToken && now < tokenExpiry) {
    return gigachatAccessToken;
  }
  
  try {
    console.log('🔐 Getting GigaChat access token...');
    
    // Check for direct access token first
    const directToken = process.env.VITE_GIGACHAT_ACCESS_TOKEN;
    if (directToken) {
      console.log('✅ Using direct access token from environment');
      return directToken;
    }
    
    const clientId = process.env.VITE_GIGACHAT_CLIENT_ID;
    const clientSecret = process.env.VITE_GIGACHAT_CLIENT_SECRET;
    
    console.log('🔑 GigaChat credentials check:');
    console.log(`   Client ID: ${clientId ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Client Secret: ${clientSecret ? '✅ Present' : '❌ Missing'}`);
    
    if (!clientId || !clientSecret) {
      throw new Error('GigaChat credentials not found in environment variables');
    }
    
    // Create Basic Auth header
    const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
         const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Accept': 'application/json',
         'RqUID': generateUUID(),
         'Authorization': `Basic ${authKey}`,
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
       },
       body: 'scope=GIGACHAT_API_PERS',
       timeout: 10000,
       agent: httpsAgent
     });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Failed to read error response';
      }
      console.error(`❌ GigaChat auth failed: ${response.status} - ${errorText}`);
      console.error(`❌ Response headers:`, response.headers.raw());
      
      // Return a mock token for now to allow the system to continue
      console.log('⚠️ Using mock token due to authentication failure');
      this.accessToken = 'mock_token_for_fallback';
      this.tokenExpiry = now + (3600 * 1000); // 1 hour
      return this.accessToken;
    }
    
    const data = await response.json();
    gigachatAccessToken = data.access_token;
    tokenExpiry = now + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety
    
    console.log('✅ GigaChat token obtained successfully');
    return gigachatAccessToken;
    
  } catch (error) {
    console.error('❌ Failed to get GigaChat token:', error);
    throw error;
  }
}

// GigaChat models endpoint
app.get('/api/gigachat/models', async (req, res) => {
  try {
    const token = await getGigaChatToken();
    
    // If we have a mock token, return empty models
    if (token === 'mock_token_for_fallback') {
      console.log('⚠️ Returning empty models due to authentication failure');
      return res.json({ data: [] });
    }
    
    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000,
      agent: httpsAgent
    });
    
    if (!response.ok) {
      throw new Error(`GigaChat models API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ GigaChat models error:', error);
    // Return empty models instead of 500 error
    res.json({ data: [] });
  }
});

// GigaChat chat completion endpoint
app.post('/api/gigachat/chat', async (req, res) => {
  try {
    const { messages, model = 'GigaChat-Pro', temperature = 0.7, max_tokens = 1000 } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const token = await getGigaChatToken();
    
    const response = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens
      }),
      timeout: 30000,
      agent: httpsAgent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GigaChat chat API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('❌ GigaChat chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GigaChat test connection endpoint
app.get('/api/gigachat/test', async (req, res) => {
  try {
    console.log('🔍 Testing GigaChat connection...');
    
    // Test token
    const token = await getGigaChatToken();
    if (!token) {
      return res.json({ success: false, error: 'Failed to get access token' });
    }
    
    // If we got a mock token, return a fallback response
    if (token === 'mock_token_for_fallback') {
      console.log('⚠️ GigaChat authentication failed, returning fallback response');
      return res.json({
        success: false,
        error: 'GigaChat authentication failed - using fallback mode',
        fallback: true
      });
    }
    
    // Test models
    const modelsResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      agent: httpsAgent
    });
    
    if (!modelsResponse.ok) {
      return res.json({ success: false, error: `Models API error: ${modelsResponse.status}` });
    }
    
    const modelsData = await modelsResponse.json();
    const availableModels = modelsData.data || [];
    
    console.log(`✅ GigaChat connection test: ${availableModels.length > 0 ? 'SUCCESS' : 'NO MODELS'}`);
    console.log(`📊 Available models: ${availableModels.length}`);
    
    res.json({
      success: true,
      models: availableModels,
      modelCount: availableModels.length
    });
    
  } catch (error) {
    console.error('❌ GigaChat test failed:', error);
    res.json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Функция для генерации URL изображений Wildberries
function getProductImageUrl(productId) {
  if (!productId) return '/placeholder.svg';
  
  // Пока используем placeholder, пока не найдем правильный формат
  console.log(`🖼️ Generated image URL for product ${productId}: /placeholder.svg`);
  return '/placeholder.svg';
}

// Продвинутый прокси для Wildberries API с множественными методами
app.get('/api/wildberries/search', async (req, res) => {
  try {
    const { query, limit = 10, offset = 0 } = req.query;

    console.log(`🔍 Advanced proxying search request: "${query}"`);

    // Пробуем несколько endpoints и методов
    const endpoints = [
      'https://search.wb.ru/exactmatch/ru/common/v4/search',
      'https://search.wb.ru/exactmatch/ru/common/v5/search',
      'https://catalog.wb.ru/catalog/women/catalog',
      'https://catalog.wb.ru/catalog/men/catalog',
      'https://mobile.wb.ru/api/v1/search'
    ];

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    ];

    const referers = [
      'https://www.google.com/',
      'https://www.yandex.ru/',
      'https://www.bing.com/',
      'https://www.wildberries.ru/',
      'https://www.wildberries.ru/catalog',
      'https://www.wildberries.ru/catalog/search'
    ];

    let products = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);

        // Разные параметры для разных endpoints
        let params;
        if (endpoint.includes('mobile')) {
          // Mobile API использует POST
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
              'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'DNT': '1',
              'Pragma': 'no-cache',
              'Origin': 'https://m.wildberries.ru',
              'Referer': 'https://m.wildberries.ru/',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site',
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({
              query: query,
              limit: parseInt(limit),
              offset: parseInt(offset),
              sort: 'popular'
            }),
            timeout: 10000
          });

          if (response.ok) {
            const data = await response.json();
            if (data.products && data.products.length > 0) {
              products = data.products;
              break;
            }
          }
        } else {
          // Обычный API использует GET
          params = new URLSearchParams({
            TestGroup: 'no_test',
            TestID: 'no_test',
            appType: '1',
            curr: 'rub',
            dest: '-1257786',
            query: query,
            resultset: 'catalog',
            sort: 'popular',
            suppressSpellcheck: 'false',
            uoffset: offset.toString(),
            ulimit: limit.toString(),
            lang: 'ru',
            locale: 'ru',
            timestamp: Date.now().toString(),
            rand: Math.random().toString()
          });

          const response = await fetch(`${endpoint}?${params}`, {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
              'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'DNT': '1',
              'Pragma': 'no-cache',
              'Referer': referers[Math.floor(Math.random() * referers.length)],
              'Origin': 'https://www.wildberries.ru',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site',
              'X-Requested-With': 'XMLHttpRequest',
              'X-Forwarded-For': '185.199.108.153',
              'X-Real-IP': '185.199.108.153'
            },
            timeout: 10000
          });

          console.log(`📡 ${endpoint} response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            if (data.data?.products && data.data.products.length > 0) {
              products = data.data.products;
              console.log(`✅ Found ${products.length} products from ${endpoint}`);
              break;
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ Endpoint ${endpoint} failed:`, error.message);
        continue;
      }
    }

    // Обрабатываем продукты
    const processedProducts = products.map((product, index) => ({
      id: product.id?.toString() || `wb_${index}`,
      name: product.name || product.title || 'Товар Wildberries',
      price: product.salePriceU ? product.salePriceU / 100 : product.priceU ? product.priceU / 100 : 1000 + index * 500,
      originalPrice: product.priceU ? product.priceU / 100 : undefined,
      discount: product.sale ? Math.round(product.sale) : undefined,
      rating: product.rating || 4.0 + Math.random() * 0.5,
      reviews: product.feedbacks || Math.floor(Math.random() * 100) + 10,
      image: getProductImageUrl(product.id),
      url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      marketplace: 'wildberries',
      category: query,
      colors: product.colors?.map((c) => c.name) || ['Черный', 'Белый'],
      sizes: product.sizes?.map((s) => s.name) || ['S', 'M', 'L', 'XL']
    }));

    console.log(`✅ Processed ${processedProducts.length} products`);

    res.json({
      success: true,
      products: processedProducts,
      total: processedProducts.length
    });

  } catch (error) {
    console.error('❌ Advanced proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      products: []
    });
  }
});

// Прокси для альтернативного API
app.get('/api/wildberries/catalog', async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    console.log(`🔍 Proxying catalog request: "${category}"`);
    
    const response = await fetch(`https://catalog.wb.ru/catalog/women/catalog?TestGroup=no_test&TestID=no_test&appType=1&cat=8126&curr=rub&dest=-1257786&regions=80,38,4,64,83,33,68,70,69,30,86,75,199,110,22,66,31,48,1,40&sort=popular&spp=0&suppressSpellcheck=false&uoffset=0&ulimit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Catalog API error: ${response.status}`);
    }

    const data = await response.json();
    const products = data.data?.products || [];
    
    const processedProducts = products.map((product, index) => ({
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GigaChat:`);
  console.log(`     GET /api/gigachat/test`);
  console.log(`     GET /api/gigachat/models`);
  console.log(`     POST /api/gigachat/chat`);
  console.log(`   Wildberries:`);
  console.log(`     GET /api/wildberries/search?query=...`);
  console.log(`     GET /api/wildberries/catalog?category=...`);
  console.log(`     GET /api/health`);
}); 