'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DeliveryInterface } from '@/components/delivery/DeliveryInterface'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface OrderData {
  id: string
  orderID: string
  customer: {
    name: string
    email: string
    phone: string
  }
  vehicle: {
    licensePlate: string
    vehicleType: string
  }
  paymentStatus: string
  overallStatus: string
}

export default function DeliveryPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [existingDelivery, setExistingDelivery] = useState<any>(null)
  const [intakeData, setIntakeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [orderId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch order data
      const orderResponse = await fetch(`/api/orders/${orderId}`)
      if (!orderResponse.ok) {
        throw new Error('Failed to fetch order data')
      }
      const orderData = await orderResponse.json()
      setOrderData(orderData.order)

      // Check if intake exists (required for delivery)
      const intakeResponse = await fetch(`/api/orders/${orderId}/intake`)
      if (!intakeResponse.ok) {
        throw new Error('Intake must be completed before starting delivery')
      }
      const intakeData = await intakeResponse.json()
      setIntakeData(intakeData.intake)

      // Check if delivery already exists
      const deliveryResponse = await fetch(`/api/orders/${orderId}/delivery`)
      if (deliveryResponse.ok) {
        const deliveryData = await deliveryResponse.json()
        setExistingDelivery(deliveryData.delivery)
      }
      // If 404, that's fine - no existing delivery
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryComplete = async (deliveryData: any) => {
    try {
      const method = existingDelivery ? 'PUT' : 'POST'
      const response = await fetch(`/api/orders/${orderId}/delivery`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deliveryData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save delivery')
      }

      const result = await response.json()
      console.log('Delivery saved successfully:', result)
      
      // Show damage alert if new damage detected
      if (result.damageAlert) {
        alert(result.damageAlert)
      }
      
      // Navigate back to order detail page
      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error('Failed to save delivery:', error)
      throw error // Let the DeliveryInterface handle the error display
    }
  }

  const handleCancel = () => {
    router.push(`/orders/${orderId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="container mx-auto">
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-red-400 font-semibold">Error</h3>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button onClick={fetchData} className="bg-red-500 hover:bg-red-600">
                  Try Again
                </Button>
                <Button onClick={handleCancel} variant="outline" className="border-gray-600 text-gray-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Order not found</div>
      </div>
    )
  }

  if (!intakeData) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="container mx-auto">
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <div>
                  <h3 className="text-yellow-400 font-semibold">Intake Required</h3>
                  <p className="text-yellow-300">Vehicle intake must be completed before starting delivery process.</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button 
                  onClick={() => router.push(`/orders/${orderId}/intake`)} 
                  className="bg-green-500 hover:bg-green-600"
                >
                  Start Intake Process
                </Button>
                <Button onClick={handleCancel} variant="outline" className="border-gray-600 text-gray-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <DeliveryInterface
        orderId={orderId}
        orderData={orderData}
        intakeData={intakeData}
        existingData={existingDelivery}
        onComplete={handleDeliveryComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
