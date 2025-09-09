import React from 'react'
import { OrderInitiatedView } from '@/components/orders/stages/OrderInitiatedView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderInitiatedPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderInitiatedPage({ params }: OrderInitiatedPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const initialOrderData = await findOrderByOrderID(orderId)

  return <OrderInitiatedView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderInitiatedPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Vehicle Capture`,
    description: `Vehicle information capture for order ${resolvedParams.orderId}`,
  }
}
