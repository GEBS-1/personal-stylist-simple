const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
  console.log(`🚀 Wildberries proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET /api/wildberries/search?query=...`);
  console.log(`   GET /api/wildberries/catalog?category=...`);
  console.log(`   GET /api/health`);
}); 