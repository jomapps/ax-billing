'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Car, Activity, DollarSign, Clock } from 'lucide-react'
import { StatsCards } from './StatsCards'
import { QuickActions } from './QuickActions'
import { OrderQueueCards } from './OrderQueueCards'
import { formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/lib/payload-client'

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

interface OverviewDashboardProps {
  stats: DashboardStats | null
  orders: OrderData[]
  loading?: boolean
  onNewOrder: () => void
  onViewInitiated: () => void
  onOpenWhatsApp?: () => void
}

export function OverviewDashboard({
  stats,
  orders,
  loading = false,
  onNewOrder,
  onViewInitiated,
  onOpenWhatsApp,
}: OverviewDashboardProps) {
  // DEBUG: Log props received
  console.log('🔍 OverviewDashboard: Props received:', {
    ordersLength: orders?.length || 0,
    loading,
    stats,
  })
  // Transform stats into format for StatsCards
  const statsCards = useMemo(() => {
    if (!stats) {
      return [
        {
          title: "Today's Orders",
          value: 0,
          icon: Car,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
        },
        {
          title: 'Active Jobs',
          value: 0,
          icon: Activity,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
        },
        {
          title: "Today's Revenue",
          value: formatCurrency(0),
          icon: DollarSign,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
        },
        {
          title: 'Avg. Time',
          value: '0m',
          icon: Clock,
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10',
        },
      ]
    }

    return [
      {
        title: "Today's Orders",
        value: stats.todayOrders,
        icon: Car,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        trend: {
          value: 12, // This could be calculated from historical data
          isPositive: true,
        },
      },
      {
        title: 'Active Jobs',
        value: stats.activeJobs,
        icon: Activity,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        trend: {
          value: 8,
          isPositive: true,
        },
      },
      {
        title: "Today's Revenue",
        value: formatCurrency(stats.todayRevenue),
        icon: DollarSign,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        trend: {
          value: 15,
          isPositive: true,
        },
      },
      {
        title: 'Avg. Time',
        value: `${stats.avgCompletionTime}m`,
        icon: Clock,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        trend: {
          value: 5,
          isPositive: false, // Lower time is better
        },
      },
    ]
  }, [stats])

  // Filter orders by status - SIMPLIFIED AND ACCURATE LOGIC
  const { newOrders, initiatedOrders, openOrders, billedOrders } = useMemo(() => {
    // DEBUG: Log all orders and their stages
    console.log('🔍 OverviewDashboard: Total orders received:', orders.length)
    console.log(
      '🔍 OverviewDashboard: All orders:',
      orders.map((order) => ({
        orderID: order.orderID,
        orderStage: order.orderStage,
        overallStatus: order.overallStatus,
      })),
    )

    // New Orders: orderStage 'empty' - created but waiting for QR scan
    const newOnes = orders.filter((order) => order.orderStage === 'empty')

    // Initiated Orders: ALL orders in 'initiated' stage (customer scanned QR, vehicle info captured)
    const initiated = orders.filter((order) => order.orderStage === 'initiated')

    // Open Orders: ALL orders in 'open' stage (services being worked on)
    const open = orders.filter((order) => order.orderStage === 'open')

    // Billed Orders: ALL orders in 'billed' stage (ready for payment)
    const billed = orders.filter((order) => order.orderStage === 'billed')

    // DEBUG: Log filtered results
    console.log('🔍 OverviewDashboard: Filtered counts:', {
      newOrders: newOnes.length,
      initiatedOrders: initiated.length,
      openOrders: open.length,
      billedOrders: billed.length,
    })

    return {
      newOrders: newOnes,
      initiatedOrders: initiated,
      openOrders: open,
      billedOrders: billed,
    }
  }, [orders])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Stats Overview */}
      <div>
        <h2 className="text-responsive-2xl font-bold text-white mb-6">Dashboard Overview</h2>
        <StatsCards stats={statsCards} loading={loading} />
      </div>

      {/* Quick Actions */}
      <QuickActions
        onNewOrder={onNewOrder}
        onViewInitiated={onViewInitiated}
        onOpenWhatsApp={onOpenWhatsApp}
      />

      {/* Order Queues */}
      <div>
        <h2 className="text-responsive-2xl font-bold text-white mb-6">Order Queues</h2>
        <OrderQueueCards
          newOrders={newOrders}
          initiatedOrders={initiatedOrders}
          openOrders={openOrders}
          billedOrders={billedOrders}
          loading={loading}
        />
      </div>
    </motion.div>
  )
}
