#!/usr/bin/env node

/**
 * Test script to verify CORS configuration
 * This script tests the CORS setup by making requests from different origins
 */

import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config()

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  testOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://local.ft.tc',
    'https://ax.ft.tc',
    'http://unauthorized-domain.com', // This should fail
  ],
}

async function testCorsOrigin(origin) {
  try {
    console.log(`\n🧪 Testing CORS for origin: ${origin}`)

    // Test OPTIONS preflight request
    const optionsResponse = await axios({
      method: 'OPTIONS',
      url: `${TEST_CONFIG.baseUrl}/api/v1/orders/create-empty`,
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
      validateStatus: () => true, // Don't throw on non-2xx status
    })

    console.log(`   OPTIONS Status: ${optionsResponse.status}`)
    console.log(`   CORS Headers:`)
    console.log(
      `     Access-Control-Allow-Origin: ${optionsResponse.headers['access-control-allow-origin'] || 'Not set'}`,
    )
    console.log(
      `     Access-Control-Allow-Methods: ${optionsResponse.headers['access-control-allow-methods'] || 'Not set'}`,
    )
    console.log(
      `     Access-Control-Allow-Headers: ${optionsResponse.headers['access-control-allow-headers'] || 'Not set'}`,
    )

    // Check if origin is allowed
    const allowedOrigin = optionsResponse.headers['access-control-allow-origin']
    const isAllowed = allowedOrigin === origin || allowedOrigin === '*'

    console.log(`   ✅ Result: ${isAllowed ? 'ALLOWED' : 'BLOCKED'}`)

    return {
      origin,
      allowed: isAllowed,
      status: optionsResponse.status,
      headers: optionsResponse.headers,
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return {
      origin,
      allowed: false,
      error: error.message,
    }
  }
}

async function testAllOrigins() {
  console.log('🚀 Starting CORS Configuration Test')
  console.log(`📍 Testing against: ${TEST_CONFIG.baseUrl}`)
  console.log('='.repeat(60))

  const results = []

  for (const origin of TEST_CONFIG.testOrigins) {
    const result = await testCorsOrigin(origin)
    results.push(result)
  }

  // Summary
  console.log('\n📊 CORS Test Summary')
  console.log('='.repeat(60))

  const allowedOrigins = results.filter((r) => r.allowed)
  const blockedOrigins = results.filter((r) => !r.allowed)

  console.log(`✅ Allowed Origins (${allowedOrigins.length}):`)
  allowedOrigins.forEach((r) => console.log(`   - ${r.origin}`))

  console.log(`\n❌ Blocked Origins (${blockedOrigins.length}):`)
  blockedOrigins.forEach((r) => console.log(`   - ${r.origin}`))

  // Environment variables check
  console.log('\n🔧 Environment Variables:')
  console.log(`   CORS_LOCALHOST_PORTS: ${process.env.CORS_LOCALHOST_PORTS || 'Not set'}`)
  console.log(`   CORS_CUSTOM_DOMAINS: ${process.env.CORS_CUSTOM_DOMAINS || 'Not set'}`)
  console.log(`   NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'Not set'}`)

  return results
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAllOrigins()
    .then(() => {
      console.log('\n✨ CORS test completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error)
      process.exit(1)
    })
}

export { testAllOrigins, testCorsOrigin }
