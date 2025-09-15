import { getPayload } from 'payload'
import config from '@payload-config'
import type { Order } from '@/payload-types'
import { SSEManager } from './sse-manager'

/**
 * Server-side order data fetching functions using PayloadCMS v3 Local API
 * These functions should ONLY be used in server components, not client components
 */

/**
 * Find an order by its orderID using direct PayloadCMS query
 * This replaces the broken REST API calls
 */
export async function findOrderByOrderID(orderID: string): Promise<Order | null> {
  try {
    const payload = await getPayload({
      config,
    })

    const result = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderID,
        },
      },
      depth: 3, // Include related data (customer, vehicle, services)
      limit: 1,
    })

    return result.docs.length > 0 ? result.docs[0] : null
  } catch (error) {
    console.error('Error finding order by orderID:', error)
    return null
  }
}

/**
 * Find an order by its database ID
 */
export async function findOrderById(id: string): Promise<Order | null> {
  try {
    const payload = await getPayload({
      config,
    })

    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 3,
    })

    return order
  } catch (error) {
    console.error('Error finding order by ID:', error)
    return null
  }
}

/**
 * Get order stage for navigation purposes
 * Returns just the orderStage field for efficient routing
 */
export async function getOrderStage(orderID: string): Promise<string | null> {
  try {
    const payload = await getPayload({
      config,
    })

    const result = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderID,
        },
      },
      select: {
        orderStage: true,
      },
      limit: 1,
    })

    return result.docs.length > 0 ? result.docs[0].orderStage : null
  } catch (error) {
    console.error('Error getting order stage:', error)
    return null
  }
}

/**
 * Update order stage - for server actions
 */
export async function updateOrderStage(
  orderID: string,
  newStage: Order['orderStage'],
  notes?: string,
): Promise<
  | {
      success: true
      order: Order
      previousStage: Order['orderStage']
      syncEvent?: any
      sseEventBroadcast: boolean
    }
  | { success: false; error: string }
> {
  try {
    const payload = await getPayload({
      config,
    })

    // First find the order to get its ID and current stage
    const result = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderID,
        },
      },
      limit: 1,
    })

    if (result.docs.length === 0) {
      console.error('Order not found for stage update:', orderID)
      return { success: false, error: 'Order not found' }
    }

    const order = result.docs[0]
    const previousStage = order.orderStage

    // Comment 8: Avoid creating events when the stage doesn't change; short-circuit updates
    if (previousStage === newStage) {
      return { success: true, order, previousStage, sseEventBroadcast: false }
    }

    // Update the order stage
    const updatedOrder = await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        orderStage: newStage as 'empty' | 'initiated' | 'open' | 'billed' | 'paid',
      },
    })

    // Create OrderSyncEvents record
    let syncEvent = null
    try {
      // Comment 3: OrderSyncEvents creation likely fails due to access control; add overrideAccess
      syncEvent = await payload.create({
        collection: 'orderSyncEvents',
        data: {
          order: order.id,
          eventType: 'stage_change',
          fieldName: 'orderStage',
          previousValue: previousStage,
          newValue: newStage,
          metadata: {
            timestamp: new Date().toISOString(),
            orderID: orderID,
            notes: notes, // Comment 2: Include notes in the event metadata
            triggeredBy: 'system',
          },
        },
        overrideAccess: true,
      })
    } catch (eventError) {
      console.error('Error creating sync event:', eventError)
      // Don't fail the update if event creation fails
    }

    // Broadcast SSE event to connected clients
    let sseEventBroadcast = false
    try {
      // Comment 7: Standardize SSE event payload to avoid duplicate orderID/timestamp fields
      SSEManager.broadcastToOrder(orderID, {
        eventType: 'stage_change',
        data: { previousStage, newStage: newStage, order: updatedOrder },
      })
      sseEventBroadcast = true
    } catch (sseError) {
      console.error('Error broadcasting SSE event:', sseError)
      // Don't fail the update if SSE broadcast fails
    }

    return { success: true, order: updatedOrder, previousStage, syncEvent, sseEventBroadcast }
  } catch (error) {
    console.error('Error updating order stage:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all orders for dashboard (server-side)
 */
export async function getActiveOrders() {
  try {
    const payload = await getPayload({
      config,
    })

    const result = await payload.find({
      collection: 'orders',
      where: {
        overallStatus: {
          not_in: ['completed', 'picked_up', 'cancelled'],
        },
      },
      sort: '-createdAt',
      depth: 2,
      limit: 50,
    })

    return result.docs
  } catch (error) {
    console.error('Error getting active orders:', error)
    return []
  }
}

/**
 * Get dashboard statistics (server-side)
 */
export async function getDashboardStats() {
  try {
    const payload = await getPayload({
      config,
    })

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get today's orders
    const todayOrdersResult = await payload.find({
      collection: 'orders',
      where: {
        createdAt: {
          greater_than_equal: today.toISOString(),
          less_than: tomorrow.toISOString(),
        },
      },
    })

    // Get active jobs (orders that are not completed or picked up)
    const activeJobsResult = await payload.find({
      collection: 'orders',
      where: {
        overallStatus: {
          not_in: ['completed', 'picked_up', 'cancelled'],
        },
      },
    })

    // Calculate today's revenue from completed orders
    const todayCompletedResult = await payload.find({
      collection: 'orders',
      where: {
        overallStatus: {
          in: ['completed', 'picked_up'],
        },
        createdAt: {
          greater_than_equal: today.toISOString(),
          less_than: tomorrow.toISOString(),
        },
      },
    })

    const todayRevenue = todayCompletedResult.docs.reduce((sum, order) => {
      return sum + (order.totalAmount || 0)
    }, 0)

    return {
      todayOrders: todayOrdersResult.totalDocs,
      activeJobs: activeJobsResult.totalDocs,
      todayRevenue,
      avgCompletionTime: 45, // Placeholder - would need to calculate from actual data
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    return {
      todayOrders: 0,
      activeJobs: 0,
      todayRevenue: 0,
      avgCompletionTime: 0,
    }
  }
}

/**
 * Create a new order (server action)
 */
export async function createOrder(data: Partial<Order>): Promise<Order | null> {
  try {
    const payload = await getPayload({
      config,
    })

    const order = await payload.create({
      collection: 'orders',
      data: {
        orderStage: 'empty',
        paymentStatus: 'pending',
        overallStatus: 'pending',
        queue: 'regular',
        totalAmount: 0,
        orderID: data.orderID || '',
        ...data,
      },
    })

    return order
  } catch (error) {
    console.error('Error creating order:', error)
    return null
  }
}

/**
 * Check if order exists (lightweight check)
 */
export async function orderExists(orderID: string): Promise<boolean> {
  try {
    const payload = await getPayload({
      config,
    })

    const result = await payload.find({
      collection: 'orders',
      where: {
        orderID: {
          equals: orderID,
        },
      },
      limit: 1,
    })

    return result.docs.length > 0
  } catch (error) {
    console.error('Error checking if order exists:', error)
    return false
  }
}
