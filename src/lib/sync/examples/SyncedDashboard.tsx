/**
 * Example implementation showing how to replace DashboardDataProvider
 * with the new SyncManager for real-time updates
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { SyncManagerProvider, useSyncManager, useDashboardSync, useConnectionHealth } from '../index'
import { fetchDashboardData } from '@/lib/actions/dashboard-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

// Enhanced dashboard data interface with sync capabilities
interface SyncedDashboardData {
  orders: any[]
  stats: any
  loading: boolean
  error: string | null
  lastSyncTime: string | null
  refreshData: () => Promise<void>
}

// Context for synced dashboard data
const SyncedDashboardContext = React.createContext<SyncedDashboardData | null>(null)

interface SyncedDashboardProviderProps {
  children: React.ReactNode
}

/**
 * Enhanced dashboard provider that uses SyncManager instead of polling
 */
function SyncedDashboardProvider({ children }: SyncedDashboardProviderProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  const { isConnected, connect } = useSyncManager()

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await fetchDashboardData()

      if (result.success) {
        console.log('🔄 SyncedDashboard: Data refreshed via sync event')
        setOrders(result.data.orders)
        setStats(result.data.stats)
        setLastSyncTime(new Date().toISOString())
      } else {
        setError(result.error || 'Failed to load dashboard data')
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

  // Use dashboard sync hook for real-time updates
  useDashboardSync(fetchData)

  // Initial data fetch and connection
  useEffect(() => {
    fetchData()
    if (!isConnected) {
      connect()
    }
  }, [fetchData, isConnected, connect])

  const value: SyncedDashboardData = {
    orders,
    stats,
    loading,
    error,
    lastSyncTime,
    refreshData: fetchData
  }

  return (
    <SyncedDashboardContext.Provider value={value}>
      {children}
    </SyncedDashboardContext.Provider>
  )
}

/**
 * Hook to use synced dashboard data
 */
function useSyncedDashboardData() {
  const context = React.useContext(SyncedDashboardContext)
  if (!context) {
    throw new Error('useSyncedDashboardData must be used within a SyncedDashboardProvider')
  }
  return context
}

/**
 * Connection status indicator component
 */
function ConnectionStatus() {
  const health = useConnectionHealth()
  const { reconnect } = useSyncManager()

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400'
      case 'connecting':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'error':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={getStatusColor()}>
        {getStatusIcon()}
        <span className="ml-1 capitalize">{health.status}</span>
      </Badge>
      
      {health.status === 'error' && (
        <Button
          onClick={reconnect}
          size="sm"
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
      
      {health.isConnected && (
        <span className="text-xs text-gray-400">
          {health.totalEvents} events
        </span>
      )}
    </div>
  )
}

/**
 * Example dashboard component using the synced data
 */
function ExampleDashboard() {
  const { orders, stats, loading, error, lastSyncTime, refreshData } = useSyncedDashboardData()

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
          <p className="text-gray-300">Loading dashboard...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline" className="border-red-500/30">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Real-time Dashboard</h1>
        <div className="flex items-center gap-4">
          <ConnectionStatus />
          {lastSyncTime && (
            <span className="text-xs text-gray-400">
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Today's Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.todayOrders || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.activeJobs || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Today's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ${(stats?.todayRevenue || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats?.avgCompletionTime || 0}min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No orders found</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                >
                  <div>
                    <span className="text-white font-medium">{order.orderID}</span>
                    <span className="text-gray-400 ml-2">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400">
                      {order.orderStage}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Complete example showing how to use the sync system
 */
export function SyncedDashboardExample() {
  return (
    <SyncManagerProvider initialConfig={{ autoReconnect: true }}>
      <SyncedDashboardProvider>
        <ExampleDashboard />
      </SyncedDashboardProvider>
    </SyncManagerProvider>
  )
}

// Export components for use in other parts of the application
export {
  SyncedDashboardProvider,
  useSyncedDashboardData,
  ConnectionStatus,
  ExampleDashboard
}
