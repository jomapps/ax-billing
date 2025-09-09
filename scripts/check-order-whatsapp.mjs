#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function checkOrderWhatsApp() {
  console.log('🔍 Checking Order WhatsApp Data')
  console.log('='.repeat(60))

  try {
    const baseUrl = 'http://localhost:3001'
    const orderId = 'AX-20250909-3309' // From the recent logs

    console.log(`📋 Fetching order data for: ${orderId}`)

    // Try to get order data via API
    const response = await axios.get(
      `${baseUrl}/api/orders?where[orderID][equals]=${orderId}&depth=3`,
    )

    if (response.data && response.data.docs && response.data.docs.length > 0) {
      const order = response.data.docs[0]

      console.log('✅ Order found:')
      console.log(`   Order ID: ${order.orderID}`)
      console.log(`   Order Stage: ${order.orderStage}`)
      console.log(`   WhatsApp Linked: ${order.whatsappLinked}`)
      console.log(`   WhatsApp Number: ${order.whatsappNumber || 'NOT SET'}`)
      console.log(
        `   Customer: ${order.customer ? (typeof order.customer === 'string' ? order.customer : order.customer.id) : 'NOT SET'}`,
      )

      if (order.customer && typeof order.customer === 'object') {
        console.log('👤 Customer Details:')
        console.log(`   Name: ${order.customer.name || 'N/A'}`)
        console.log(`   Phone: ${order.customer.phone || 'N/A'}`)
        console.log(`   Email: ${order.customer.email || 'N/A'}`)
        console.log(`   WhatsApp Verified: ${order.customer.whatsappVerified || false}`)
      }

      console.log('')

      // Check Gupshup configuration
      console.log('🔧 Gupshup Configuration:')
      console.log(
        `   API Key: ${process.env.GUPSHUP_API_KEY ? process.env.GUPSHUP_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`,
      )
      console.log(`   App Name: ${process.env.GUPSHUP_APP_NAME || 'NOT SET'}`)
      console.log(`   Source Number: ${process.env.GUPSHUP_SOURCE_NUMBER || 'NOT SET'}`)

      console.log('')

      // Analysis
      if (!order.whatsappLinked && !order.whatsappNumber) {
        console.log('💡 ISSUE IDENTIFIED:')
        console.log('   ❌ This order has NO WhatsApp number associated with it')
        console.log('   ❌ The order is not linked to any WhatsApp conversation')
        console.log('')
        console.log('🔧 Why this happens:')
        console.log('   1. This order was created directly (not via WhatsApp QR scan)')
        console.log("   2. Customer hasn't scanned the QR code yet")
        console.log('   3. Order is in "empty" or "initiated" stage without WhatsApp linking')
        console.log('')
        console.log('🚀 Solutions:')
        console.log('   A. Skip WhatsApp notification for orders without phone numbers')
        console.log('   B. Use a test number for development')
        console.log('   C. Ensure QR code is scanned before vehicle capture')

        // Test with a default number
        console.log('')
        console.log('🧪 Testing with default test number...')
        const testNumber = process.env.GUPSHUP_TEST_CUSTOMER_NUMBER || '601111071183'
        console.log(`   Test Number: ${testNumber}`)

        // Test WhatsApp message sending
        try {
          const testMessage = `📸 *Vehicle Information Captured* (TEST)

Order ID: *${orderId}*
Vehicle: sedan
License Plate: *TEST-123*

Our team is now selecting the appropriate services for your vehicle. You'll receive an update shortly!`

          const whatsappResponse = await axios.post(
            'https://api.gupshup.io/sm/api/v1/msg',
            {
              channel: 'whatsapp',
              source: process.env.GUPSHUP_SOURCE_NUMBER,
              destination: testNumber,
              message: {
                type: 'text',
                text: testMessage,
              },
              'src.name': process.env.GUPSHUP_APP_NAME,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                apikey: process.env.GUPSHUP_API_KEY,
              },
            },
          )

          console.log('   ✅ Test WhatsApp message sent successfully!')
          console.log(`   Response: ${JSON.stringify(whatsappResponse.data)}`)
        } catch (whatsappError) {
          console.log('   ❌ Test WhatsApp message failed:')
          if (whatsappError.response) {
            console.log(`   Status: ${whatsappError.response.status}`)
            console.log(`   Data: ${JSON.stringify(whatsappError.response.data)}`)
          } else {
            console.log(`   Error: ${whatsappError.message}`)
          }
        }
      } else if (order.whatsappNumber) {
        console.log('✅ Order has WhatsApp number - should work fine')
        console.log('   The 500 error might be a temporary Gupshup service issue')
      }
    } else {
      console.log('❌ Order not found or API returned empty result')
    }
  } catch (error) {
    console.error('❌ Failed to check order:', error.message)
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Data: ${error.response.data}`)
    }
  }
}

// Run the check
checkOrderWhatsApp().catch(console.error)
