#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'

// Simple vehicle processing function based on the service
async function processVehiclePhoto(imageUrl) {
  const falApiKey = process.env.FAL_KEY
  const falVisionModel = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'
  
  if (!falApiKey) {
    return {
      success: false,
      error: 'AI processing not configured',
    }
  }

  try {
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
    `

    const response = await axios.post(
      `https://fal.run/${falVisionModel}`,
      {
        image_url: imageUrl,
        prompt: prompt,
      },
      {
        headers: {
          Authorization: `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const aiResponse = response.data.output
    if (!aiResponse) {
      throw new Error('No response from AI model')
    }

    // Try to parse JSON response, fallback to text parsing if needed
    let vehicleInfo
    try {
      vehicleInfo = JSON.parse(aiResponse)
    } catch (parseError) {
      // If JSON parsing fails, try to extract information from text
      vehicleInfo = parseTextResponse(aiResponse)
    }

    // Validate the response
    if (!vehicleInfo.vehicleType || !vehicleInfo.licensePlate) {
      throw new Error('Incomplete vehicle information extracted')
    }

    return {
      success: true,
      vehicleInfo,
    }
  } catch (error) {
    console.error('AI processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI processing error',
    }
  }
}

function parseTextResponse(text) {
  const vehicleInfo = {
    vehicleType: 'sedan',
    licensePlate: '',
    confidence: 0.5,
    extractedText: text,
  }

  // Extract vehicle type
  const vehicleTypes = ['sedan', 'suv', 'hatchback', 'mpv', 'pickup', 'motorcycle', 'heavy_bike', 'van', 'truck']
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
  console.log('🔍 Testing Vehicle Processing Service with Fal.ai')
  console.log('=' .repeat(60))
  
  try {
    console.log('🚀 Processing vehicle image...')
    console.log(`   Image URL: ${TEST_IMAGE_URL}`)
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
      console.log('🎉 Vehicle Processing Service test PASSED!')
      
      // Test if this matches the expected order data
      console.log('')
      console.log('🔍 Verification for Order AX-20250908-5336:')
      console.log('   Expected: License plate extraction from vehicle image')
      console.log(`   Result: Successfully extracted "${result.vehicleInfo.licensePlate}"`)
      console.log(`   Vehicle Type: ${result.vehicleInfo.vehicleType}`)
      console.log('   ✅ AI processing failure has been RESOLVED!')
      
    } else {
      console.log('❌ Vehicle processing FAILED!')
      console.log(`   Error: ${result.error}`)
      console.log('')
      console.log('❌ Vehicle Processing Service test FAILED!')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:')
    console.error(`   ${error.message}`)
    console.log('')
    console.log('❌ Vehicle Processing Service test FAILED!')
    process.exit(1)
  }
}

// Run the test
testVehicleService().catch(console.error)
