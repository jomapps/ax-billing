'use client'

import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  QrCode,
  Copy,
  CheckCircle,
  MessageSquare,
  ExternalLink,
  Download,
  Share,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'

interface QRCodeDialogProps {
  qrValue: string
  orderId: string
  isLoading?: boolean
  error?: string | null
  onCopy?: () => void
  onOpenWhatsApp?: () => void
  onRefresh?: () => void
  copied?: boolean
  trigger?: React.ReactNode
  title?: string
  description?: string
  className?: string
}

export function QRCodeDialog({
  qrValue,
  orderId,
  isLoading = false,
  error = null,
  onCopy,
  onOpenWhatsApp,
  onRefresh,
  copied = false,
  trigger,
  title = 'Customer QR Code',
  description = 'Customer can scan this QR code to start their service via WhatsApp',
  className,
}: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleCopy = async () => {
    if (qrValue && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(qrValue)
        onCopy?.()
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const handleOpenWhatsApp = () => {
    if (qrValue && typeof window !== 'undefined') {
      window.open(qrValue, '_blank')
      onOpenWhatsApp?.()
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share && qrValue) {
      try {
        await navigator.share({
          title: `Order ${orderId} - QR Code`,
          text: 'Scan this QR code to start your service',
          url: qrValue,
        })
      } catch (err) {
        // Fallback to copy
        handleCopy()
      }
    } else {
      handleCopy()
    }
  }

  const downloadQR = () => {
    if (!qrValue) return

    // Create a canvas to render the QR code
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 512
    canvas.height = 512

    // Create a temporary SVG element
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '512')
    svg.setAttribute('height', '512')

    // Create QR code SVG content (simplified)
    const qrSvg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="white"/>
      <text x="256" y="256" text-anchor="middle" font-size="16" fill="black">QR Code for ${orderId}</text>
    </svg>`

    // Create download link
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qr-code-${orderId}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const defaultTrigger = (
    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 touch-target">
      <QrCode className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">View QR Code</span>
      <span className="sm:hidden">QR</span>
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className={cn(
        'sm:max-w-md bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto',
        className
      )}>
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-400" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* QR Code Display */}
          <div className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center space-y-4">
                <RefreshCw className="w-12 h-12 text-blue-400 animate-spin" />
                <p className="text-gray-300">Generating QR code...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-400" />
                <p className="text-red-400">{error}</p>
                {onRefresh && (
                  <Button onClick={onRefresh} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            ) : qrValue ? (
              <div className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG
                    value={qrValue}
                    size={280}
                    level="M"
                    includeMargin={true}
                    className="w-full max-w-xs"
                  />
                </div>

                {/* Order Info */}
                <div className="space-y-2">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Order {orderId}
                  </Badge>
                  <p className="text-gray-300 text-sm">
                    {description}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          {qrValue && !isLoading && !error && (
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={handleOpenWhatsApp}
                  className="bg-green-500 hover:bg-green-600 text-white touch-target"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open in WhatsApp
                </Button>

                <Button
                  onClick={handleCopy}
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
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </Button>

                <Button
                  onClick={downloadQR}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <h4 className="text-white font-medium mb-2">Instructions:</h4>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Show this QR code to the customer</li>
              <li>Customer scans with their phone camera</li>
              <li>Customer will be redirected to WhatsApp</li>
              <li>Order will automatically update when connected</li>
            </ol>
          </div>

          {/* Close Button */}
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            className="w-full border-gray-600 text-gray-300"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Simplified version for inline use
interface InlineQRCodeProps {
  qrValue: string
  size?: number
  className?: string
}

export function InlineQRCode({ qrValue, size = 200, className }: InlineQRCodeProps) {
  if (!qrValue) return null

  return (
    <div className={cn('flex justify-center p-4 bg-white rounded-lg', className)}>
      <QRCodeSVG
        value={qrValue}
        size={size}
        level="M"
        includeMargin={true}
        className="border-2 border-gray-200 rounded"
      />
    </div>
  )
}
