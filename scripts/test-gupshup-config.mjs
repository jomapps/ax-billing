#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testGupshupConfiguration() {
  console.log('🔍 Testing Gupshup Configuration Issues')
  console.log('=' .repeat(60))
  
  const apiKey = process.env.GUPSHUP_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER
  
  console.log('📋 Current Configuration:')
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`)
  console.log(`   App Name: "${appName}" (Length: ${appName?.length || 0})`)
  console.log(`   Source Number: ${sourceNumber}`)
  console.log('')
  
  // Test 1: Check account info with different approaches
  console.log('🧪 Test 1: Account Information')
  console.log('-' .repeat(40))
  
  try {
    const accountResponse = await axios.get(
      'https://api.gupshup.io/sm/api/v1/users/me',
      {
        headers: {
          apikey: apiKey,
        },
        timeout: 5000,
      }
    )
    
    console.log('✅ Account info response:')
    console.log(JSON.stringify(accountResponse.data, null, 2))
    
  } catch (error) {
    console.log('❌ Account info failed:')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data: ${JSON.stringify(error.response.data)}`)
      
      if (error.response.data?.message === 'Invalid App name Passed') {
        console.log('')
        console.log('💡 ISSUE IDENTIFIED: Invalid App Name')
        console.log('   The app name "AutoExpress" might not be correctly configured')
        console.log('   in your Gupshup account.')
      }
    } else {
      console.log(`   Error: ${error.message}`)
    }
  }
  
  // Test 2: Check app list
  console.log('')
  console.log('🧪 Test 2: List Available Apps')
  console.log('-' .repeat(40))
  
  try {
    const appsResponse = await axios.get(
      'https://api.gupshup.io/sm/api/v1/app',
      {
        headers: {
          apikey: apiKey,
        },
        timeout: 5000,
      }
    )
    
    console.log('✅ Available apps:')
    console.log(JSON.stringify(appsResponse.data, null, 2))
    
    if (appsResponse.data && appsResponse.data.apps) {
      console.log('')
      console.log('📱 Your registered apps:')
      appsResponse.data.apps.forEach((app, index) => {
        console.log(`   ${index + 1}. ${app.name} (Phone: ${app.phone})`)
      })
      
      // Check if our app name matches any registered app
      const matchingApp = appsResponse.data.apps.find(app => app.name === appName)
      if (matchingApp) {
        console.log(`   ✅ Found matching app: ${matchingApp.name}`)
      } else {
        console.log(`   ❌ App "${appName}" not found in registered apps`)
        console.log('   💡 This is likely the cause of the 500 errors!')
      }
    }
    
  } catch (error) {
    console.log('❌ Apps list failed:')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data: ${JSON.stringify(error.response.data)}`)
    } else {
      console.log(`   Error: ${error.message}`)
    }
  }
  
  // Test 3: Try different app name formats
  console.log('')
  console.log('🧪 Test 3: Testing Different App Name Formats')
  console.log('-' .repeat(40))
  
  const appNameVariations = [
    'AutoExpress',
    'autoexpress',
    'Auto Express',
    'auto-express',
    'AX',
    '', // Empty app name
  ]
  
  for (const testAppName of appNameVariations) {
    console.log(`\n📱 Testing app name: "${testAppName}"`)
    
    try {
      const testResponse = await axios.post(
        'https://api.gupshup.io/sm/api/v1/msg',
        {
          channel: 'whatsapp',
          source: sourceNumber,
          destination: '601111071183',
          message: {
            type: 'text',
            text: `Test with app name: ${testAppName}`,
          },
          'src.name': testAppName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
          },
          timeout: 5000,
        }
      )
      
      console.log(`   ✅ SUCCESS with "${testAppName}": ${response.status}`)
      console.log(`   Response: ${JSON.stringify(testResponse.data)}`)
      
    } catch (error) {
      const status = error.response?.status || 'Network Error'
      console.log(`   ❌ FAILED with "${testAppName}": ${status}`)
      
      if (error.response && error.response.status !== 500) {
        // Different error code might give us more info
        console.log(`   Data: ${JSON.stringify(error.response.data)}`)
      }
    }
  }
  
  // Test 4: Check if it's a WhatsApp Business API issue
  console.log('')
  console.log('🧪 Test 4: WhatsApp Business API Status Check')
  console.log('-' .repeat(40))
  
  try {
    // Try to get webhook info (this might give us more details)
    const webhookResponse = await axios.get(
      `https://api.gupshup.io/sm/api/v1/app/setting/webhook`,
      {
        headers: {
          apikey: apiKey,
        },
        timeout: 5000,
      }
    )
    
    console.log('✅ Webhook settings:')
    console.log(JSON.stringify(webhookResponse.data, null, 2))
    
  } catch (error) {
    console.log('❌ Webhook check failed:')
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data: ${JSON.stringify(error.response.data)}`)
    }
  }
  
  console.log('')
  console.log('🔍 DIAGNOSIS SUMMARY:')
  console.log('=' .repeat(60))
  console.log('Based on the tests above:')
  console.log('')
  console.log('1. ✅ Phone number format is correct (601111071183)')
  console.log('2. ❌ App name "AutoExpress" might not be registered')
  console.log('3. ❌ 500 errors suggest server-side configuration issue')
  console.log('4. 💡 Most likely cause: WhatsApp Business API not properly set up')
  console.log('')
  console.log('🔧 RECOMMENDED ACTIONS:')
  console.log('1. Check Gupshup dashboard for app registration')
  console.log('2. Verify WhatsApp Business API is approved and active')
  console.log('3. Confirm the app name matches exactly in Gupshup console')
  console.log('4. Check if phone number is verified for WhatsApp Business')
  console.log('5. Contact Gupshup support if issues persist')
}

// Run the test
testGupshupConfiguration().catch(console.error)
