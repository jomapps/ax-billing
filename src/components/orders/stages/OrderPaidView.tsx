'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Wrench,
  ClipboardList,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { VehicleInfoCard } from '../shared/VehicleInfoCard'
import { cn } from '@/lib/utils'

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  whatsappLinked?: boolean
  whatsappNumber?: string
  customer?: any
  vehicle?: any
  servicesRendered?: any[]
  jobStatus?: any[]
  totalAmount: number
  paymentStatus: string
  overallStatus: string
  createdAt: string
  updatedAt: string
}

interface OrderPaidViewProps {
  orderId: string
  initialOrderData?: OrderData | null
  className?: string
}

export function OrderPaidView({ orderId, initialOrderData, className }: OrderPaidViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set initial data from server-side props
    if (initialOrderData) {
      setOrderData(initialOrderData)
      setLoading(false)
    } else {
      setError(`Order ${orderId} not found.`)
      setLoading(false)
    }
  }, [initialOrderData, orderId])

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

  return (
    <div className={cn('container mx-auto p-6 space-y-6 max-w-6xl', className)}>
      {/* Server-side architecture - no polling needed */}

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
            <p className="text-gray-400">Service Execution & Job Tracking</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Paid - In Service
          </Badge>
          <p className="text-sm text-gray-400 mt-1">Status: {orderData.overallStatus}</p>
        </div>
      </motion.div>

      {/* Coming Soon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-green-400" />
              Service Execution
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-12">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Job Tracking Coming Soon</h3>
            <p className="text-gray-400 mb-6">
              This stage will provide real-time job tracking, staff assignments, and progress
              monitoring.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Real-time job progress tracking</p>
              <p>• Staff task assignment and management</p>
              <p>• Step-by-step completion checkpoints</p>
              <p>• Quality control and inspection</p>
              <p>• Customer pickup coordination</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Vehicle Info if available */}
      {orderData.vehicle && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <VehicleInfoCard vehicle={orderData.vehicle} />
        </motion.div>
      )}
    </div>
  )
}
