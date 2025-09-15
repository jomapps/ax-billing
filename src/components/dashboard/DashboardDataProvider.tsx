'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import { fetchDashboardData } from '@/lib/actions/dashboard-actions'
import { useSyncManager, useDashboardSync, usePollingFallback } from '@/lib/sync'

interface DashboardData {
  orders: any[]
  stats: any
  loading: boolean
  isRefreshing: boolean
  error: string | null
  lastSyncTime: string | null
  isConnected: boolean
  connectionError: string | null
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardData | null>(null)

interface DashboardDataProviderProps {
  children: React.ReactNode
}

export function DashboardDataProvider({ children }: DashboardDataProviderProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  const { isConnected, isConnecting, connect, error: syncError } = useSyncManager()

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    const id = ++requestIdRef.current
    try {
      setError(null)
      if (!loading) setIsRefreshing(true)
      const result = await fetchDashboardData()
      if (id !== requestIdRef.current) return // stale
      if (result.success) {
        // DEBUG: Log the actual data being received
        console.log('🔄 DashboardDataProvider: Data refreshed via sync event')
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
        setLastSyncTime(new Date().toISOString())
      } else {
        setError(result.error || 'Failed to load dashboard data. Please try again.')
        setOrders([])
        setStats(null)
      }
    } catch (err) {
      if (id !== requestIdRef.current) return // stale
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
      setOrders([])
      setStats(null)
    } finally {
      if (id === requestIdRef.current) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [])

  const onSyncEvent = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchData()
    }, 300)
  }, [fetchData])

  // Use dashboard sync hook for real-time updates
  useDashboardSync(onSyncEvent)

  // Register polling callback to refresh data when in polling fallback mode
  usePollingFallback(fetchData)

  // Initial data fetch and connection management
  useEffect(() => {
    fetchData()
    // Only connect if not already connected or connecting to avoid duplicate calls
    if (!isConnected && !isConnecting) {
      connect()
    }
  }, [fetchData, isConnected, isConnecting, connect])

  const value = useMemo(
    () => ({
      orders,
      stats,
      loading,
      isRefreshing,
      error,
      lastSyncTime,
      isConnected,
      connectionError: syncError,
      refreshData: fetchData,
    }),
    [orders, stats, loading, isRefreshing, error, lastSyncTime, isConnected, syncError, fetchData],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardData() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider')
  }
  return context
}
