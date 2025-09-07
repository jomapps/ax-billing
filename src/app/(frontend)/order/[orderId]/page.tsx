import React from 'react'
import { OrderPageView } from '@/components/orders/OrderPageView'

interface OrderPageProps {
  params: Promise<{ orderId: string }>
}

async function fetchInitialOrderData(orderId: string) {
  try {
    // Use PayloadCMS REST API to fetch initial order data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const response = await fetch(
      `${baseUrl}/api/orders?where[orderID][equals]=${orderId}&depth=2`,
      {
        cache: 'no-store', // Always fetch fresh data
      },
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.docs && data.docs.length > 0 ? data.docs[0] : null
  } catch (error) {
    console.error('Failed to fetch initial order data:', error)
    return null
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Fetch initial order data server-side
  const initialOrderData = await fetchInitialOrderData(orderId)

  return (
    <div className="min-h-screen bg-gray-900">
      <OrderPageView orderId={orderId} initialOrderData={initialOrderData} />
    </div>
  )
}

export async function generateMetadata({ params }: OrderPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - AX Billing`,
    description: `Order management and QR code for ${resolvedParams.orderId}`,
  }
}
