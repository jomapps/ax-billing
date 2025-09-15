#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'
const ALLOW_DIRECT_FAL_TESTS = process.env.ALLOW_DIRECT_FAL_TESTS === 'true'

async function testVehicleAnalysisIntegration() {
  console.log('🔍 Testing Vehicle Analysis Integration via BAML API')
  console.log('='.repeat(60))

  console.log(`📋 Configuration:`)
  console.log(`   API URL: ${NEXT_PUBLIC_APP_URL}`)
  console.log(`   Test Image: ${TEST_IMAGE_URL}`)
  console.log(`   Direct FAL Tests: ${ALLOW_DIRECT_FAL_TESTS ? 'Enabled' : 'Disabled'}`)
  console.log('')

  try {
    console.log('🚀 Making API request to BAML vehicle analysis endpoint...')

    const startTime = Date.now()

    const response = await axios.post(
      `${NEXT_PUBLIC_APP_URL}/api/v1/ai/analyze-vehicle`,
      {
        imageUrl: TEST_IMAGE_URL,
      },
      {
        headers: {
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

    const analysisResult = response.data
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error}`)
    }

    console.log('🤖 Vehicle Analysis Result:')
    console.log(JSON.stringify(analysisResult.analysis, null, 2))
    console.log('')

    const analysis = analysisResult.analysis
    console.log('✅ Successfully received analysis response:')
    console.log(`   Vehicle Type: ${analysis.vehicle_type}`)
    console.log(`   Make: ${analysis.make || 'N/A'}`)
    console.log(`   Model: ${analysis.model || 'N/A'}`)
    console.log(`   License Plate: ${analysis.license_plate || 'N/A'}`)
    console.log(`   Overall Condition: ${analysis.overall_condition}`)
    console.log(`   Damages Found: ${analysis.damages?.length || 0}`)
    console.log(`   Confidence Score: ${analysis.confidence_score || 'N/A'}`)
    console.log(`   AI Provider: ${analysisResult.metadata?.aiProvider || 'N/A'}`)

    // Validate required fields
    if (analysis.vehicle_type && analysis.overall_condition) {
      console.log('✅ All required fields present')
      console.log('🎉 Vehicle analysis integration test PASSED!')
    } else {
      console.log('⚠️  Missing required fields')
      console.log('❌ Vehicle analysis integration test FAILED!')
    }
  } catch (error) {
    console.error('❌ API request failed:')
    console.error(`   Error: ${error.message}`)

    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`)
    }

    console.log('❌ Vehicle analysis integration test FAILED!')
    process.exit(1)
  }
}

// Optional direct FAL AI test (gated behind environment flag)
async function testDirectFalAi() {
  if (!ALLOW_DIRECT_FAL_TESTS) {
    console.log('⏭️  Direct FAL AI tests disabled (set ALLOW_DIRECT_FAL_TESTS=true to enable)')
    return
  }

  const FAL_KEY = process.env.FAL_KEY
  const FAL_VISION_MODEL = process.env.FAL_VISION_MODEL || 'fal-ai/moondream2/visual-query'

  if (!FAL_KEY) {
    console.log('⚠️  FAL_KEY not configured, skipping direct FAL tests')
    return
  }

  console.log('')
  console.log('🔍 Testing Direct FAL AI Integration (Optional)')
  console.log('='.repeat(60))

  try {
    const response = await axios.post(
      `https://fal.run/${FAL_VISION_MODEL}`,
      {
        image_url: TEST_IMAGE_URL,
        prompt: 'Analyze this vehicle image and identify the vehicle type and license plate.',
      },
      {
        headers: {
          Authorization: `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    )

    console.log('✅ Direct FAL AI test successful')
    console.log('📄 Response:', response.data.output?.substring(0, 200) + '...')
  } catch (error) {
    console.error('❌ Direct FAL AI test failed:', error.message)
  }
}

// Run the tests
async function runTests() {
  await testVehicleAnalysisIntegration()
  await testDirectFalAi()
}

runTests().catch(console.error)
