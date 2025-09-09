import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenRouterSimple() {
  console.log('🔍 Testing OpenRouter API with simple text request...\n');
  
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  console.log('🔑 API Key format:', openRouterApiKey ? `${openRouterApiKey.substring(0, 10)}...` : 'Missing');
  console.log('🔑 API Key length:', openRouterApiKey ? openRouterApiKey.length : 0);
  
  if (!openRouterApiKey) {
    console.error('❌ OpenRouter API key not found in environment variables');
    return;
  }
  
  try {
    console.log('\n🚀 Making simple text request to OpenRouter API...');
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo', // Use a simpler model first
        messages: [
          {
            role: 'user',
            content: 'Hello, can you respond with just "API working"?'
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AX Billing Test',
        },
      },
    );
    
    console.log('✅ API call successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data.choices[0]?.message?.content);
    
    // Now test with vision model
    console.log('\n🔍 Testing vision model availability...');
    
    const visionResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'gpt-4o', // Try gpt-4o instead of gpt-4-vision-preview
        messages: [
          {
            role: 'user',
            content: 'Can you see images?'
          }
        ],
        max_tokens: 20,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AX Billing Test',
        },
      },
    );
    
    console.log('✅ Vision model test successful!');
    console.log('Response:', visionResponse.data.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('💥 API call failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOpenRouterSimple();
