import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { WhatsAppService } from '@/lib/whatsapp/whatsapp-service'
import type { Order, User } from '@/payload-types'

const whatsappService = new WhatsAppService()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { stage, notes } = await request.json()
    const resolvedParams = await params
    const orderId = resolvedParams.id

    if (!stage) {
      return NextResponse.json({ error: 'Stage is required' }, { status: 400 })
    }

    const validStages = ['empty', 'initiated', 'open', 'billed', 'paid']
    if (!validStages.includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })
    }

    // Find the order (by orderID, not database ID)
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      limit: 1,
      depth: 2,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0] as Order
    const customer = order.customer as User

    // Update the order stage
    const updatedOrder = await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        orderStage: stage,
      },
    })

    // Send WhatsApp notification based on stage
    let message = ''
    switch (stage) {
      case 'open':
        message = `🔧 *Order Update*

Order ID: *${order.orderID}*
Status: Ready for service selection

Our team can now add services to your order. We'll notify you once services are selected and pricing is confirmed.`
        break

      case 'billed':
        message = `💳 *Payment Required*

Order ID: *${order.orderID}*
Status: Services completed, payment due

Your vehicle service is complete! We'll send you the payment link shortly.

Total: RM ${order.totalAmount || 0}`
        break

      case 'paid':
        message = `✅ *Payment Confirmed*

Order ID: *${order.orderID}*
Status: Paid

Thank you for your payment! Your vehicle is ready for pickup.

Thank you for choosing AX Billing! 🚗✨`
        break

      default:
        // No message for other stages
        break
    }

    // Send WhatsApp message if applicable
    if (message && order.whatsappNumber && customer) {
      await whatsappService.sendMessage(order.whatsappNumber, message)

      // Log the message
      await payload.create({
        collection: 'whatsapp-messages',
        data: {
          user: customer.id,
          order: order.id,
          whatsappNumber: order.whatsappNumber,
          messageId: `stage_update_${stage}_${Date.now()}`,
          direction: 'outbound',
          messageType: 'text',
          content: message,
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderID: updatedOrder.orderID,
        orderStage: updatedOrder.orderStage,
        previousStage: order.orderStage,
      },
      messageSent: !!message,
      message: 'Order stage updated successfully',
    })
  } catch (error) {
    console.error('Order stage update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update order stage',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST to update order stage',
    },
    { status: 405 },
  )
}
