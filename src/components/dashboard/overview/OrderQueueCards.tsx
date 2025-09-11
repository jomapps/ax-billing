'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Car, CreditCard, User, DollarSign, Camera, CheckCircle, QrCode } from 'lucide-react'
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
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  servicesRendered?: Array<{
    service: any
    selectedOptions?: any[]
    servicePrice: number
    optionsPrice?: number
  }>
}

interface OrderQueueCardsProps {
  newOrders: OrderData[]
  initiatedOrders: OrderData[]
  openOrders: OrderData[]
  billedOrders: OrderData[]
  loading?: boolean
}

export function OrderQueueCards({
  newOrders,
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
      onClick={() => {
        // Navigate to the appropriate stage-specific page
        const stageRoutes = {
          empty: `/order/${order.orderID}/new`,
          initiated: `/order/${order.orderID}/initiated`,
          open: `/order/${order.orderID}/open`,
          billed: `/order/${order.orderID}/billed`,
          paid: `/order/${order.orderID}/paid`,
        }
        const targetRoute =
          stageRoutes[order.orderStage as keyof typeof stageRoutes] || `/order/${order.orderID}`
        router.push(targetRoute)
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="text-white font-semibold text-responsive-xs">{order.orderID}</h3>
            <Badge
              variant="secondary"
              className={`text-responsive-xs ${
                order.orderStage === 'empty'
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : order.orderStage === 'initiated'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : order.orderStage === 'open'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : order.orderStage === 'billed'
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }`}
            >
              {order.orderStage === 'empty'
                ? 'Awaiting QR Scan'
                : order.orderStage === 'initiated' &&
                    (!order.servicesRendered || order.servicesRendered.length === 0)
                  ? 'Awaiting Services'
                  : order.orderStage === 'open'
                    ? 'Services Added'
                    : order.orderStage === 'billed' &&
                        order.servicesRendered &&
                        order.servicesRendered.length > 0
                      ? 'Ready for Payment'
                      : 'Unknown Status'}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 text-responsive-xs">
                {order.customer && typeof order.customer === 'object'
                  ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
                    'Unknown Customer'
                  : 'Unknown Customer'}
              </span>
            </div>

            {order.vehicle && typeof order.vehicle === 'object' && (
              <div className="flex items-center gap-1.5">
                <Car className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300 text-responsive-xs">
                  {order.vehicle.licensePlate || 'No License'}
                </span>
              </div>
            )}

            {order.totalAmount && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300 text-responsive-xs font-medium">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300 text-responsive-xs">
                {formatTimeAgo(order.createdAt)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-700">
            {/* Contextual buttons based on order stage */}
            {order.orderStage === 'empty' && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/order/${order.orderID}/new`)
                }}
                size="sm"
                className="w-full bg-purple-500 hover:bg-purple-600 h-8"
                title="View QR code for customer to scan"
              >
                <QrCode className="w-3 h-3 mr-1" />
                <span className="text-responsive-xs">Show QR</span>
              </Button>
            )}

            {order.orderStage === 'initiated' &&
              (!order.servicesRendered || order.servicesRendered.length === 0) && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/order/${order.orderID}/initiated`)
                  }}
                  size="sm"
                  className="w-full bg-blue-500 hover:bg-blue-600 h-8"
                  title="Capture vehicle information and add services"
                >
                  <Car className="w-3 h-3 mr-1" />
                  <span className="text-responsive-xs">Capture</span>
                </Button>
              )}

            {order.orderStage === 'open' && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/order/${order.orderID}/open`)
                }}
                size="sm"
                className="w-full bg-green-500 hover:bg-green-600 h-8"
                title="Manage services for this order"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                <span className="text-responsive-xs">Manage</span>
              </Button>
            )}

            {order.orderStage === 'billed' &&
              order.servicesRendered &&
              order.servicesRendered.length > 0 &&
              order.paymentStatus === 'pending' && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/order/${order.orderID}/billed`)
                  }}
                  size="sm"
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black h-8"
                  title="Process payment for this billed order"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  <span className="text-responsive-xs">Payment</span>
                </Button>
              )}

            {/* Fallback button for edge cases */}
            {!(
              order.orderStage === 'empty' ||
              (order.orderStage === 'initiated' &&
                (!order.servicesRendered || order.servicesRendered.length === 0)) ||
              order.orderStage === 'open' ||
              (order.orderStage === 'billed' &&
                order.servicesRendered &&
                order.servicesRendered.length > 0 &&
                order.paymentStatus === 'pending')
            ) && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  const stageRoutes = {
                    empty: `/order/${order.orderID}/new`,
                    initiated: `/order/${order.orderID}/initiated`,
                    open: `/order/${order.orderID}/open`,
                    billed: `/order/${order.orderID}/billed`,
                    paid: `/order/${order.orderID}/paid`,
                  }
                  const targetRoute =
                    stageRoutes[order.orderStage as keyof typeof stageRoutes] ||
                    `/order/${order.orderID}`
                  router.push(targetRoute)
                }}
                size="sm"
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
                title="View order details"
              >
                View Details
              </Button>
            )}
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
          <p className="text-gray-400 text-responsive-base text-center py-8">
            No {title.toLowerCase()}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-300 text-responsive-sm">
                Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
      {renderSection('New Orders', newOrders, QrCode, 'text-purple-400')}
      {renderSection('Initiated Orders', initiatedOrders, Clock, 'text-blue-400')}
      {renderSection('Open Orders', openOrders, Car, 'text-green-400')}
      {renderSection('Billed Orders', billedOrders, CreditCard, 'text-yellow-400')}
    </div>
  )
}
