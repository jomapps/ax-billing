#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testPhoneNumberFormats() {
  console.log('🔍 Testing Phone Number Formats for Gupshup')
  console.log('=' .repeat(60))
  
  const apiKey = process.env.GUPSHUP_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER
  
  // Test different phone number formats
  const testNumbers = [
    '601111071183',      // Current format (from logs)
    '+601111071183',     // With + prefix
    '60111107118',       // Shorter version
    '1111071183',        // Without country code
    '+60111107118',      // Different length with +
  ]
  
  console.log('📋 Configuration:')
  console.log(`   API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}`)
  console.log(`   App Name: ${appName || 'NOT SET'}`)
  console.log(`   Source Number: ${sourceNumber || 'NOT SET'}`)
  console.log('')
  
  if (!apiKey || !appName || !sourceNumber) {
    console.log('❌ Missing required Gupshup configuration')
    return
  }
  
  // Test our phone number formatting logic first
  console.log('🧪 Testing Our Phone Number Formatting Logic:')
  console.log('-' .repeat(40))
  
  // Simulate the formatting logic from WhatsAppService
  function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Invalid phone number provided')
    }
    
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present (assuming Malaysia +60)
    if (!cleaned.startsWith('60') && cleaned.length === 10) {
      cleaned = '60' + cleaned.substring(1) // Remove leading 0 and add 60
    }
    
    return cleaned
  }
  
  function isValidWhatsAppNumber(phoneNumber) {
    const formatted = formatPhoneNumber(phoneNumber)
    // Malaysian numbers should be 11-12 digits starting with 60
    return /^60\d{9,10}$/.test(formatted)
  }
  
  const originalNumbers = [
    '0111071183',        // Malaysian format with leading 0
    '601111071183',      // Already formatted
    '+601111071183',     // With international prefix
    '111071183',         // Without leading 0 or country code
  ]
  
  originalNumbers.forEach(num => {
    try {
      const formatted = formatPhoneNumber(num)
      const isValid = isValidWhatsAppNumber(num)
      console.log(`   ${num.padEnd(15)} → ${formatted.padEnd(15)} (Valid: ${isValid})`)
    } catch (error) {
      console.log(`   ${num.padEnd(15)} → ERROR: ${error.message}`)
    }
  })
  
  console.log('')
  console.log('🚀 Testing Different Formats with Gupshup API:')
  console.log('-' .repeat(40))
  
  for (const testNumber of testNumbers) {
    console.log(`\n📱 Testing: ${testNumber}`)
    
    try {
      const testMessage = `🧪 Phone format test
      
Number: ${testNumber}
Time: ${new Date().toISOString()}`

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
      
      const response = await axios.post(
        'https://api.gupshup.io/sm/api/v1/msg',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
          },
          timeout: 8000,
        }
      )
      
      console.log(`   ✅ SUCCESS: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(response.data)}`)
      
      if (response.data.status === 'submitted') {
        console.log(`   🎉 Message submitted successfully with format: ${testNumber}`)
      }
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.response?.status || 'Network Error'}`)
      
      if (error.response) {
        console.log(`   Data: ${JSON.stringify(error.response.data)}`)
        
        // Check for specific error patterns
        if (error.response.status === 400) {
          console.log(`   💡 400 Error suggests invalid phone number format`)
        } else if (error.response.status === 500) {
          console.log(`   💡 500 Error suggests server issue (not phone format)`)
        }
      } else {
        console.log(`   Error: ${error.message}`)
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('')
  console.log('🔍 Checking Gupshup Documentation Format:')
  console.log('-' .repeat(40))
  console.log('   According to Gupshup docs, phone numbers should be:')
  console.log('   - Without + prefix')
  console.log('   - With country code')
  console.log('   - Example: 919876543210 (for India)')
  console.log('   - For Malaysia: 60XXXXXXXXX')
  console.log('')
  console.log('   Our current format: 601111071183')
  console.log('   This should be correct for Malaysian numbers')
  
  // Test with a known working format from Gupshup examples
  console.log('')
  console.log('🧪 Testing with Gupshup Example Format:')
  console.log('-' .repeat(40))
  
  // Try the exact format from our environment
  const envTestNumber = process.env.GUPSHUP_TEST_CUSTOMER_NUMBER
  if (envTestNumber) {
    console.log(`\n📱 Testing ENV number: ${envTestNumber}`)
    
    try {
      const response = await axios.post(
        'https://api.gupshup.io/sm/api/v1/msg',
        {
          channel: 'whatsapp',
          source: sourceNumber,
          destination: envTestNumber,
          message: {
            type: 'text',
            text: '🧪 Final test with ENV number',
          },
          'src.name': appName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
          },
          timeout: 8000,
        }
      )
      
      console.log(`   ✅ ENV number test: ${response.status}`)
      console.log(`   Response: ${JSON.stringify(response.data)}`)
      
    } catch (error) {
      console.log(`   ❌ ENV number failed: ${error.response?.status || 'Network Error'}`)
      if (error.response) {
        console.log(`   Data: ${JSON.stringify(error.response.data)}`)
      }
    }
  }
}

// Run the test
testPhoneNumberFormats().catch(console.error)
