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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ProgressiveDisclosure } from '@/components/ui/progressive-disclosure'

import { cn } from '@/lib/utils'

interface OrderPageViewProps {
  orderId: string
  initialOrderData?: OrderData | null
  className?: string
}

interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  qrCodeGenerated: boolean
  whatsappLinked: boolean
  whatsappNumber?: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash'
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'ready' | 'picked_up' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export function OrderPageView({ orderId, initialOrderData, className }: OrderPageViewProps) {
  const router = useRouter()
  const [orderData, setOrderData] = useState<OrderData | null>(initialOrderData || null)
  const [loading, setLoading] = useState(!initialOrderData) // Only show loading if no initial data
  const [error, setError] = useState<string | null>(null)
  const [orderNotFound, setOrderNotFound] = useState(!initialOrderData)
  const [qrValue, setQrValue] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const qrGeneratedRef = useRef(false) // Track if QR has been generated

  // TBD: This component requires a valid order to exist in the database
  // For testing, create an order first using the dashboard or API before accessing this page

  useEffect(() => {
    // Only fetch initial data if we don't have it from server-side
    if (!initialOrderData) {
      fetchFullOrderData()
    }
  }, [initialOrderData])

  useEffect(() => {
    // Generate QR code when order data is loaded - but only once
    if (orderData && orderData.orderStage === 'empty' && !qrGeneratedRef.current) {
      qrGeneratedRef.current = true
      generateQRCode()
    }
  }, [orderData])

  const fetchFullOrderData = async () => {
    try {
      setError(null)

      // Use PayloadCMS REST API to find order by orderID
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
    // Prevent multiple QR generations
    if (qrLoading || qrValue) {
      return
    }

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

  const copyToClipboard = async () => {
    if (qrValue && typeof navigator !== 'undefined' && navigator.clipboard) {
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
    if (qrValue && typeof window !== 'undefined') {
      window.open(qrValue, '_blank')
    }
  }

  const handleDeleteOrder = async () => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      // Delete the order using PayloadCMS REST API
      const response = await fetch(`/api/orders/${orderData?.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete order')
      }

      // Redirect to dashboard after successful deletion
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
            <p className="text-red-400 mb-4">{error || 'Order not found'}</p>

            {isNotFound && (
              <p className="text-gray-300 text-sm mb-4">
                This order may not exist yet. You can create a new order from the dashboard.
              </p>
            )}

            <div className="space-y-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-gray-600 text-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>

              {isNotFound && (
                <Button
                  onClick={() => router.push('/')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Create New Order
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (stage: string) => {
    const statusConfig = {
      empty: { label: 'Waiting for Customer', color: 'bg-yellow-500/20 text-yellow-400' },
      initiated: { label: 'Customer Connected', color: 'bg-green-500/20 text-green-400' },
      open: { label: 'Service Selection', color: 'bg-blue-500/20 text-blue-400' },
      billed: { label: 'Payment Required', color: 'bg-orange-500/20 text-orange-400' },
      paid: { label: 'Paid', color: 'bg-green-500/20 text-green-400' },
    }

    const config = statusConfig[stage as keyof typeof statusConfig] || statusConfig.empty
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const shouldShowQR = orderData?.orderStage === 'empty' || !orderData?.whatsappLinked

  return (
    <div className={cn('container mx-auto p-6 space-y-6 max-w-4xl', className)}>
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
            className="border-gray-600 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {orderData?.orderID || 'Unknown Order'}
            </h1>
            <p className="text-gray-400">Order Management</p>
          </div>
        </div>
        <div className="text-right">
          {orderData && getStatusBadge(orderData.orderStage)}
          <p className="text-sm text-gray-400 mt-1">
            Created {orderData ? new Date(orderData.createdAt).toLocaleString() : 'Unknown'}
          </p>
        </div>
      </motion.div>

      {/* Main Content - Mobile-First Layout */}
      <div className="space-y-6">
        {/* QR Code Section - Mobile Dialog, Desktop Card */}
        {shouldShowQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Mobile QR Dialog */}
            <div className="block lg:hidden">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-400" />
                      Customer QR Code
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View QR
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-blue-400" />
                            Customer QR Code
                          </DialogTitle>
                        </DialogHeader>
                        <div className="text-center space-y-4 p-4">
                          {qrLoading ? (
                            <div className="flex flex-col items-center space-y-4">
                              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                              <p className="text-gray-300">Generating QR code...</p>
                            </div>
                          ) : qrError ? (
                            <div className="text-center space-y-4">
                              <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
                              <p className="text-red-400">{qrError}</p>
                              <Button onClick={generateQRCode} variant="outline" size="sm">
                                Try Again
                              </Button>
                            </div>
                          ) : qrValue ? (
                            <div className="space-y-4">
                              <div className="flex justify-center">
                                <QRCodeSVG
                                  value={qrValue}
                                  size={280}
                                  level="M"
                                  includeMargin={true}
                                  className="border-2 border-gray-600 rounded-lg w-full max-w-xs"
                                />
                              </div>
                              <div className="space-y-3">
                                <p className="text-gray-300 text-sm">
                                  Customer can scan this QR code to start their service via WhatsApp
                                </p>
                                <div className="flex flex-col gap-2">
                                  <Button
                                    onClick={copyToClipboard}
                                    variant="outline"
                                    className="border-gray-600 text-gray-300 touch-target"
                                  >
                                    {copied ? (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={openWhatsApp}
                                    className="bg-green-500 hover:bg-green-600 text-white touch-target"
                                  >
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Open WhatsApp
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <p className="text-gray-300 text-sm">QR code ready for customer scanning</p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-300"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={openWhatsApp}
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-400 hover:bg-green-500/10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop QR Card */}
            <div className="hidden lg:block">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-blue-400" />
                    Customer QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {qrLoading ? (
                    <div className="flex flex-col items-center space-y-4">
                      <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                      <p className="text-gray-300">Generating QR code...</p>
                    </div>
                  ) : qrError ? (
                    <div className="text-center space-y-4">
                      <AlertTriangle className="w-8 h-8 mx-auto text-red-400" />
                      <p className="text-red-400">{qrError}</p>
                      <Button onClick={generateQRCode} variant="outline" size="sm">
                        Try Again
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
                      <div className="space-y-2">
                        <p className="text-gray-300 text-sm">
                          Customer can scan this QR code to start their service via WhatsApp
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={openWhatsApp}
                            variant="outline"
                            size="sm"
                            className="border-green-600 text-green-400 hover:bg-green-500/10"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Open WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Order Status Section - Enhanced Mobile Layout */}
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
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 touch-target"
                  title="Delete this order permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Status Information */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-300 font-medium">Order Stage:</span>
                  {orderData && getStatusBadge(orderData.orderStage)}
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-300 font-medium">WhatsApp Connected:</span>
                  <Badge
                    className={
                      orderData?.whatsappLinked
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }
                  >
                    {orderData?.whatsappLinked ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-300 font-medium">Payment Status:</span>
                  <Badge
                    className={
                      orderData?.paymentStatus === 'paid'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }
                  >
                    {orderData?.paymentStatus}
                  </Badge>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* Progressive Disclosure for Next Steps */}
              <ProgressiveDisclosure
                trigger={<span className="text-white font-medium">Next Steps</span>}
                priority="high"
                className="bg-gray-700/30 rounded-lg p-3"
                defaultOpen={true}
              >
                <div className="space-y-2">
                  {orderData?.orderStage === 'empty' && (
                    <p className="text-gray-300 text-sm">
                      Waiting for customer to scan QR code and connect via WhatsApp.
                    </p>
                  )}
                  {orderData?.orderStage === 'initiated' && (
                    <p className="text-gray-300 text-sm">
                      Customer connected! Staff can now proceed with service selection.
                    </p>
                  )}
                  {orderData?.orderStage === 'open' && (
                    <p className="text-gray-300 text-sm">
                      Services are being selected. Customer will receive pricing confirmation.
                    </p>
                  )}
                  {orderData?.orderStage === 'billed' && (
                    <p className="text-gray-300 text-sm">
                      Payment link sent to customer. Waiting for payment confirmation.
                    </p>
                  )}
                  {orderData?.orderStage === 'paid' && (
                    <p className="text-gray-300 text-sm">
                      Payment received! Service can now begin.
                    </p>
                  )}
                </div>
              </ProgressiveDisclosure>

              {/* Progressive Disclosure for Order Details */}
              <ProgressiveDisclosure
                trigger={<span className="text-white font-medium">Order Details</span>}
                priority="medium"
                className="bg-gray-700/30 rounded-lg p-3"
                defaultOpen={false}
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="text-gray-300">{orderData?.orderID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-gray-300">
                      {orderData ? new Date(orderData.createdAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Updated:</span>
                    <span className="text-gray-300">
                      {orderData ? new Date(orderData.updatedAt).toLocaleString() : 'Unknown'}
                    </span>
                  </div>
                  {orderData?.whatsappNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">WhatsApp Number:</span>
                      <span className="text-gray-300">{orderData.whatsappNumber}</span>
                    </div>
                  )}
                </div>
              </ProgressiveDisclosure>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Customer Connected Message */}
      {orderData?.orderStage !== 'empty' && orderData?.whatsappLinked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h4 className="text-green-400 font-medium">Customer Connected!</h4>
                  <p className="text-gray-300 text-sm">
                    {orderData.whatsappNumber
                      ? `Customer ${orderData.whatsappNumber} has connected via WhatsApp.`
                      : 'Customer has successfully connected via WhatsApp.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
