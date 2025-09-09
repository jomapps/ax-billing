import React from 'react'
import { OrderOpenView } from '@/components/orders/stages/OrderOpenView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderOpenPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderOpenPage({ params }: OrderOpenPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const initialOrderData = await findOrderByOrderID(orderId)

  return <OrderOpenView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderOpenPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - Service Management`,
    description: `Service selection and management for order ${resolvedParams.orderId}`,
  }
}
