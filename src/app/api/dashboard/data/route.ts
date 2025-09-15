import { NextRequest, NextResponse } from 'next/server'
import { fetchDashboardData } from '@/lib/actions/dashboard-actions'

/**
 * API route for dashboard data
 * This provides a REST endpoint that calls the server action
 */
export async function GET(request: NextRequest) {
  try {
    const result = await fetchDashboardData()
    
    if (result.success) {
      return NextResponse.json(result.data, { status: 200 })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch dashboard data' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
