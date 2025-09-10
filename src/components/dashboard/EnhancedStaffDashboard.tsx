'use client'
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
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
  User,
  DollarSign,
  Activity,
  Bell,
  ArrowRight,
  QrCode,
  MessageSquare,
  Copy,
  Trash2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency, formatTimeAgo, getStatusColor, getQueueColor } from '@/lib/utils'
import { payloadClient, type OrderWithRelations, type DashboardStats } from '@/lib/payload-client'

// Import existing components
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'
import { InitiatedOrdersDashboard } from '@/components/whatsapp/InitiatedOrdersDashboard'
import { VehicleCaptureInterface } from '@/components/whatsapp/VehicleCaptureInterface'
import { ServiceSelectionGrid } from '@/components/services/ServiceSelectionGrid'
import { PaymentLinkGenerator } from '@/components/payments/PaymentLinkGenerator'
import { OrderCompletion } from '@/components/orders/OrderCompletion'

// Import new data management components
import { DashboardDataProvider, useDashboardData } from './DashboardDataProvider'
import { OrderStatusChecker } from './OrderStatusChecker'

interface EnhancedStaffDashboardProps {
  staffId?: string
  location?: string
}

type WorkflowStep =
  | 'overview'
  | 'new-order'
  | 'order-created'
  | 'initiated-orders'
  | 'vehicle-capture'
  | 'service-selection'
  | 'payment'
  | 'completion'

// Internal component that uses the data provider
function EnhancedStaffDashboardContent({
  staffId = 'staff-001',
  location = 'Main Branch',
}: EnhancedStaffDashboardProps) {
  const router = useRouter() // Used for navigation in card clicks
  const { orders, stats, loading, error, refreshData } = useDashboardData()
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    await refreshData()
  }, [refreshData])

  // Handle workflow navigation
  const handleNewOrder = () => {
    setCurrentStep('new-order')
  }

  const handleOrderCreated = (orderId: string) => {
    setRecentOrderId(orderId)
    setSelectedOrderId(orderId)
    setNotifications((prev) => [...prev, `New order created: ${orderId}`])
    refreshData() // Refresh data

    // Redirect to the order page instead of showing QR code on dashboard
    router.push(`/order/${orderId}`)
  }

  const handleCaptureVehicle = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('vehicle-capture')
  }

  const handleVehicleCaptured = () => {
    setCurrentStep('service-selection')
    refreshData() // Refresh data
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
    { id: 'order-created', label: 'Order Created', icon: QrCode },
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
              onClick={handleRefresh}
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
                onViewInitiated={() => setCurrentStep('initiated-orders')}
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

            {currentStep === 'order-created' && selectedOrderId && (
              <OrderCreatedContent
                orderId={selectedOrderId}
                staffId={staffId}
                location={location}
                onOrderInitiated={() => setCurrentStep('initiated-orders')}
                onBackToOverview={handleBackToOverview}
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
  onViewInitiated: () => void
  onCaptureVehicle: (orderId: string) => void
  onServiceSelection: (orderId: string) => void
  onPaymentGeneration: (orderId: string) => void
  onOrderCompletion: (orderId: string) => void
}

function OverviewContent({
  stats,
  orders,
  onNewOrder,
  onViewInitiated,
  onCaptureVehicle,
  onServiceSelection,
  onPaymentGeneration,
  onOrderCompletion,
}: OverviewContentProps) {
  const router = useRouter()
  // SIMPLIFIED: Order filtering logic matching OverviewDashboard
  const newOrders = orders.filter((order) => order.orderStage === 'empty')
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
                onClick={onViewInitiated}
                variant="outline"
                className="w-full h-20 border-gray-600 text-gray-300 hover:bg-gray-800"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-6 h-6" />
                  <span>View Initiated</span>
                </div>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => window.open('/whatsapp-demo', '_blank')}
                variant="outline"
                className="w-full h-20 border-gray-600 text-gray-300 hover:bg-gray-800"
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span>WhatsApp Hub</span>
                </div>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders by Stage */}
      <div className="space-y-8">
        {/* New Orders */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-purple-400" />
                New Orders
              </div>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                {newOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {newOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No new orders</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-300 text-sm">
                    Showing {newOrders.length} order{newOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {newOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => {
                        router.push(`/order/${order.orderID}`)
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <h3 className="text-white font-semibold text-sm">{order.orderID}</h3>
                            <Badge
                              variant="secondary"
                              className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs"
                            >
                              Awaiting QR Scan
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">New Customer</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {formatTimeAgo(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-700">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/order/${order.orderID}`)
                              }}
                              size="sm"
                              className="w-full bg-purple-500 hover:bg-purple-600"
                            >
                              <QrCode className="w-4 h-4 mr-2" />
                              Show QR Code
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

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
              <p className="text-gray-400 text-center py-8">No initiated orders</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-300 text-sm">
                    Showing {initiatedOrders.length} order{initiatedOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {initiatedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => {
                        /* router.push(`/orders/${order.orderID}`) */
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold text-lg">{order.orderID}</h3>
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/20 text-blue-400 border-blue-500/30"
                            >
                              Initiated
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {order.customer && typeof order.customer === 'object'
                                  ? `${(order.customer as any).firstName || ''} ${(order.customer as any).lastName || ''}`.trim() ||
                                    'Unknown Customer'
                                  : 'Unknown Customer'}
                              </span>
                            </div>

                            {order.vehicle && typeof order.vehicle === 'object' && (
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300 text-sm">
                                  {(order.vehicle as any).licensePlate || 'No License'}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {formatTimeAgo(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-700">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                // router.push(`/orders/${order.orderID}`)
                              }}
                              size="sm"
                              className="w-full bg-blue-500 hover:bg-blue-600"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Start Process
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
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
              <p className="text-gray-400 text-center py-8">No open orders</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-300 text-sm">
                    Showing {openOrders.length} order{openOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {openOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => {
                        /* router.push(`/orders/${order.orderID}`) */
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold text-lg">{order.orderID}</h3>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/20 text-green-400 border-green-500/30"
                            >
                              In Progress
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {order.vehicle && typeof order.vehicle === 'object'
                                  ? (order.vehicle as any).licensePlate || 'No License'
                                  : 'No License'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {order.customer && typeof order.customer === 'object'
                                  ? `${(order.customer as any).firstName || ''} ${(order.customer as any).lastName || ''}`.trim() ||
                                    'Unknown Customer'
                                  : 'Unknown Customer'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {formatTimeAgo(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-700">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                // router.push(`/orders/${order.orderID}`)
                              }}
                              size="sm"
                              className="w-full bg-green-500 hover:bg-green-600"
                            >
                              <Car className="w-4 h-4 mr-2" />
                              Manage Order
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
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
              <p className="text-gray-400 text-center py-8">No pending payments</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-300 text-sm">
                    Showing {billedOrders.length} order{billedOrders.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {billedOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                      onClick={() => {
                        /* router.push(`/orders/${order.orderID}`) */
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white font-semibold text-lg">{order.orderID}</h3>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            >
                              Pending Payment
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm font-medium">
                                {formatCurrency(order.totalAmount || 0)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {order.customer && typeof order.customer === 'object'
                                  ? `${(order.customer as any).firstName || ''} ${(order.customer as any).lastName || ''}`.trim() ||
                                    'Unknown Customer'
                                  : 'Unknown Customer'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 text-sm">
                                {formatTimeAgo(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-700">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                // router.push(`/orders/${order.orderID}`)
                              }}
                              size="sm"
                              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Process Payment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
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
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateOrder = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/orders/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, location }),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      const data = await response.json()
      onOrderCreated(data.orderID)
    } catch (err) {
      console.error('Failed to create order:', err)
      setError('Failed to create order. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-400" />
          Create New Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div>
            <p className="text-gray-300 mb-4">
              Click the button below to create a new empty order. You will be redirected to the
              order page where customers can scan the QR code.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCreateOrder}
            disabled={isCreating}
            className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold text-lg"
            size="lg"
          >
            {isCreating ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Creating Order...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <span>CREATE NEW ORDER</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Order Created Content Component - Shows QR code until order is initiated
interface OrderCreatedContentProps {
  orderId: string
  staffId: string
  location: string
  onOrderInitiated: () => void
  onBackToOverview: () => void
}

function OrderCreatedContent({
  orderId,
  staffId,
  location,
  onOrderInitiated,
  onBackToOverview,
}: OrderCreatedContentProps) {
  const [orderStatus, setOrderStatus] = useState<'empty' | 'initiated'>('empty')
  const [isChecking, setIsChecking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [qrValue, setQrValue] = useState('')
  const [qrLoading, setQrLoading] = useState(true)
  const [qrError, setQrError] = useState<string | null>(null)

  // Generate QR code when component mounts
  useEffect(() => {
    const generateQR = async () => {
      try {
        setQrLoading(true)
        setQrError(null)

        const response = await fetch('/api/v1/whatsapp/qr-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            staffId,
            location,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate QR code')
        }

        const data = await response.json()
        setQrValue(data.qrValue)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
        setQrError('Failed to generate QR code. Please try again.')
      } finally {
        setQrLoading(false)
      }
    }

    generateQR()
  }, [orderId, staffId, location])

  // Handle order status changes
  const handleOrderInitiated = () => {
    setOrderStatus('initiated')
    // Auto-navigate to initiated orders after a brief delay
    setTimeout(() => {
      onOrderInitiated()
    }, 2000)
  }

  // Delete order function
  const handleDeleteOrder = async () => {
    if (
      !confirm(`Are you sure you want to delete order ${orderId}? This action cannot be undone.`)
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      // Navigate back to overview after successful deletion
      onBackToOverview()
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert('Failed to delete order. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (orderStatus === 'initiated') {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-400 mb-2">Order Initiated!</h2>
            <p className="text-gray-300 mb-4">
              Customer has scanned the QR code and sent a WhatsApp message.
            </p>
            <p className="text-sm text-gray-400">Redirecting to initiated orders...</p>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Order Created Successfully!
            </div>
            <Button
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              variant="outline"
              size="sm"
              className="text-red-400 border-red-400 hover:bg-red-500/10"
            >
              {isDeleting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300">
                  Order ID: <span className="font-mono font-bold text-blue-400">{orderId}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Show this QR code to the customer to start the service
                </p>
              </div>
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                Waiting for Customer
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <OrderStatusChecker
        orderId={orderId}
        onOrderInitiated={handleOrderInitiated}
        checkInterval={10000}
      >
        {({ isChecking, orderStatus }) => (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-400" />
                Customer QR Code
                {isChecking && <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto">
                {qrLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-lg flex items-center justify-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  </div>
                ) : qrError ? (
                  <div className="text-center p-8">
                    <p className="text-red-400 mb-4">{qrError}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative inline-block">
                      <QRCodeSVG
                        value={qrValue}
                        size={256}
                        level="M"
                        includeMargin={true}
                        className="border-2 border-gray-200 rounded-lg"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Scan this QR code with your phone to start your car wash service via
                        WhatsApp
                      </p>
                      <p className="text-xs text-gray-500">
                        This QR code is linked to order {orderId}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(qrValue)
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>

                      <Button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.open(qrValue, '_blank')
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open WhatsApp
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h3 className="font-semibold text-blue-400 mb-2">Next Steps:</h3>
                  <ol className="text-sm text-gray-300 space-y-1">
                    <li>1. Show the QR code to the customer</li>
                    <li>2. Customer scans with their phone camera</li>
                    <li>3. Customer sends the WhatsApp message</li>
                    <li>4. Order will automatically move to "Initiated" status</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </OrderStatusChecker>

      <div className="flex gap-4">
        <Button onClick={onBackToOverview} variant="outline" className="flex-1">
          Back to Overview
        </Button>
        <Button onClick={onOrderInitiated} variant="outline" className="flex-1">
          Skip to Initiated Orders
        </Button>
      </div>
    </div>
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

// Main export component with data provider wrapper
export function EnhancedStaffDashboard(props: EnhancedStaffDashboardProps) {
  return (
    <DashboardDataProvider refreshInterval={30000}>
      <EnhancedStaffDashboardContent {...props} />
    </DashboardDataProvider>
  )
}
