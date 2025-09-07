import React from 'react'
import { OrderNewView } from '@/components/orders/stages/OrderNewView'

interface OrderNewPageProps {
  params: Promise<{ orderId: string }>
}

async function fetchInitialOrderData(orderId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const response = await fetch(
      `${baseUrl}/api/orders?where[orderID][equals]=${orderId}&depth=2`,
      {
        cache: 'no-store',
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

export default async function OrderNewPage({ params }: OrderNewPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  const initialOrderData = await fetchInitialOrderData(orderId)

  return <OrderNewView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderNewPageProps) {
  const resolvedParams = await params
  return {
    title: `New Order ${resolvedParams.orderId} - QR Code`,
    description: `QR code and WhatsApp link for order ${resolvedParams.orderId}`,
  }
}
