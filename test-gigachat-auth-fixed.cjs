require('dotenv').config();
const fetch = require('node-fetch');
const https = require('https');

// Function to generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create a custom HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testGigaChatAuth() {
  console.log('🔍 Testing GigaChat authentication with Basic Auth...');
  
  const clientId = process.env.VITE_GIGACHAT_CLIENT_ID;
  const clientSecret = process.env.VITE_GIGACHAT_CLIENT_SECRET;
  
  console.log('🔑 Credentials:');
  console.log(`   Client ID: ${clientId ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Client Secret: ${clientSecret ? '✅ Present' : '❌ Missing'}`);
  
  if (!clientId || !clientSecret) {
    console.error('❌ Missing credentials');
    return;
  }
  
  try {
    // Create Basic Auth header
    const authKey = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log(`🔐 Auth Key: ${authKey.substring(0, 20)}...`);
    
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
    
    console.log(`📡 Response status: ${response.status}`);
    console.log(`📡 Response headers:`, response.headers.raw());
    
    const responseText = await response.text();
    console.log(`📡 Response body: ${responseText}`);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Authentication successful!');
      console.log(`🔑 Access Token: ${data.access_token ? data.access_token.substring(0, 20) + '...' : 'Missing'}`);
      console.log(`⏰ Expires in: ${data.expires_in} seconds`);
      
      // Test models endpoint
      console.log('\n🔍 Testing models endpoint...');
      const modelsResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/models', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${data.access_token}`
        },
        timeout: 10000,
        agent: httpsAgent
      });
      
      console.log(`📡 Models response status: ${modelsResponse.status}`);
      
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        console.log('✅ Models endpoint successful!');
        console.log(`📊 Available models: ${modelsData.data ? modelsData.data.length : 0}`);
        if (modelsData.data) {
          modelsData.data.forEach((model, index) => {
            console.log(`   ${index + 1}. ${model.id || model.name || 'Unknown'}`);
          });
        }
      } else {
        const errorText = await modelsResponse.text();
        console.error(`❌ Models endpoint failed: ${errorText}`);
      }
      
    } else {
      console.error(`❌ Authentication failed: ${response.status} - ${responseText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGigaChatAuth();
