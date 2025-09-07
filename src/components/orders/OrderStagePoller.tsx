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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownStageRef = useRef<string | null>(currentStage) // Keep track of last known stage
  const consecutiveFailuresRef = useRef(0) // Track consecutive API failures

  // Update ref when currentStage prop changes
  useEffect(() => {
    currentStageRef.current = currentStage
  }, [currentStage])

  // Simple polling effect without useCallback
  useEffect(() => {
    console.log(`🚀 OrderStagePoller: Starting polling for order ${orderId}`)

    const pollOrderStage = async () => {
      console.log(
        `🔄 OrderStagePoller: Polling order ${orderId} (current stage: ${currentStageRef.current})`,
      )
      try {
        // Use simple API call with only orderID - no stage filtering
        const apiUrl = `/api/orders?where[orderID][equals]=${orderId}&limit=1`

        console.log(`🔍 OrderStagePoller: Fetching order data from: ${apiUrl}`)
        const response = await fetch(apiUrl)

        if (!response.ok) {
          console.log(`❌ OrderStagePoller: API response not ok: ${response.status}`)
          return
        }

        const data = await response.json()
        console.log(`📊 OrderStagePoller: Received data:`, data)

        if (data && data.docs && data.docs.length > 0) {
          const newStage = data.docs[0].orderStage
          console.log(
            `🔍 OrderStagePoller: Current stage: ${currentStageRef.current}, New stage: ${newStage}`,
          )

          // Reset failure counter on successful API call
          consecutiveFailuresRef.current = 0
          lastKnownStageRef.current = newStage

          // If stage changed, navigate to the correct stage URL
          if (newStage !== currentStageRef.current) {
            console.log(
              `🔄 OrderStagePoller: Order stage changed from ${currentStageRef.current} to ${newStage} - navigating to correct stage`,
            )
            currentStageRef.current = newStage // Update ref to prevent multiple navigations

            // Navigate to the correct stage URL based on the new stage
            const stageRoutes = {
              empty: `/order/${orderId}/new`,
              initiated: `/order/${orderId}/initiated`,
              open: `/order/${orderId}/open`,
              billed: `/order/${orderId}/billed`,
              paid: `/order/${orderId}/paid`,
            }

            const targetRoute =
              stageRoutes[newStage as keyof typeof stageRoutes] || `/order/${orderId}`
            console.log(`🎯 OrderStagePoller: Navigating to ${targetRoute} for stage: ${newStage}`)
            router.push(targetRoute)
          } else {
            console.log(`✅ OrderStagePoller: No stage change detected`)
          }
        } else {
          // No order found - this could indicate a stage change!
          consecutiveFailuresRef.current += 1
          console.log(
            `🔍 OrderStagePoller: No order found (attempt #${consecutiveFailuresRef.current}) - this may indicate stage change`,
          )

          // If this is the first "no order found" after successful polls,
          // it likely means the stage changed and we need to navigate to the next stage
          if (consecutiveFailuresRef.current === 1 && lastKnownStageRef.current) {
            console.log(
              `🎯 OrderStagePoller: Stage change detected! Order was found before but not now - determining next stage`,
            )

            // Determine the next stage based on current stage
            const currentStage = currentStageRef.current
            const stageProgression = {
              empty: 'initiated',
              initiated: 'open',
              open: 'billed',
              billed: 'paid',
              paid: 'paid', // Stay on paid if already paid
            }

            const nextStage =
              stageProgression[currentStage as keyof typeof stageProgression] || 'initiated'
            const stageRoutes = {
              empty: `/order/${orderId}/new`,
              initiated: `/order/${orderId}/initiated`,
              open: `/order/${orderId}/open`,
              billed: `/order/${orderId}/billed`,
              paid: `/order/${orderId}/paid`,
            }

            const targetRoute =
              stageRoutes[nextStage as keyof typeof stageRoutes] || `/order/${orderId}`
            console.log(
              `🎯 OrderStagePoller: Navigating from ${currentStage} to ${nextStage} at ${targetRoute}`,
            )

            // Update current stage and navigate
            currentStageRef.current = nextStage
            router.push(targetRoute)

            // Reset counters after triggering navigation
            consecutiveFailuresRef.current = 0
            lastKnownStageRef.current = nextStage
          } else if (consecutiveFailuresRef.current >= 5) {
            // If we have many consecutive failures without a previous success,
            // this might be a real API issue
            console.log(
              `⚠️ OrderStagePoller: ${consecutiveFailuresRef.current} consecutive failures - may be API issue`,
            )
            consecutiveFailuresRef.current = 0 // Reset to avoid spam
          }
        }
      } catch (error) {
        console.error('❌ OrderStagePoller: Failed to poll order stage:', error)
      }
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Run initial poll immediately
    pollOrderStage()

    // Poll every 5 seconds
    intervalRef.current = setInterval(pollOrderStage, 5000)

    return () => {
      console.log(`🛑 OrderStagePoller: Stopping polling for order ${orderId}`)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [orderId]) // Only depend on orderId, not router hooks

  // This component renders nothing - it's just for polling
  return null
}
