// Тест реального endpoint для получения товаров Wildberries
async function testWildberriesAPI() {
  const searchQuery = 'футболка';
  
  console.log('🧪 Testing Wildberries API...');
  
  try {
    // Попробуем использовать реальный endpoint для получения товаров
    // Этот endpoint используется на сайте Wildberries для отображения товаров
    const apiParams = new URLSearchParams({
      TestGroup: 'no_test',
      TestID: 'no_test',
      appType: '1',
      curr: 'rub',
      dest: '-1257786',
      query: searchQuery,
      resultset: 'catalog',
      sort: 'popular',
      suppressSpellcheck: 'false',
      uoffset: '0',
      ulimit: '5',
      lang: 'ru',
      locale: 'ru'
    });

    const response = await fetch(`https://search.wb.ru/exactmatch/ru/common/v4/search?${apiParams}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
      }
    });

    console.log('📡 Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    // Попробуем использовать полученные метаданные для получения товаров
    if (data.shardKey) {
      console.log(`🔍 Using shardKey: ${data.shardKey}`);
      
      // Попробуем получить товары, используя shardKey
      const productParams = new URLSearchParams({
        TestGroup: 'no_test',
        TestID: 'no_test',
        appType: '1',
        curr: 'rub',
        dest: '-1257786',
        query: searchQuery,
        resultset: 'catalog',
        sort: 'popular',
        suppressSpellcheck: 'false',
        uoffset: '0',
        ulimit: '5',
        lang: 'ru',
        locale: 'ru',
        shardKey: data.shardKey
      });

      const productResponse = await fetch(`https://search.wb.ru/exactmatch/ru/common/v4/search?${productParams}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8'
        }
      });

      console.log('📡 Product Response Status:', productResponse.status);

      if (productResponse.ok) {
        const productData = await productResponse.json();
        console.log('✅ Product Response:', JSON.stringify(productData, null, 2));
        
        if (productData.data?.products) {
          console.log(`📦 Found ${productData.data.products.length} products`);
          productData.data.products.slice(0, 3).forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - ${product.salePriceU / 100}₽`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWildberriesAPI(); 