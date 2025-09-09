#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testCorrectedGupshupFormat() {
  console.log('🔍 Testing CORRECTED Gupshup API Format')
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
    console.log('🔧 Using CORRECTED Format:')
    console.log('   ✅ URL: https://api.gupshup.io/wa/api/v1/msg (was /sm/api/v1/msg)')
    console.log('   ✅ Content-Type: application/x-www-form-urlencoded (was application/json)')
    console.log('   ✅ Message: JSON string in form data (was nested object)')
    console.log('')
    
    const testMessage = `🧪 CORRECTED FORMAT TEST

Time: ${new Date().toISOString()}
Status: Testing form-encoded Gupshup API
Format: application/x-www-form-urlencoded`

    // Create the message object
    const messageObject = {
      type: 'text',
      text: testMessage,
    }
    
    // Create form data (same as our corrected WhatsApp service)
    const formData = new URLSearchParams()
    formData.append('channel', 'whatsapp')
    formData.append('source', sourceNumber)
    formData.append('destination', testNumber)
    formData.append('message', JSON.stringify(messageObject))
    formData.append('src.name', appName)
    
    console.log('📤 Sending with corrected format...')
    console.log('📋 Form Data:')
    console.log(`   channel: whatsapp`)
    console.log(`   source: ${sourceNumber}`)
    console.log(`   destination: ${testNumber}`)
    console.log(`   message: ${JSON.stringify(messageObject)}`)
    console.log(`   src.name: ${appName}`)
    console.log('')
    
    const response = await axios.post(
      'https://api.gupshup.io/wa/api/v1/msg', // Corrected URL
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded', // Corrected content type
          apikey: apiKey,
        },
        timeout: 10000,
      }
    )
    
    console.log('🎉 SUCCESS! Gupshup API call worked!')
    console.log(`   Status: ${response.status}`)
    console.log(`   Response:`)
    console.log(JSON.stringify(response.data, null, 2))
    
    if (response.data.status === 'submitted') {
      console.log('')
      console.log('✅ Message submitted successfully!')
      console.log('   The corrected format fixed the issue!')
      console.log('   WhatsApp notifications should now work properly.')
    } else {
      console.log('')
      console.log('⚠️ Message not submitted:')
      console.log(`   Status: ${response.data.status}`)
      console.log(`   Message: ${response.data.message || 'No message'}`)
    }
    
  } catch (error) {
    console.error('❌ Corrected format test failed:')
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Status Text: ${error.response.statusText}`)
      console.error(`   Data: ${JSON.stringify(error.response.data)}`)
      
      if (error.response.status === 500) {
        console.log('')
        console.log('💡 Still getting 500 error:')
        console.log('   Even with the corrected format, we\'re getting a 500 error.')
        console.log('   This suggests the issue is with the Gupshup account setup,')
        console.log('   not our API format.')
      } else if (error.response.status === 400) {
        console.log('')
        console.log('💡 400 Error Analysis:')
        console.log('   This could indicate:')
        console.log('   - Invalid phone number format')
        console.log('   - Invalid app name')
        console.log('   - Missing required parameters')
        console.log('   - Account not properly configured')
      } else if (error.response.status === 401) {
        console.log('')
        console.log('💡 401 Error Analysis:')
        console.log('   Authentication failed - check API key')
      }
      
    } else if (error.request) {
      console.error('   Network error - no response received')
      console.error(`   Error: ${error.message}`)
    } else {
      console.error(`   Request setup error: ${error.message}`)
    }
  }
}

// Test account info with corrected format
async function testAccountInfo() {
  console.log('')
  console.log('🔍 Testing Account Info (to verify API key)')
  console.log('-' .repeat(40))
  
  try {
    const response = await axios.get(
      'https://api.gupshup.io/wa/api/v1/users/me', // Try the corrected base URL
      {
        headers: {
          apikey: process.env.GUPSHUP_API_KEY,
        },
        timeout: 5000,
      }
    )
    
    console.log('✅ Account info (corrected URL):')
    console.log(JSON.stringify(response.data, null, 2))
    
  } catch (error) {
    console.log('❌ Account info failed (corrected URL):')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
    
    // Try the old URL for comparison
    try {
      console.log('')
      console.log('🔄 Trying old URL for comparison...')
      const oldResponse = await axios.get(
        'https://api.gupshup.io/sm/api/v1/users/me',
        {
          headers: {
            apikey: process.env.GUPSHUP_API_KEY,
          },
          timeout: 5000,
        }
      )
      
      console.log('✅ Account info (old URL):')
      console.log(JSON.stringify(oldResponse.data, null, 2))
      
    } catch (oldError) {
      console.log('❌ Account info failed (old URL too):')
      if (oldError.response) {
        console.log(`   Status: ${oldError.response.status}`)
        console.log(`   Data: ${JSON.stringify(oldError.response.data)}`)
      }
    }
  }
}

// Run the tests
console.log('Starting corrected Gupshup API format tests...\n')
await testCorrectedGupshupFormat()
await testAccountInfo()

console.log('\n' + '=' .repeat(60))
console.log('🏁 Corrected format test completed!')
console.log('')
console.log('💡 Key Changes Made:')
console.log('   1. URL: /wa/api/v1/msg instead of /sm/api/v1/msg')
console.log('   2. Content-Type: application/x-www-form-urlencoded')
console.log('   3. Message: JSON string in form data')
console.log('   4. All parameters as form fields')
console.log('')
console.log('🎯 If this test succeeds, WhatsApp notifications will work!')
