'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Edit,
  Camera,
  CheckCircle,
  AlertTriangle,
  User,
  Car,
  Calendar,
  DollarSign,
  Clock,
  Package,
  FileText,
  Settings,
  Truck,
  Eye,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { cn, formatCurrency, formatDisplayDate } from '@/lib/utils'

interface OrderDetailViewProps {
  orderId: string
  className?: string
}

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  customer?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  vehicle?: {
    id: string
    licensePlate: string
    vehicleType: string
  }
  servicesRendered?: Array<{
    service: {
      name: string
      description: string
    }
    servicePrice: number
    optionsPrice: number
  }>
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash'
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'ready' | 'picked_up' | 'cancelled'
  queue: 'regular' | 'vip' | 'remnant'
  estimatedCompletionTime?: string
  createdAt: string
  updatedAt: string
  intake?: {
    id: string
    intakeCompletedAt?: string
    damageAssessment?: any
  }
  delivery?: {
    id: string
    deliveryCompletedAt?: string
    newDamageDetected?: boolean
  }
}

export function OrderDetailView({ orderId, className }: OrderDetailViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderData()
  }, [orderId])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch order data')
      }

      const data = await response.json()
      setOrderData(data.order)
    } catch (err) {
      console.error('Failed to fetch order data:', err)
      setError('Failed to load order data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canEdit = () => {
    if (!orderData) return false
    // Can edit if order is not paid (as per requirements)
    return orderData.paymentStatus !== 'paid'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-500'
      case 'in_progress':
      case 'billed':
        return 'bg-blue-500'
      case 'pending':
      case 'empty':
        return 'bg-yellow-500'
      case 'cancelled':
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getQueueColor = (queue: string) => {
    switch (queue) {
      case 'vip':
        return 'bg-purple-500'
      case 'remnant':
        return 'bg-orange-500'
      default:
        return 'bg-blue-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-12 h-12"></div>
          <p className="text-gray-400">Loading order details...</p>
        </div>
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
            <p className="text-red-400 mb-4">{error || 'Order not found'}</p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('container mx-auto p-6 space-y-6', className)}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{orderData.orderID}</h1>
            <p className="text-gray-400">Order Details & Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(orderData.overallStatus)}>
            {orderData.overallStatus.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge className={getQueueColor(orderData.queue)}>{orderData.queue.toUpperCase()}</Badge>
        </div>
      </motion.div>

      {/* Mobile-First Tabbed Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800/50 border-gray-700">
            <TabsTrigger value="overview" className="flex items-center gap-2 text-xs sm:text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2 text-xs sm:text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="process" className="flex items-center gap-2 text-xs sm:text-sm">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Process</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Customer & Vehicle Info */}
              <CollapsibleSection title="Customer & Vehicle" icon={User}>
                <div className="space-y-4">
                  {orderData.customer ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Customer</h4>
                      <p className="text-gray-300">
                        {orderData.customer.name || 'Unknown Customer'}
                      </p>
                      <p className="text-gray-400 text-sm">{orderData.customer.email}</p>
                      {orderData.customer.phone && (
                        <p className="text-gray-400 text-sm">{orderData.customer.phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">No customer assigned</p>
                  )}

                  <Separator className="bg-gray-600" />

                  {orderData.vehicle ? (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-white">Vehicle</h4>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-300">{orderData.vehicle.licensePlate}</span>
                      </div>
                      <p className="text-gray-400 text-sm capitalize">
                        {orderData.vehicle.vehicleType.replace('_', ' ')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400">No vehicle assigned</p>
                  )}
                </div>
              </CollapsibleSection>

              {/* Status & Timeline */}
              <CollapsibleSection title="Status & Timeline" icon={Clock}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Order Stage</p>
                      <Badge className={getStatusColor(orderData.orderStage)}>
                        {orderData.orderStage.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Payment Status</p>
                      <Badge className={getStatusColor(orderData.paymentStatus)}>
                        {orderData.paymentStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="bg-gray-600" />

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-sm">Created:</span>
                      </div>
                      <span className="text-gray-300 text-sm">
                        {formatDisplayDate(orderData.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-sm">Updated:</span>
                      </div>
                      <span className="text-gray-300 text-sm">
                        {formatDisplayDate(orderData.updatedAt)}
                      </span>
                    </div>
                    {orderData.estimatedCompletionTime && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-400" />
                          <span className="text-gray-400 text-sm">Est. Completion:</span>
                        </div>
                        <span className="text-gray-300 text-sm">
                          {formatDisplayDate(orderData.estimatedCompletionTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Edit Order - Only if not paid */}
              {canEdit() && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/edit`)}
                  className="h-24 bg-blue-500 hover:bg-blue-600 text-white flex flex-col items-center gap-2 touch-target"
                >
                  <Edit className="w-6 h-6" />
                  <span className="text-sm font-medium">Edit Order</span>
                </Button>
              )}

              {/* Intake - Only if no intake exists */}
              {!orderData.intake && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/intake`)}
                  className="h-24 bg-green-500 hover:bg-green-600 text-white flex flex-col items-center gap-2 touch-target"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-sm font-medium">Start Intake</span>
                </Button>
              )}

              {/* View Intake - If intake exists */}
              {orderData.intake && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/intake/view`)}
                  variant="outline"
                  className="h-24 border-green-500 text-green-400 hover:bg-green-500/10 flex flex-col items-center gap-2 touch-target"
                >
                  <Eye className="w-6 h-6" />
                  <span className="text-sm font-medium">View Intake</span>
                </Button>
              )}

              {/* Delivery - Only if intake exists and no delivery */}
              {orderData.intake && !orderData.delivery && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/delivery`)}
                  className="h-24 bg-purple-500 hover:bg-purple-600 text-white flex flex-col items-center gap-2 touch-target"
                >
                  <Truck className="w-6 h-6" />
                  <span className="text-sm font-medium">Start Delivery</span>
                </Button>
              )}

              {/* View Delivery - If delivery exists */}
              {orderData.delivery && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/delivery/view`)}
                  variant="outline"
                  className="h-24 border-purple-500 text-purple-400 hover:bg-purple-500/10 flex flex-col items-center gap-2 touch-target"
                >
                  <Eye className="w-6 h-6" />
                  <span className="text-sm font-medium">View Delivery</span>
                </Button>
              )}

              {/* Complete Order - If ready */}
              {orderData.overallStatus === 'ready' && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/complete`)}
                  className="h-24 bg-yellow-500 hover:bg-yellow-600 text-black flex flex-col items-center gap-2 touch-target"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">Complete</span>
                </Button>
              )}

              {/* Generate Payment Link - If billed but not paid */}
              {orderData.orderStage === 'billed' && orderData.paymentStatus !== 'paid' && (
                <Button
                  onClick={() => router.push(`/orders/${orderId}/payment`)}
                  className="h-24 bg-orange-500 hover:bg-orange-600 text-white flex flex-col items-center gap-2 touch-target"
                >
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-medium">Payment Link</span>
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <CollapsibleSection title="Services & Pricing" icon={Package}>
              {orderData.servicesRendered && orderData.servicesRendered.length > 0 ? (
                <div className="space-y-4">
                  {orderData.servicesRendered.map((serviceItem, index) => (
                    <div key={index} className="border border-gray-600 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-white">{serviceItem.service.name}</h4>
                        <div className="text-left sm:text-right">
                          <p className="text-white font-semibold">
                            {formatCurrency(
                              serviceItem.servicePrice + (serviceItem.optionsPrice || 0),
                            )}
                          </p>
                          {serviceItem.optionsPrice > 0 && (
                            <p className="text-gray-400 text-sm">
                              Service: {formatCurrency(serviceItem.servicePrice)} + Options:{' '}
                              {formatCurrency(serviceItem.optionsPrice)}
                            </p>
                          )}
                        </div>
                      </div>
                      {serviceItem.service.description && (
                        <p className="text-gray-400 text-sm">{serviceItem.service.description}</p>
                      )}
                    </div>
                  ))}

                  <Separator className="bg-gray-600" />

                  <div className="flex items-center justify-between text-lg sm:text-xl font-bold">
                    <span className="text-white">Total Amount:</span>
                    <span className="text-green-400">{formatCurrency(orderData.totalAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">No services added yet</p>
                  {canEdit() && (
                    <Button
                      onClick={() => router.push(`/orders/${orderId}/services`)}
                      className="mt-4 bg-blue-500 hover:bg-blue-600"
                    >
                      Add Services
                    </Button>
                  )}
                </div>
              )}
            </CollapsibleSection>
          </TabsContent>
          {/* Process Tab */}
          <TabsContent value="process" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Intake Status */}
              <CollapsibleSection title="Intake Status" icon={Camera}>
                {orderData.intake ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Intake Completed</span>
                    </div>
                    {orderData.intake.intakeCompletedAt && (
                      <p className="text-gray-400 text-sm">
                        Completed: {formatDisplayDate(orderData.intake.intakeCompletedAt)}
                      </p>
                    )}
                    <Button
                      onClick={() => router.push(`/orders/${orderId}/intake/view`)}
                      variant="outline"
                      className="w-full border-green-500 text-green-400 hover:bg-green-500/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Intake Details
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">Intake Pending</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Vehicle intake with photos and damage assessment needs to be completed.
                    </p>
                    <Button
                      onClick={() => router.push(`/orders/${orderId}/intake`)}
                      className="w-full bg-green-500 hover:bg-green-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Intake Process
                    </Button>
                  </div>
                )}
              </CollapsibleSection>

              {/* Delivery Status */}
              <CollapsibleSection title="Delivery Status" icon={Truck}>
                {orderData.delivery ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">Delivery Completed</span>
                    </div>
                    {orderData.delivery.newDamageDetected && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-400 font-semibold">New Damage Detected!</span>
                      </div>
                    )}
                    {orderData.delivery.deliveryCompletedAt && (
                      <p className="text-gray-400 text-sm">
                        Completed: {formatDisplayDate(orderData.delivery.deliveryCompletedAt)}
                      </p>
                    )}
                    <Button
                      onClick={() => router.push(`/orders/${orderId}/delivery/view`)}
                      variant="outline"
                      className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Delivery Details
                    </Button>
                  </div>
                ) : orderData.intake ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-yellow-400 font-semibold">Delivery Pending</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Vehicle delivery inspection and damage comparison needs to be completed.
                    </p>
                    <Button
                      onClick={() => router.push(`/orders/${orderId}/delivery`)}
                      className="w-full bg-purple-500 hover:bg-purple-600"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Start Delivery Process
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400 font-semibold">Awaiting Intake</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Complete vehicle intake first before starting delivery process.
                    </p>
                    <Button disabled className="w-full" variant="outline">
                      <Truck className="w-4 h-4 mr-2" />
                      Delivery Unavailable
                    </Button>
                  </div>
                )}
              </CollapsibleSection>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
