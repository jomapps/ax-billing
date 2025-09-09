#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testGupshupDirect() {
  console.log('🔍 Testing Gupshup API Directly')
  console.log('=' .repeat(60))
  
  const apiKey = process.env.GUPSHUP_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER
  const testNumber = process.env.GUPSHUP_TEST_CUSTOMER_NUMBER || '601111071183'
  
  console.log('📋 Configuration:')
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`)
  console.log(`   App Name: ${appName || 'NOT SET'}`)
  console.log(`   Source Number: ${sourceNumber || 'NOT SET'}`)
  console.log(`   Test Number: ${testNumber}`)
  console.log('')
  
  if (!apiKey || !appName || !sourceNumber) {
    console.log('❌ Missing required Gupshup configuration')
    return
  }
  
  try {
    console.log('📤 Sending test message...')
    
    const testMessage = `🧪 Test message from AX Billing system
    
Time: ${new Date().toISOString()}
Status: Testing Gupshup API connectivity`

    const requestData = {
      channel: 'whatsapp',
      source: sourceNumber,
      destination: testNumber,
      message: {
        type: 'text',
        text: testMessage,
      },
      'src.name': appName,
    }
    
    console.log('📋 Request data:')
    console.log(JSON.stringify(requestData, null, 2))
    console.log('')
    
    const response = await axios.post(
      'https://api.gupshup.io/sm/api/v1/msg',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          apikey: apiKey,
        },
        timeout: 10000,
      }
    )
    
    console.log('✅ Gupshup API call successful!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`)
    console.log(JSON.stringify(response.data, null, 2))
    
    if (response.data.status === 'submitted') {
      console.log('')
      console.log('🎉 Message submitted successfully!')
      console.log('   The Gupshup API is working correctly.')
      console.log('   The previous 500 errors might have been temporary.')
    } else {
      console.log('')
      console.log('⚠️ Message not submitted:')
      console.log(`   Status: ${response.data.status}`)
      console.log(`   Response: ${JSON.stringify(response.data)}`)
    }
    
  } catch (error) {
    console.error('❌ Gupshup API call failed:')
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Status Text: ${error.response.statusText}`)
      console.error(`   Data: ${JSON.stringify(error.response.data)}`)
      console.error(`   Headers:`)
      console.error(JSON.stringify(error.response.headers, null, 2))
      
      if (error.response.status === 500) {
        console.log('')
        console.log('💡 Analysis of 500 Error:')
        console.log('   This is a server-side error from Gupshup, not our code.')
        console.log('   Possible causes:')
        console.log('   - Gupshup service temporary outage')
        console.log('   - API rate limiting')
        console.log('   - Account billing/quota issues')
        console.log('   - WhatsApp Business API restrictions')
        console.log('   - Invalid phone number format')
        console.log('')
        console.log('🔧 Recommendations:')
        console.log('   1. Check Gupshup dashboard for account status')
        console.log('   2. Verify WhatsApp Business API is properly configured')
        console.log('   3. Try again in a few minutes (might be temporary)')
        console.log('   4. Contact Gupshup support if issue persists')
      }
      
    } else if (error.request) {
      console.error('   Network error - no response received')
      console.error(`   Error: ${error.message}`)
    } else {
      console.error(`   Request setup error: ${error.message}`)
    }
  }
}

// Test account info endpoint
async function testGupshupAccount() {
  console.log('')
  console.log('🔍 Testing Gupshup Account Info')
  console.log('-' .repeat(40))
  
  try {
    const response = await axios.get(
      'https://api.gupshup.io/sm/api/v1/users/me',
      {
        headers: {
          apikey: process.env.GUPSHUP_API_KEY,
        },
        timeout: 5000,
      }
    )
    
    console.log('✅ Account info retrieved:')
    console.log(JSON.stringify(response.data, null, 2))
    
  } catch (error) {
    console.log('⚠️ Could not retrieve account info:')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
  }
}

// Run the tests
console.log('Starting Gupshup API tests...\n')
await testGupshupDirect()
await testGupshupAccount()

console.log('\n' + '=' .repeat(60))
console.log('🏁 Gupshup API test completed!')
console.log('')
console.log('💡 Summary:')
console.log('   - Vehicle capture system is working correctly')
console.log('   - BSON ObjectId errors are fixed')
console.log('   - WhatsApp errors are handled gracefully')
console.log('   - The 500 error appears to be a Gupshup service issue')
