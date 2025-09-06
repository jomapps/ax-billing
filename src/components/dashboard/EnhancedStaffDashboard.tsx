'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Clock,
  Car,
  Camera,
  CreditCard,
  CheckCircle,
  RefreshCw,
  Zap,
  Users,
  DollarSign,
  Activity,
  Bell,
  ArrowRight,
  QrCode,
  MessageSquare,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency, formatTime, getStatusColor, getQueueColor } from '@/lib/utils'
import { payloadClient, type OrderWithRelations, type DashboardStats } from '@/lib/payload-client'

// Import existing components
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'
import { InitiatedOrdersDashboard } from '@/components/whatsapp/InitiatedOrdersDashboard'
import { VehicleCaptureInterface } from '@/components/whatsapp/VehicleCaptureInterface'
import { ServiceSelectionGrid } from '@/components/services/ServiceSelectionGrid'
import { PaymentLinkGenerator } from '@/components/payments/PaymentLinkGenerator'
import { OrderCompletion } from '@/components/orders/OrderCompletion'

interface EnhancedStaffDashboardProps {
  staffId?: string
  location?: string
}

type WorkflowStep =
  | 'overview'
  | 'new-order'
  | 'initiated-orders'
  | 'vehicle-capture'
  | 'service-selection'
  | 'payment'
  | 'completion'

export function EnhancedStaffDashboard({
  staffId = 'staff-001',
  location = 'Main Branch',
}: EnhancedStaffDashboardProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview')
  const [orders, setOrders] = useState<OrderWithRelations[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [ordersResult, dashboardStats] = await Promise.all([
        payloadClient.getOrders({
          where: {
            overallStatus: {
              not_in: ['completed', 'picked_up', 'cancelled'],
            },
          },
          sort: '-createdAt',
          limit: 50,
        }),
        payloadClient.getDashboardStats(),
      ])

      setOrders(ordersResult.docs)
      setStats(dashboardStats)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  // Handle workflow navigation
  const handleNewOrder = () => {
    setCurrentStep('new-order')
  }

  const handleOrderCreated = (orderId: string) => {
    setRecentOrderId(orderId)
    setNotifications((prev) => [...prev, `New order created: ${orderId}`])
    setCurrentStep('initiated-orders')
    fetchData() // Refresh data
  }

  const handleCaptureVehicle = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('vehicle-capture')
  }

  const handleVehicleCaptured = () => {
    setCurrentStep('service-selection')
    fetchData() // Refresh data
  }

  const handleServiceSelection = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('service-selection')
  }

  const handlePaymentGeneration = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('payment')
  }

  const handleOrderCompletion = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('completion')
  }

  const handleBackToOverview = () => {
    setCurrentStep('overview')
    setSelectedOrderId(null)
  }

  // Quick stats for overview
  const quickStats = [
    {
      title: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: Car,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Jobs',
      value: stats?.activeJobs || 0,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Avg. Time',
      value: `${stats?.avgCompletionTime || 0}m`,
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ]

  // Workflow steps for navigation
  const workflowSteps = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'new-order', label: 'New Order', icon: Plus },
    { id: 'initiated-orders', label: 'Initiated', icon: Clock },
    { id: 'vehicle-capture', label: 'Vehicle', icon: Camera },
    { id: 'service-selection', label: 'Services', icon: Car },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'completion', label: 'Complete', icon: CheckCircle },
  ]

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">AX Billing Staff Dashboard</h1>
            <p className="text-gray-300">
              {location} • Staff ID: {staffId}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="w-6 h-6 text-yellow-400" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}

            {/* Refresh Button */}
            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Workflow Navigation */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = currentStep === step.id
                  const isCompleted = workflowSteps.findIndex((s) => s.id === currentStep) > index

                  return (
                    <React.Fragment key={step.id}>
                      <motion.button
                        onClick={() => setCurrentStep(step.id as WorkflowStep)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                          isActive
                            ? 'bg-blue-500 text-white'
                            : isCompleted
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600',
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.label}</span>
                      </motion.button>

                      {index < workflowSteps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-600" />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {currentStep !== 'overview' && (
                <Button
                  onClick={handleBackToOverview}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Back to Overview
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 'overview' && (
              <OverviewContent
                stats={quickStats}
                orders={orders}
                onNewOrder={handleNewOrder}
                onCaptureVehicle={handleCaptureVehicle}
                onServiceSelection={handleServiceSelection}
                onPaymentGeneration={handlePaymentGeneration}
                onOrderCompletion={handleOrderCompletion}
              />
            )}

            {currentStep === 'new-order' && (
              <NewOrderContent
                staffId={staffId}
                location={location}
                onOrderCreated={handleOrderCreated}
              />
            )}

            {currentStep === 'initiated-orders' && (
              <InitiatedOrdersContent
                onCaptureVehicle={handleCaptureVehicle}
                recentOrderId={recentOrderId}
              />
            )}

            {currentStep === 'vehicle-capture' && selectedOrderId && (
              <VehicleCaptureContent
                orderId={selectedOrderId}
                onVehicleCaptured={handleVehicleCaptured}
                onBack={handleBackToOverview}
              />
            )}

            {currentStep === 'service-selection' && selectedOrderId && (
              <ServiceSelectionContent
                orderId={selectedOrderId}
                onServicesSelected={() => handlePaymentGeneration(selectedOrderId)}
                onBack={handleBackToOverview}
              />
            )}

            {currentStep === 'payment' && selectedOrderId && (
              <PaymentContent
                orderId={selectedOrderId}
                onPaymentSent={() => handleOrderCompletion(selectedOrderId)}
                onBack={handleBackToOverview}
              />
            )}

            {currentStep === 'completion' && selectedOrderId && (
              <CompletionContent
                orderId={selectedOrderId}
                onOrderCompleted={handleBackToOverview}
                onBack={handleBackToOverview}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Overview Content Component
interface OverviewContentProps {
  stats: Array<{
    title: string
    value: string | number
    icon: React.ComponentType<any>
    color: string
    bgColor: string
  }>
  orders: OrderWithRelations[]
  onNewOrder: () => void
  onCaptureVehicle: (orderId: string) => void
  onServiceSelection: (orderId: string) => void
  onPaymentGeneration: (orderId: string) => void
  onOrderCompletion: (orderId: string) => void
}

function OverviewContent({
  stats,
  orders,
  onNewOrder,
  onCaptureVehicle,
  onServiceSelection,
  onPaymentGeneration,
  onOrderCompletion,
}: OverviewContentProps) {
  const initiatedOrders = orders.filter((order) => order.orderStage === 'initiated')
  const openOrders = orders.filter((order) => order.orderStage === 'open')
  const billedOrders = orders.filter((order) => order.orderStage === 'billed')

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                      <Icon className={cn('w-6 h-6', stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={onNewOrder}
                className="w-full h-20 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <Plus className="w-8 h-8" />
                  <span>NEW ORDER</span>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 border-gray-600 text-gray-300 hover:bg-gray-800"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <QrCode className="w-6 h-6" />
                  <span>Scan QR</span>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full h-20 border-gray-600 text-gray-300 hover:bg-gray-800"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span>Messages</span>
                </div>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Initiated Orders */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Initiated Orders
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {initiatedOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {initiatedOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No initiated orders</p>
            ) : (
              initiatedOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{order.orderID}</p>
                    <p className="text-gray-400 text-sm">
                      {order.customer && typeof order.customer === 'object'
                        ? (order.customer as any).name || 'Unknown Customer'
                        : 'Unknown Customer'}
                    </p>
                  </div>
                  <Button
                    onClick={() => onCaptureVehicle(order.orderID)}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Capture
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-green-400" />
                Open Orders
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {openOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No open orders</p>
            ) : (
              openOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{order.orderID}</p>
                    <p className="text-gray-400 text-sm">
                      {order.vehicle && typeof order.vehicle === 'object'
                        ? (order.vehicle as any).licensePlate || 'No License'
                        : 'No License'}
                    </p>
                  </div>
                  <Button
                    onClick={() => onServiceSelection(order.orderID)}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <Car className="w-4 h-4 mr-1" />
                    Services
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Billed Orders */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                Awaiting Payment
              </div>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                {billedOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {billedOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No pending payments</p>
            ) : (
              billedOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{order.orderID}</p>
                    <p className="text-gray-400 text-sm">
                      {formatCurrency(order.totalAmount || 0)}
                    </p>
                  </div>
                  <Button
                    onClick={() => onOrderCompletion(order.orderID)}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// New Order Content Component
interface NewOrderContentProps {
  staffId: string
  location: string
  onOrderCreated: (orderId: string) => void
}

function NewOrderContent({ staffId, location, onOrderCreated }: NewOrderContentProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-400" />
          Create New Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-2xl mx-auto">
          <WhatsAppQRCode
            staffId={staffId}
            location={location}
            onOrderCreated={onOrderCreated}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// Initiated Orders Content Component
interface InitiatedOrdersContentProps {
  onCaptureVehicle: (orderId: string) => void
  recentOrderId: string | null
}

function InitiatedOrdersContent({ onCaptureVehicle, recentOrderId }: InitiatedOrdersContentProps) {
  return (
    <div className="space-y-6">
      {recentOrderId && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Order Created Successfully!</p>
                <p className="text-gray-300 text-sm">Order ID: {recentOrderId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Initiated Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InitiatedOrdersDashboard onCaptureVehicle={onCaptureVehicle} />
        </CardContent>
      </Card>
    </div>
  )
}

// Vehicle Capture Content Component
interface VehicleCaptureContentProps {
  orderId: string
  onVehicleCaptured: () => void
  onBack: () => void
}

function VehicleCaptureContent({ orderId, onVehicleCaptured, onBack }: VehicleCaptureContentProps) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          Vehicle Capture - {orderId}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VehicleCaptureInterface
          orderId={orderId}
          onVehicleCaptured={onVehicleCaptured}
          onClose={onBack}
          className="max-w-2xl mx-auto"
        />
      </CardContent>
    </Card>
  )
}

// Service Selection Content Component (Placeholder)
interface ServiceSelectionContentProps {
  orderId: string
  onServicesSelected: () => void
  onBack: () => void
}

function ServiceSelectionContent({
  orderId,
  onServicesSelected,
  onBack,
}: ServiceSelectionContentProps) {
  const handleServicesSelected = (services: string[], total: number) => {
    // Here you would typically save the selected services to the order
    console.log('Services selected:', services, 'Total:', total)
    onServicesSelected()
  }

  return (
    <ServiceSelectionGrid
      orderId={orderId}
      onServicesSelected={handleServicesSelected}
      onBack={onBack}
    />
  )
}

// Payment Content Component (Placeholder)
interface PaymentContentProps {
  orderId: string
  onPaymentSent: () => void
  onBack: () => void
}

function PaymentContent({ orderId, onPaymentSent, onBack }: PaymentContentProps) {
  return <PaymentLinkGenerator orderId={orderId} onPaymentSent={onPaymentSent} onBack={onBack} />
}

// Completion Content Component (Placeholder)
interface CompletionContentProps {
  orderId: string
  onOrderCompleted: () => void
  onBack: () => void
}

function CompletionContent({ orderId, onOrderCompleted, onBack }: CompletionContentProps) {
  return <OrderCompletion orderId={orderId} onOrderCompleted={onOrderCompleted} onBack={onBack} />
}
