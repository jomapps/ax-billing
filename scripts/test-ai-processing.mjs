import { VehicleProcessingService } from '../src/lib/whatsapp/vehicle-processing-service.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAIProcessing() {
  console.log('🔍 Testing AI Processing for Order AX-20250908-5336...\n');
  
  // The image URL from the database (we need to construct the full URL)
  const imageFilename = 'vehicle-AX-20250908-5336-1757438371929.jpg';
  const imageUrl = `${process.env.S3_PUBLIC_BUCKET}/media/${imageFilename}`;
  
  console.log('📸 Image URL:', imageUrl);
  console.log('🔑 OpenRouter API Key:', process.env.OPENROUTER_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('🤖 OpenRouter Model:', process.env.OPENROUTER_MODEL || 'gpt-4-vision-preview (default)');
  console.log('🌐 App URL:', process.env.NEXT_PUBLIC_APP_URL);
  
  try {
    const vehicleService = new VehicleProcessingService();
    
    console.log('\n🚀 Starting AI processing...');
    const startTime = Date.now();
    
    const result = await vehicleService.processVehiclePhoto(imageUrl);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️  Processing completed in ${duration}ms\n`);
    
    console.log('=== AI PROCESSING RESULT ===');
    console.log('Success:', result.success);
    
    if (result.success && result.vehicleInfo) {
      console.log('✅ AI Recognition Successful!');
      console.log('Vehicle Type:', result.vehicleInfo.vehicleType);
      console.log('License Plate:', result.vehicleInfo.licensePlate);
      console.log('Confidence:', result.vehicleInfo.confidence);
      console.log('Extracted Text:', result.vehicleInfo.extractedText || 'N/A');
    } else {
      console.log('❌ AI Recognition Failed!');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAIProcessing();
