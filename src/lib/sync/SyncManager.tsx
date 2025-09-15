'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  SyncState,
  SyncEvent,
  SyncConfiguration,
  ConnectionState,
  EventType,
  SSEEventData,
  ConnectionMetrics,
  PersistedSyncState,
  EventFilter,
  SyncCallback,
  EventSubscription,
  DEFAULT_SYNC_CONFIG,
  STORAGE_KEYS,
} from './types'
import { PollingManager } from './polling'

interface SyncManagerContextValue {
  // State
  connectionState: ConnectionState
  events: SyncEvent[]
  error: string | null
  metrics: ConnectionMetrics
  configuration: SyncConfiguration
  nextSseRetryAt: string | null

  // Computed state
  isConnected: boolean
  isConnecting: boolean
  isPollingFallback: boolean

  // Methods
  connect: (options?: Partial<SyncConfiguration>) => void
  disconnect: () => void
  reconnect: () => void
  subscribe: (callback: SyncCallback, filter?: EventFilter) => () => void
  subscribeToOrder: (orderID: string, callback: SyncCallback) => () => void
  subscribeToEventType: (eventType: EventType, callback: SyncCallback) => () => void
  acknowledgeEvent: (eventId: string) => void
  clearEventHistory: () => void
  updateConfiguration: (
    config: Partial<SyncConfiguration>,
    options?: { reconnect?: boolean },
  ) => void
  // Polling fallback controls
  startPolling: () => void
  stopPolling: () => void
  registerPollingCallback: (cb: () => void | Promise<void>, intervalMs?: number) => string
  unregisterPollingCallback: (id: string) => void
}

const SyncManagerContext = createContext<SyncManagerContextValue | null>(null)

interface SyncManagerProviderProps {
  children: React.ReactNode
  initialConfig?: Partial<SyncConfiguration>
  enablePersistence?: boolean
  eventSourceFactory?: (url: string) => EventSource
}

export function SyncManagerProvider({
  children,
  initialConfig = {},
  enablePersistence = true,
  eventSourceFactory,
}: SyncManagerProviderProps) {
  // Core state
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED,
  )
  const [events, setEvents] = useState<SyncEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [configuration, setConfiguration] = useState<SyncConfiguration>({
    ...DEFAULT_SYNC_CONFIG,
    ...initialConfig,
  })
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    totalConnections: 0,
    totalEvents: 0,
    totalReconnects: 0,
    uptime: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    averageLatency: 0,
    eventCounts: {} as Record<EventType, number>,
  })
  const [isPollingFallback, setIsPollingFallback] = useState(false)

  // Refs for managing connections and subscriptions
  const eventSourceRef = useRef<EventSource | null>(null)
  const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map())
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const connectionStartTimeRef = useRef<number | null>(null)
  const pollingManagerRef = useRef<PollingManager | null>(null)
  const sseRetryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingStartTimeRef = useRef<number | null>(null)
  const nextSseRetryAtRef = useRef<string | null>(null)

  // Computed state
  const isConnected = connectionState === ConnectionState.CONNECTED
  const isConnecting =
    connectionState === ConnectionState.CONNECTING ||
    connectionState === ConnectionState.RECONNECTING

  const loadPersistedState = useCallback(() => {
    try {
      const persistedData = localStorage.getItem(STORAGE_KEYS.SYNC_STATE)
      if (persistedData) {
        const parsed: PersistedSyncState = JSON.parse(persistedData)

        // Restore configuration
        setConfiguration((prev) => ({ ...prev, ...parsed.configuration }))

        // Restore recent events (filter out old ones)
        const recentEvents = parsed.events.filter((event) => {
          const eventTime = new Date(event.timestamp).getTime()
          const oneHourAgo = Date.now() - 60 * 60 * 1000
          return eventTime > oneHourAgo
        })
        setEvents(recentEvents)

        // Restore lastEventId
        setLastEventId(parsed.lastEventId || null)

        // Restore metrics
        setMetrics((prev) => ({ ...prev, ...parsed.connectionMetrics }))
      }
    } catch (error) {
      console.error('Failed to load persisted sync state:', error)
    }
  }, [])

  const persistState = useCallback(() => {
    try {
      const persistedState: PersistedSyncState = {
        events: events.slice(-configuration.eventHistoryLimit),
        configuration,
        lastConnectionTime: new Date().toISOString(),
        connectionMetrics: metrics,
        lastEventId,
        version: '1.0.0',
      }
      localStorage.setItem(STORAGE_KEYS.SYNC_STATE, JSON.stringify(persistedState))
    } catch (error) {
      console.error('Failed to persist sync state:', error)
    }
  }, [events, configuration, metrics, lastEventId])

  // Load persisted state on mount
  useEffect(() => {
    if (enablePersistence) {
      loadPersistedState()
    }
  }, [enablePersistence])

  // Persist state changes
  useEffect(() => {
    if (enablePersistence) {
      persistState()
    }
  }, [events, configuration, metrics, enablePersistence, persistState])

  // Auto-connect if configured
  useEffect(() => {
    if (configuration.autoConnect && connectionState === ConnectionState.DISCONNECTED) {
      connect()
    }
  }, [configuration.autoConnect])

  const generateEventId = useCallback(() => {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const safeParse = useCallback(<T,>(raw: string): T | null => {
    try {
      return JSON.parse(raw) as T
    } catch (error) {
      console.error('Failed to parse SSE event data:', error, 'Raw data:', raw)
      return null
    }
  }, [])

  const addEvent = useCallback(
    (
      eventData: SSEEventData,
      messageEvent?: MessageEvent,
      source: 'sse' | 'localStorage' | 'manual' | 'polling' = 'sse',
    ) => {
      const event: SyncEvent = {
        id: generateEventId(),
        eventType: eventData.eventType as EventType,
        data: eventData.data,
        orderID: eventData.orderID,
        timestamp: eventData.timestamp,
        metadata: {
          receivedAt: new Date().toISOString(),
          processed: false,
          acknowledged: false,
          source,
        },
      }

      // Extract lastEventId from SSE message event
      if (messageEvent && (messageEvent as any).lastEventId) {
        setLastEventId((messageEvent as any).lastEventId)
      }

      setEvents((prev) => {
        const newEvents = [...prev, event].slice(-configuration.eventHistoryLimit)
        return newEvents
      })

      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        totalEvents: prev.totalEvents + 1,
        eventCounts: {
          ...prev.eventCounts,
          [event.eventType]: (prev.eventCounts[event.eventType] || 0) + 1,
        },
      }))

      // Notify subscribers
      notifySubscribers(event)

      return event
    },
    [configuration.eventHistoryLimit, generateEventId],
  )

  const notifySubscribers = useCallback((event: SyncEvent) => {
    subscriptionsRef.current.forEach((subscription) => {
      if (!subscription.active) return

      // Apply filters
      if (subscription.filter) {
        const { orderID, eventTypes, since, limit } = subscription.filter

        if (orderID && event.orderID !== orderID) return
        if (eventTypes && !eventTypes.includes(event.eventType)) return
        if (since && new Date(event.timestamp) < new Date(since)) return

        // Check limit
        if (limit && subscription.deliveredCount >= limit) return
      }

      try {
        subscription.callback(event)
        subscription.deliveredCount += 1
      } catch (error) {
        console.error('Error in event subscription callback:', error)
      }
    })
  }, [])

  // Helper to close SSE without affecting polling state
  const closeSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(
    (options: Partial<SyncConfiguration> = {}) => {
      if (eventSourceRef.current) {
        closeSSE()
      }

      const config = { ...configuration, ...options }
      setConfiguration(config)

      // Skip setting CONNECTING state if we're in polling fallback to remain in POLLING_FALLBACK
      if (!isPollingFallback) {
        setConnectionState(ConnectionState.CONNECTING)
      }

      setError(null)
      connectionStartTimeRef.current = Date.now()

      try {
        // Build SSE URL with filters
        const url = new URL('/api/v1/sync/events', window.location.origin)
        if (config.orderID) {
          url.searchParams.set('orderID', config.orderID)
        }
        if (config.eventTypes && config.eventTypes.length > 0) {
          url.searchParams.set('eventTypes', config.eventTypes.join(','))
        }
        if (lastEventId) {
          url.searchParams.set('lastEventId', lastEventId)
        }

        const eventSource = eventSourceFactory
          ? eventSourceFactory(url.toString())
          : new EventSource(url.toString())
        eventSourceRef.current = eventSource

        // Handle connection events
        eventSource.addEventListener('connected', (event) => {
          const data = safeParse(event.data)
          if (!data) return

          setConnectionState(ConnectionState.CONNECTED)
          setError(null)
          reconnectAttemptsRef.current = 0

          if (isPollingFallback) {
            stopPollingFallback()
          }

          setMetrics((prev) => ({
            ...prev,
            totalConnections: prev.totalConnections + 1,
            lastConnectedAt: new Date().toISOString(),
          }))

          addEvent(
            {
              eventType: 'connected',
              data,
              timestamp: (data as any)?.timestamp || new Date().toISOString(),
            },
            event,
          )
        })

        // Handle heartbeat events
        eventSource.addEventListener('heartbeat', (event) => {
          const data = safeParse(event.data)
          if (!data) return

          addEvent(
            {
              eventType: 'heartbeat',
              data,
              timestamp: (data as any)?.timestamp || new Date().toISOString(),
            },
            event,
          )
        })

        // Handle order stage change events
        eventSource.addEventListener('stage_change', (event) => {
          const data = safeParse(event.data)
          if (!data) return

          addEvent(
            {
              eventType: 'stage_change',
              data: (data as any)?.data,
              orderID: (data as any)?.orderID,
              timestamp: (data as any)?.timestamp || new Date().toISOString(),
            },
            event,
          )
        })

        // Handle other event types
        const eventTypes: EventType[] = [
          'status_update',
          'payment_update',
          'order_created',
          'order_deleted',
          'order_stage_change',
          'whatsapp_connected',
          'qr_generated',
        ]
        eventTypes.forEach((eventType) => {
          eventSource.addEventListener(eventType, (event) => {
            const data = safeParse(event.data)
            if (!data) return

            addEvent(
              {
                eventType,
                data: (data as any)?.data,
                orderID: (data as any)?.orderID,
                timestamp: (data as any)?.timestamp || new Date().toISOString(),
              },
              event,
            )
          })
        })

        // Handle errors
        eventSource.onerror = (event) => {
          console.error('SSE connection error:', event)

          // Explicitly close EventSource to prevent native auto-reconnect
          eventSourceRef.current?.close()
          eventSourceRef.current = null

          // Only set ERROR state if we're not already in polling fallback mode
          if (!isPollingFallback) {
            setConnectionState(ConnectionState.ERROR)
          }
          setError('Connection lost. Attempting to reconnect...')

          setMetrics((prev) => ({
            ...prev,
            lastDisconnectedAt: new Date().toISOString(),
          }))

          // Guard reconnection logic based on polling fallback state
          if (
            !isPollingFallback &&
            config.autoReconnect &&
            reconnectAttemptsRef.current < config.maxReconnectAttempts
          ) {
            scheduleReconnect()
          } else if (config.autoReconnect && configuration.enablePollingFallback) {
            // Max attempts exceeded → switch to polling fallback
            startPollingFallback()
          }
        }
      } catch (error) {
        console.error('Failed to establish SSE connection:', error)
        setConnectionState(ConnectionState.ERROR)
        setError(error instanceof Error ? error.message : 'Failed to connect')
      }
    },
    [configuration, addEvent, closeSSE, isPollingFallback],
  )

  const stopPollingFallback = useCallback(() => {
    if (!isPollingFallback) return

    // Stop timers
    if (sseRetryTimerRef.current) {
      clearInterval(sseRetryTimerRef.current)
      sseRetryTimerRef.current = null
    }

    pollingManagerRef.current?.stop()
    setIsPollingFallback(false)
    nextSseRetryAtRef.current = null

    // Track total polling time
    if (pollingStartTimeRef.current) {
      const delta = Date.now() - pollingStartTimeRef.current
      setMetrics((prev) => ({
        ...prev,
        totalPollingTime: (prev.totalPollingTime ?? 0) + delta,
      }))
      pollingStartTimeRef.current = null
    }
  }, [isPollingFallback])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (sseRetryTimerRef.current) {
      clearInterval(sseRetryTimerRef.current)
      sseRetryTimerRef.current = null
    }

    // Properly handle polling fallback state
    if (isPollingFallback) {
      stopPollingFallback()
    } else {
      pollingManagerRef.current?.stop()
    }

    setConnectionState(ConnectionState.DISCONNECTED)
    setError(null)

    if (connectionStartTimeRef.current) {
      const uptime = Date.now() - connectionStartTimeRef.current
      setMetrics((prev) => ({
        ...prev,
        uptime: prev.uptime + uptime,
        lastDisconnectedAt: new Date().toISOString(),
      }))
      connectionStartTimeRef.current = null
    }
  }, [isPollingFallback, stopPollingFallback])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const delay = Math.min(
      configuration.reconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      30000, // Max 30 seconds
    )

    setConnectionState(ConnectionState.RECONNECTING)
    reconnectAttemptsRef.current += 1

    reconnectTimeoutRef.current = setTimeout(() => {
      setMetrics((prev) => ({
        ...prev,
        totalReconnects: prev.totalReconnects + 1,
      }))
      connect()
    }, delay)
  }, [configuration.reconnectDelay, connect])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  const registerPollingCallback = useCallback(
    (cb: () => void | Promise<void>, intervalMs?: number) => {
      if (!pollingManagerRef.current) {
        pollingManagerRef.current = new PollingManager()
      }
      const id = pollingManagerRef.current.register(
        async () => {
          try {
            await cb()
            // Emit synthetic event so downstream listeners can react uniformly
            addEvent(
              {
                eventType: 'polling_data_refresh' as EventType,
                data: { source: 'polling' },
                timestamp: new Date().toISOString(),
              } as SSEEventData,
              undefined,
              'polling',
            )
          } catch (e) {
            console.error('Polling callback error:', e)
          }
        },
        intervalMs ?? configuration.pollingInterval ?? 15000,
      )

      // If we're already in polling mode, start this callback immediately
      if (isPollingFallback) {
        pollingManagerRef.current.start(id)
      }

      return id
    },
    [configuration.pollingInterval, isPollingFallback, addEvent],
  )

  const unregisterPollingCallback = useCallback((id: string) => {
    pollingManagerRef.current?.unregister(id)
  }, [])

  const startPollingFallback = useCallback(() => {
    if (isPollingFallback) return

    setIsPollingFallback(true)
    setConnectionState(ConnectionState.POLLING_FALLBACK)
    setError('Real-time connection unavailable. Switched to polling fallback.')

    setMetrics((prev) => ({
      ...prev,
      pollingSessions: (prev.pollingSessions ?? 0) + 1,
      lastDisconnectedAt: new Date().toISOString(),
    }))

    if (!pollingManagerRef.current) {
      pollingManagerRef.current = new PollingManager()
    }
    pollingManagerRef.current.start()
    pollingStartTimeRef.current = Date.now()

    // Periodically attempt SSE reconnect while in polling mode
    if (sseRetryTimerRef.current) {
      clearInterval(sseRetryTimerRef.current)
    }
    const retryEvery = configuration.sseRetryInterval ?? 120000
    nextSseRetryAtRef.current = new Date(Date.now() + retryEvery).toISOString()
    sseRetryTimerRef.current = setInterval(() => {
      try {
        nextSseRetryAtRef.current = new Date(Date.now() + retryEvery).toISOString()
        reconnect()
      } catch (e) {
        console.warn('SSE retry failed (polling mode):', e)
      }
    }, retryEvery)
  }, [configuration.sseRetryInterval, isPollingFallback, reconnect])

  const startPolling = useCallback(() => startPollingFallback(), [startPollingFallback])
  const stopPolling = useCallback(() => stopPollingFallback(), [stopPollingFallback])

  const subscribe = useCallback(
    (callback: SyncCallback, filter?: EventFilter) => {
      const id = generateEventId()
      const subscription: EventSubscription = {
        id,
        callback,
        filter,
        createdAt: new Date().toISOString(),
        active: true,
        deliveredCount: 0,
      }

      subscriptionsRef.current.set(id, subscription)

      // Return unsubscribe function
      return () => {
        const sub = subscriptionsRef.current.get(id)
        if (sub) {
          sub.active = false
          subscriptionsRef.current.delete(id)
        }
      }
    },
    [generateEventId],
  )

  const subscribeToOrder = useCallback(
    (orderID: string, callback: SyncCallback) => {
      return subscribe(callback, { orderID })
    },
    [subscribe],
  )

  const subscribeToEventType = useCallback(
    (eventType: EventType, callback: SyncCallback) => {
      return subscribe(callback, { eventTypes: [eventType] })
    },
    [subscribe],
  )

  const acknowledgeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? { ...event, metadata: { ...event.metadata, acknowledged: true } }
          : event,
      ),
    )
  }, [])

  const clearEventHistory = useCallback(() => {
    setEvents([])
    if (enablePersistence) {
      localStorage.removeItem(STORAGE_KEYS.SYNC_STATE)
      // Persist empty state
      persistState()
    }
  }, [enablePersistence, persistState])

  const updateConfiguration = useCallback(
    (config: Partial<SyncConfiguration>, options: { reconnect?: boolean } = {}) => {
      setConfiguration((prev) => {
        const newConfig = { ...prev, ...config }

        // Check if filters changed
        const filtersChanged =
          (config.orderID !== undefined && config.orderID !== prev.orderID) ||
          (config.eventTypes !== undefined &&
            JSON.stringify(config.eventTypes) !== JSON.stringify(prev.eventTypes))

        // Auto-reconnect if filters changed and connected
        if (
          (filtersChanged || options.reconnect) &&
          connectionState === ConnectionState.CONNECTED
        ) {
          // Reconnect with new configuration
          setTimeout(() => reconnect(), 0)
        }

        return newConfig
      })
    },
    [connectionState, reconnect],
  )

  // Effect to recalibrate SSE retry timer when interval changes during polling fallback
  useEffect(() => {
    if (isPollingFallback && sseRetryTimerRef.current) {
      // Clear existing timer
      clearInterval(sseRetryTimerRef.current)

      // Create new timer with updated interval
      const retryEvery = configuration.sseRetryInterval ?? 120000
      nextSseRetryAtRef.current = new Date(Date.now() + retryEvery).toISOString()
      sseRetryTimerRef.current = setInterval(() => {
        try {
          nextSseRetryAtRef.current = new Date(Date.now() + retryEvery).toISOString()
          reconnect()
        } catch (e) {
          console.warn('SSE retry failed (polling mode):', e)
        }
      }, retryEvery)
    }
  }, [configuration.sseRetryInterval, isPollingFallback, reconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
      subscriptionsRef.current.clear()
    }
  }, [disconnect])

  const value: SyncManagerContextValue = {
    // State
    connectionState,
    events,
    error,
    metrics,
    configuration,
    nextSseRetryAt: nextSseRetryAtRef.current,

    // Computed state
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

  return <SyncManagerContext.Provider value={value}>{children}</SyncManagerContext.Provider>
}

export function useSyncManagerContext() {
  const context = useContext(SyncManagerContext)
  if (!context) {
    throw new Error('useSyncManagerContext must be used within a SyncManagerProvider')
  }
  return context
}
