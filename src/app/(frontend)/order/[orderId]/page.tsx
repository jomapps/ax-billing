'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSyncManager } from '@/lib/sync/useSyncManager'
import { useAutoNavigation } from '@/lib/sync/useAutoNavigation'
import { getStageUrl } from '@/lib/utils'

interface OrderPageProps {
  params: Promise<{ orderId: string }>
}

export default function OrderPage({ params }: OrderPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [orderId, setOrderId] = useState<string | null>(null)
  const [orderStage, setOrderStage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { updateConfiguration } = useSyncManager()

  // Resolve params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setOrderId(resolvedParams.orderId)
    })
  }, [params])

  // Fetch order stage on mount
  useEffect(() => {
    if (!orderId) return

    const fetchOrderStage = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch order data from existing PayloadCMS API endpoint
        const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&limit=1`)

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/404')
            return
          }
          throw new Error('Failed to fetch order data')
        }

        const data = await response.json()

        if (!data.docs || data.docs.length === 0) {
          router.push('/404')
          return
        }

        const order = data.docs[0]
        const stage = order.orderStage

        if (!stage) {
          router.push('/404')
          return
        }

        setOrderStage(stage)

        // Configure SyncManager for this order
        updateConfiguration({
          orderID: orderId,
          autoConnect: true,
          autoReconnect: true,
        })

        // Navigate to appropriate stage page (avoid duplicate navigation)
        const stageUrl = getStageUrl(orderId, stage)
        if (pathname !== stageUrl) {
          router.push(stageUrl)
        }
      } catch (err) {
        console.error('Error fetching order stage:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderStage()
  }, [orderId, router, updateConfiguration])

  // Setup automatic navigation for stage changes
  useAutoNavigation(orderId || '', orderStage || '', {
    enabled: !!orderId && !!orderStage,
    onNavigate: (newStage, oldStage) => {
      console.log(`[OrderPage] Auto-navigating from ${oldStage} to ${newStage}`)
    },
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // This component primarily handles initial navigation
  // The actual stage content is rendered by stage-specific pages
  return null
}
