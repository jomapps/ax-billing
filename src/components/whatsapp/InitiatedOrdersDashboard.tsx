'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Clock, User, Phone, Camera } from 'lucide-react'

interface InitiatedOrder {
  id: string
  orderID: string
  whatsappNumber: string
  customerName: string
  customerId?: string
  customerEmail?: string
  createdAt: string
  qrCodeScannedAt: string
  waitingTime: number
  metadata?: any
}

interface InitiatedOrdersDashboardProps {
  onCaptureVehicle?: (orderId: string) => void
  className?: string
}

export function InitiatedOrdersDashboard({
  onCaptureVehicle,
  className = '',
}: InitiatedOrdersDashboardProps) {
  const [orders, setOrders] = useState<InitiatedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchInitiatedOrders()
  }, [])

  const fetchInitiatedOrders = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/staff/initiated-orders')

      if (!response.ok) {
        throw new Error('Failed to fetch initiated orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
      setError(null)
    } catch (error) {
      console.error('Failed to fetch initiated orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchInitiatedOrders()
  }

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getWaitingTimeColor = (minutes: number) => {
    if (minutes < 5) return 'bg-green-100 text-green-800'
    if (minutes < 15) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Initiated Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading orders...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Initiated Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Initiated Orders ({orders.length})
          </CardTitle>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No initiated orders at the moment</p>
            <p className="text-sm">Orders will appear here when customers scan QR codes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-lg">{order.orderID}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {order.customerName}
                      </p>
                    </div>
                  </div>
                  <Badge className={getWaitingTimeColor(order.waitingTime)}>
                    <Clock className="w-3 h-3 mr-1" />
                    {formatWaitingTime(order.waitingTime)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono">{order.whatsappNumber}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span>Scanned: </span>
                    <span>{new Date(order.qrCodeScannedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => onCaptureVehicle?.(order.orderID)}
                    className="flex-1"
                    size="sm"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capture Vehicle
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${order.whatsappNumber}`, '_blank')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
