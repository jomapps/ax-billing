'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  Smartphone,
  QrCode,
  Send,
  Copy,
  Check,
  DollarSign,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  Loader2,
  ExternalLink,
  Car,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn, formatCurrency } from '@/lib/utils'

interface OrderDetails {
  id: string
  orderID: string
  customer: {
    name: string
    whatsappNumber: string
    email?: string
  }
  services: Array<{
    id: string
    name: string
    price: number
  }>
  totalAmount: number
  estimatedTime: number
  vehicle?: {
    licensePlate: string
    vehicleType: string
  }
}

interface PaymentLinkGeneratorProps {
  orderId: string
  onPaymentSent: () => void
  onBack?: () => void
  className?: string
}

export function PaymentLinkGenerator({
  orderId,
  onPaymentSent,
  onBack,
  className = '',
}: PaymentLinkGeneratorProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [customMessage, setCustomMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Payment method options
  const paymentMethods = [
    {
      id: 'online',
      name: 'Online Payment',
      description: 'Credit/Debit Card, Digital Wallets',
      icon: CreditCard,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'qr',
      name: 'QR Code Payment',
      description: 'Scan to pay with mobile apps',
      icon: QrCode,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Payment',
      description: 'Send payment link via WhatsApp',
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ]

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('whatsapp')

  // Mock order details - replace with actual API call
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true)

        // Mock data - replace with actual API call
        const mockOrderDetails: OrderDetails = {
          id: '1',
          orderID: orderId,
          customer: {
            name: 'John Doe',
            whatsappNumber: '+60123456789',
            email: 'john.doe@example.com',
          },
          services: [
            { id: '1', name: 'Premium Wash', price: 25 },
            { id: '2', name: 'Interior Cleaning', price: 20 },
          ],
          totalAmount: 45,
          estimatedTime: 45,
          vehicle: {
            licensePlate: 'ABC1234',
            vehicleType: 'sedan',
          },
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setOrderDetails(mockOrderDetails)

        // Set default message
        setCustomMessage(
          `Hi ${`${mockOrderDetails.customer.firstName || ''} ${mockOrderDetails.customer.lastName || ''}`.trim() || 'Customer'}! Your car wash service is ready for payment.\n\n` +
            `Order: ${mockOrderDetails.orderID}\n` +
            `Vehicle: ${mockOrderDetails.vehicle?.licensePlate}\n` +
            `Total: ${formatCurrency(mockOrderDetails.totalAmount)}\n\n` +
            `Please click the link below to complete your payment:`,
        )
      } catch (err) {
        console.error('Failed to fetch order details:', err)
        setError('Failed to load order details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderId])

  const generatePaymentLink = async () => {
    if (!orderDetails) return

    try {
      setGenerating(true)
      setError(null)

      // Mock payment link generation - replace with actual API call
      const mockPaymentLink = `https://payment.axbilling.com/pay/${orderDetails.orderID}?amount=${orderDetails.totalAmount}&method=${selectedPaymentMethod}`
      const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPaymentLink)}`

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setPaymentLink(mockPaymentLink)
      setQrCodeUrl(mockQrCodeUrl)
      setSuccess('Payment link generated successfully!')
    } catch (err) {
      console.error('Failed to generate payment link:', err)
      setError('Failed to generate payment link. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const sendPaymentLink = async () => {
    if (!orderDetails || !paymentLink) return

    try {
      setSending(true)
      setError(null)

      // Mock WhatsApp message sending - replace with actual API call
      const messageData = {
        to: orderDetails.customer.whatsappNumber,
        message: `${customMessage}\n\n${paymentLink}`,
        orderId: orderDetails.orderID,
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess('Payment link sent successfully via WhatsApp!')

      // Auto-proceed after successful send
      setTimeout(() => {
        onPaymentSent()
      }, 2000)
    } catch (err) {
      console.error('Failed to send payment link:', err)
      setError('Failed to send payment link. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = async () => {
    if (!paymentLink) return

    try {
      await navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-400">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!orderDetails) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h3 className="text-xl font-semibold text-white mb-2">Order Not Found</h3>
        <p className="text-gray-400 mb-6">Unable to load order details for {orderId}</p>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300">
            Go Back
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Generate Payment Link</h2>
          <p className="text-gray-400">Order: {orderDetails.orderID}</p>
        </div>

        {onBack && (
          <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300">
            Back
          </Button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <p className="text-green-400">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">
                  {`${orderDetails.customer.firstName || ''} ${orderDetails.customer.lastName || ''}`.trim() ||
                    'Unknown Customer'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{orderDetails.customer.whatsappNumber}</span>
              </div>
              {orderDetails.vehicle && (
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">
                    {orderDetails.vehicle.licensePlate} ({orderDetails.vehicle.vehicleType})
                  </span>
                </div>
              )}
            </div>

            <Separator className="bg-gray-700" />

            {/* Services */}
            <div className="space-y-2">
              <h4 className="text-white font-medium">Services</h4>
              {orderDetails.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <span className="text-gray-300">{service.name}</span>
                  <span className="text-green-400">{formatCurrency(service.price)}</span>
                </div>
              ))}
            </div>

            <Separator className="bg-gray-700" />

            {/* Total */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Estimated Time:</span>
                <div className="flex items-center gap-1 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{orderDetails.estimatedTime} minutes</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">Total Amount:</span>
                <span className="text-green-400">{formatCurrency(orderDetails.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection & Generation */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Method Options */}
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = selectedPaymentMethod === method.id

                return (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={cn(
                        'p-4 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-700/30 hover:border-gray-600',
                      )}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('p-2 rounded-lg', method.bgColor)}>
                          <Icon className={cn('w-5 h-5', method.color)} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{method.name}</h4>
                          <p className="text-gray-400 text-sm">{method.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-blue-400" />}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Generate Payment Link Button */}
            {!paymentLink && (
              <Button
                onClick={generatePaymentLink}
                disabled={generating}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Generate Payment Link
                  </>
                )}
              </Button>
            )}

            {/* Payment Link Display */}
            {paymentLink && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <Label className="text-gray-300 text-sm">Payment Link</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={paymentLink}
                      readOnly
                      className="bg-gray-800 border-gray-600 text-gray-300"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="text-center">
                    <Label className="text-gray-300 text-sm">QR Code</Label>
                    <div className="mt-2 p-4 bg-white rounded-lg inline-block">
                      <img src={qrCodeUrl} alt="Payment QR Code" className="w-32 h-32" />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      Customer can scan this QR code to pay
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Message Section */}
      {paymentLink && selectedPaymentMethod === 'whatsapp' && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              WhatsApp Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300">Message to Customer</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter custom message..."
                className="mt-2 bg-gray-700 border-gray-600 text-gray-300 min-h-[120px]"
              />
              <p className="text-gray-400 text-sm mt-1">
                The payment link will be automatically added to the end of this message.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() =>
                  window.open(
                    `https://wa.me/${orderDetails.customer.whatsappNumber.replace('+', '')}`,
                    '_blank',
                  )
                }
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open WhatsApp
              </Button>

              <Button
                onClick={sendPaymentLink}
                disabled={sending || !customMessage.trim()}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Payment Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Actions */}
      {paymentLink && selectedPaymentMethod !== 'whatsapp' && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6 text-center">
            <h3 className="text-white font-semibold text-lg mb-2">Payment Link Ready</h3>
            <p className="text-gray-400 mb-6">
              Share the payment link or QR code with the customer to complete the payment.
            </p>
            <Button
              onClick={onPaymentSent}
              className="bg-green-500 hover:bg-green-600 text-white px-8"
              size="lg"
            >
              Continue to Completion
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
