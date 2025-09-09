import React from 'react'
import { OrderBilledView } from '@/components/orders/stages/OrderBilledView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderBilledPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderBilledPage({ params }: OrderBilledPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const initialOrderData = await findOrderByOrderID(orderId)

  return <OrderBilledView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderBilledPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Payment & Billing`,
    description: `Payment processing and billing for order ${resolvedParams.orderId}`,
  }
}
