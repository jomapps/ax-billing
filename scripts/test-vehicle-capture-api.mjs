#!/usr/bin/env node

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testVehicleCaptureAPI() {
  console.log('🔍 Testing Vehicle Capture API with Fal.ai Integration')
  console.log('=' .repeat(60))
  
  const baseUrl = 'http://localhost:3001'
  const orderId = 'AX-20250908-5336'
  
  // Test with a sample image (we'll create a simple test image)
  const testImagePath = path.join(__dirname, 'test-vehicle.jpg')
  
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️  No test image found. Please use the actual vehicle capture interface.')
    console.log('   You can test by going to:')
    console.log(`   ${baseUrl}/order/${orderId}/initiated`)
    console.log('   And clicking "Vehicle Capture" to take a photo.')
    return
  }
  
  try {
    console.log('🚀 Testing vehicle capture API...')
    console.log(`   Order ID: ${orderId}`)
    console.log(`   API URL: ${baseUrl}/api/v1/staff/capture-vehicle`)
    console.log('')
    
    // Create form data
    const formData = new FormData()
    formData.append('orderId', orderId)
    formData.append('vehicleImage', fs.createReadStream(testImagePath))
    
    const response = await axios.post(
      `${baseUrl}/api/v1/staff/capture-vehicle`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout for AI processing
      }
    )
    
    console.log('✅ API request successful!')
    console.log('📋 Response:')
    console.log(JSON.stringify(response.data, null, 2))
    
    if (response.data.success) {
      console.log('')
      console.log('🎉 Vehicle capture with Fal.ai integration SUCCESSFUL!')
      
      if (response.data.aiResult && response.data.aiResult.vehicleInfo) {
        const { vehicleType, licensePlate, confidence } = response.data.aiResult.vehicleInfo
        console.log('🤖 AI Processing Results:')
        console.log(`   Vehicle Type: ${vehicleType}`)
        console.log(`   License Plate: ${licensePlate}`)
        console.log(`   Confidence: ${confidence}`)
      }
    } else {
      console.log('❌ Vehicle capture failed')
      console.log(`   Error: ${response.data.error}`)
    }
    
  } catch (error) {
    console.error('❌ API request failed:')
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Error: ${error.response.data?.error || error.message}`)
      
      if (error.response.data) {
        console.error('   Response data:')
        console.error(JSON.stringify(error.response.data, null, 2))
      }
    } else {
      console.error(`   Network error: ${error.message}`)
    }
    
    console.log('')
    console.log('❌ Vehicle capture API test FAILED!')
  }
}

// Alternative: Test the URL construction logic
async function testUrlConstruction() {
  console.log('')
  console.log('🔧 Testing URL Construction Logic')
  console.log('-' .repeat(40))
  
  const publicBucketUrl = 'https://media.ft.tc'
  const testFilename = 'vehicle-AX-20250908-5336-1757438371929.jpg'
  
  // Simulate different mediaResult scenarios
  const testCases = [
    {
      name: 'Full URL in mediaResult.url',
      mediaResult: {
        url: `${publicBucketUrl}/media/${testFilename}`,
        filename: testFilename
      }
    },
    {
      name: 'Relative URL in mediaResult.url',
      mediaResult: {
        url: `/media/${testFilename}`,
        filename: testFilename
      }
    },
    {
      name: 'Empty URL in mediaResult.url',
      mediaResult: {
        url: '',
        filename: testFilename
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}:`)
    
    const { mediaResult } = testCase
    let imageUrl
    
    // Apply the same logic as in the API
    if (mediaResult.url && mediaResult.url.startsWith('http')) {
      imageUrl = mediaResult.url
    } else {
      const filename = mediaResult.filename || `vehicle-test-${Date.now()}.jpg`
      imageUrl = `${publicBucketUrl}/media/${filename}`
    }
    
    console.log(`   Input: url="${mediaResult.url}", filename="${mediaResult.filename}"`)
    console.log(`   Output: ${imageUrl}`)
    
    // Test if URL is accessible
    try {
      const response = await axios.head(imageUrl, { timeout: 5000 })
      console.log(`   ✅ URL accessible (${response.status})`)
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ URL not accessible (${error.response.status})`)
      } else {
        console.log(`   ❌ Network error: ${error.message}`)
      }
    }
  }
}

// Run the tests
console.log('Starting vehicle capture API tests...\n')
await testVehicleCaptureAPI()
await testUrlConstruction()

console.log('\n' + '=' .repeat(60))
console.log('🏁 Test completed!')
console.log('')
console.log('💡 To test the full integration:')
console.log('   1. Go to http://localhost:3001/order/AX-20250908-5336/initiated')
console.log('   2. Click "Vehicle Capture"')
console.log('   3. Take a photo of a vehicle')
console.log('   4. Check the console logs for Fal.ai processing results')
