#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testUrlConstruction() {
  console.log('🔍 Testing URL Construction for Fal.ai Access')
  console.log('='.repeat(60))

  const publicBucketUrl = process.env.S3_PUBLIC_BUCKET || 'https://media.ft.tc'
  const testFilename = 'vehicle-AX-20250908-5336-1757438371929.jpg'

  // Test different URL construction scenarios
  const testUrls = [
    // Direct public URL (what we expect to work)
    `${publicBucketUrl}/media/${testFilename}`,

    // Alternative constructions
    `${publicBucketUrl}/${testFilename}`,

    // The known working URL from our previous tests
    'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg',
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

      // Test with BAML API if accessible
      if (response.status === 200) {
        console.log('   🚀 Testing with BAML API...')
        await testWithBamlApi(testUrl)
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

async function testWithBamlApi(imageUrl) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const response = await axios.post(
      `${appUrl}/api/v1/ai/analyze-vehicle`,
      {
        imageUrl: imageUrl,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    )

    console.log('   ✅ BAML API processing successful!')
    console.log(`   📋 Vehicle Type: ${response.data.analysis?.vehicle_type || 'N/A'}`)
    console.log(`   📋 License Plate: ${response.data.analysis?.license_plate || 'N/A'}`)
    console.log(`   📋 AI Provider: ${response.data.metadata?.aiProvider || 'N/A'}`)
  } catch (error) {
    if (error.response) {
      console.log(
        `   ❌ BAML API error (${error.response.status}): ${error.response.data?.error || error.message}`,
      )
      if (error.response.data) {
        console.log(`   📄 Error details:`, JSON.stringify(error.response.data, null, 2))
      }
    } else {
      console.log(`   ❌ BAML API network error: ${error.message}`)
    }
  }
}

// Optional direct FAL AI test (gated behind environment flag)
async function testWithDirectFalAi(imageUrl) {
  const allowDirectFalTests = process.env.ALLOW_DIRECT_FAL_TESTS === 'true'

  if (!allowDirectFalTests) {
    console.log('   ⏭️  Direct FAL AI tests disabled (set ALLOW_DIRECT_FAL_TESTS=true to enable)')
    return
  }

  const falApiKey = process.env.FAL_KEY
  const falVisionModel = process.env.FAL_VISION_MODEL || 'fal-ai/llavav15-13b'

  if (!falApiKey) {
    console.log('   ⚠️  No FAL_KEY configured for direct tests')
    return
  }

  try {
    const response = await axios.post(
      `https://fal.run/${falVisionModel}`,
      {
        image_url: imageUrl,
        prompt: 'Analyze this vehicle image and identify the vehicle type and license plate.',
      },
      {
        headers: {
          Authorization: `Key ${falApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    )

    console.log('   ✅ Direct FAL AI processing successful!')
    console.log(`   📋 Result: ${response.data.output?.substring(0, 100)}...`)
  } catch (error) {
    console.log(`   ❌ Direct FAL AI error: ${error.message}`)
  }
}

// Run the test
testUrlConstruction().catch(console.error)
