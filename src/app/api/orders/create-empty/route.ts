import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { staffId, location, notes } = body

    // Generate unique order ID
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0')
    const orderID = `AX-${dateStr}-${random}`

    // Create empty order
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderID,
        orderStage: 'empty',
        qrCodeGenerated: false,
        whatsappLinked: false,
        totalAmount: 0,
        paymentStatus: 'pending',
        overallStatus: 'pending',
        queue: 'regular',
      },
    })

    return NextResponse.json({
      success: true,
      orderID: order.orderID,
      id: order.id,
      message: 'Empty order created successfully',
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
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
      message: 'Use POST to create empty orders',
    },
    { status: 405 },
  )
}
