import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, Intake } from '@/payload-types'

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

    // Check if intake already exists for this order
    const existingIntake = await payload.find({
      collection: 'intake',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (existingIntake.docs.length > 0) {
      return NextResponse.json({ error: 'Intake already exists for this order' }, { status: 400 })
    }

    // Create intake record
    const intakeData = {
      order: order.id,
      numberplateImage: body.numberplateImage,
      vehicleImages: body.vehicleImages || [],
      damageAssessment: body.damageAssessment || {},
      staffMember: body.staffMember,
      intakeCompletedAt: new Date().toISOString(),
    }

    const intake = await payload.create({
      collection: 'intake',
      data: intakeData,
    })

    // Update order status if needed
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        vehicleCapturedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      intake: intake,
      message: 'Intake completed successfully',
    })
  } catch (error) {
    console.error('Failed to create intake:', error)
    return NextResponse.json(
      { error: 'Failed to create intake', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Find intake for this order
    const intakeResult = await payload.find({
      collection: 'intake',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
      depth: 2,
    })

    if (intakeResult.docs.length === 0) {
      return NextResponse.json({ error: 'Intake not found for this order' }, { status: 404 })
    }

    const intake = intakeResult.docs[0] as Intake

    return NextResponse.json({
      success: true,
      intake: intake,
    })
  } catch (error) {
    console.error('Failed to fetch intake:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intake', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // Find existing intake
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
      return NextResponse.json({ error: 'Intake not found for this order' }, { status: 404 })
    }

    const existingIntake = intakeResult.docs[0] as Intake

    // Update intake record
    const updatedIntake = await payload.update({
      collection: 'intake',
      id: existingIntake.id,
      data: {
        ...body,
        intakeCompletedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      intake: updatedIntake,
      message: 'Intake updated successfully',
    })
  } catch (error) {
    console.error('Failed to update intake:', error)
    return NextResponse.json(
      { error: 'Failed to update intake', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
