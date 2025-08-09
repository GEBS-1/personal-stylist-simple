const fetch = require('node-fetch');
const https = require('https');
require('dotenv').config();

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testGigaChatAuth() {
  try {
    console.log('🔍 Testing GigaChat authentication...');
    
    const clientId = process.env.VITE_GIGACHAT_CLIENT_ID;
    const clientSecret = process.env.VITE_GIGACHAT_CLIENT_SECRET;
    
    console.log('🔑 GigaChat credentials:');
    console.log(`   Client ID: ${clientId ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Client Secret: ${clientSecret ? '✅ Present' : '❌ Missing'}`);
    
    if (!clientId || !clientSecret) {
      throw new Error('GigaChat credentials not found');
    }
    
    const rqUID = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🆔 RqUID: ${rqUID}`);
    
    const requestBody = `scope=GIGACHAT_API_PERS&grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`;
    console.log('📝 Request body:', requestBody);
    
    const response = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': rqUID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: requestBody,
      timeout: 15000,
      agent: httpsAgent
    });
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, response.headers.raw());
    
    const responseText = await response.text();
    console.log(`📡 Response body: ${responseText}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    const data = JSON.parse(responseText);
    console.log('✅ Authentication successful!');
    console.log('🔑 Access token:', data.access_token ? '✅ Present' : '❌ Missing');
    console.log('⏰ Expires in:', data.expires_in, 'seconds');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
  }
}

testGigaChatAuth();
