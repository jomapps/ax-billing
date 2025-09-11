'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Car, CreditCard, User, DollarSign, QrCode } from 'lucide-react'
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from '@/components/ui/compact-card'
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

interface CompactOrderQueueProps {
  title: string
  orders: OrderData[]
  icon: any
  color: string
  loading?: boolean
}

export function CompactOrderQueue({
  title,
  orders,
  icon,
  color,
  loading = false,
}: CompactOrderQueueProps) {
  const router = useRouter()

  const getStatusBadge = (order: OrderData) => {
    const statusConfig = {
      empty: { text: 'QR Scan', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      initiated: { text: 'Services', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      open: { text: 'Active', bg: 'bg-green-500/20 text-green-400 border-green-500/30' },
      billed: { text: 'Payment', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      paid: { text: 'Complete', bg: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
    }

    const config = statusConfig[order.orderStage] || statusConfig.paid
    return (
      <Badge variant="secondary" className={`text-[10px] ${config.bg}`}>
        {config.text}
      </Badge>
    )
  }

  const getActionButton = (order: OrderData) => {
    const buttonConfig = {
      empty: {
        text: 'QR',
        icon: QrCode,
        color: 'bg-purple-500 hover:bg-purple-600',
        route: `/order/${order.orderID}/new`,
      },
      initiated: {
        text: 'Capture',
        icon: Car,
        color: 'bg-blue-500 hover:bg-blue-600',
        route: `/order/${order.orderID}/initiated`,
      },
      open: {
        text: 'Manage',
        icon: Car,
        color: 'bg-green-500 hover:bg-green-600',
        route: `/order/${order.orderID}/open`,
      },
      billed: {
        text: 'Pay',
        icon: CreditCard,
        color: 'bg-yellow-500 hover:bg-yellow-600 text-black',
        route: `/order/${order.orderID}/billed`,
      },
    }

    const config = buttonConfig[order.orderStage as keyof typeof buttonConfig]
    if (!config) return null

    return (
      <Button
        onClick={(e) => {
          e.stopPropagation()
          router.push(config.route)
        }}
        size="sm"
        className={`w-full h-6 ${config.color} text-[10px] sm:text-responsive-xs`}
      >
        <config.icon className="w-2.5 h-2.5 mr-1" />
        {config.text}
      </Button>
    )
  }

  const renderOrderCard = (order: OrderData) => (
    <CompactCard
      key={order.id}
      className="cursor-pointer hover:scale-[1.02] transition-transform"
      onClick={() => {
        const stageRoutes = {
          empty: `/order/${order.orderID}/new`,
          initiated: `/order/${order.orderID}/initiated`,
          open: `/order/${order.orderID}/open`,
          billed: `/order/${order.orderID}/billed`,
          paid: `/order/${order.orderID}/paid`,
        }
        const targetRoute = stageRoutes[order.orderStage] || `/order/${order.orderID}`
        router.push(targetRoute)
      }}
    >
      <CompactCardContent className="p-2">
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium text-[11px] sm:text-responsive-xs truncate">
              {order.orderID}
            </h4>
            {getStatusBadge(order)}
          </div>

          {/* Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-gray-400" />
              <span className="text-gray-300 text-[10px] sm:text-responsive-xs truncate">
                {order.customer && typeof order.customer === 'object'
                  ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
                    'Unknown'
                  : 'Unknown'}
              </span>
            </div>

            {order.vehicle && typeof order.vehicle === 'object' && (
              <div className="flex items-center gap-1">
                <Car className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-gray-300 text-[10px] sm:text-responsive-xs truncate">
                  {order.vehicle.licensePlate || 'No License'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              {order.totalAmount && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-2.5 h-2.5 text-gray-400" />
                  <span className="text-gray-300 text-[10px] sm:text-responsive-xs font-medium">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-gray-400" />
                <span className="text-gray-300 text-[10px] sm:text-responsive-xs">
                  {formatTimeAgo(order.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="pt-1 border-t border-gray-700">{getActionButton(order)}</div>
        </div>
      </CompactCardContent>
    </CompactCard>
  )

  if (loading) {
    return (
      <CompactCard>
        <CompactCardHeader>
          <div className="animate-pulse">
            <div className="w-24 h-4 bg-gray-700 rounded"></div>
          </div>
        </CompactCardHeader>
        <CompactCardContent>
          <div className="grid-responsive-orders">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="animate-pulse">
                <div className="w-full h-24 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CompactCardContent>
      </CompactCard>
    )
  }

  return (
    <CompactCard>
      <CompactCardHeader className="pb-2">
        <CompactCardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {React.createElement(icon, { className: `w-4 h-4 ${color}` })}
            <span className="text-responsive-sm">{title}</span>
          </div>
          <Badge
            variant="secondary"
            className={`${color.replace('text-', 'bg-').replace('-400', '-500/20')} ${color} border-${color.replace('text-', '').replace('-400', '-500/30')}`}
          >
            {orders.length}
          </Badge>
        </CompactCardTitle>
      </CompactCardHeader>
      <CompactCardContent className="pt-0">
        {orders.length === 0 ? (
          <p className="text-gray-400 text-responsive-xs text-center py-4">
            No {title.toLowerCase()}
          </p>
        ) : (
          <div className="grid-responsive-orders">{orders.map(renderOrderCard)}</div>
        )}
      </CompactCardContent>
    </CompactCard>
  )
}
