'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Clock,
  Car,
  CreditCard,
  User,
  DollarSign,
  QrCode,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'
import {
  CompactCard,
  CompactCardContent,
  CompactCardHeader,
  CompactCardTitle,
} from '@/components/ui/compact-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InlineDisclosure } from '@/components/ui/progressive-disclosure'
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
  variant?: 'default' | 'mobile-first' | 'compact' | 'detailed'
  enableProgressive?: boolean
  maxVisible?: number
}

export function CompactOrderQueue({
  title,
  orders,
  icon,
  color,
  loading = false,
  variant = 'default',
  enableProgressive = true,
  maxVisible = 6,
}: CompactOrderQueueProps) {
  const router = useRouter()
  const [showAll, setShowAll] = useState(false)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  // Static color map to prevent Tailwind purging
  const getCountBadgeClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      'text-purple-400': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'text-blue-400': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'text-green-400': 'bg-green-500/20 text-green-400 border-green-500/30',
      'text-yellow-400': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'text-red-400': 'bg-red-500/20 text-red-400 border-red-500/30',
      'text-gray-400': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return colorMap[color] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

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

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const getGridClass = () => {
    switch (variant) {
      case 'mobile-first':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3'
      case 'compact':
        return 'grid-responsive-compact'
      case 'detailed':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4'
      default:
        return 'grid-responsive-orders'
    }
  }

  const renderOrderCard = (order: OrderData) => {
    const isExpanded = expandedOrders.has(order.id)

    return (
      <CompactCard
        key={order.id}
        className="cursor-pointer hover:scale-[1.02] transition-transform touch-target"
        size={variant === 'mobile-first' ? 'mobile' : 'default'}
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

            {/* Primary Info - Always Visible */}
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

              {/* Mobile-First: Show only essential info by default */}
              <div className="flex items-center justify-between">
                {order.totalAmount !== undefined && (
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

            {/* Progressive Disclosure for Secondary Info */}
            {enableProgressive && order.vehicle && typeof order.vehicle === 'object' && (
              <InlineDisclosure
                trigger={
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Info className="w-3 h-3" />
                    <span>Vehicle Details</span>
                  </div>
                }
                priority="medium"
                className="mt-1"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Car className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-300 text-[10px] sm:text-responsive-xs truncate">
                      {order.vehicle.licensePlate || 'No License'}
                    </span>
                  </div>
                  {order.vehicle.make && (
                    <div className="text-[10px] text-gray-400">
                      {order.vehicle.make} {order.vehicle.model} {order.vehicle.year}
                    </div>
                  )}
                </div>
              </InlineDisclosure>
            )}

            {/* Action Button */}
            <div className="pt-1 border-t border-gray-700">{getActionButton(order)}</div>
          </div>
        </CompactCardContent>
      </CompactCard>
    )
  }

  if (loading) {
    return (
      <CompactCard>
        <CompactCardHeader>
          <div className="animate-pulse">
            <div className="w-24 h-4 bg-gray-700 rounded"></div>
          </div>
        </CompactCardHeader>
        <CompactCardContent>
          <div className={getGridClass()}>
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
          <Badge variant="secondary" className={getCountBadgeClasses(color)}>
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
          <div className="space-y-3">
            <div className={getGridClass()}>
              {(showAll ? orders : orders.slice(0, maxVisible)).map(renderOrderCard)}
            </div>

            {/* Show More/Less Button for Mobile */}
            {orders.length > maxVisible && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700/30"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show {orders.length - maxVisible} More
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CompactCardContent>
    </CompactCard>
  )
}
