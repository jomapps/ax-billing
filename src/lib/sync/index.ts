/**
 * Central order sync system for real-time order synchronization
 *
 * This module provides a comprehensive sync system that replaces polling-based
 * data fetching with real-time SSE (Server-Sent Events) for order updates.
 *
 * @example Basic usage:
 * ```tsx
 * import { SyncManagerProvider, useSyncManager } from '@/lib/sync'
 *
 * function App() {
 *   return (
 *     <SyncManagerProvider>
 *       <Dashboard />
 *     </SyncManagerProvider>
 *   )
 * }
 *
 * function Dashboard() {
 *   const { isConnected, events } = useSyncManager()
 *   // Component logic here
 * }
 * ```
 *
 * @example Order-specific sync:
 * ```tsx
 * import { useOrderSync, useOrderStageChange } from '@/lib/sync'
 *
 * function OrderPage({ orderID }) {
 *   const { events, latestEvent } = useOrderSync(orderID)
 *
 *   useOrderStageChange(orderID, (event, prevStage, newStage) => {
 *     console.log(`Order ${orderID} changed from ${prevStage} to ${newStage}`)
 *   })
 * }
 * ```
 */

// Core Components and Context
export { SyncManagerProvider, useSyncManagerContext } from './SyncManager'

// Main Hook
export { default as useSyncManager } from './useSyncManager'

// Specialized Hooks
export {
  useOrderSync,
  useEventTypeSync,
  useOrderStageChange,
  useAutoRefresh,
  useConnectionHealth,
  useEventAcknowledgment,
  useDashboardSync,
  useOptimisticUpdates,
  usePollingFallback,
} from './useSyncManager'

// Debug Tools
export { SyncDebugPanel } from './SyncDebugPanel'
export {
  syncLogger,
  LogLevel,
  LogCategory,
  logConnection,
  logEvents,
  logPolling,
  logStorage,
} from './debug'

// Type Definitions
export type {
  // Core Interfaces
  SyncState,
  SyncEvent,
  SyncConfiguration,
  EventData,
  EventMetadata,

  // Event Types
  EventType,

  // Connection Types
  ConnectionMetrics,

  // SSE Types
  SSEEventData,
  SSEConnectionOptions,
  SSEEventHandler,
  SSEError,

  // Storage Types
  PersistedSyncState,
  SyncPreferences,
  EventHistory,

  // Hook Types
  SyncManagerHookReturn,
  EventSubscription,
  SyncMethods,
  SyncStatus,

  // Utility Types
  OrderID,
  EventFilter,
  SyncCallback,
  ReconnectionConfig,

  // Integration Types
  DashboardSyncData,
  OrderPageSyncData,
  NavigationTrigger,
  OptimisticUpdate,

  // Order Data
  OrderData,
} from './types'

// Enums
export { ConnectionState } from './types'

// Import for internal use
import { ConnectionState } from './types'

// Constants and Defaults
export { DEFAULT_SYNC_CONFIG, DEFAULT_RECONNECTION_CONFIG, STORAGE_KEYS } from './types'

// Utility Functions
export const SyncUtils = {
  /**
   * Check if an event matches a filter
   */
  eventMatchesFilter: (event: SyncEvent, filter: EventFilter): boolean => {
    if (filter.orderID && event.orderID !== filter.orderID) return false
    if (filter.eventTypes && !filter.eventTypes.includes(event.eventType)) return false
    if (filter.since && new Date(event.timestamp) < new Date(filter.since)) return false
    return true
  },

  /**
   * Generate a unique event ID
   */
  generateEventId: (): string => {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Calculate connection uptime in milliseconds
   */
  calculateUptime: (connectedAt: string | null): number => {
    if (!connectedAt) return 0
    return Date.now() - new Date(connectedAt).getTime()
  },

  /**
   * Format uptime for display
   */
  formatUptime: (uptimeMs: number): string => {
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  },

  /**
   * Get event type display name
   */
  getEventTypeDisplayName: (eventType: EventType): string => {
    const displayNames: Record<EventType, string> = {
      connected: 'Connected',
      heartbeat: 'Heartbeat',
      stage_change: 'Stage Change',
      order_stage_change: 'Order Stage Change',
      status_update: 'Status Update',
      payment_update: 'Payment Update',
      order_created: 'Order Created',
      order_deleted: 'Order Deleted',
      whatsapp_connected: 'WhatsApp Connected',
      qr_generated: 'QR Generated',
      polling_data_refresh: 'Polling Data Refresh',
    }
    return displayNames[eventType] || eventType
  },

  /**
   * Check if event type is critical (requires immediate attention)
   */
  isEventTypeCritical: (eventType: EventType): boolean => {
    const criticalEvents: EventType[] = [
      'stage_change',
      'order_stage_change',
      'payment_update',
      'order_deleted',
    ]
    return criticalEvents.includes(eventType)
  },

  /**
   * Get connection state display info
   */
  getConnectionStateInfo: (state: ConnectionState) => {
    const stateInfo = {
      [ConnectionState.DISCONNECTED]: {
        label: 'Disconnected',
        color: 'gray',
        icon: '⚫',
      },
      [ConnectionState.CONNECTING]: {
        label: 'Connecting',
        color: 'yellow',
        icon: '🟡',
      },
      [ConnectionState.CONNECTED]: {
        label: 'Connected',
        color: 'green',
        icon: '🟢',
      },
      [ConnectionState.RECONNECTING]: {
        label: 'Reconnecting',
        color: 'orange',
        icon: '🟠',
      },
      [ConnectionState.ERROR]: {
        label: 'Error',
        color: 'red',
        icon: '🔴',
      },
      [ConnectionState.POLLING_FALLBACK]: {
        label: 'Polling Fallback',
        color: 'blue',
        icon: '🔄',
      },
    }
    return stateInfo[state]
  },
}

// Re-export types for convenience
import type {
  SyncEvent,
  EventFilter,
  EventType,
  SyncCallback,
  ConnectionState as ConnectionStateType,
} from './types'

export type {
  SyncEvent as Event,
  EventFilter as Filter,
  EventType as Type,
  SyncCallback as Callback,
  ConnectionStateType as State,
}
