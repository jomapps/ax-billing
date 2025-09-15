'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  RefreshCw,
  Bell,
  Activity,
  Plus,
  QrCode,
  Clock,
  Camera,
  Car,
  CreditCard,
  CheckCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Import modular components
import { OverviewDashboard } from './overview/OverviewDashboard'
import { DashboardDataProvider, useDashboardData } from './DashboardDataProvider'
import { MobileNavigation } from './MobileNavigation'

// Import existing workflow components
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'
import { InitiatedOrdersDashboard } from '@/components/whatsapp/InitiatedOrdersDashboard'
import { VehicleCaptureInterface } from '@/components/whatsapp/VehicleCaptureInterface'
import { ServiceSelectionGrid } from '@/components/services/ServiceSelectionGrid'
import { PaymentLinkGenerator } from '@/components/payments/PaymentLinkGenerator'
import { OrderCompletion } from '@/components/orders/OrderCompletion'

type WorkflowStep =
  | 'overview'
  | 'new-order'
  | 'order-created'
  | 'initiated-orders'
  | 'vehicle-capture'
  | 'service-selection'
  | 'payment'
  | 'completion'

interface ModularStaffDashboardProps {
  staffId?: string
  location?: string
}

function ModularStaffDashboardContent({
  staffId = 'staff-001',
  location = 'Main Branch',
}: ModularStaffDashboardProps) {
  const router = useRouter()
  const { orders, stats, loading, isRefreshing, error, refreshData } = useDashboardData()
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<string[]>([])

  // Navigation handlers
  const handleBackToOverview = () => {
    setCurrentStep('overview')
    setSelectedOrderId(null)
  }

  const handleRefresh = useCallback(async () => {
    await refreshData()
  }, [refreshData])

  // Workflow handlers
  const handleNewOrder = () => {
    setCurrentStep('new-order')
  }

  const handleOrderCreated = (orderId: string) => {
    setRecentOrderId(orderId)
    setSelectedOrderId(orderId)
    setNotifications((prev) => [...prev, `New order created: ${orderId}`])
    // Remove manual refresh - SSE will update shortly after order creation

    // Redirect to the order page instead of showing QR code on dashboard
    router.push(`/order/${orderId}`)
  }

  const handleViewInitiated = () => {
    setCurrentStep('initiated-orders')
  }

  const handleCaptureVehicle = (orderId: string) => {
    setSelectedOrderId(orderId)
    setCurrentStep('vehicle-capture')
  }

  const handleVehicleCaptured = () => {
    setCurrentStep('service-selection')
    // Remove manual refresh - SSE will update shortly after vehicle capture
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

  const handleOrderCompleted = () => {
    setCurrentStep('overview')
    setSelectedOrderId(null)
    // Remove manual refresh - SSE will update shortly after order completion
  }

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

  // Quick actions for mobile navigation
  const quickActions = [
    {
      id: 'new-order',
      label: 'Create Order',
      icon: Plus,
      onClick: handleNewOrder,
    },
    {
      id: 'initiated-orders',
      label: 'View Initiated',
      icon: Clock,
      onClick: handleViewInitiated,
      badge: orders.filter((o) => o.orderStage === 'initiated').length,
    },
    {
      id: 'refresh',
      label: 'Refresh Data',
      icon: RefreshCw,
      onClick: handleRefresh,
    },
  ]

  // Navigation handler for mobile
  const handleMobileNavigate = (stepId: string) => {
    const stepHandlers: Record<string, () => void> = {
      overview: handleBackToOverview,
      'new-order': handleNewOrder,
      'initiated-orders': handleViewInitiated,
    }

    const handler = stepHandlers[stepId]
    if (handler) {
      handler()
    } else {
      setCurrentStep(stepId as WorkflowStep)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Navigation */}
            <MobileNavigation
              currentStep={currentStep}
              workflowSteps={workflowSteps}
              quickActions={quickActions}
              onNavigate={handleMobileNavigate}
            />

            {currentStep !== 'overview' && (
              <Button
                onClick={handleBackToOverview}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hidden sm:flex"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Overview</span>
                <span className="sm:hidden">Back</span>
              </Button>
            )}
            <div>
              <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-white">
                {currentStep === 'overview'
                  ? 'Staff Dashboard'
                  : workflowSteps.find((step) => step.id === currentStep)?.label || 'Dashboard'}
              </h1>
              <p className="text-gray-400 text-responsive-xs">
                {location} • {staffId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                <Badge variant="secondary" className="ml-1">
                  {notifications.length}
                </Badge>
              </Button>
            )}

            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
              disabled={loading || isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 sm:mr-2 ${loading || isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

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
              <OverviewDashboard
                stats={stats}
                orders={orders}
                loading={loading}
                onNewOrder={handleNewOrder}
                onViewInitiated={handleViewInitiated}
                onOpenWhatsApp={() => {
                  if (typeof window !== 'undefined') {
                    window.open('/whatsapp-demo', '_blank')
                  }
                }}
              />
            )}

            {currentStep === 'new-order' && (
              <NewOrderContent
                staffId={staffId || 'staff-001'}
                location={location || 'Main Branch'}
                onOrderCreated={handleOrderCreated}
              />
            )}

            {currentStep === 'order-created' && recentOrderId && (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">Order Created Successfully!</h2>
                <p className="text-gray-400">Order ID: {recentOrderId}</p>
                <Button onClick={handleBackToOverview} className="bg-blue-500 hover:bg-blue-600">
                  Back to Dashboard
                </Button>
              </div>
            )}

            {currentStep === 'initiated-orders' && (
              <InitiatedOrdersDashboard onCaptureVehicle={handleCaptureVehicle} />
            )}

            {currentStep === 'vehicle-capture' && selectedOrderId && (
              <VehicleCaptureInterface
                orderId={selectedOrderId}
                onVehicleCaptured={handleVehicleCaptured}
              />
            )}

            {currentStep === 'service-selection' && selectedOrderId && (
              <ServiceSelectionGrid
                orderId={selectedOrderId}
                onServicesSelected={() => handlePaymentGeneration(selectedOrderId)}
              />
            )}

            {currentStep === 'payment' && selectedOrderId && (
              <PaymentLinkGenerator
                orderId={selectedOrderId}
                onPaymentSent={() => handleOrderCompletion(selectedOrderId)}
              />
            )}

            {currentStep === 'completion' && selectedOrderId && (
              <OrderCompletion orderId={selectedOrderId} onOrderCompleted={handleOrderCompleted} />
            )}
          </motion.div>
        </AnimatePresence>
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
      // TBD: Ensure database is properly connected and PayloadCMS is configured
      const response = await fetch('/api/v1/orders/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, location }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create order`)
      }

      const data = await response.json()
      if (data.success && data.orderID) {
        onOrderCreated(data.orderID)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('Failed to create order:', err)
      setError(err instanceof Error ? err.message : 'Failed to create order. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Create New Order</h3>
            <p className="text-gray-300 text-sm">
              Click the button below to create a new empty order. You will be redirected to the
              order page where customers can scan the QR code.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            onClick={handleCreateOrder}
            disabled={isCreating}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold"
            size="lg"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Creating Order...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>CREATE NEW ORDER</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main export component with data provider wrapper
export function ModularStaffDashboard(props: ModularStaffDashboardProps) {
  return (
    <DashboardDataProvider>
      <ModularStaffDashboardContent {...props} />
    </DashboardDataProvider>
  )
}
