'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface OrderStagePollerProps {
  orderId: string
  currentStage: string
}

export function OrderStagePoller({ orderId, currentStage }: OrderStagePollerProps) {
  const router = useRouter()
  const currentStageRef = useRef(currentStage)

  useEffect(() => {
    // Update ref when currentStage changes
    currentStageRef.current = currentStage
  }, [currentStage])

  useEffect(() => {
    const pollOrderStage = async () => {
      try {
        // Only fetch order stage - minimal data
        const response = await fetch(`/api/orders?where[orderID][equals]=${orderId}&select=orderStage`)
        
        if (!response.ok) {
          return
        }

        const data = await response.json()
        
        if (data.docs && data.docs.length > 0) {
          const newStage = data.docs[0].orderStage
          
          // If stage changed, refresh the page to get new server-side data
          if (newStage !== currentStageRef.current) {
            console.log(`Order stage changed from ${currentStageRef.current} to ${newStage} - refreshing page`)
            router.refresh() // Next.js server-side refresh
          }
        }
      } catch (error) {
        console.error('Failed to poll order stage:', error)
      }
    }

    // Poll every 5 seconds
    const interval = setInterval(pollOrderStage, 5000)
    
    return () => clearInterval(interval)
  }, [orderId, router])

  // This component renders nothing - it's just for polling
  return null
}
