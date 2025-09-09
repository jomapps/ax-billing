'use server'

import { getActiveOrders, getDashboardStats } from '@/lib/server/order-queries'

/**
 * Server action to fetch dashboard data
 * This bypasses the PayloadCMS API access control by using server-side queries
 */
export async function fetchDashboardData() {
  try {
    const [orders, stats] = await Promise.all([getActiveOrders(), getDashboardStats()])

    return {
      success: true,
      data: {
        orders,
        stats,
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      success: false,
      error: 'Failed to fetch dashboard data',
      data: {
        orders: [],
        stats: {
          todayOrders: 0,
          activeJobs: 0,
          todayRevenue: 0,
          avgCompletionTime: 0,
        },
      },
    }
  }
}
