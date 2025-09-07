import React from 'react'
import { OrderPaidView } from '@/components/orders/stages/OrderPaidView'

interface OrderPaidPageProps {
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

export default async function OrderPaidPage({ params }: OrderPaidPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  const initialOrderData = await fetchInitialOrderData(orderId)

  return <OrderPaidView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderPaidPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Service Execution`,
    description: `Service execution and job tracking for order ${resolvedParams.orderId}`,
  }
}
