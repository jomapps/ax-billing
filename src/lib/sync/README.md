# Real-time Order Sync System

A comprehensive client-side synchronization system that provides real-time order updates using Server-Sent Events (SSE). This system replaces polling-based data fetching with efficient, real-time event-driven updates.

## Overview

The sync system consists of:
- **SyncManager**: React context for managing SSE connections and state
- **useSyncManager**: Main hook for accessing sync functionality
- **Specialized Hooks**: Order-specific and event-type-specific hooks
- **localStorage Persistence**: Crash recovery and offline resilience
- **TypeScript Support**: Full type safety and IntelliSense

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │    │   SyncManager    │    │  SSE Endpoint   │
│                 │    │                  │    │                 │
│ useSyncManager  │◄──►│ Event Handling   │◄──►│ /api/v1/sync/   │
│ useOrderSync    │    │ State Management │    │     events      │
│ useDashboardSync│    │ localStorage     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Basic Setup

```tsx
import { SyncManagerProvider, useSyncManager } from '@/lib/sync'

function App() {
  return (
    <SyncManagerProvider>
      <Dashboard />
    </SyncManagerProvider>
  )
}

function Dashboard() {
  const { isConnected, events, connect } = useSyncManager()
  
  useEffect(() => {
    connect() // Establish SSE connection
  }, [connect])

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Events: {events.length}</p>
    </div>
  )
}
```

### 2. Order-Specific Sync

```tsx
import { useOrderSync, useOrderStageChange } from '@/lib/sync'

function OrderPage({ orderID }) {
  const { events, latestEvent } = useOrderSync(orderID)
  
  useOrderStageChange(orderID, (event, prevStage, newStage) => {
    console.log(`Order ${orderID}: ${prevStage} → ${newStage}`)
    // Handle stage change (refresh data, show notification, etc.)
  })

  return (
    <div>
      <h1>Order: {orderID}</h1>
      <p>Latest Event: {latestEvent?.eventType}</p>
      <p>Total Events: {events.length}</p>
    </div>
  )
}
```

### 3. Dashboard with Real-time Updates

```tsx
import { useDashboardSync, useConnectionHealth } from '@/lib/sync'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const health = useConnectionHealth()

  const refreshDashboard = useCallback(async () => {
    const data = await fetchDashboardData()
    setDashboardData(data)
  }, [])

  // Auto-refresh on relevant events
  useDashboardSync(refreshDashboard)

  return (
    <div>
      <div>Status: {health.status}</div>
      <div>Events: {health.totalEvents}</div>
      {/* Dashboard content */}
    </div>
  )
}
```

## Core Components

### SyncManagerProvider

The main provider component that manages SSE connections and sync state.

```tsx
<SyncManagerProvider
  initialConfig={{
    autoReconnect: true,
    maxReconnectAttempts: 5,
    eventHistoryLimit: 100
  }}
  enablePersistence={true}
>
  {children}
</SyncManagerProvider>
```

**Props:**
- `initialConfig`: Initial sync configuration
- `enablePersistence`: Enable localStorage persistence (default: true)

### useSyncManager

Main hook for accessing sync functionality.

```tsx
const {
  // State
  connectionState,
  isConnected,
  events,
  error,
  metrics,
  
  // Methods
  connect,
  disconnect,
  reconnect,
  subscribe,
  subscribeToOrder,
  subscribeToEventType
} = useSyncManager()
```

## Specialized Hooks

### useOrderSync

Subscribe to events for a specific order.

```tsx
const { events, latestEvent } = useOrderSync(orderID, (event) => {
  console.log('Order event:', event)
})
```

### useOrderStageChange

Handle order stage changes with automatic callbacks.

```tsx
useOrderStageChange(orderID, (event, previousStage, newStage) => {
  if (newStage === 'paid') {
    showSuccessNotification('Payment received!')
  }
})
```

### useAutoRefresh

Automatically refresh data when relevant events occur.

```tsx
useAutoRefresh(orderID, refreshOrderData, {
  eventTypes: ['stage_change', 'payment_update'],
  debounceMs: 1000,
  enabled: true
})
```

### useConnectionHealth

Monitor connection health and performance.

```tsx
const {
  status,           // 'healthy' | 'connecting' | 'error' | 'disconnected'
  isConnected,
  totalEvents,
  uptime,
  eventCounts
} = useConnectionHealth()
```

### useDashboardSync

Auto-refresh dashboard data on relevant events.

```tsx
useDashboardSync(() => {
  fetchDashboardData().then(setDashboardData)
})
```

## Event Types

The system supports various event types:

- `connected`: SSE connection established
- `heartbeat`: Connection health check
- `stage_change`: Order stage changed
- `status_update`: Order status updated
- `payment_update`: Payment status changed
- `order_created`: New order created
- `order_deleted`: Order deleted
- `whatsapp_connected`: WhatsApp linked to order
- `qr_generated`: QR code generated

## Configuration

### Default Configuration

```typescript
{
  orderID: null,              // Filter by specific order
  eventTypes: undefined,      // Filter by event types
  autoReconnect: true,        // Auto-reconnect on disconnect
  maxReconnectAttempts: 5,    // Max reconnection attempts
  reconnectDelay: 1000,       // Initial reconnect delay (ms)
  heartbeatInterval: 30000,   // Heartbeat interval (ms)
  eventHistoryLimit: 100      // Max events to keep in memory
}
```

### Custom Configuration

```tsx
const { updateConfiguration } = useSyncManager()

updateConfiguration({
  autoReconnect: false,
  eventHistoryLimit: 50,
  maxReconnectAttempts: 3
})
```

## Error Handling

The system includes comprehensive error handling:

```tsx
const { error, connectionState } = useSyncManager()

if (connectionState === ConnectionState.ERROR) {
  console.error('Sync error:', error)
  // Handle error (show notification, retry, etc.)
}
```

## localStorage Persistence

The system automatically persists:
- Recent events (configurable limit)
- Connection metrics
- User preferences
- Sync configuration

Data is restored on page refresh for seamless user experience.

## Performance Considerations

- **Event Debouncing**: Prevents rapid-fire events from causing performance issues
- **Memory Management**: Automatic cleanup of old events and listeners
- **Connection Pooling**: Efficient connection sharing across components
- **Selective Re-renders**: Only trigger re-renders for relevant events

## Migration from Polling

To replace existing polling-based components:

1. **Wrap with SyncManagerProvider**:
   ```tsx
   <SyncManagerProvider>
     <ExistingComponent />
   </SyncManagerProvider>
   ```

2. **Replace polling with sync hooks**:
   ```tsx
   // Before: useEffect with setInterval
   useEffect(() => {
     const interval = setInterval(fetchData, 30000)
     return () => clearInterval(interval)
   }, [])

   // After: Real-time sync
   useDashboardSync(fetchData)
   ```

3. **Add connection status indicators**:
   ```tsx
   const health = useConnectionHealth()
   return <div>Status: {health.status}</div>
   ```

## Testing

The system includes comprehensive tests:

```bash
npm test src/lib/sync/__tests__/
```

Tests cover:
- Connection establishment
- Event handling
- Error scenarios
- Hook functionality
- localStorage persistence

## Examples

See the `examples/` directory for complete implementations:
- `SyncedDashboard.tsx`: Dashboard with real-time updates
- `SyncedOrderPage.tsx`: Order page with live synchronization

## Troubleshooting

### Connection Issues

1. Check SSE endpoint availability: `/api/v1/sync/events`
2. Verify network connectivity
3. Check browser console for errors
4. Use connection health monitoring

### Performance Issues

1. Reduce `eventHistoryLimit` if memory usage is high
2. Use event filtering to reduce unnecessary updates
3. Implement proper event debouncing
4. Monitor connection metrics

### Event Filtering

```tsx
// Filter by order ID
connect({ orderID: 'ORDER-123' })

// Filter by event types
connect({ eventTypes: ['stage_change', 'payment_update'] })

// Combined filtering
connect({ 
  orderID: 'ORDER-123',
  eventTypes: ['stage_change']
})
```
