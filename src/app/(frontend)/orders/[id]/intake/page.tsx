'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { IntakeInterface } from '@/components/intake/IntakeInterface'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
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

export default function IntakePage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [existingIntake, setExistingIntake] = useState<any>(null)
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

      // Check if intake already exists
      const intakeResponse = await fetch(`/api/v1/orders/${orderId}/intake`)
      if (intakeResponse.ok) {
        const intakeData = await intakeResponse.json()
        setExistingIntake(intakeData.intake)
      }
      // If 404, that's fine - no existing intake
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleIntakeComplete = async (intakeData: any) => {
    try {
      const method = existingIntake ? 'PUT' : 'POST'
      const response = await fetch(`/api/v1/orders/${orderId}/intake`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(intakeData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save intake')
      }

      const result = await response.json()
      console.log('Intake saved successfully:', result)

      // Navigate back to order detail page
      router.push(`/orders/${orderId}`)
    } catch (error) {
      console.error('Failed to save intake:', error)
      throw error // Let the IntakeInterface handle the error display
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
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="border-gray-600 text-gray-300"
                >
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

  return (
    <div className="min-h-screen bg-gray-900">
      <IntakeInterface
        orderId={orderId}
        orderData={orderData}
        existingData={existingIntake}
        onComplete={handleIntakeComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
