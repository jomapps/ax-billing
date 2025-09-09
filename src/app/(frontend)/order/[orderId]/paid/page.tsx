import React from 'react'
import { OrderPaidView } from '@/components/orders/stages/OrderPaidView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderPaidPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderPaidPage({ params }: OrderPaidPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const initialOrderData = await findOrderByOrderID(orderId)

  return <OrderPaidView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderPaidPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Service Execution`,
    description: `Service execution and job tracking for order ${resolvedParams.orderId}`,
  }
}
