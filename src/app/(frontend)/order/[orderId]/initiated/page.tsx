import React from 'react'
import { OrderInitiatedView } from '@/components/orders/stages/OrderInitiatedView'

interface OrderInitiatedPageProps {
  params: Promise<{ orderId: string }>
}

async function fetchInitialOrderData(orderId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const response = await fetch(
      `${baseUrl}/api/orders?where[orderID][equals]=${orderId}&depth=3`,
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

export default async function OrderInitiatedPage({ params }: OrderInitiatedPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  const initialOrderData = await fetchInitialOrderData(orderId)

  return <OrderInitiatedView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderInitiatedPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Vehicle Capture`,
    description: `Vehicle information capture for order ${resolvedParams.orderId}`,
  }
}
