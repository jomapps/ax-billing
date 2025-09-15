'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncManagerContext } from './SyncManager'
import {
  SyncManagerHookReturn,
  SyncEvent,
  EventType,
  SyncCallback,
  EventFilter,
  OrderData,
  ConnectionState,
} from './types'

/**
 * Custom React hook that provides easy access to the SyncManager functionality
 * for components throughout the application.
 */
export function useSyncManager(): SyncManagerHookReturn {
  const context = useSyncManagerContext()

  if (!context) {
    throw new Error('useSyncManager must be used within a SyncManagerProvider')
  }

  const {
    connectionState,
    events,
    error,
    metrics,
    configuration,
    nextSseRetryAt,
    isConnected,
    isConnecting,
    isPollingFallback,
    connect,
    disconnect,
    reconnect,
    subscribe,
    subscribeToOrder,
    subscribeToEventType,
    acknowledgeEvent,
    clearEventHistory,
    updateConfiguration,
    startPolling,
    stopPolling,
    registerPollingCallback,
    unregisterPollingCallback,
  } = context

  return {
    // State
    connectionState,
    events,
    error,
    metrics,
    configuration,
    nextSseRetryAt,
    isConnected,
    isConnecting,
    isPollingFallback,

    // Methods
    connect,
    disconnect,
    reconnect,
    subscribe,
    subscribeToOrder,
    subscribeToEventType,
    acknowledgeEvent,
    clearEventHistory,
    updateConfiguration,
    startPolling,
    stopPolling,
    registerPollingCallback,
    unregisterPollingCallback,
  }
}

/**
 * Hook for subscribing to order-specific events with automatic cleanup
 */
export function useOrderSync(orderID: string | null, callback?: SyncCallback) {
  const { subscribeToOrder, events } = useSyncManager()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  // Get recent events for this order
  const orderEvents = useMemo(() => {
    if (!orderID) return []
    return events.filter((event) => event.orderID === orderID)
  }, [events, orderID])

  // Subscribe to order events
  useEffect(() => {
    if (!orderID || !callbackRef.current) return

    const unsubscribe = subscribeToOrder(orderID, callbackRef.current)
    return unsubscribe
  }, [orderID, subscribeToOrder])

  return {
    events: orderEvents,
    latestEvent: orderEvents[orderEvents.length - 1] || null,
  }
}

/**
 * Hook for subscribing to specific event types with filtering
 */
export function useEventTypeSync(eventTypes: EventType[], callback?: SyncCallback) {
  const { subscribe, events } = useSyncManager()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  // Get recent events of specified types
  const filteredEvents = useMemo(() => {
    return events.filter((event) => eventTypes.includes(event.eventType))
  }, [events, eventTypes])

  // Subscribe to event types
  useEffect(() => {
    if (eventTypes.length === 0 || !callbackRef.current) return

    const unsubscribe = subscribe(callbackRef.current, { eventTypes })
    return unsubscribe
  }, [eventTypes, subscribe])

  return {
    events: filteredEvents,
    latestEvent: filteredEvents[filteredEvents.length - 1] || null,
  }
}

/**
 * Hook for detecting order stage changes and triggering actions
 */
export function useOrderStageChange(
  orderID: string | null,
  onStageChange?: (event: SyncEvent, previousStage?: string, newStage?: string) => void,
) {
  const { subscribeToOrder } = useSyncManager()
  const onStageChangeRef = useRef(onStageChange)
  onStageChangeRef.current = onStageChange

  useEffect(() => {
    if (!orderID || !onStageChangeRef.current) return

    const unsubscribe = subscribeToOrder(orderID, (event) => {
      if (
        (event.eventType === 'stage_change' || event.eventType === 'order_stage_change') &&
        onStageChangeRef.current
      ) {
        const { previousStage, newStage } = event.data
        onStageChangeRef.current(event, previousStage, newStage)
      }
    })

    return unsubscribe
  }, [orderID, subscribeToOrder])
}

/**
 * Hook for automatic page refresh when order data changes
 */
export function useAutoRefresh(
  orderID: string | null,
  refreshCallback: () => void,
  options: {
    eventTypes?: EventType[]
    debounceMs?: number
    enabled?: boolean
  } = {},
) {
  const { subscribeToOrder } = useSyncManager()
  const refreshCallbackRef = useRef(refreshCallback)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  refreshCallbackRef.current = refreshCallback

  const {
    eventTypes = ['stage_change', 'status_update', 'payment_update'],
    debounceMs = 1000,
    enabled = true,
  } = options

  useEffect(() => {
    if (!orderID || !enabled || !refreshCallbackRef.current) return

    const unsubscribe = subscribeToOrder(orderID, (event) => {
      if (!eventTypes.includes(event.eventType)) return

      // Debounce refresh calls
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        refreshCallbackRef.current?.()
      }, debounceMs)
    })

    return () => {
      unsubscribe()
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [orderID, eventTypes, debounceMs, enabled, subscribeToOrder])
}

/**
 * Hook for connection health monitoring
 */
export function useConnectionHealth() {
  const {
    connectionState,
    error,
    metrics,
    isConnected,
    isConnecting,
    isPollingFallback,
    configuration,
    nextSseRetryAt,
  } = useSyncManager()

  const healthStatus = useMemo(() => {
    if (isPollingFallback) return 'polling'
    if (connectionState === ConnectionState.ERROR) return 'error'
    if (connectionState === ConnectionState.CONNECTED) return 'healthy'
    if (
      connectionState === ConnectionState.CONNECTING ||
      connectionState === ConnectionState.RECONNECTING
    )
      return 'connecting'
    return 'disconnected'
  }, [connectionState, isPollingFallback])

  const connectionInfo = useMemo(
    () => ({
      status: healthStatus,
      isConnected,
      isConnecting,
      error,
      uptime: metrics.uptime,
      totalEvents: metrics.totalEvents,
      totalReconnects: metrics.totalReconnects,
      lastConnectedAt: metrics.lastConnectedAt,
      eventCounts: metrics.eventCounts,
      // Polling metrics
      pollingSessions: metrics.pollingSessions,
      totalPollingTime: metrics.totalPollingTime,
      // Configuration intervals
      sseRetryInterval: configuration.sseRetryInterval,
      pollingInterval: configuration.pollingInterval,
      // Next SSE retry timing
      nextSseRetryAt,
    }),
    [healthStatus, isConnected, isConnecting, error, metrics, configuration, nextSseRetryAt],
  )

  return connectionInfo
}

/**
 * Hook for managing event acknowledgments
 */
export function useEventAcknowledgment() {
  const { events, acknowledgeEvent } = useSyncManager()

  const unacknowledgedEvents = useMemo(() => {
    return events.filter((event) => !event.metadata.acknowledged)
  }, [events])

  const acknowledgeAll = useCallback(() => {
    unacknowledgedEvents.forEach((event) => {
      acknowledgeEvent(event.id)
    })
  }, [unacknowledgedEvents, acknowledgeEvent])

  const acknowledgeByType = useCallback(
    (eventType: EventType) => {
      events
        .filter((event) => event.eventType === eventType && !event.metadata.acknowledged)
        .forEach((event) => {
          acknowledgeEvent(event.id)
        })
    },
    [events, acknowledgeEvent],
  )

  return {
    unacknowledgedEvents,
    acknowledgeEvent,
    acknowledgeAll,
    acknowledgeByType,
    unacknowledgedCount: unacknowledgedEvents.length,
  }
}

/**
 * Hook for real-time dashboard data synchronization
 */
export function useDashboardSync(refreshCallback?: () => void) {
  const { subscribe } = useSyncManager()
  const refreshCallbackRef = useRef(refreshCallback)
  refreshCallbackRef.current = refreshCallback

  // Subscribe to events that affect dashboard data
  useEffect(() => {
    if (!refreshCallbackRef.current) return

    const unsubscribe = subscribe((event) => {
      // Refresh dashboard on order-related events
      const dashboardEvents: EventType[] = [
        'stage_change',
        'order_stage_change',
        'order_created',
        'order_deleted',
        'status_update',
        'payment_update',
      ]

      if (dashboardEvents.includes(event.eventType)) {
        refreshCallbackRef.current?.()
      }
    })

    return unsubscribe
  }, [subscribe])

  // Also register for polling fallback refreshes
  usePollingFallback(() => {
    refreshCallbackRef.current?.()
  }, 15000)
}

/**
 * Hook for optimistic updates with rollback capability
 */
export function useOptimisticUpdates<T>(
  initialData: T,
  updateFunction: (data: T, event: SyncEvent) => T,
) {
  const { events } = useSyncManager()
  const [optimisticData, setOptimisticData] = useState(initialData)
  const rollbackStackRef = useRef<Array<{ data: T; eventId: string }>>([])

  // Apply optimistic updates
  const applyOptimisticUpdate = useCallback(
    (event: SyncEvent) => {
      setOptimisticData((current) => {
        const updated = updateFunction(current, event)
        rollbackStackRef.current.push({ data: current, eventId: event.id })
        return updated
      })
    },
    [updateFunction],
  )

  // Rollback specific update
  const rollbackUpdate = useCallback((eventId: string) => {
    const rollbackIndex = rollbackStackRef.current.findIndex((item) => item.eventId === eventId)
    if (rollbackIndex !== -1) {
      const rollbackData = rollbackStackRef.current[rollbackIndex].data
      setOptimisticData(rollbackData)
      rollbackStackRef.current.splice(rollbackIndex, 1)
    }
  }, [])

  // Clear all optimistic updates
  const clearOptimisticUpdates = useCallback(() => {
    setOptimisticData(initialData)
    rollbackStackRef.current = []
  }, [initialData])

  return {
    data: optimisticData,
    applyOptimisticUpdate,
    rollbackUpdate,
    clearOptimisticUpdates,
    hasPendingUpdates: rollbackStackRef.current.length > 0,
  }
}

// Re-export main hook as default

/**
 * Hook to register a polling callback that is invoked during polling fallback mode.
 * Automatically unregisters on unmount.
 */
export function usePollingFallback(callback: () => void | Promise<void>, intervalMs?: number) {
  const { registerPollingCallback, unregisterPollingCallback } = useSyncManager()
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    const id = registerPollingCallback(() => cbRef.current?.(), intervalMs)
    return () => unregisterPollingCallback(id)
  }, [registerPollingCallback, unregisterPollingCallback, intervalMs])
}

/**
 * Hook for order-specific polling integration
 */
export function useOrderPolling(
  orderID: string | null,
  fetchFn: (orderID: string) => void | Promise<void>,
  options: { intervalMs?: number; enabled?: boolean } = {},
) {
  const { registerPollingCallback, unregisterPollingCallback } = useSyncManager()
  const fetchFnRef = useRef(fetchFn)
  const lastOrderIDRef = useRef<string | null>(null)
  const pollingIdRef = useRef<string | null>(null)

  fetchFnRef.current = fetchFn

  const { intervalMs = 30000, enabled = true } = options

  useEffect(() => {
    // Clean up previous polling if orderID changed
    if (pollingIdRef.current && lastOrderIDRef.current !== orderID) {
      unregisterPollingCallback(pollingIdRef.current)
      pollingIdRef.current = null
    }

    // Register new polling if we have an orderID and it's enabled
    if (orderID && enabled && !pollingIdRef.current) {
      pollingIdRef.current = registerPollingCallback(async () => {
        try {
          await fetchFnRef.current?.(orderID)
        } catch (error) {
          console.error('Order polling error:', error)
        }
      }, intervalMs)
    }

    lastOrderIDRef.current = orderID

    // Cleanup on unmount or when disabled
    return () => {
      if (pollingIdRef.current) {
        unregisterPollingCallback(pollingIdRef.current)
        pollingIdRef.current = null
      }
    }
  }, [orderID, enabled, intervalMs, registerPollingCallback, unregisterPollingCallback])

  // Also cleanup when disabled
  useEffect(() => {
    if (!enabled && pollingIdRef.current) {
      unregisterPollingCallback(pollingIdRef.current)
      pollingIdRef.current = null
    }
  }, [enabled, unregisterPollingCallback])
}

export default useSyncManager
