#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testUrlConstruction() {
  console.log('🔍 Testing URL Construction for Fal.ai Access')
  console.log('=' .repeat(60))
  
  const publicBucketUrl = process.env.S3_PUBLIC_BUCKET || 'https://media.ft.tc'
  const testFilename = 'vehicle-AX-20250908-5336-1757438371929.jpg'
  
  // Test different URL construction scenarios
  const testUrls = [
    // Direct public URL (what we expect to work)
    `${publicBucketUrl}/media/${testFilename}`,
    
    // Alternative constructions
    `${publicBucketUrl}/${testFilename}`,
    
    // The known working URL from our previous tests
    'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'
  ]
  
  console.log('📋 Configuration:')
  console.log(`   S3_PUBLIC_BUCKET: ${publicBucketUrl}`)
  console.log(`   Test Filename: ${testFilename}`)
  console.log('')
  
  for (let i = 0; i < testUrls.length; i++) {
    const testUrl = testUrls[i]
    console.log(`🧪 Test ${i + 1}: ${testUrl}`)
    
    try {
      // Test if the URL is accessible
      const response = await axios.head(testUrl, { timeout: 10000 })
      console.log(`   ✅ URL accessible (${response.status})`)
      
      // Test with Fal.ai if accessible
      if (response.status === 200) {
        console.log('   🚀 Testing with Fal.ai...')
        await testWithFalAi(testUrl)
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ URL not accessible (${error.response.status})`)
      } else {
        console.log(`   ❌ Network error: ${error.message}`)
      }
    }
    console.log('')
  }
}

async function testWithFalAi(imageUrl) {
  const falApiKey = process.env.FAL_KEY
  const falVisionModel = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'
  
  if (!falApiKey) {
    console.log('   ⚠️  No Fal.ai API key configured')
    return
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
        "confidence": 0.95
      }
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
        timeout: 30000
      },
    )

    console.log('   ✅ Fal.ai processing successful!')
    console.log(`   📋 Result: ${response.data.output}`)
    
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ Fal.ai error (${error.response.status}): ${error.response.data?.detail || error.message}`)
      if (error.response.data) {
        console.log(`   📄 Error details:`, JSON.stringify(error.response.data, null, 2))
      }
    } else {
      console.log(`   ❌ Fal.ai network error: ${error.message}`)
    }
  }
}

// Run the test
testUrlConstruction().catch(console.error)
