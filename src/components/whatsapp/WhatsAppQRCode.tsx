'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, Check } from 'lucide-react'

interface WhatsAppQRCodeProps {
  orderId?: string
  staffId?: string
  location?: string
  onOrderCreated?: (orderId: string) => void
  className?: string
}

export function WhatsAppQRCode({
  orderId,
  staffId,
  location,
  onOrderCreated,
  className = '',
}: WhatsAppQRCodeProps) {
  const [qrValue, setQrValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrderId, setCurrentOrderId] = useState(orderId)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (currentOrderId) {
      generateQRCodeWithOrder()
    } else {
      createOrderAndGenerateQR()
    }
  }, [currentOrderId, staffId, location])

  const createOrderAndGenerateQR = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create empty order first
      const orderResponse = await fetch('/api/v1/orders/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, location }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create order')
      }

      const orderData = await orderResponse.json()
      const newOrderId = orderData.orderID

      setCurrentOrderId(newOrderId)
      onOrderCreated?.(newOrderId)

      // Generate QR code with order ID
      await generateQRCodeWithOrder(newOrderId)
    } catch (error) {
      console.error('Failed to create order and generate QR code:', error)
      setError('Failed to create order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCodeWithOrder = async (orderIdToUse?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const orderIdForQR = orderIdToUse || currentOrderId
      const response = await fetch('/api/v1/whatsapp/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderIdForQR,
          staffId,
          location,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data = await response.json()
      setQrValue(data.qrValue)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      setError('Failed to generate QR code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    if (currentOrderId) {
      generateQRCodeWithOrder()
    } else {
      createOrderAndGenerateQR()
    }
  }

  const handleCopyLink = async () => {
    if (qrValue) {
      try {
        await navigator.clipboard.writeText(qrValue)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <Card className={`w-fit ${className}`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-pulse bg-gray-200 w-64 h-64 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`w-fit ${className}`}>
        <CardHeader>
          <CardTitle className="text-center text-red-600">Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-fit ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Scan to Start Service</CardTitle>
        {currentOrderId && (
          <p className="text-center text-sm text-gray-600">
            Order ID: <span className="font-mono font-bold text-blue-600">{currentOrderId}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="relative">
          <QRCodeSVG
            value={qrValue}
            size={256}
            level="M"
            includeMargin={true}
            className="border-2 border-gray-200 rounded-lg"
          />
        </div>

        <div className="text-center max-w-xs space-y-2">
          <p className="text-sm text-gray-600">
            Scan this QR code with your phone to start your car wash service via WhatsApp
          </p>
          {currentOrderId && (
            <p className="text-xs text-gray-500">
              This QR code is linked to order {currentOrderId}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button onClick={handleCopyLink} variant="outline" size="sm">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
