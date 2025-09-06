'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Car,
  Plus,
  Clock,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Timer,
  Zap,
  RefreshCw,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  cn,
  formatCurrency,
  formatTime,
  getStatusColor,
  getQueueColor,
  getVehicleTypeLabel,
} from '@/lib/utils'
import { payloadClient, type OrderWithRelations, type DashboardStats } from '@/lib/payload-client'

export function StaffDashboard() {
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    activeJobs: 0,
    todayRevenue: 0,
    avgCompletionTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<string>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch active orders (not completed or picked up)
      const ordersResult = await payloadClient.getOrders({
        where: {
          overallStatus: {
            not_in: ['completed', 'picked_up', 'cancelled'],
          },
        },
        sort: '-createdAt',
        limit: 50,
      })

      // Fetch dashboard stats
      const dashboardStats = await payloadClient.getDashboardStats()

      setOrders(ordersResult.docs)
      setStats(dashboardStats)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchData, 30000)

    return () => clearInterval(interval)
  }, [])

  const filteredOrders = orders.filter(
    (order) => selectedQueue === 'all' || order.queue === selectedQueue,
  )

  const queueCounts = {
    all: orders.length,
    vip: orders.filter((o) => o.queue === 'vip').length,
    regular: orders.filter((o) => o.queue === 'regular').length,
    remnant: orders.filter((o) => o.queue === 'remnant').length,
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen space-y-6"
      style={{
        padding: '2rem',
        paddingTop: '1.5rem',
        paddingBottom: '3rem',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
        style={{ marginBottom: '3rem' }}
      >
        <div>
          <h1
            className="gaming-title neon-text"
            style={{
              fontFamily: 'Orbitron, monospace',
              fontWeight: 900,
              fontSize: '3.5rem',
              lineHeight: 1.1,
              letterSpacing: '0.05em',
              color: '#00d4ff',
              textShadow: '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff, 0 0 20px #00d4ff',
              animation: 'neon-flicker 2s infinite alternate',
            }}
          >
            AX BILLING
          </h1>
          <p
            className="gaming-subtitle mt-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              color: '#94a3b8',
              fontSize: '1.125rem',
              marginTop: '0.5rem',
            }}
          >
            Staff Dashboard
          </p>
          {error && (
            <div className="mt-2 flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="ml-2"
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Retry'}
              </Button>
            </div>
          )}
          {!error && (
            <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>
                {loading ? 'Updating...' : `Last updated: ${new Date().toLocaleTimeString()}`}
              </span>
            </div>
          )}
        </div>
        <Button
          size="lg"
          className="gap-2"
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0284c7 100%)',
            borderColor: '#0ea5e9',
            borderWidth: '2px',
            borderStyle: 'solid',
            borderRadius: '12px',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            fontSize: '1rem',
            padding: '0.875rem 2rem',
            boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.25), 0 0 0 1px rgba(14, 165, 233, 0.1)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            const target = e.target as HTMLElement
            target.style.background =
              'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #0ea5e9 100%)'
            target.style.boxShadow =
              '0 6px 20px 0 rgba(14, 165, 233, 0.4), 0 0 0 1px rgba(14, 165, 233, 0.2)'
            target.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const target = e.target as HTMLElement
            target.style.background =
              'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0284c7 100%)'
            target.style.boxShadow =
              '0 4px 14px 0 rgba(14, 165, 233, 0.25), 0 0 0 1px rgba(14, 165, 233, 0.1)'
            target.style.transform = 'translateY(0px)'
          }}
        >
          <Plus className="w-5 h-5" />
          New Order
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          padding: '0',
          marginBottom: '2rem',
        }}
      >
        <Card variant="gaming" glow="subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <Car className="h-4 w-4 text-primary-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-400">{stats.todayOrders}</div>
            <p className="text-xs text-gray-400">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card variant="gaming" glow="subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Activity className="h-4 w-4 text-secondary-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-400">{stats.activeJobs}</div>
            <p className="text-xs text-gray-400">Currently in progress</p>
          </CardContent>
        </Card>

        <Card variant="gaming" glow="subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-accent-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent-400">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-gray-400">+8% from yesterday</p>
          </CardContent>
        </Card>

        <Card variant="gaming" glow="subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <Timer className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {formatTime(stats.avgCompletionTime)}
            </div>
            <p className="text-xs text-gray-400">-5min from yesterday</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Queue Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-2 flex-wrap"
        style={{ marginTop: '2rem', marginBottom: '1.5rem' }}
      >
        {Object.entries(queueCounts).map(([queue, count]) => (
          <Button
            key={queue}
            variant={selectedQueue === queue ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedQueue(queue)}
            className="gap-2"
            style={{
              background:
                selectedQueue === queue
                  ? 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 50%, #0284c7 100%)'
                  : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              borderColor: selectedQueue === queue ? '#0ea5e9' : '#475569',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: '0.875rem',
              padding: '0.5rem 1rem',
              boxShadow:
                selectedQueue === queue
                  ? '0 2px 8px 0 rgba(14, 165, 233, 0.2), 0 0 0 1px rgba(14, 165, 233, 0.1)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              minHeight: '36px',
            }}
            onMouseEnter={(e) => {
              if (selectedQueue !== queue) {
                const target = e.target as HTMLElement
                target.style.background = 'linear-gradient(135deg, #334155 0%, #475569 100%)'
                target.style.borderColor = '#64748b'
                target.style.boxShadow = '0 2px 6px 0 rgba(0, 0, 0, 0.15)'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedQueue !== queue) {
                const target = e.target as HTMLElement
                target.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
                target.style.borderColor = '#475569'
                target.style.boxShadow =
                  '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }
            }}
          >
            {queue.charAt(0).toUpperCase() + queue.slice(1)}
            <Badge
              variant="secondary"
              size="sm"
              style={{
                backgroundColor: selectedQueue === queue ? '#38bdf8' : '#64748b',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0.125rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginLeft: '0.5rem',
              }}
            >
              {count}
            </Badge>
          </Button>
        ))}
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
        style={{ marginTop: '2rem' }}
      >
        <h2
          className="text-2xl font-semibold"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '1.5rem',
          }}
        >
          Active Orders
        </h2>
        <div
          className="grid gap-4"
          style={{
            gap: '1.5rem',
            marginTop: '1rem',
          }}
        >
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card
                variant="gaming"
                className="hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{order.orderID}</h3>
                        <p className="text-gray-400">
                          {typeof order.customer === 'object'
                            ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() ||
                              order.customer.email
                            : 'Customer'}{' '}
                          •{' '}
                          {typeof order.vehicle === 'object'
                            ? order.vehicle.licensePlate
                            : 'Vehicle'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="gaming"
                        className={cn('capitalize', getQueueColor(order.queue))}
                      >
                        {order.queue}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getStatusColor(order.overallStatus))}
                      >
                        {order.overallStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Amount</p>
                      <p className="font-semibold text-accent-400">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Payment</p>
                      <p
                        className={cn(
                          'font-semibold capitalize',
                          getStatusColor(order.paymentStatus),
                        )}
                      >
                        {order.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Vehicle</p>
                      <p className="font-semibold">
                        {typeof order.vehicle === 'object' && order.vehicle.vehicleType
                          ? getVehicleTypeLabel(order.vehicle.vehicleType)
                          : 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">ETA</p>
                      <p className="font-semibold">
                        {order.estimatedCompletionTime
                          ? new Date(order.estimatedCompletionTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {order.jobStatus?.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-2 min-w-fit">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                            step.status === 'completed' && 'bg-green-500/20 text-green-400',
                            step.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                            step.status === 'pending' && 'bg-gray-500/20 text-gray-400',
                          )}
                        >
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : step.status === 'in_progress' ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300 whitespace-nowrap">
                          {step.stepName}
                        </span>
                        {stepIndex < (order.jobStatus?.length || 0) - 1 && (
                          <div className="w-8 h-0.5 bg-gray-600 mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Floating Action Button */}
      <Button className="fab">
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  )
}
