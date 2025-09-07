import React from 'react'

interface OrderLayoutProps {
  children: React.ReactNode
  params: Promise<{ orderId: string }>
}

export default async function OrderLayout({ children, params }: OrderLayoutProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = await params
  return {
    title: `Order ${resolvedParams.orderId} - AX Billing`,
    description: `Order management for ${resolvedParams.orderId}`,
  }
}
