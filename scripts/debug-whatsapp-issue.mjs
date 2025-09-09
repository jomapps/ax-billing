#!/usr/bin/env node

import { getPayload } from 'payload'
import config from '@payload-config'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function debugWhatsAppIssue() {
  console.log('🔍 Debugging WhatsApp Issue')
  console.log('='.repeat(60))

  try {
    const payload = await getPayload({ config })
    const orderId = 'AX-20250908-5336'

    console.log('📋 Checking order data...')

    // Find the order with full customer data
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      depth: 2, // Get related customer data
      limit: 1,
    })

    if (orderResult.docs.length === 0) {
      console.log('❌ Order not found!')
      return
    }

    const order = orderResult.docs[0]

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
    console.log('🔧 Checking Gupshup Configuration:')
    console.log(
      `   API Key: ${process.env.GUPSHUP_API_KEY ? process.env.GUPSHUP_API_KEY.substring(0, 10) + '...' : 'NOT SET'}`,
    )
    console.log(`   App Name: ${process.env.GUPSHUP_APP_NAME || 'NOT SET'}`)
    console.log(`   Source Number: ${process.env.GUPSHUP_SOURCE_NUMBER || 'NOT SET'}`)

    console.log('')

    // Test phone number formatting if we have a WhatsApp number
    if (order.whatsappNumber) {
      console.log('📱 Testing Phone Number Formatting:')

      // Import WhatsApp service
      const { WhatsAppService } = await import('../src/lib/whatsapp/whatsapp-service.js')
      const whatsappService = new WhatsAppService()

      try {
        const formatted = whatsappService.formatPhoneNumber(order.whatsappNumber)
        const isValid = whatsappService.isValidWhatsAppNumber(order.whatsappNumber)

        console.log(`   Original: ${order.whatsappNumber}`)
        console.log(`   Formatted: ${formatted}`)
        console.log(`   Valid: ${isValid}`)

        if (!isValid) {
          console.log('   ❌ Invalid phone number format!')
        }
      } catch (error) {
        console.log(`   ❌ Phone formatting error: ${error.message}`)
      }
    } else {
      console.log('⚠️  No WhatsApp number found in order!')
      console.log('   This is likely why the WhatsApp message failed.')
      console.log('   The order needs to be linked to a WhatsApp conversation first.')
    }

    console.log('')

    // Check if this is a new order that hasn't been linked to WhatsApp yet
    if (!order.whatsappLinked && !order.whatsappNumber) {
      console.log('💡 Analysis:')
      console.log("   This appears to be a new order that hasn't been linked to WhatsApp yet.")
      console.log('   The vehicle capture process is trying to send a WhatsApp message,')
      console.log("   but there's no WhatsApp number associated with this order.")
      console.log('')
      console.log('🔧 Possible Solutions:')
      console.log('   1. Skip WhatsApp notification for orders without WhatsApp numbers')
      console.log('   2. Use a test/default number for development')
      console.log('   3. Ensure the order is properly linked to WhatsApp before vehicle capture')
    }
  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

// Run the debug
debugWhatsAppIssue().catch(console.error)
