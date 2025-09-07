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

  // Filter orders by status - FIXED LOGIC + NEW ORDERS
  const { newOrders, initiatedOrders, openOrders, billedOrders } = useMemo(() => {
    // New Orders: orderStage 'empty' - created but waiting for QR scan
    const newOnes = orders.filter((order) => order.orderStage === 'empty')

    // Initiated Orders: orderStage 'initiated' with no services added yet
    const initiated = orders.filter(
      (order) =>
        order.orderStage === 'initiated' &&
        (!order.servicesRendered || order.servicesRendered.length === 0),
    )

    // Open Orders: orderStage 'open' - services being selected/added
    const open = orders.filter(
      (order) =>
        order.orderStage === 'open' ||
        (order.overallStatus === 'in_progress' && order.orderStage !== 'billed'),
    )

    // Billed Orders: orderStage 'billed' AND has actual services to bill
    const billed = orders.filter(
      (order) =>
        order.orderStage === 'billed' &&
        order.servicesRendered &&
        order.servicesRendered.length > 0 &&
        order.paymentStatus === 'pending',
    )

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
        <h2 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h2>
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
        <h2 className="text-2xl font-bold text-white mb-6">Order Queues</h2>
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
