import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, Delivery, Intake } from '@/payload-types'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const resolvedParams = await params
    const orderId = resolvedParams.id
    const body = await request.json()

    // Find the order by orderID
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      limit: 1,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0] as Order

    // Check if delivery already exists for this order
    const existingDelivery = await payload.find({
      collection: 'delivery',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (existingDelivery.docs.length > 0) {
      return NextResponse.json({ error: 'Delivery already exists for this order' }, { status: 400 })
    }

    // Find related intake
    const intakeResult = await payload.find({
      collection: 'intake',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (intakeResult.docs.length === 0) {
      return NextResponse.json({ error: 'Intake must be completed before delivery' }, { status: 400 })
    }

    const intake = intakeResult.docs[0] as Intake

    // Create delivery record
    const deliveryData = {
      order: order.id,
      intake: intake.id,
      deliveryImages: body.deliveryImages || [],
      vehicleInspection: body.vehicleInspection || {},
      damageComparison: body.damageComparison || {
        newDamageDetected: false,
        newDamage: [],
      },
      staffMember: body.staffMember,
      deliveryCompletedAt: new Date().toISOString(),
      customerNotified: false,
    }

    const delivery = await payload.create({
      collection: 'delivery',
      data: deliveryData,
    })

    // Update order status
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        overallStatus: 'ready',
      },
    })

    // If new damage detected, trigger notification
    if (body.damageComparison?.newDamageDetected) {
      // TODO: Send damage alert notification to customer
      console.log(`New damage detected for order ${orderId} - customer notification required`)
    }

    return NextResponse.json({
      success: true,
      delivery: delivery,
      message: 'Delivery completed successfully',
      damageAlert: body.damageComparison?.newDamageDetected ? 'New damage detected - customer will be notified' : null,
    })
  } catch (error) {
    console.error('Failed to create delivery:', error)
    return NextResponse.json(
      { error: 'Failed to create delivery', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

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
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0] as Order

    // Find delivery for this order
    const deliveryResult = await payload.find({
      collection: 'delivery',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
      depth: 2,
    })

    if (deliveryResult.docs.length === 0) {
      return NextResponse.json({ error: 'Delivery not found for this order' }, { status: 404 })
    }

    const delivery = deliveryResult.docs[0] as Delivery

    return NextResponse.json({
      success: true,
      delivery: delivery,
    })
  } catch (error) {
    console.error('Failed to fetch delivery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const resolvedParams = await params
    const orderId = resolvedParams.id
    const body = await request.json()

    // Find the order by orderID
    const orderResult = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderId,
        },
      },
      limit: 1,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0] as Order

    // Find existing delivery
    const deliveryResult = await payload.find({
      collection: 'delivery',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (deliveryResult.docs.length === 0) {
      return NextResponse.json({ error: 'Delivery not found for this order' }, { status: 404 })
    }

    const existingDelivery = deliveryResult.docs[0] as Delivery

    // Update delivery record
    const updatedDelivery = await payload.update({
      collection: 'delivery',
      id: existingDelivery.id,
      data: {
        ...body,
        deliveryCompletedAt: new Date().toISOString(),
      },
    })

    // Handle new damage detection
    if (body.damageComparison?.newDamageDetected && !existingDelivery.customerNotified) {
      // TODO: Send damage alert notification to customer
      console.log(`New damage detected for order ${orderId} - customer notification required`)
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: 'Delivery updated successfully',
    })
  } catch (error) {
    console.error('Failed to update delivery:', error)
    return NextResponse.json(
      { error: 'Failed to update delivery', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
