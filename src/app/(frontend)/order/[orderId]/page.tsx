import React from 'react'
import { redirect } from 'next/navigation'
import { getOrderStage } from '@/lib/server/order-queries'

interface OrderPageProps {
  params: Promise<{ orderId: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Use server-side PayloadCMS query to get order stage
  const orderStage = await getOrderStage(orderId)

  if (!orderStage) {
    // Order not found, redirect to 404 or error page
    redirect('/404')
  }

  // Redirect to appropriate stage-specific page
  switch (orderStage) {
    case 'empty':
      redirect(`/order/${orderId}/new`)
    case 'initiated':
      redirect(`/order/${orderId}/initiated`)
    case 'open':
      redirect(`/order/${orderId}/open`)
    case 'billed':
      redirect(`/order/${orderId}/billed`)
    case 'paid':
      redirect(`/order/${orderId}/paid`)
    default:
      redirect(`/order/${orderId}/new`)
  }
}

export async function generateMetadata({ params }: OrderPageProps) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - AX Billing`,
    description: `Order management and QR code for ${resolvedParams.orderId}`,
  }
}
