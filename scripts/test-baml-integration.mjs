#!/usr/bin/env node

import { config } from 'dotenv'
import fetch from 'node-fetch'

// Load environment variables
config()

async function testBAMLIntegration() {
  console.log('🧪 Testing BAML Integration via API...\n')

  // Check if OpenRouter API key is available
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('❌ OPENROUTER_API_KEY not found in environment variables')
    console.log('   Please add OPENROUTER_API_KEY to your .env file to test BAML integration')
    return
  }

  console.log('✅ OpenRouter API key found')

  // Test image URL (using our test vehicle image)
  const testImageUrl = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'

  try {
    console.log('\n📸 Testing vehicle image analysis via API...')
    console.log(`Image URL: ${testImageUrl}`)

    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/v1/ai/analyze-vehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        generateRecommendations: true,
        includeCostEstimate: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()

    if (result.success && result.analysis) {
      console.log('✅ Vehicle analysis successful!')
      console.log('Analysis result:', JSON.stringify(result.analysis, null, 2))

      if (result.serviceRecommendations && result.serviceRecommendations.length > 0) {
        console.log('✅ Service recommendations included!')
        console.log('Recommendations:', result.serviceRecommendations)
      }

      if (result.costEstimate) {
        console.log('✅ Cost estimation included!')
        console.log('Cost estimate:', result.costEstimate)
      }

      // Validate BAML-specific fields
      console.log('\n🔍 Validating BAML integration:')
      console.log(`   Vehicle Type: ${result.analysis.vehicle_type}`)
      console.log(`   License Plate: ${result.analysis.license_plate || 'Not detected'}`)
      console.log(`   Confidence Score: ${result.analysis.confidence_score || 'Not provided'}`)
      console.log(`   Damages Found: ${result.analysis.damages?.length || 0}`)
      console.log(`   AI Provider: ${result.metadata?.aiProvider || 'Unknown'}`)
    } else {
      console.log('❌ Vehicle analysis failed:', result.error || 'Unknown error')
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }

  console.log('\n🏁 BAML integration test completed')
}

// Test with different configurations
async function testDifferentConfigurations() {
  console.log('\n🔧 Testing different analysis configurations...')

  const testImageUrl = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'

  try {
    // Test with only analysis
    console.log('\n📸 Testing analysis only...')
    const analysisOnly = await fetch('http://localhost:3000/api/v1/ai/analyze-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: testImageUrl }),
    })

    if (analysisOnly.ok) {
      const result = await analysisOnly.json()
      console.log('✅ Analysis only successful!')
      console.log('Result:', JSON.stringify(result.analysis, null, 2))
    }

    // Test with recommendations only
    console.log('\n🔧 Testing with recommendations...')
    const withRecommendations = await fetch('http://localhost:3000/api/v1/ai/analyze-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        includeRecommendations: true,
      }),
    })

    if (withRecommendations.ok) {
      const result = await withRecommendations.json()
      console.log('✅ Analysis with recommendations successful!')
      console.log('Recommendations:', result.serviceRecommendations)
    }
  } catch (error) {
    console.error('❌ Configuration test failed:', error)
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting BAML Integration Tests')
  console.log('   Make sure the Next.js server is running on localhost:3000\n')

  await testBAMLIntegration()
  await testDifferentConfigurations()

  console.log('\n🏁 All tests completed!')
}

runTests().catch(console.error)
