'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useOrderStageChange } from './useSyncManager'
import { getStageUrl, isValidStage } from '@/lib/utils'

interface AutoNavigationOptions {
  enabled?: boolean
  debounceMs?: number
  onNavigate?: (newStage: string, oldStage: string) => void
}

/**
 * Hook for automatic navigation based on order stage changes
 * Integrates with SyncManager to provide real-time navigation
 */
export function useAutoNavigation(
  orderId: string,
  currentStage: string,
  options: AutoNavigationOptions = {},
) {
  const { enabled = true, debounceMs = 500, onNavigate } = options

  const router = useRouter()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastNavigationRef = useRef<string | null>(null)

  const handleNavigation = useCallback(
    (newStage: string) => {
      // Prevent duplicate navigation
      if (lastNavigationRef.current === newStage) {
        return
      }

      // Validate stage
      if (!isValidStage(newStage)) {
        console.warn(`[AutoNavigation] Invalid stage received: ${newStage}`)
        return
      }

      // Skip if same as current stage
      if (newStage === currentStage) {
        return
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Debounce navigation
      debounceTimeoutRef.current = setTimeout(() => {
        try {
          const newUrl = getStageUrl(orderId, newStage)

          // Call onNavigate callback if provided
          if (onNavigate) {
            onNavigate(newStage, currentStage)
          }

          console.log(`[AutoNavigation] Navigating from ${currentStage} to ${newStage}`)

          // Update last navigation reference
          lastNavigationRef.current = newStage

          // Navigate to new stage
          router.push(newUrl)
        } catch (error) {
          console.error('[AutoNavigation] Navigation failed:', error)
        }
      }, debounceMs)
    },
    [orderId, currentStage, router, debounceMs, onNavigate],
  )

  // Subscribe to order stage changes using callback-based API
  useOrderStageChange(orderId, (event, previousStage, newStage) => {
    if (!enabled || !newStage) {
      return
    }

    if (newStage !== currentStage) {
      handleNavigation(newStage)
    }
  })

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  return {
    isEnabled: enabled,
    hasError: false, // Error handling is now internal to useOrderStageChange
    lastStageChange: null, // Stage change data is handled via callback
  }
}
