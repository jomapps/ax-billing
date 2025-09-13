'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Car, Activity, DollarSign, Clock, QrCode, CreditCard, BarChart3, Zap } from 'lucide-react'
import { CompactStatsCards } from './CompactStatsCards'
import { QuickActions } from './QuickActions'
import { CompactOrderQueue } from './CompactOrderQueue'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  // State for collapsible sections
  const [sectionsState, setSectionsState] = useState({
    stats: true,
    actions: true,
    orders: true,
  })

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3 sm:space-y-4"
    >
      {/* Mobile-First Tabbed Interface */}
      <div className="block md:hidden">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            {/* Quick Actions */}
            <CollapsibleSection
              title="Quick Actions"
              icon={Zap}
              variant="gaming"
              defaultOpen={sectionsState.actions}
              onToggle={(isOpen) => setSectionsState((prev) => ({ ...prev, actions: isOpen }))}
            >
              <QuickActions
                onNewOrder={onNewOrder}
                onViewInitiated={onViewInitiated}
                onOpenWhatsApp={onOpenWhatsApp}
              />
            </CollapsibleSection>

            {/* Key Stats Summary */}
            <CollapsibleSection
              title="Key Statistics"
              icon={BarChart3}
              variant="compact"
              defaultOpen={true}
            >
              <div className="grid grid-cols-2 gap-2">
                {statsCards.slice(0, 4).map((stat, index) => (
                  <div key={stat.title} className="p-2 bg-gray-800/30 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`w-3 h-3 ${stat.color}`} />
                      <span className="text-xs text-gray-400">{stat.title}</span>
                    </div>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="stats" className="space-y-3 mt-4">
            <CompactStatsCards stats={statsCards} loading={loading} variant="mobile-first" />
          </TabsContent>

          <TabsContent value="orders" className="space-y-3 mt-4">
            <div className="space-y-3">
              <CompactOrderQueue
                title="New Orders"
                orders={newOrders}
                icon={QrCode}
                color="text-purple-400"
                loading={loading}
                variant="mobile-first"
              />
              <CompactOrderQueue
                title="Initiated Orders"
                orders={initiatedOrders}
                icon={Clock}
                color="text-blue-400"
                loading={loading}
                variant="mobile-first"
              />
              <CompactOrderQueue
                title="Open Orders"
                orders={openOrders}
                icon={Car}
                color="text-green-400"
                loading={loading}
                variant="mobile-first"
              />
              <CompactOrderQueue
                title="Billed Orders"
                orders={billedOrders}
                icon={CreditCard}
                color="text-yellow-400"
                loading={loading}
                variant="mobile-first"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop Layout with Collapsible Sections */}
      <div className="hidden md:block space-y-4">
        {/* Stats Overview */}
        <CollapsibleSection
          title="Dashboard Statistics"
          icon={BarChart3}
          variant="gaming"
          defaultOpen={sectionsState.stats}
          onToggle={(isOpen) => setSectionsState((prev) => ({ ...prev, stats: isOpen }))}
        >
          <CompactStatsCards stats={statsCards} loading={loading} />
        </CollapsibleSection>

        {/* Quick Actions */}
        <CollapsibleSection
          title="Quick Actions"
          icon={Zap}
          variant="default"
          defaultOpen={sectionsState.actions}
          onToggle={(isOpen) => setSectionsState((prev) => ({ ...prev, actions: isOpen }))}
        >
          <QuickActions
            onNewOrder={onNewOrder}
            onViewInitiated={onViewInitiated}
            onOpenWhatsApp={onOpenWhatsApp}
          />
        </CollapsibleSection>

        {/* Order Queues */}
        <CollapsibleSection
          title="Order Queues"
          icon={Car}
          variant="gaming"
          defaultOpen={sectionsState.orders}
          onToggle={(isOpen) => setSectionsState((prev) => ({ ...prev, orders: isOpen }))}
        >
          <div className="space-y-3">
            <CompactOrderQueue
              title="New Orders"
              orders={newOrders}
              icon={QrCode}
              color="text-purple-400"
              loading={loading}
            />
            <CompactOrderQueue
              title="Initiated Orders"
              orders={initiatedOrders}
              icon={Clock}
              color="text-blue-400"
              loading={loading}
            />
            <CompactOrderQueue
              title="Open Orders"
              orders={openOrders}
              icon={Car}
              color="text-green-400"
              loading={loading}
            />
            <CompactOrderQueue
              title="Billed Orders"
              orders={billedOrders}
              icon={CreditCard}
              color="text-yellow-400"
              loading={loading}
            />
          </div>
        </CollapsibleSection>
      </div>
    </motion.div>
  )
}
