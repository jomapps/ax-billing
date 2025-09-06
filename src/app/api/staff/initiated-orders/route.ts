import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Order, User } from '@/payload-types'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all orders in 'initiated' status
    const result = await payload.find({
      collection: 'orders',
      where: {
        orderStage: {
          equals: 'initiated',
        },
      },
      limit,
      sort: '-qrCodeScannedAt', // Most recent scans first
      depth: 2, // Include related customer data
    })

    // Transform the data for the frontend
    const initiatedOrders = result.docs.map((order: Order) => {
      const customer = order.customer as User
      
      return {
        id: order.id,
        orderID: order.orderID,
        whatsappNumber: order.whatsappNumber,
        customerName: customer 
          ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer'
          : 'New Customer',
        customerId: customer?.id,
        customerEmail: customer?.email,
        createdAt: order.createdAt,
        qrCodeScannedAt: order.qrCodeScannedAt,
        waitingTime: order.qrCodeScannedAt 
          ? Math.floor((Date.now() - new Date(order.qrCodeScannedAt).getTime()) / 60000)
          : 0, // waiting time in minutes
        metadata: order.metadata,
      }
    })

    return NextResponse.json({
      success: true,
      orders: initiatedOrders,
      total: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('Error fetching initiated orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch initiated orders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use GET to fetch initiated orders',
    },
    { status: 405 }
  )
}
