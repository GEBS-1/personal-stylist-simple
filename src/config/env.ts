// Конфигурация переменных окружения
export const env = {
  // AI API Keys
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  CLAUDE_API_KEY: import.meta.env.VITE_CLAUDE_API_KEY || '',
  COHERE_API_KEY: import.meta.env.VITE_COHERE_API_KEY || '',
  
  // Marketplace API Keys
  WILDBERRIES_API_KEY: import.meta.env.VITE_WILDBERRIES_API_KEY || '',
  
  // App Settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Personal Stylist Simple',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  
  // Marketplace Settings
  ENABLE_OZON: import.meta.env.VITE_ENABLE_OZON === 'true',
  ENABLE_LAMODA: import.meta.env.VITE_ENABLE_LAMODA === 'true',
  ENABLE_WILDBERRIES: import.meta.env.VITE_ENABLE_WILDBERRIES !== 'false',
  
  // Development
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  DEV: import.meta.env.DEV || false,
} as const;

// Проверка валидности API ключей
export const isValidApiKey = (key: string): boolean => {
  if (!key) return false;
  
  // Проверяем, что это не placeholder значения
  const placeholderPatterns = [
    'your-',
    'sk-your-',
    'sk-ant-your-',
    'placeholder',
    'example'
  ];
  
  return !placeholderPatterns.some(pattern => 
    key.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Получение валидных API ключей
export const getValidApiKeys = () => {
  return {
    gemini: isValidApiKey(env.GEMINI_API_KEY) ? env.GEMINI_API_KEY : '',
    openai: isValidApiKey(env.OPENAI_API_KEY) ? env.OPENAI_API_KEY : '',
    claude: isValidApiKey(env.CLAUDE_API_KEY) ? env.CLAUDE_API_KEY : '',
    cohere: isValidApiKey(env.COHERE_API_KEY) ? env.COHERE_API_KEY : '',
    wildberries: isValidApiKey(env.WILDBERRIES_API_KEY) ? env.WILDBERRIES_API_KEY : '',
  };
};

// Проверка наличия хотя бы одного валидного AI ключа
export const hasValidAiKey = (): boolean => {
  const keys = getValidApiKeys();
  return !!(keys.gemini || keys.openai || keys.claude || keys.cohere);
};

// Логирование конфигурации (только в development)
export const logConfig = () => {
  if (env.DEV) {
    console.log('🔧 Environment Configuration:');
    console.log(`  App: ${env.APP_NAME} v${env.APP_VERSION}`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  API URL: ${env.API_URL}`);
    
    const keys = getValidApiKeys();
    console.log('🔑 API Keys Status:');
    console.log(`  Gemini: ${keys.gemini ? '✅ Valid' : '❌ Missing/Invalid'}`);
    console.log(`  OpenAI: ${keys.openai ? '✅ Valid' : '❌ Missing/Invalid'}`);
    console.log(`  Claude: ${keys.claude ? '✅ Valid' : '❌ Missing/Invalid'}`);
    console.log(`  Cohere: ${keys.cohere ? '✅ Valid' : '❌ Missing/Invalid'}`);
    console.log(`  Wildberries: ${keys.wildberries ? '✅ Valid' : '❌ Missing/Invalid'}`);
    
    console.log('🛍️ Marketplace Settings:');
    console.log(`  Ozon: ${env.ENABLE_OZON ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Lamoda: ${env.ENABLE_LAMODA ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Wildberries: ${env.ENABLE_WILDBERRIES ? '✅ Enabled' : '❌ Disabled'}`);
  }
}; 