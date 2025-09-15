'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Clock, User, Phone, Camera, Car, DollarSign } from 'lucide-react'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  totalAmount?: number
  overallStatus?: string
  vehicle?: any
  metadata?: any
}

interface InitiatedOrdersDashboardProps {
  className?: string
}

export function InitiatedOrdersDashboard({ className = '' }: InitiatedOrdersDashboardProps) {
  const [orders, setOrders] = useState<InitiatedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchInitiatedOrders()
  }, [])

  const fetchInitiatedOrders = async () => {
    try {
      setRefreshing(true)
      // FIXED: Fetch orders that are truly initiated (orderStage 'initiated' with no services yet)
      // These are orders where customers have scanned the QR code but haven't added services
      const response = await fetch(
        '/api/orders?where[orderStage][equals]=initiated&depth=2&limit=10',
      )

      if (!response.ok) {
        throw new Error('Failed to fetch initiated orders')
      }

      const data = await response.json()
      // Transform the orders to match the expected format
      const transformedOrders = data.docs.map((order: any) => ({
        id: order.id,
        orderID: order.orderID,
        whatsappNumber: order.whatsappNumber || 'N/A',
        customerName:
          order.customer && typeof order.customer === 'object'
            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
              'Unknown Customer'
            : 'Unknown Customer',
        customerId: order.customer?.id,
        customerEmail: order.customer?.email,
        createdAt: order.createdAt,
        qrCodeScannedAt: order.qrCodeScannedAt || order.createdAt,
        waitingTime: order.qrCodeScannedAt
          ? Math.floor((Date.now() - new Date(order.qrCodeScannedAt).getTime()) / 60000)
          : Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000),
        totalAmount: order.totalAmount,
        overallStatus: order.overallStatus,
        vehicle: order.vehicle,
      }))
      setOrders(transformedOrders)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/order/${order.orderID}/initiated`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-lg">{order.orderID}</h3>
                    <Badge className={`${getWaitingTimeColor(order.waitingTime)} text-xs`}>
                      {order.overallStatus === 'pending'
                        ? 'Pending'
                        : order.overallStatus === 'in_progress'
                          ? 'In Progress'
                          : 'Waiting'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">{order.customerName}</span>
                    </div>

                    {order.vehicle && typeof order.vehicle === 'object' && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {order.vehicle.licensePlate || 'No License'}
                        </span>
                      </div>
                    )}

                    {order.totalAmount && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm font-medium">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">
                        {formatTimeAgo(order.createdAt)}
                      </span>
                    </div>

                    {order.whatsappNumber !== 'N/A' && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm font-mono">
                          {order.whatsappNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-700 mt-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCaptureVehicle?.(order.orderID)
                      }}
                      size="sm"
                      className="w-full bg-blue-500 hover:bg-blue-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Vehicle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
