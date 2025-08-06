// Тест URL изображений Wildberries
const https = require('https');

function testImageUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${url} - Status: ${res.statusCode}`);
      resolve({ url, status: res.statusCode, success: res.statusCode === 200 });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      resolve({ url, status: 0, success: false, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve({ url, status: 0, success: false, error: 'timeout' });
    });
  });
}

async function testAllImageUrls() {
  const productId = 415946071; // ID из логов
  const vol = Math.floor(productId / 100000);
  const part = Math.floor(productId / 10000);
  
  const testUrls = [
    `https://basket-${vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/c246x328/1.jpg`,
    `https://images.wbstatic.net/c246x328/new/${vol}/${productId}.jpg`,
    `https://basket-${vol}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/c246x328/2.jpg`,
    `https://images.wbstatic.net/c246x328/new/${vol}/${productId}-1.jpg`
  ];
  
  console.log(`🔍 Testing image URLs for product ID: ${productId}`);
  console.log(`📁 Vol: ${vol}, Part: ${part}\n`);
  
  for (const url of testUrls) {
    await testImageUrl(url);
  }
}

testAllImageUrls(); 