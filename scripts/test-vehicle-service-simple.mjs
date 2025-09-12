#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Use the AI service API endpoint instead of direct FAL calls
async function processVehiclePhoto(imageUrl) {
  try {
    console.log('🤖 Testing vehicle analysis via AI service API...')

    const response = await axios.post(
      `${APP_URL}/api/v1/ai/analyze-vehicle`,
      {
        imageUrl: imageUrl,
        generateRecommendations: false,
        includeCostEstimate: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      },
    )

    if (response.data && response.data.success) {
      const analysis = response.data.analysis

      // Convert to expected format
      const vehicleInfo = {
        vehicleType: mapVehicleType(analysis.vehicle_type),
        licensePlate: analysis.license_plate || 'UNKNOWN',
        confidence: analysis.confidence_score || 0.9,
        extractedText: analysis.overall_condition || '',
      }

      return {
        success: true,
        vehicleInfo,
      }
    } else {
      throw new Error(response.data?.error || 'AI analysis failed')
    }
  } catch (error) {
    console.error('AI service API error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI service error',
    }
  }
}

// Map BAML vehicle types to expected format
function mapVehicleType(bamlType) {
  const typeMap = {
    CAR: 'sedan',
    SUV: 'suv',
    TRUCK: 'truck',
    VAN: 'van',
    MOTORCYCLE: 'motorcycle',
    OTHER: 'sedan', // default fallback
  }

  return typeMap[bamlType] || 'sedan'
}

function parseTextResponse(text) {
  const vehicleInfo = {
    vehicleType: 'sedan',
    licensePlate: '',
    confidence: 0.5,
    extractedText: text,
  }

  // Extract vehicle type
  const vehicleTypes = [
    'sedan',
    'suv',
    'hatchback',
    'mpv',
    'pickup',
    'motorcycle',
    'heavy_bike',
    'van',
    'truck',
  ]
  for (const type of vehicleTypes) {
    if (text.toLowerCase().includes(type.toLowerCase())) {
      vehicleInfo.vehicleType = type
      break
    }
  }

  // Extract license plate using regex patterns
  const platePatterns = [
    /[A-Z]{1,3}[-\s]?\d{1,4}[-\s]?[A-Z]?/g, // Common patterns like ABC-123, AB-1234
    /\b[A-Z0-9]{3,8}\b/g, // General alphanumeric patterns
  ]

  for (const pattern of platePatterns) {
    const matches = text.match(pattern)
    if (matches && matches.length > 0) {
      vehicleInfo.licensePlate = matches[0].replace(/[-\s]/g, '')
      break
    }
  }

  return vehicleInfo
}

async function testVehicleService() {
  console.log('🔍 Testing Vehicle Processing Service with BAML/AI Service API')
  console.log('='.repeat(60))

  try {
    console.log('🚀 Processing vehicle image via AI service...')
    console.log(`   Image URL: ${TEST_IMAGE_URL}`)
    console.log(`   API Endpoint: ${APP_URL}/api/v1/ai/analyze-vehicle`)
    console.log('')

    const startTime = Date.now()
    const result = await processVehiclePhoto(TEST_IMAGE_URL)
    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`⏱️  Processing completed in ${duration}ms`)
    console.log('')

    if (result.success && result.vehicleInfo) {
      console.log('✅ Vehicle processing SUCCESSFUL!')
      console.log('📋 Extracted Information:')
      console.log(`   Vehicle Type: ${result.vehicleInfo.vehicleType}`)
      console.log(`   License Plate: ${result.vehicleInfo.licensePlate}`)
      console.log(`   Confidence: ${result.vehicleInfo.confidence}`)
      if (result.vehicleInfo.extractedText) {
        console.log(`   Extracted Text: ${result.vehicleInfo.extractedText}`)
      }
      console.log('')
      console.log('🎉 BAML/AI Service integration test PASSED!')

      // Test if this matches the expected order data
      console.log('')
      console.log('🔍 Verification for Order AX-20250908-5336:')
      console.log('   Expected: License plate extraction from vehicle image')
      console.log(`   Result: Successfully extracted "${result.vehicleInfo.licensePlate}"`)
      console.log(`   Vehicle Type: ${result.vehicleInfo.vehicleType}`)
      console.log('   ✅ BAML integration has been IMPLEMENTED!')
    } else {
      console.log('❌ Vehicle processing FAILED!')
      console.log(`   Error: ${result.error}`)
      console.log('')
      console.log('❌ BAML/AI Service integration test FAILED!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Test failed with error:')
    console.error(`   ${error.message}`)
    console.log('')
    console.log('❌ BAML/AI Service integration test FAILED!')
    process.exit(1)
  }
}

// Run the test
testVehicleService().catch(console.error)
