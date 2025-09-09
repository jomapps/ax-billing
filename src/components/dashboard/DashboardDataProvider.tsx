'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchDashboardData } from '@/lib/actions/dashboard-actions'

interface DashboardData {
  orders: any[]
  stats: any
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardData | null>(null)

interface DashboardDataProviderProps {
  children: React.ReactNode
  refreshInterval?: number // in milliseconds, default 30000 (30 seconds)
}

export function DashboardDataProvider({
  children,
  refreshInterval = 30000,
}: DashboardDataProviderProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)

      const result = await fetchDashboardData()

      if (result.success) {
        // DEBUG: Log the actual data being received
        console.log('🔍 DashboardDataProvider: Raw orders result:', result.data.orders)
        console.log('🔍 DashboardDataProvider: Orders count:', result.data.orders.length)
        console.log(
          '🔍 DashboardDataProvider: First few orders:',
          result.data.orders.slice(0, 3).map((order) => ({
            orderID: order.orderID,
            orderStage: order.orderStage,
            overallStatus: order.overallStatus,
            paymentStatus: order.paymentStatus,
          })),
        )

        setOrders(result.data.orders)
        setStats(result.data.stats)
      } else {
        setError(result.error || 'Failed to load dashboard data. Please try again.')
        setOrders([])
        setStats(null)
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
      setOrders([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial fetch
    fetchData()

    // Set up polling only if refreshInterval is provided and > 0
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval])

  const value: DashboardData = {
    orders,
    stats,
    loading,
    error,
    refreshData: fetchData,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider')
  }
  return context
}
