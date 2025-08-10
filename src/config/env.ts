// Конфигурация переменных окружения
export const env = {
  // AI API Keys
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  CLAUDE_API_KEY: import.meta.env.VITE_CLAUDE_API_KEY || '',
  COHERE_API_KEY: import.meta.env.VITE_COHERE_API_KEY || '',
  GIGACHAT_CLIENT_ID: import.meta.env.VITE_GIGACHAT_CLIENT_ID || '',
  GIGACHAT_CLIENT_SECRET: import.meta.env.VITE_GIGACHAT_CLIENT_SECRET || '',
  
  // Marketplace API Keys
  WILDBERRIES_API_KEY: import.meta.env.VITE_WILDBERRIES_API_KEY || '',
  
  // App Settings
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Personal Stylist Pro',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  
  // Marketplace Settings
  ENABLE_OZON: import.meta.env.VITE_ENABLE_OZON === 'true',
  ENABLE_LAMODA: import.meta.env.VITE_ENABLE_LAMODA === 'true',
  ENABLE_WILDBERRIES: import.meta.env.VITE_ENABLE_WILDBERRIES !== 'false',
  
  // Development
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  DEV: import.meta.env.DEV || false,
} as const;

// Константы для изображений
export const PLACEHOLDER_IMAGE = '/placeholder.svg';

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

export function getValidApiKeys() {
  return {
    openai: import.meta.env.VITE_OPENAI_API_KEY || '',
    gemini: import.meta.env.VITE_GEMINI_API_KEY || '',
    claude: import.meta.env.VITE_CLAUDE_API_KEY || '',
    cohere: import.meta.env.VITE_COHERE_API_KEY || '',
    // Добавляем GigaChat
    gigachat: {
      clientId: import.meta.env.VITE_GIGACHAT_CLIENT_ID || '',
      clientSecret: import.meta.env.VITE_GIGACHAT_CLIENT_SECRET || ''
    }
  };
}

export function hasValidAiKey() {
  const keys = getValidApiKeys();
  return !!(
    keys.openai ||
    keys.gemini ||
    keys.claude ||
    keys.cohere ||
    (keys.gigachat.clientId && keys.gigachat.clientSecret)
  );
}

// Проверка поддержки генерации изображений
export function supportsImageGeneration() {
  const keys = getValidApiKeys();
  const hasKeys = !!(keys.gigachat.clientId && keys.gigachat.clientSecret);
  
  // Дополнительная проверка на placeholder значения
  const hasValidKeys = hasKeys && 
    !keys.gigachat.clientId.includes('your_') && 
    !keys.gigachat.clientSecret.includes('your_');
  
  console.log('🔍 Image Generation Check:', {
    hasKeys,
    hasValidKeys,
    clientId: keys.gigachat.clientId ? '✅ Present' : '❌ Missing',
    clientSecret: keys.gigachat.clientSecret ? '✅ Present' : '❌ Missing'
  });
  
  return hasValidKeys;
}

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
    console.log(`  GigaChat: ${keys.gigachat.clientId && keys.gigachat.clientSecret ? '✅ Valid' : '❌ Missing/Invalid'}`);
    
    console.log('🎨 Image Generation Support:');
    console.log(`  GigaChat Images: ${supportsImageGeneration() ? '✅ Available' : '❌ Not Available'}`);
    
    console.log('🛍️ Marketplace Settings:');
    console.log(`  Ozon: ${env.ENABLE_OZON ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Lamoda: ${env.ENABLE_LAMODA ? '✅ Enabled' : '❌ Disabled'}`);
    console.log(`  Wildberries: ${env.ENABLE_WILDBERRIES ? '✅ Enabled' : '❌ Disabled'}`);
  }
}; 