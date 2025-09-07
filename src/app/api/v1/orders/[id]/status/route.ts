import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order } from '@/payload-types'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const resolvedParams = await params
    const orderId = resolvedParams.id

    // Find the order by orderID
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

    // Check for related intake and delivery
    const [intakeResult, deliveryResult] = await Promise.all([
      payload.find({
        collection: 'intake',
        where: {
          order: {
            equals: order.id,
          },
        },
        limit: 1,
      }),
      payload.find({
        collection: 'delivery',
        where: {
          order: {
            equals: order.id,
          },
        },
        limit: 1,
      }),
    ])

    const hasIntake = intakeResult.docs.length > 0
    const hasDelivery = deliveryResult.docs.length > 0

    // Determine overall progress
    let progress = 0
    let stage = 'created'

    if (order.qrCodeGenerated) {
      progress = 20
      stage = 'initiated'
    }

    if (hasIntake) {
      progress = 50
      stage = 'intake_completed'
    }

    if (order.paymentStatus === 'paid') {
      progress = 80
      stage = 'paid'
    }

    if (hasDelivery) {
      progress = 100
      stage = 'completed'
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderID: order.orderID,
        orderStage: order.orderStage,
        overallStatus: order.overallStatus,
        paymentStatus: order.paymentStatus,
        qrCodeGenerated: order.qrCodeGenerated,
        whatsappLinked: order.whatsappLinked,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      progress: {
        percentage: progress,
        stage,
        hasIntake,
        hasDelivery,
      },
      customer: order.customer,
      vehicle: order.vehicle,
      message: 'Order status retrieved successfully',
    })
  } catch (error) {
    console.error('Order status retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
