import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, Intake } from '@/payload-types'

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
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const intake = intakeResult.docs[0] as Intake

    return NextResponse.json({
      success: true,
      intake,
      message: 'Intake retrieved successfully',
    })
  } catch (error) {
    console.error('Intake retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve intake',
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
    const intakeData = await request.json()

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

    // Check if intake already exists
    const existingIntakeResult = await payload.find({
      collection: 'intake',
      where: {
        order: {
          equals: order.id,
        },
      },
      limit: 1,
    })

    if (existingIntakeResult.docs.length > 0) {
      return NextResponse.json(
        { error: 'Intake already exists for this order. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Create new intake
    const intake = await payload.create({
      collection: 'intake',
      data: {
        order: order.id,
        orderID: order.orderID,
        ...intakeData,
      },
    })

    return NextResponse.json({
      success: true,
      intake,
      message: 'Intake created successfully',
    })
  } catch (error) {
    console.error('Intake creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create intake',
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
    const intakeData = await request.json()

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
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const existingIntake = intakeResult.docs[0] as Intake

    // Update intake
    const updatedIntake = await payload.update({
      collection: 'intake',
      id: existingIntake.id,
      data: intakeData,
    })

    return NextResponse.json({
      success: true,
      intake: updatedIntake,
      message: 'Intake updated successfully',
    })
  } catch (error) {
    console.error('Intake update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update intake',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
