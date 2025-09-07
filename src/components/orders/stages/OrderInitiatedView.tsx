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
import { OrderStagePoller } from '../OrderStagePoller'
import { VehicleInfoCard } from '../shared/VehicleInfoCard'
import { VehicleCaptureInterface } from '@/components/whatsapp/VehicleCaptureInterface'
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

export function OrderInitiatedView({ orderId, initialOrderData, className }: OrderInitiatedViewProps) {
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
    <div className={cn('container mx-auto p-6 space-y-6 max-w-6xl', className)}>
      <OrderStagePoller orderId={orderId} currentStage={orderData.orderStage} />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{orderData.orderID}</h1>
            <p className="text-gray-400">Customer Connected - Capturing Vehicle</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Initiated
          </Badge>
          <p className="text-sm text-gray-400 mt-1">
            Connected {orderData.qrCodeScannedAt ? new Date(orderData.qrCodeScannedAt).toLocaleString() : 'Recently'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-green-400" />
                Customer Information
                {hasCustomer && <CheckCircle className="w-4 h-4 text-green-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCustomer ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">WhatsApp Status:</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      Connected
                    </Badge>
                  </div>
                  
                  {orderData.customer?.name && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Name:</span>
                      <span className="text-white">{orderData.customer.name}</span>
                    </div>
                  )}
                  
                  {orderData.whatsappNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">WhatsApp:</span>
                      <span className="text-white font-mono">{orderData.whatsappNumber}</span>
                    </div>
                  )}
                  
                  {orderData.customer?.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Email:</span>
                      <span className="text-white">{orderData.customer.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Waiting for customer connection...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Capture */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {hasVehicle ? (
            <VehicleInfoCard vehicle={orderData.vehicle} showOwner={false} />
          ) : (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-400" />
                  Vehicle Capture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showVehicleCapture ? (
                  <VehicleCaptureInterface
                    orderId={orderData.orderID}
                    onVehicleCaptured={handleVehicleCaptured}
                    onCancel={() => setShowVehicleCapture(false)}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">Capture Vehicle Information</h3>
                    <p className="text-gray-400 mb-6">
                      Take a photo of the vehicle to automatically extract license plate and vehicle type.
                    </p>
                    <Button
                      onClick={() => setShowVehicleCapture(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Vehicle Capture
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Progress Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Progress Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white">QR Code Scanned</span>
                <span className="text-gray-400 text-sm">
                  {orderData.qrCodeScannedAt && new Date(orderData.qrCodeScannedAt).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {hasCustomer ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
                <span className="text-white">Customer Connected</span>
                {hasCustomer && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Complete
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {hasVehicle ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
                <span className="text-white">Vehicle Information Captured</span>
                {hasVehicle && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Complete
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400">Service Selection</span>
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                  Pending
                </Badge>
              </div>
            </div>
            
            {hasCustomer && hasVehicle && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Ready for Next Stage</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Customer and vehicle information captured. Order will automatically progress to service selection.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
