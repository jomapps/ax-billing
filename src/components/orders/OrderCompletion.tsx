'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle,
  Clock,
  User,
  Car,
  DollarSign,
  MessageSquare,
  Star,
  Send,
  Loader2,
  AlertCircle,
  Camera,
  FileText,
  Download,
  Share,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency, formatTime } from '@/lib/utils'

interface OrderCompletionProps {
  orderId: string
  onOrderCompleted: () => void
  onBack?: () => void
  className?: string
}

interface CompletionData {
  orderID: string
  customer: {
    name: string
    whatsappNumber: string
    email?: string
  }
  vehicle: {
    licensePlate: string
    vehicleType: string
  }
  services: Array<{
    id: string
    name: string
    price: number
    completed: boolean
  }>
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed'
  startTime: string
  completionTime?: string
  duration?: number
  beforePhotos?: string[]
  afterPhotos?: string[]
  notes?: string
}

export function OrderCompletion({
  orderId,
  onOrderCompleted,
  onBack,
  className = '',
}: OrderCompletionProps) {
  const [orderData, setOrderData] = useState<CompletionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [completionNotes, setCompletionNotes] = useState('')
  const [customerRating, setCustomerRating] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true)

        // Mock order completion data
        const mockData: CompletionData = {
          orderID: orderId,
          customer: {
            name: 'John Doe',
            whatsappNumber: '+60123456789',
            email: 'john.doe@example.com',
          },
          vehicle: {
            licensePlate: 'ABC1234',
            vehicleType: 'sedan',
          },
          services: [
            { id: '1', name: 'Premium Wash', price: 25, completed: true },
            { id: '2', name: 'Interior Cleaning', price: 20, completed: true },
          ],
          totalAmount: 45,
          paymentStatus: 'paid',
          startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          completionTime: new Date().toISOString(),
          duration: 45,
          beforePhotos: [
            'https://via.placeholder.com/200x150/666/fff?text=Before+1',
            'https://via.placeholder.com/200x150/666/fff?text=Before+2',
          ],
          afterPhotos: [
            'https://via.placeholder.com/200x150/4CAF50/fff?text=After+1',
            'https://via.placeholder.com/200x150/4CAF50/fff?text=After+2',
          ],
          notes: 'Vehicle was in good condition. All services completed successfully.',
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setOrderData(mockData)
        setCompletionNotes(mockData.notes || '')
      } catch (err) {
        console.error('Failed to fetch order data:', err)
        setError('Failed to load order data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId])

  const handleCompleteOrder = async () => {
    if (!orderData) return

    try {
      setCompleting(true)
      setError(null)

      // Mock API call to complete order
      const completionData = {
        orderId: orderData.orderID,
        completionNotes,
        completionTime: new Date().toISOString(),
        finalAmount: orderData.totalAmount,
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setSuccess('Order completed successfully!')

      // Auto-send completion notification
      await sendCompletionNotification()

      // Navigate back after completion
      setTimeout(() => {
        onOrderCompleted()
      }, 3000)
    } catch (err) {
      console.error('Failed to complete order:', err)
      setError('Failed to complete order. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const sendCompletionNotification = async () => {
    if (!orderData) return

    try {
      setSendingNotification(true)

      const message = `🎉 *Service Completed!*

Order ID: *${orderData.orderID}*
Vehicle: ${orderData.vehicle.licensePlate}
Total: ${formatCurrency(orderData.totalAmount)}
Duration: ${orderData.duration} minutes

Thank you for choosing AX Billing! 

Your vehicle is ready for pickup. We hope you're satisfied with our service.

Rate your experience: ⭐⭐⭐⭐⭐

Have a great day! 🚗✨`

      // Mock WhatsApp API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccess('Completion notification sent to customer!')
    } catch (err) {
      console.error('Failed to send notification:', err)
      setError('Failed to send completion notification.')
    } finally {
      setSendingNotification(false)
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

  if (!orderData) {
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
          <h2 className="text-2xl font-bold text-white">Complete Order</h2>
          <p className="text-gray-400">Order: {orderData.orderID}</p>
        </div>

        {onBack && (
          <Button onClick={onBack} variant="outline" className="border-gray-600 text-gray-300">
            Back
          </Button>
        )}
      </div>

      {/* Status Messages */}
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
              <CheckCircle className="w-5 h-5 text-green-400" />
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
              <CheckCircle className="w-5 h-5 text-green-400" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer & Vehicle Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300">
                  {`${orderData.customer.firstName || ''} ${orderData.customer.lastName || ''}`.trim() ||
                    'Unknown Customer'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-purple-400" />
                <span className="text-gray-300">
                  {orderData.vehicle.licensePlate} ({orderData.vehicle.vehicleType})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{orderData.customer.whatsappNumber}</span>
              </div>
            </div>

            <Separator className="bg-gray-700" />

            {/* Services */}
            <div className="space-y-2">
              <h4 className="text-white font-medium">Services Completed</h4>
              {orderData.services.map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{service.name}</span>
                  </div>
                  <span className="text-green-400">{formatCurrency(service.price)}</span>
                </div>
              ))}
            </div>

            <Separator className="bg-gray-700" />

            {/* Timing & Payment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Duration:</span>
                <div className="flex items-center gap-1 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{orderData.duration} minutes</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Payment Status:</span>
                <Badge
                  className={cn(
                    orderData.paymentStatus === 'paid'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  )}
                >
                  {orderData.paymentStatus.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-white">Total Amount:</span>
                <span className="text-green-400">{formatCurrency(orderData.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Actions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Completion Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Completion Notes */}
            <div>
              <Label className="text-gray-300">Completion Notes</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Add any notes about the service completion..."
                className="mt-2 bg-gray-700 border-gray-600 text-gray-300 min-h-[100px]"
              />
            </div>

            {/* Before/After Photos */}
            {(orderData.beforePhotos?.length || orderData.afterPhotos?.length) && (
              <div className="space-y-3">
                <Label className="text-gray-300">Service Photos</Label>

                {orderData.beforePhotos?.length && (
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2">Before Photos</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {orderData.beforePhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Before ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-600"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {orderData.afterPhotos?.length && (
                  <div>
                    <h5 className="text-sm text-gray-400 mb-2">After Photos</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {orderData.afterPhotos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`After ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-600"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleCompleteOrder}
                disabled={completing || sendingNotification}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                {completing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Completing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Order & Notify Customer
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={completing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>

                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                  disabled={completing}
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share Summary
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Feedback Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Customer Experience
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Quality */}
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-5 h-5',
                      star <= customerRating ? 'text-yellow-400 fill-current' : 'text-gray-600',
                    )}
                  />
                ))}
              </div>
              <h4 className="text-white font-medium">Service Quality</h4>
              <p className="text-gray-400 text-sm">Expected customer rating</p>
            </div>

            {/* Time Efficiency */}
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-medium">On Time</h4>
              <p className="text-gray-400 text-sm">Completed in {orderData.duration}m</p>
            </div>

            {/* Payment Status */}
            <div className="text-center p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <h4 className="text-white font-medium">Payment Complete</h4>
              <p className="text-gray-400 text-sm">{formatCurrency(orderData.totalAmount)}</p>
            </div>
          </div>

          {/* Completion Message Preview */}
          <div className="p-4 bg-gray-700/30 rounded-lg">
            <Label className="text-gray-300 text-sm">Customer Notification Preview</Label>
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm whitespace-pre-line">
                🎉 *Service Completed!*{'\n\n'}
                Order ID: *{orderData.orderID}*{'\n'}
                Vehicle: {orderData.vehicle.licensePlate}
                {'\n'}
                Total: {formatCurrency(orderData.totalAmount)}
                {'\n'}
                Duration: {orderData.duration} minutes{'\n\n'}
                Thank you for choosing AX Billing!{'\n\n'}
                Your vehicle is ready for pickup. We hope you're satisfied with our service.{'\n\n'}
                Rate your experience: ⭐⭐⭐⭐⭐{'\n\n'}
                Have a great day! 🚗✨
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
