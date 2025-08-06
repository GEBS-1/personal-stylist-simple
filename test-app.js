// Простой тест для проверки работы приложения
console.log('🧪 Testing Personal Stylist App...');

// Проверяем, что приложение запущено
async function testApp() {
  try {
    // Проверяем, что сервер отвечает
    const response = await fetch('http://localhost:5173');
    if (response.ok) {
      console.log('✅ App is running on http://localhost:5173');
    } else {
      console.log('⚠️ App responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ App is not running or not accessible');
    console.log('💡 Make sure to run: npm run dev');
  }
}

// Проверяем переменные окружения
function checkEnvironment() {
  console.log('🔧 Environment check:');
  
  // Проверяем наличие файла .env
  console.log('📁 .env file: Check if exists in project root');
  
  // Проверяем основные переменные
  const envVars = [
    'VITE_GEMINI_API_KEY',
    'VITE_OPENAI_API_KEY', 
    'VITE_CLAUDE_API_KEY',
    'VITE_COHERE_API_KEY',
    'VITE_WILDBERRIES_API_KEY'
  ];
  
  envVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your-key-here' && !value.includes('placeholder')) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Not configured`);
    }
  });
}

// Запускаем тесты
testApp();
checkEnvironment();

console.log('📋 Next steps:');
console.log('1. Create .env file with your API keys');
console.log('2. Run: npm run dev');
console.log('3. Open http://localhost:5173 in browser');
console.log('4. Check browser console for detailed logs'); 