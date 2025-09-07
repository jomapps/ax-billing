'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Car, CreditCard, User, DollarSign, Camera, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatTimeAgo } from '@/lib/utils'

interface OrderData {
  id: string
  orderID: string
  customer: any
  vehicle: any
  totalAmount?: number
  createdAt: string
  overallStatus: string
  paymentStatus: string
}

interface OrderQueueCardsProps {
  initiatedOrders: OrderData[]
  openOrders: OrderData[]
  billedOrders: OrderData[]
  loading?: boolean
}

export function OrderQueueCards({
  initiatedOrders,
  openOrders,
  billedOrders,
  loading = false,
}: OrderQueueCardsProps) {
  const router = useRouter()

  const renderOrderCard = (order: OrderData) => (
    <Card
      key={order.id}
      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
      onClick={() => router.push(`/orders/${order.orderID}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">{order.orderID}</h3>
            <Badge
              variant="secondary"
              className={
                order.overallStatus === 'pending'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : order.overallStatus === 'in_progress'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }
            >
              {order.overallStatus === 'pending'
                ? 'Initiated'
                : order.overallStatus === 'in_progress'
                  ? 'In Progress'
                  : 'Pending Payment'}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">
                {order.customer && typeof order.customer === 'object'
                  ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
                    'Unknown Customer'
                  : 'Unknown Customer'}
              </span>
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
              <span className="text-gray-300 text-sm">{formatTimeAgo(order.createdAt)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/orders/${order.orderID}`)
              }}
              size="sm"
              className={`w-full ${
                order.overallStatus === 'pending'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : order.overallStatus === 'in_progress'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-black'
              }`}
            >
              {order.overallStatus === 'pending' && (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Process
                </>
              )}
              {order.overallStatus === 'in_progress' && (
                <>
                  <Car className="w-4 h-4 mr-2" />
                  Manage Order
                </>
              )}
              {order.paymentStatus === 'pending' && (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderSection = (title: string, orders: OrderData[], icon: any, color: string) => (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(icon, { className: `w-5 h-5 ${color}` })}
            {title}
          </div>
          <Badge
            variant="secondary"
            className={`${color.replace('text-', 'bg-').replace('-400', '-500/20')} ${color} border-${color.replace('text-', '').replace('-400', '-500/30')}`}
          >
            {orders.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No {title.toLowerCase()}</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-300 text-sm">
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map(renderOrderCard)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="animate-pulse">
                <div className="w-32 h-6 bg-gray-700 rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="animate-pulse">
                    <div className="w-full h-32 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {renderSection('Initiated Orders', initiatedOrders, Clock, 'text-blue-400')}
      {renderSection('Open Orders', openOrders, Car, 'text-green-400')}
      {renderSection('Billed Orders', billedOrders, CreditCard, 'text-yellow-400')}
    </div>
  )
}
