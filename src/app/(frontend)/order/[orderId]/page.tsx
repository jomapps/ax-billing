import React from 'react'
import { redirect } from 'next/navigation'

interface OrderPageProps {
  params: Promise<{ orderId: string }>
}

async function fetchInitialOrderData(orderId: string) {
  try {
    // Use PayloadCMS REST API to fetch initial order data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const response = await fetch(
      `${baseUrl}/api/orders?where[orderID][equals]=${orderId}&select=orderStage`,
      {
        cache: 'no-store', // Always fetch fresh data
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

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  // Fetch order stage to determine redirect
  const orderData = await fetchInitialOrderData(orderId)

  if (!orderData) {
    // Order not found, redirect to 404 or error page
    redirect('/404')
  }

  // Redirect to appropriate stage-specific page
  const stage = orderData.orderStage
  switch (stage) {
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
