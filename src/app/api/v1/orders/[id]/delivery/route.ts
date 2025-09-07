import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, Delivery, Intake } from '@/payload-types'

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
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    const delivery = deliveryResult.docs[0] as Delivery

    return NextResponse.json({
      success: true,
      delivery,
      message: 'Delivery retrieved successfully',
    })
  } catch (error) {
    console.error('Delivery retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const resolvedParams = await params
    const orderId = resolvedParams.id
    const deliveryData = await request.json()

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

    // Check if intake exists (required for delivery)
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
      return NextResponse.json(
        { error: 'Intake must be completed before starting delivery' },
        { status: 400 }
      )
    }

    // Check if delivery already exists
    const existingDeliveryResult = await payload.find({
      collection: 'delivery',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (existingDeliveryResult.docs.length > 0) {
      return NextResponse.json(
        { error: 'Delivery already exists for this order. Use PUT to update.' },
        { status: 409 }
      )
    }

    const intake = intakeResult.docs[0] as Intake

    // Create new delivery
    const delivery = await payload.create({
      collection: 'delivery',
      data: {
        order: order.id,
        orderID: order.orderID,
        intakeReference: intake.id,
        ...deliveryData,
      },
    })

    // Check for new damage by comparing with intake
    let damageAlert = null
    if (deliveryData.vehicleInspection && intake.damageAssessment) {
      // Simple damage comparison logic
      const intakeDamageCount = intake.damageAssessment.existingDamage?.length || 0
      const deliveryDamageCount = deliveryData.vehicleInspection.damageItems?.length || 0
      
      if (deliveryDamageCount > intakeDamageCount) {
        damageAlert = `⚠️ New damage detected! Found ${deliveryDamageCount - intakeDamageCount} additional damage item(s) compared to intake.`
      }
    }

    return NextResponse.json({
      success: true,
      delivery,
      damageAlert,
      message: 'Delivery created successfully',
    })
  } catch (error) {
    console.error('Delivery creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const resolvedParams = await params
    const orderId = resolvedParams.id
    const deliveryData = await request.json()

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
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    const existingDelivery = deliveryResult.docs[0] as Delivery

    // Update delivery
    const updatedDelivery = await payload.update({
      collection: 'delivery',
      id: existingDelivery.id,
      data: deliveryData,
    })

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: 'Delivery updated successfully',
    })
  } catch (error) {
    console.error('Delivery update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update delivery',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
