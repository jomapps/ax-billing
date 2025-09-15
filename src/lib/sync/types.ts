/**
 * TypeScript interfaces and types for the sync system
 * Ensures type safety and consistency across the application
 */

// Core Sync Interfaces
export interface SyncState {
  connectionState: ConnectionState
  events: SyncEvent[]
  configuration: SyncConfiguration
  metrics: ConnectionMetrics
  error: string | null
  lastEventId: string | null
}

export interface SyncEvent {
  id: string
  eventType: EventType
  data: EventData
  orderID?: string
  timestamp: string
  metadata: EventMetadata
}

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  POLLING_FALLBACK = 'polling_fallback',
  ERROR = 'error',
}

export interface SyncConfiguration {
  orderID?: string | null
  eventTypes?: EventType[]
  autoConnect?: boolean
  autoReconnect: boolean
  maxReconnectAttempts: number
  reconnectDelay: number
  heartbeatInterval: number
  eventHistoryLimit: number
  pollingInterval?: number
  sseRetryInterval?: number
  enablePollingFallback?: boolean
}

// Event Type Definitions
export type EventType =
  | 'connected'
  | 'heartbeat'
  | 'stage_change'
  | 'order_stage_change'
  | 'status_update'
  | 'payment_update'
  | 'order_created'
  | 'order_deleted'
  | 'whatsapp_connected'
  | 'qr_generated'
  | 'polling_data_refresh'

export interface EventData {
  [key: string]: any
  previousStage?: string
  newStage?: string
  order?: OrderData
  clientId?: string
  message?: string
  activeConnections?: number
}

export interface EventMetadata {
  receivedAt: string
  processed: boolean
  acknowledged: boolean
  retryCount?: number
  source: 'sse' | 'localStorage' | 'manual' | 'polling'
}

// SSE Integration Types
export interface SSEEventData {
  eventType: string
  data: any
  orderID?: string
  timestamp: string
}

export interface SSEConnectionOptions {
  orderID?: string | null
  eventTypes?: string[]
  withCredentials?: boolean
  headers?: Record<string, string>
}

export interface SSEEventHandler {
  (event: SyncEvent): void
}

export interface SSEError {
  type: 'connection' | 'parsing' | 'network' | 'timeout'
  message: string
  timestamp: string
  retryable: boolean
}

// localStorage Types
export interface PersistedSyncState {
  events: SyncEvent[]
  configuration: SyncConfiguration
  lastConnectionTime: string
  connectionMetrics: ConnectionMetrics
  lastEventId: string | null
  version: string
}

export interface SyncPreferences {
  autoReconnect: boolean
  eventTypes: EventType[]
  debugMode: boolean
  notificationsEnabled: boolean
}

export interface EventHistory {
  events: SyncEvent[]
  maxSize: number
  lastCleanup: string
}

export interface ConnectionMetrics {
  totalConnections: number
  totalEvents: number
  totalReconnects: number
  uptime: number
  lastConnectedAt: string | null
  lastDisconnectedAt: string | null
  averageLatency: number
  eventCounts: Record<EventType, number>
  pollingSessions?: number
  totalPollingTime?: number
}

// Hook Return Types
export interface SyncManagerHookReturn {
  // State
  connectionState: ConnectionState
  events: SyncEvent[]
  error: string | null
  metrics: ConnectionMetrics
  configuration: SyncConfiguration
  nextSseRetryAt: string | null
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
  startPolling: () => void
  stopPolling: () => void
  registerPollingCallback: (callback: () => void | Promise<void>, intervalMs?: number) => string
  unregisterPollingCallback: (id: string) => void
}

export interface EventSubscription {
  id: string
  callback: SyncCallback
  filter?: EventFilter
  createdAt: string
  active: boolean
  deliveredCount: number
}

export interface SyncMethods {
  connect: (options?: Partial<SyncConfiguration>) => void
  disconnect: () => void
  reconnect: () => void
  clearEvents: () => void
  updateConfig: (config: Partial<SyncConfiguration>) => void
  startPolling: () => void
  stopPolling: () => void
}

export interface SyncStatus {
  connected: boolean
  connecting: boolean
  error: string | null
  eventCount: number
  uptime: number
  lastEventTime: string | null
}

// Utility Types
export type OrderID = string

export interface EventFilter {
  orderID?: string
  eventTypes?: EventType[]
  since?: string
  limit?: number
}

export interface SyncCallback {
  (event: SyncEvent): void
}

export interface ReconnectionConfig {
  enabled: boolean
  maxAttempts: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

// Integration Types
export interface DashboardSyncData {
  orders: any[]
  stats: any
  lastSyncTime: string
  pendingUpdates: SyncEvent[]
}

export interface OrderPageSyncData {
  orderData: OrderData | null
  recentEvents: SyncEvent[]
  autoRefresh: boolean
  navigationTriggers: NavigationTrigger[]
}

export interface NavigationTrigger {
  eventType: EventType
  condition: (event: SyncEvent) => boolean
  action: 'refresh' | 'redirect' | 'notify'
  target?: string
}

export interface OptimisticUpdate {
  id: string
  type: 'order_update' | 'stage_change' | 'payment_update'
  data: any
  timestamp: string
  confirmed: boolean
  rollback?: () => void
}

// Order Data Interface (from existing codebase)
export interface OrderData {
  id: string
  orderID: string
  orderStage: 'empty' | 'initiated' | 'open' | 'billed' | 'paid'
  qrCodeGenerated: boolean
  whatsappLinked: boolean
  whatsappNumber?: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cash'
  overallStatus: 'pending' | 'in_progress' | 'completed' | 'ready' | 'picked_up' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// Default configurations
export const DEFAULT_SYNC_CONFIG: SyncConfiguration = {
  orderID: null,
  eventTypes: undefined,
  autoConnect: true,
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  heartbeatInterval: 30000,
  eventHistoryLimit: 100,
  pollingInterval: 15000,
  sseRetryInterval: 120000,
  enablePollingFallback: true,
}

export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  enabled: true,
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
}

// Storage keys for localStorage
export const STORAGE_KEYS = {
  SYNC_STATE: 'ax-billing-sync-state',
  PREFERENCES: 'ax-billing-sync-preferences',
  EVENT_HISTORY: 'ax-billing-event-history',
  METRICS: 'ax-billing-sync-metrics',
} as const
