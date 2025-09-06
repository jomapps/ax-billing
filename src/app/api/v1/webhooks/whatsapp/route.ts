import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import { OrderLinkingService } from '@/lib/whatsapp/order-linking-service'
import { QRCodeService } from '@/lib/whatsapp/qr-service'

const whatsappService = new WhatsAppService()
const orderLinkingService = new OrderLinkingService()
const qrService = new QRCodeService()

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.text()
    const signature = request.headers.get('x-gupshup-signature')

    // Debug: Log signature verification details
    console.log('=== WEBHOOK SIGNATURE DEBUG ===')
    console.log('Received signature header:', signature)
    console.log('Webhook secret from env:', process.env.GUPSHUP_WEBHOOK_SECRET)
    console.log('Request body length:', body.length)
    console.log('Request body preview:', body.substring(0, 200))

    // Verify webhook signature
    if (!whatsappService.verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature')
      console.log(
        'Expected signature would be:',
        require('crypto-js')
          .HmacSHA256(body, process.env.GUPSHUP_WEBHOOK_SECRET || '')
          .toString(),
      )
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Webhook signature verified successfully')

    const webhookData = JSON.parse(body)
    console.log('WhatsApp webhook received:', webhookData)

    // Process different message types
    switch (webhookData.type) {
      case 'message':
        await handleIncomingMessage(webhookData, payload)
        break
      case 'message-event':
        await handleMessageStatus(webhookData, payload)
        break
      default:
        console.log('Unknown webhook type:', webhookData.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleIncomingMessage(data: any, payload: any) {
  try {
    const { mobile, text, name, id: messageId, timestamp } = data.payload

    console.log(`Processing message from ${mobile}: ${text}`)

    // Format phone number
    const formattedNumber = whatsappService.formatPhoneNumber(mobile)

    // Extract order ID from message
    const orderId = orderLinkingService.extractOrderId(text)

    if (!orderId) {
      // No order ID found - send error message
      await whatsappService.sendMessage(
        formattedNumber,
        '❌ Invalid QR code. Please scan the QR code provided by our staff to start your service.',
      )

      // Log the message anyway
      await logMessage(payload, {
        whatsappNumber: formattedNumber,
        messageId,
        direction: 'inbound',
        messageType: 'text',
        content: text,
        status: 'received',
        timestamp: new Date(parseInt(timestamp)),
      })
      return
    }

    // Validate that the order exists and can be linked
    const isValidOrder = await orderLinkingService.validateOrderForLinking(orderId)
    if (!isValidOrder) {
      await whatsappService.sendMessage(
        formattedNumber,
        `❌ Order ${orderId} is not available for linking. Please contact our staff for assistance.`,
      )
      return
    }

    // Find or create user and link to order
    let user = await orderLinkingService.findUserByWhatsApp(formattedNumber)
    let order

    if (!user) {
      // New customer - create account and link to order
      console.log(`Creating new user for ${formattedNumber}`)
      const result = await orderLinkingService.createUserAndLinkOrder(
        formattedNumber,
        orderId,
        name,
      )
      user = result.user
      order = result.order
    } else {
      // Existing customer - link to order
      console.log(`Linking existing user ${user.id} to order ${orderId}`)
      order = await orderLinkingService.linkWhatsAppToOrder(formattedNumber, orderId, user)

      // Update user's last contact time
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          lastWhatsappContact: new Date(),
          whatsappVerified: true,
        },
      })
    }

    // Track QR code scan
    await qrService.trackQRScan(orderId, formattedNumber)

    // Send order initiated confirmation
    const welcomeMessage = `🎉 *Welcome to AX Billing!*

Your order has been created:
Order ID: *${orderId}*

Our staff will now capture your vehicle information and add the services you need. We'll keep you updated throughout the process!

Thank you for choosing AX Billing! 🚗✨`

    await whatsappService.sendMessage(formattedNumber, welcomeMessage)

    // Log the incoming message
    await logMessage(payload, {
      user: user.id,
      order: order.id,
      whatsappNumber: formattedNumber,
      messageId,
      direction: 'inbound',
      messageType: 'text',
      content: text,
      status: 'received',
      timestamp: new Date(parseInt(timestamp)),
    })

    // Log the outgoing message
    await logMessage(payload, {
      user: user.id,
      order: order.id,
      whatsappNumber: formattedNumber,
      messageId: `out_${Date.now()}`,
      direction: 'outbound',
      messageType: 'text',
      content: welcomeMessage,
      status: 'sent',
      timestamp: new Date(),
    })

    console.log(`Successfully processed message for order ${orderId}`)
  } catch (error) {
    console.error('Error handling incoming message:', error)

    // Send error message to user if possible
    try {
      const { mobile } = data.payload
      const formattedNumber = whatsappService.formatPhoneNumber(mobile)
      await whatsappService.sendMessage(
        formattedNumber,
        '❌ Sorry, there was an error processing your request. Please try again or contact our staff for assistance.',
      )
    } catch (sendError) {
      console.error('Failed to send error message:', sendError)
    }
  }
}

async function handleMessageStatus(data: any, payload: any) {
  try {
    const { messageId, status } = data.payload

    // Update message delivery status
    await payload.update({
      collection: 'whatsapp-messages',
      where: {
        messageId: {
          equals: messageId,
        },
      },
      data: {
        status,
      },
    })

    console.log(`Updated message ${messageId} status to ${status}`)
  } catch (error) {
    console.error('Error handling message status:', error)
  }
}

async function logMessage(payload: any, messageData: any) {
  try {
    await payload.create({
      collection: 'whatsapp-messages',
      data: messageData,
    })
  } catch (error) {
    console.error('Error logging message:', error)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests for WhatsApp webhooks',
    },
    { status: 405 },
  )
}
