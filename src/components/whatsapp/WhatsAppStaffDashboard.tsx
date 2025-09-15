'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WhatsAppQRCode } from './WhatsAppQRCode'
import { InitiatedOrdersDashboard } from './InitiatedOrdersDashboard'

import { QrCode, Clock, Camera, MessageSquare } from 'lucide-react'

interface WhatsAppStaffDashboardProps {
  staffId?: string
  location?: string
  className?: string
}

export function WhatsAppStaffDashboard({
  staffId,
  location,
  className = '',
}: WhatsAppStaffDashboardProps) {
  const [activeTab, setActiveTab] = useState('qr-code')

  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)

  const handleOrderCreated = (orderId: string) => {
    setRecentOrderId(orderId)
  }

  const handleCaptureVehicle = (orderId: string) => {
    // Vehicle capture is now handled directly in the orders tab
    // Switch to orders tab if not already there
    if (activeTab !== 'orders') {
      setActiveTab('orders')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            WhatsApp Integration Dashboard
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage QR codes, track initiated orders, and process vehicle information
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="qr-code" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code & Setup
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Orders & Vehicle Capture
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr-code" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <WhatsAppQRCode
                staffId={staffId}
                location={location}
                onOrderCreated={handleOrderCreated}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Generate QR Code</p>
                      <p className="text-sm text-gray-600">
                        A new empty order is created with a unique ID embedded in the QR code
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Customer Scans</p>
                      <p className="text-sm text-gray-600">
                        Customer scans QR code and gets connected to WhatsApp with order ID
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Order Initiated</p>
                      <p className="text-sm text-gray-600">
                        Order appears in "Initiated Orders" tab for vehicle capture
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {recentOrderId && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-green-600 mb-2">Latest Order Created</p>
                      <p className="font-mono font-bold text-green-800">{recentOrderId}</p>
                      <Button onClick={() => setActiveTab('orders')} size="sm" className="mt-3">
                        View Initiated Orders
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <InitiatedOrdersDashboard className="w-full" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
