'use client'

import React, { useState, useEffect } from 'react'
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
  Zap
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatTime, getStatusColor, getQueueColor } from '@/lib/utils'

interface Order {
  id: string
  orderID: string
  customer: {
    firstName?: string
    lastName?: string
    email: string
  }
  vehicle: {
    licensePlate: string
    vehicleType: string
  }
  totalAmount: number
  paymentStatus: string
  queue: string
  overallStatus: string
  estimatedCompletionTime?: string
  jobStatus: Array<{
    stepName: string
    status: string
    timestamp?: string
  }>
}

interface DashboardStats {
  todayOrders: number
  activeJobs: number
  todayRevenue: number
  avgCompletionTime: number
}

export function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    activeJobs: 0,
    todayRevenue: 0,
    avgCompletionTime: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<string>('all')

  useEffect(() => {
    // TODO: Fetch real data from API
    // Mock data for now
    const mockOrders: Order[] = [
      {
        id: '1',
        orderID: 'AX-20241204-0001',
        customer: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        vehicle: { licensePlate: 'ABC123', vehicleType: 'sedan' },
        totalAmount: 25.00,
        paymentStatus: 'paid',
        queue: 'regular',
        overallStatus: 'in_progress',
        estimatedCompletionTime: new Date(Date.now() + 30 * 60000).toISOString(),
        jobStatus: [
          { stepName: 'Pre-wash', status: 'completed', timestamp: new Date().toISOString() },
          { stepName: 'Soap & Scrub', status: 'in_progress' },
          { stepName: 'Rinse', status: 'pending' },
          { stepName: 'Dry', status: 'pending' },
        ]
      },
      {
        id: '2',
        orderID: 'AX-20241204-0002',
        customer: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
        vehicle: { licensePlate: 'XYZ789', vehicleType: 'mpv_van' },
        totalAmount: 35.00,
        paymentStatus: 'paid',
        queue: 'vip',
        overallStatus: 'pending',
        estimatedCompletionTime: new Date(Date.now() + 45 * 60000).toISOString(),
        jobStatus: [
          { stepName: 'Pre-wash', status: 'pending' },
          { stepName: 'Soap & Scrub', status: 'pending' },
          { stepName: 'Rinse', status: 'pending' },
          { stepName: 'Dry', status: 'pending' },
        ]
      }
    ]

    const mockStats: DashboardStats = {
      todayOrders: 12,
      activeJobs: 5,
      todayRevenue: 450.00,
      avgCompletionTime: 35,
    }

    setOrders(mockOrders)
    setStats(mockStats)
    setLoading(false)
  }, [])

  const filteredOrders = orders.filter(order => 
    selectedQueue === 'all' || order.queue === selectedQueue
  )

  const queueCounts = {
    all: orders.length,
    vip: orders.filter(o => o.queue === 'vip').length,
    regular: orders.filter(o => o.queue === 'regular').length,
    remnant: orders.filter(o => o.queue === 'remnant').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-gaming font-bold neon-text">
            AX BILLING
          </h1>
          <p className="text-gray-400 mt-2">Staff Dashboard</p>
        </div>
        <Button size="lg" className="gap-2">
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
      >
        {Object.entries(queueCounts).map(([queue, count]) => (
          <Button
            key={queue}
            variant={selectedQueue === queue ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedQueue(queue)}
            className="gap-2"
          >
            {queue.charAt(0).toUpperCase() + queue.slice(1)}
            <Badge variant="secondary" size="sm">
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
      >
        <h2 className="text-2xl font-semibold">Active Orders</h2>
        <div className="grid gap-4">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card variant="gaming" className="hover:scale-[1.02] transition-transform cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{order.orderID}</h3>
                        <p className="text-gray-400">
                          {order.customer.firstName} {order.customer.lastName} • {order.vehicle.licensePlate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="gaming" 
                        className={cn("capitalize", getQueueColor(order.queue))}
                      >
                        {order.queue}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn("capitalize", getStatusColor(order.overallStatus))}
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
                      <p className={cn("font-semibold capitalize", getStatusColor(order.paymentStatus))}>
                        {order.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Vehicle</p>
                      <p className="font-semibold">{order.vehicle.vehicleType.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">ETA</p>
                      <p className="font-semibold">
                        {order.estimatedCompletionTime 
                          ? new Date(order.estimatedCompletionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'TBD'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {order.jobStatus.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-2 min-w-fit">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                          step.status === 'completed' && "bg-green-500/20 text-green-400",
                          step.status === 'in_progress' && "bg-blue-500/20 text-blue-400",
                          step.status === 'pending' && "bg-gray-500/20 text-gray-400"
                        )}>
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
                        {stepIndex < order.jobStatus.length - 1 && (
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
