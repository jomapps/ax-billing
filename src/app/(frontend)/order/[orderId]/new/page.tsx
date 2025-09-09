import React from 'react'
import { OrderNewView } from '@/components/orders/stages/OrderNewView'
import { findOrderByOrderID } from '@/lib/server/order-queries'

interface OrderNewPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderNewPage({ params }: OrderNewPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order data
  const initialOrderData = await findOrderByOrderID(orderId)

  return <OrderNewView orderId={orderId} initialOrderData={initialOrderData} />
}

export async function generateMetadata({ params }: OrderNewPageProps) {
  const resolvedParams = await params
  return {
    title: `New Order ${resolvedParams.orderId} - QR Code`,
    description: `QR code and WhatsApp link for order ${resolvedParams.orderId}`,
  }
}
