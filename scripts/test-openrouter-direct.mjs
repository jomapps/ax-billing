import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testOpenRouterDirect() {
  console.log('🔍 Testing OpenRouter API directly for Order AX-20250908-5336...\n');
  
  // The image URL from the database
  const imageFilename = 'vehicle-AX-20250908-5336-1757438371929.jpg';
  const imageUrl = `${process.env.S3_PUBLIC_BUCKET}/media/${imageFilename}`;
  
  console.log('📸 Image URL:', imageUrl);
  console.log('🔑 OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('🤖 OpenRouter Model:', process.env.OPENROUTER_MODEL || 'gpt-4-vision-preview (default)');
  console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OpenRouter API key not found in environment variables');
    return;
  }
  
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  const openRouterModel = process.env.OPENROUTER_MODEL || 'gpt-4-vision-preview';
  const openRouterBaseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  
  const prompt = `
    Analyze this vehicle image and extract the following information:
    1. Vehicle type (classify as: sedan, suv, hatchback, mpv, pickup, motorcycle, heavy_bike, van, truck)
    2. License plate number (extract the exact text)
    
    Please respond in JSON format:
    {
      "vehicleType": "sedan|suv|hatchback|mpv|pickup|motorcycle|heavy_bike|van|truck",
      "licensePlate": "extracted license plate text",
      "confidence": 0.95,
      "extractedText": "any other text visible on the vehicle"
    }
    
    If you cannot clearly identify the vehicle type or license plate, set confidence to a lower value.
  `;
  
  try {
    console.log('\n🚀 Making request to OpenRouter API...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${openRouterBaseUrl}/chat/completions`,
      {
        model: openRouterModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AX Billing Vehicle Processing',
        },
      },
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  API call completed in ${duration}ms\n`);
    
    console.log('=== OPENROUTER API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const aiResponse = response.data.choices[0]?.message?.content;
    console.log('Raw AI Response:', aiResponse);
    
    if (!aiResponse) {
      console.error('❌ No response content from AI model');
      return;
    }
    
    try {
      // Parse JSON response
      const vehicleInfo = JSON.parse(aiResponse);
      
      console.log('\n=== PARSED VEHICLE INFO ===');
      console.log('✅ JSON parsing successful!');
      console.log('Vehicle Type:', vehicleInfo.vehicleType);
      console.log('License Plate:', vehicleInfo.licensePlate);
      console.log('Confidence:', vehicleInfo.confidence);
      console.log('Extracted Text:', vehicleInfo.extractedText || 'N/A');
      
      // Validate the response
      if (!vehicleInfo.vehicleType || !vehicleInfo.licensePlate) {
        console.log('⚠️  Incomplete vehicle information extracted');
        console.log('Missing vehicle type:', !vehicleInfo.vehicleType);
        console.log('Missing license plate:', !vehicleInfo.licensePlate);
      } else {
        console.log('✅ Complete vehicle information extracted successfully!');
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
      console.error('Raw response that failed to parse:', aiResponse);
    }
    
  } catch (error) {
    console.error('💥 OpenRouter API call failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('Full error:', error);
  }
}

testOpenRouterDirect();
