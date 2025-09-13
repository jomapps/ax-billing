'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Camera,
  Upload,
  User,
  Phone,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ProgressiveDisclosure } from '@/components/ui/progressive-disclosure'

import { VehicleInfoCard } from '../shared/VehicleInfoCard'
import { VehicleCaptureInterface } from '@/components/whatsapp/VehicleCaptureInterface'
import { MultiImageVehicleCaptureInterface } from '@/components/whatsapp/MultiImageVehicleCaptureInterface'
import { cn } from '@/lib/utils'

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  whatsappLinked?: boolean
  whatsappNumber?: string
  customer?: {
    id: string
    name?: string
    email?: string
    phone?: string
  }
  vehicle?: any
  totalAmount: number
  paymentStatus: string
  overallStatus: string
  createdAt: string
  updatedAt: string
  qrCodeScannedAt?: string
  vehicleCapturedAt?: string
}

interface OrderInitiatedViewProps {
  orderId: string
  initialOrderData?: OrderData | null
  className?: string
}

export function OrderInitiatedView({
  orderId,
  initialOrderData,
  className,
}: OrderInitiatedViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData)
  const [error, setError] = useState<string | null>(null)
  const [showVehicleCapture, setShowVehicleCapture] = useState(false)

  useEffect(() => {
    if (!initialOrderData) {
      fetchFullOrderData()
    }
  }, [initialOrderData])

  const fetchFullOrderData = async () => {
    try {
      setError(null)

      const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&depth=3`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch order data`)
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        setOrderData(data.docs[0])
      } else {
        setError(`Order ${orderId} not found.`)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch order data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load order data.')
      setLoading(false)
    }
  }

  const handleVehicleCaptured = (vehicleData: any) => {
    // Refresh order data to get updated vehicle information
    fetchFullOrderData()
    setShowVehicleCapture(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
            <p className="text-gray-300">Loading order...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !orderData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Order</h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasVehicle = orderData.vehicle && orderData.vehicleCapturedAt
  const hasCustomer = orderData.customer && orderData.whatsappLinked

  return (
    <div className={cn('container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl', className)}>
      {/* Server-side architecture - no polling needed */}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-responsive-xl sm:text-responsive-2xl font-bold text-white truncate">
              {orderData.orderID}
            </h1>
            <p className="text-gray-400 text-responsive-xs sm:text-responsive-sm">
              Customer Connected - Capturing Vehicle
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-1 flex-shrink-0">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 self-start sm:self-auto">
            Initiated
          </Badge>
          <p className="text-responsive-xs text-gray-400">
            Connected{' '}
            {orderData.qrCodeScannedAt
              ? new Date(orderData.qrCodeScannedAt).toLocaleDateString()
              : 'Recently'}
          </p>
        </div>
      </motion.div>

      <div className="space-y-4 sm:space-y-6">
        {/* Customer Information - Mobile-First with CollapsibleSection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <CollapsibleSection title="Customer Information" icon={User} defaultOpen={true}>
            {hasCustomer ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-300 font-medium">WhatsApp Status:</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 self-start sm:self-auto">
                    Connected
                  </Badge>
                </div>

                {orderData.customer?.name && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-300 font-medium">Name:</span>
                    <span className="text-white">{orderData.customer.name}</span>
                  </div>
                )}

                {orderData.whatsappNumber && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-300 font-medium">WhatsApp:</span>
                    <span className="text-white font-mono text-sm break-all">
                      {orderData.whatsappNumber}
                    </span>
                  </div>
                )}

                {orderData.customer?.email && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-300 font-medium">Email:</span>
                    <span className="text-white text-sm break-all">{orderData.customer.email}</span>
                  </div>
                )}

                {orderData.customer?.phone && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-300 font-medium">Phone:</span>
                    <span className="text-white font-mono text-sm">{orderData.customer.phone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Waiting for customer connection...</p>
                <p className="text-gray-500 text-sm mt-2">
                  Customer will connect via WhatsApp QR scan
                </p>
              </div>
            )}
          </CollapsibleSection>
        </motion.div>

        {/* Vehicle Capture - Enhanced Mobile Layout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <CollapsibleSection title="Vehicle Capture" icon={Camera} defaultOpen={!hasVehicle}>
            {hasVehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Vehicle Captured Successfully</span>
                </div>
                <VehicleInfoCard vehicle={orderData.vehicle} showOwner={false} />
              </div>
            ) : (
              <div className="space-y-4">
                {showVehicleCapture ? (
                  <MultiImageVehicleCaptureInterface
                    orderId={orderId}
                    onVehicleCaptured={handleVehicleCaptured}
                    onCancel={() => setShowVehicleCapture(false)}
                  />
                ) : (
                  <div className="text-center py-6">
                    <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Comprehensive Vehicle Capture
                    </h3>
                    <p className="text-gray-400 mb-6 text-sm sm:text-base">
                      Take multiple photos of the vehicle (front, back, left, right) to
                      automatically extract license plate, analyze vehicle size, and detect any
                      damage.
                    </p>
                    <Button
                      onClick={() => setShowVehicleCapture(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto touch-target"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Start Multi-Image Capture</span>
                      <span className="sm:hidden">Start Capture</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
        </motion.div>

        {/* Progress Status - Enhanced with Progress Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CollapsibleSection title="Progress Status" icon={Clock} defaultOpen={true}>
            <div className="space-y-6">
              {/* Visual Progress Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Order Initiation Progress</span>
                  <span className="text-sm text-gray-400">
                    {hasCustomer && hasVehicle ? '100%' : hasCustomer || hasVehicle ? '67%' : '33%'}
                  </span>
                </div>
                <Progress
                  value={hasCustomer && hasVehicle ? 100 : hasCustomer || hasVehicle ? 67 : 33}
                  className="h-3"
                  variant="gaming"
                />
              </div>

              <Separator className="bg-gray-600" />

              {/* Progress Steps */}
              <ProgressiveDisclosure
                trigger={<span className="text-white font-medium">Progress Details</span>}
                priority="high"
                className="bg-gray-700/30 rounded-lg p-4"
                defaultOpen={true}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-white">QR Code Scanned</span>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {orderData.qrCodeScannedAt &&
                        new Date(orderData.qrCodeScannedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {hasCustomer ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="text-white">Customer Connected</span>
                    </div>
                    {hasCustomer && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs self-start sm:self-auto">
                        Complete
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {hasVehicle ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      )}
                      <span className="text-white">Vehicle Information Captured</span>
                    </div>
                    {hasVehicle && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs self-start sm:self-auto">
                        Complete
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400">Service Selection</span>
                    </div>
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs self-start sm:self-auto">
                      Pending
                    </Badge>
                  </div>
                </div>
              </ProgressiveDisclosure>

              {/* Success Message */}
              {hasCustomer && hasVehicle && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Ready for Next Stage</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Customer and vehicle information captured. Order will automatically progress to
                    service selection.
                  </p>
                </motion.div>
              )}
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>
    </div>
  )
}
