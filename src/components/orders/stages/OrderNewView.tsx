'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  QrCode,
  MessageSquare,
  Copy,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Trash2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderStagePoller } from '../OrderStagePoller'
import { cn } from '@/lib/utils'

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  whatsappLinked?: boolean
  whatsappNumber?: string
  customer?: any
  vehicle?: any
  totalAmount: number
  paymentStatus: string
  overallStatus: string
  createdAt: string
  updatedAt: string
}

interface OrderNewViewProps {
  orderId: string
  initialOrderData?: OrderData | null
  className?: string
}

export function OrderNewView({ orderId, initialOrderData, className }: OrderNewViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData)
  const [error, setError] = useState<string | null>(null)
  const [orderNotFound, setOrderNotFound] = useState(!initialOrderData)
  const [qrValue, setQrValue] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const qrGeneratedRef = useRef(false)

  useEffect(() => {
    if (!initialOrderData) {
      fetchFullOrderData()
    }
  }, [initialOrderData])

  useEffect(() => {
    if (orderData && orderData.orderStage === 'empty' && !qrGeneratedRef.current) {
      qrGeneratedRef.current = true
      generateQRCode()
    }
  }, [orderData])

  const fetchFullOrderData = async () => {
    try {
      setError(null)

      const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&depth=2`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch order data`)
      }

      const data = await response.json()

      if (data.docs && data.docs.length > 0) {
        setOrderData(data.docs[0])
        setOrderNotFound(false)
      } else {
        setError(`Order ${orderId} not found. It may not exist or may have been deleted.`)
        setOrderNotFound(true)
      }
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch order data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load order data. Please try again.')
      setOrderNotFound(true)
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    if (qrLoading || qrValue) {
      console.log('QR generation skipped:', { qrLoading, qrValue: !!qrValue })
      return
    }

    console.log('Starting QR generation for order:', orderData?.orderID)

    try {
      setQrLoading(true)
      setQrError(null)

      const response = await fetch('/api/v1/whatsapp/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          staffId: 'staff-001', // TODO: Get from context
          location: 'Main Branch', // TODO: Get from context
        }),
      })

      console.log('QR API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('QR API error:', errorData)
        throw new Error(errorData.error || 'Failed to generate QR code')
      }

      const data = await response.json()
      console.log('QR API response data:', data)

      if (data.qrValue) {
        setQrValue(data.qrValue)
        console.log('QR value set:', data.qrValue)
      } else {
        throw new Error('No QR value in response')
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err)
      setQrError(err instanceof Error ? err.message : 'Failed to generate QR code')
    } finally {
      setQrLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (qrValue) {
      try {
        await navigator.clipboard.writeText(qrValue)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const openWhatsApp = () => {
    if (qrValue) {
      window.open(qrValue, '_blank')
    }
  }

  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/orders/${orderData?.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      router.push('/')
    } catch (error) {
      console.error('Failed to delete order:', error)
      alert('Failed to delete order. Please try again.')
    }
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

  if (error || (!loading && !orderData)) {
    const isNotFound = error?.includes('not found') || error?.includes('404')

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {isNotFound ? 'Order Not Found' : 'Error Loading Order'}
            </h3>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              {!isNotFound && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!orderData) return null

  return (
    <div className={cn('container mx-auto p-6 space-y-6 max-w-4xl', className)}>
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
            <p className="text-gray-400">New Order - Awaiting Customer</p>
          </div>
        </div>
        <div className="text-right">
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            Awaiting QR Scan
          </Badge>
          <p className="text-sm text-gray-400 mt-1">
            Created {new Date(orderData.createdAt).toLocaleString()}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-400" />
                Customer QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : qrError ? (
                <div className="text-center p-8">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="text-red-400 mb-4">{qrError}</p>
                  <Button onClick={generateQRCode} variant="outline" size="sm">
                    Retry
                  </Button>
                </div>
              ) : qrValue ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={qrValue}
                      size={256}
                      level="M"
                      includeMargin={true}
                      className="border-2 border-gray-600 rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                    <Button
                      onClick={openWhatsApp}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Open WhatsApp
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  Order Status
                </div>
                <Button
                  onClick={handleDeleteOrder}
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  title="Delete this order permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Order Stage:</span>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    New Order
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">WhatsApp Connected:</span>
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Not Connected
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Customer:</span>
                  <span className="text-gray-400">Awaiting Connection</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Vehicle:</span>
                  <span className="text-gray-400">Not Captured</span>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div className="space-y-2">
                <h4 className="text-white font-medium">Next Steps:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Customer scans QR code</li>
                  <li>• WhatsApp conversation initiated</li>
                  <li>• Vehicle information captured</li>
                  <li>• Services selected and billed</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
