/**
 * Example implementation showing how to add real-time sync to OrderPageView
 * Demonstrates order-specific event handling and automatic page updates
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useOrderSync,
  useOrderStageChange,
  useAutoRefresh,
  useConnectionHealth,
  SyncEvent,
  OrderData
} from '../index'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Bell, 
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react'

interface SyncedOrderPageProps {
  orderId: string
  initialOrderData?: OrderData | null
}

/**
 * Enhanced order page with real-time synchronization
 */
export function SyncedOrderPage({ orderId, initialOrderData }: SyncedOrderPageProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  // Connection health monitoring
  const health = useConnectionHealth()

  // Fetch order data function
  const fetchOrderData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&depth=2`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch order data`)
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        setOrderData(data.docs[0])
        console.log('🔄 SyncedOrderPage: Order data refreshed via sync event')
      } else {
        setError(`Order ${orderId} not found`)
      }
    } catch (err) {
      console.error('Failed to fetch order data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load order data')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Subscribe to order-specific events
  const { events: orderEvents, latestEvent } = useOrderSync(orderId, (event) => {
    console.log('📡 Received order event:', event)
    
    // Add notification for important events
    if (event.eventType === 'stage_change') {
      const { previousStage, newStage } = event.data
      addNotification(`Order stage changed from ${previousStage} to ${newStage}`)
    }
  })

  // Handle stage changes with automatic navigation
  useOrderStageChange(orderId, (event, previousStage, newStage) => {
    console.log(`🔄 Order ${orderId} stage changed: ${previousStage} → ${newStage}`)
    
    // Automatic navigation based on stage changes
    if (newStage === 'paid') {
      addNotification('Payment received! Order is now complete.')
      // Could redirect to completion page
      // router.push(`/orders/${orderId}/complete`)
    } else if (newStage === 'initiated') {
      addNotification('Customer connected via WhatsApp!')
    }
  })

  // Auto-refresh order data when relevant events occur
  useAutoRefresh(orderId, fetchOrderData, {
    eventTypes: ['stage_change', 'status_update', 'payment_update'],
    debounceMs: 500,
    enabled: true
  })

  // Initial data fetch
  useEffect(() => {
    if (!initialOrderData) {
      fetchOrderData()
    }
  }, [initialOrderData, fetchOrderData])

  // Helper function to add notifications
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]) // Keep last 5 notifications
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(1))
    }, 5000)
  }, [])

  // Clear a specific notification
  const clearNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
            <p className="text-gray-300">Loading order...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Order</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchOrderData} variant="outline" className="border-red-500/30">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header with connection status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{orderData.orderID}</h1>
          <p className="text-gray-400">Real-time Order Management</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {health.isConnected ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-gray-400">
              {health.isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          {/* Event Counter */}
          <Badge className="bg-blue-500/20 text-blue-400">
            {orderEvents.length} events
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <Card key={index} className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">{notification}</span>
                  </div>
                  <Button
                    onClick={() => clearNotification(index)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-green-400 hover:bg-green-500/10"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Status Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-400" />
            Order Status
            {latestEvent && (
              <Badge className="bg-yellow-500/20 text-yellow-400 ml-auto">
                Last update: {new Date(latestEvent.timestamp).toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400 text-sm">Current Stage</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-blue-500/20 text-blue-400">
                  {orderData.orderStage}
                </Badge>
                {health.isConnected && (
                  <span className="text-xs text-green-400">● Live</span>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 text-sm">Payment Status</span>
              <div className="mt-1">
                <Badge className={
                  orderData.paymentStatus === 'paid'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }>
                  {orderData.paymentStatus}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 text-sm">WhatsApp Status</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={
                  orderData.whatsappLinked
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }>
                  {orderData.whatsappLinked ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="text-gray-400 text-sm">Overall Status</span>
              <div className="mt-1">
                <Badge className="bg-purple-500/20 text-purple-400">
                  {orderData.overallStatus}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {orderEvents.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No events yet</p>
          ) : (
            <div className="space-y-2">
              {orderEvents.slice(-5).reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {event.eventType === 'stage_change' && (
                      <ArrowRight className="w-4 h-4 text-blue-400" />
                    )}
                    {event.eventType === 'connected' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <div>
                      <span className="text-white text-sm font-medium">
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </span>
                      {event.eventType === 'stage_change' && event.data.previousStage && (
                        <p className="text-gray-400 text-xs">
                          {event.data.previousStage} → {event.data.newStage}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
