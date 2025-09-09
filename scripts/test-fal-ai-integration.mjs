#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const FAL_KEY = process.env.FAL_KEY
const FAL_VISION_MODEL = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'
const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'

async function testFalAiIntegration() {
  console.log('🔍 Testing Fal.ai Integration for Vehicle Recognition')
  console.log('=' .repeat(60))
  
  if (!FAL_KEY) {
    console.error('❌ FAL_KEY environment variable not set')
    process.exit(1)
  }

  console.log(`📋 Configuration:`)
  console.log(`   Model: ${FAL_VISION_MODEL}`)
  console.log(`   API Key: ${FAL_KEY.substring(0, 10)}...`)
  console.log(`   Test Image: ${TEST_IMAGE_URL}`)
  console.log('')

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

  try {
    console.log('🚀 Making API request to Fal.ai...')
    
    const startTime = Date.now()
    
    const response = await axios.post(
      `https://fal.run/${FAL_VISION_MODEL}`,
      {
        image_url: TEST_IMAGE_URL,
        prompt: prompt,
      },
      {
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      },
    )

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`✅ API request successful (${duration}ms)`)
    console.log('')
    
    console.log('📄 Raw Response:')
    console.log(JSON.stringify(response.data, null, 2))
    console.log('')

    const aiResponse = response.data.output
    if (!aiResponse) {
      throw new Error('No output in response')
    }

    console.log('🤖 AI Response:')
    console.log(aiResponse)
    console.log('')

    // Try to parse as JSON
    try {
      const vehicleInfo = JSON.parse(aiResponse)
      console.log('✅ Successfully parsed JSON response:')
      console.log(`   Vehicle Type: ${vehicleInfo.vehicleType}`)
      console.log(`   License Plate: ${vehicleInfo.licensePlate}`)
      console.log(`   Confidence: ${vehicleInfo.confidence}`)
      if (vehicleInfo.extractedText) {
        console.log(`   Extracted Text: ${vehicleInfo.extractedText}`)
      }
      
      // Validate required fields
      if (vehicleInfo.vehicleType && vehicleInfo.licensePlate) {
        console.log('✅ All required fields present')
        console.log('🎉 Fal.ai integration test PASSED!')
      } else {
        console.log('⚠️  Missing required fields')
        console.log('❌ Fal.ai integration test FAILED!')
      }
      
    } catch (parseError) {
      console.log('⚠️  Failed to parse as JSON, attempting text extraction...')
      
      // Fallback text parsing
      const vehicleTypes = ['sedan', 'suv', 'hatchback', 'mpv', 'pickup', 'motorcycle', 'heavy_bike', 'van', 'truck']
      let detectedType = 'sedan'
      
      for (const type of vehicleTypes) {
        if (aiResponse.toLowerCase().includes(type.toLowerCase())) {
          detectedType = type
          break
        }
      }
      
      // Extract license plate using regex
      const platePatterns = [
        /[A-Z]{1,3}[-\s]?\d{1,4}[-\s]?[A-Z]?/g,
        /\b[A-Z0-9]{3,8}\b/g,
      ]
      
      let detectedPlate = ''
      for (const pattern of platePatterns) {
        const matches = aiResponse.match(pattern)
        if (matches && matches.length > 0) {
          detectedPlate = matches[0].replace(/[-\s]/g, '')
          break
        }
      }
      
      console.log('📝 Text extraction results:')
      console.log(`   Vehicle Type: ${detectedType}`)
      console.log(`   License Plate: ${detectedPlate}`)
      
      if (detectedType && detectedPlate) {
        console.log('✅ Text extraction successful')
        console.log('🎉 Fal.ai integration test PASSED (with fallback)!')
      } else {
        console.log('❌ Text extraction failed')
        console.log('❌ Fal.ai integration test FAILED!')
      }
    }

  } catch (error) {
    console.error('❌ API request failed:')
    console.error(`   Error: ${error.message}`)
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`)
    }
    
    console.log('❌ Fal.ai integration test FAILED!')
    process.exit(1)
  }
}

// Run the test
testFalAiIntegration().catch(console.error)
