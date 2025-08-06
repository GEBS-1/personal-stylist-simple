// Тест агрессивного парсинга Wildberries
console.log('🧪 Testing Wildberries parsing methods...');

// Тестируем разные endpoints
const testEndpoints = async () => {
  const endpoints = [
    'https://search.wb.ru/exactmatch/ru/common/v4/search',
    'https://search.wb.ru/exactmatch/ru/common/v5/search',
    'https://search.wb.ru/exactmatch/ru/common/v3/search'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      
      const params = new URLSearchParams({
        TestGroup: 'no_test',
        TestID: 'no_test',
        appType: '1',
        curr: 'rub',
        dest: '-1257786',
        query: 'рубашка',
        resultset: 'catalog',
        sort: 'popular',
        suppressSpellcheck: 'false',
        uoffset: '0',
        ulimit: '5',
        lang: 'ru',
        locale: 'ru',
        timestamp: Date.now().toString(),
        rand: Math.random().toString()
      });

      const response = await fetch(`${endpoint}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'DNT': '1',
          'Pragma': 'no-cache',
          'Referer': 'https://www.wildberries.ru/',
          'Origin': 'https://www.wildberries.ru',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: AbortSignal.timeout(10000)
      });

      console.log(`📡 Status: ${response.status}`);
      console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Found data:`, data);
        
        if (data.data?.products) {
          console.log(`📦 Found ${data.data.products.length} products`);
          console.log(`📦 First product:`, data.data.products[0]);
        } else if (data.products) {
          console.log(`📦 Found ${data.products.length} products in alternative format`);
          console.log(`📦 First product:`, data.products[0]);
        } else {
          console.log(`📦 No products found in response`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error response: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Endpoint failed:`, error.message);
    }
  }
};

// Тестируем веб-скрапинг
const testWebScraping = async () => {
  try {
    console.log('\n🔍 Testing web scraping...');
    
    const searchUrl = 'https://www.wildberries.ru/catalog/0/search.aspx?search=рубашка';
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Pragma': 'no-cache',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      },
      signal: AbortSignal.timeout(15000)
    });

    console.log(`📡 Web scraping status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`📦 Got HTML response, length: ${html.length}`);
      
      // Ищем JSON данные
      const jsonMatches = html.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/);
      if (jsonMatches) {
        console.log(`✅ Found initial state JSON`);
        try {
          const initialState = JSON.parse(jsonMatches[1]);
          console.log(`📦 Initial state keys:`, Object.keys(initialState));
        } catch (e) {
          console.log(`❌ Failed to parse initial state:`, e.message);
        }
      } else {
        console.log(`❌ No initial state found`);
      }
      
      // Ищем продукты
      const productMatches = html.match(/"products":\s*(\[.*?\])/);
      if (productMatches) {
        console.log(`✅ Found products JSON`);
      } else {
        console.log(`❌ No products JSON found`);
      }
      
      // Ищем карточки товаров
      const productCards = html.match(/<div[^>]*class="[^"]*product-card[^"]*"[^>]*>/g);
      if (productCards) {
        console.log(`✅ Found ${productCards.length} product cards`);
      } else {
        console.log(`❌ No product cards found`);
      }
    } else {
      console.log(`❌ Web scraping failed`);
    }
  } catch (error) {
    console.log(`❌ Web scraping error:`, error.message);
  }
};

// Запускаем тесты
const runTests = async () => {
  console.log('🚀 Starting Wildberries parsing tests...\n');
  
  await testEndpoints();
  await testWebScraping();
  
  console.log('\n✅ Tests completed!');
};

// Запускаем если файл выполняется напрямую
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  runTests();
} else {
  // Browser environment
  runTests();
} 