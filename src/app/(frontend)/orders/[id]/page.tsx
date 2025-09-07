import React from 'react'
import { OrderDetailView } from '@/components/orders/OrderDetailView'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.id

  return (
    <div className="min-h-screen bg-gray-900">
      <OrderDetailView orderId={orderId} />
    </div>
  )
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.id} - AX Billing`,
    description: `Order details and management for ${resolvedParams.id}`,
  }
}
