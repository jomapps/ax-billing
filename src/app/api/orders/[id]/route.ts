import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const order = orderResult.docs[0]

    // Check if order can be deleted (only allow deletion of empty orders)
    if (order.orderStage !== 'empty') {
      return NextResponse.json(
        { 
          error: 'Cannot delete order', 
          message: 'Only empty orders can be deleted. This order has already been initiated.' 
        }, 
        { status: 400 }
      )
    }

    // Delete the order
    await payload.delete({
      collection: 'orders',
      id: order.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully',
      orderID: orderId,
    })
  } catch (error) {
    console.error('Order deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
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
      depth: 2,
    })

    if (orderResult.docs.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orderResult.docs[0]

    return NextResponse.json({
      success: true,
      order: order,
    })
  } catch (error) {
    console.error('Order retrieval error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
