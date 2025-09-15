# Integration Guide: Real-time Sync System

This guide shows how to integrate the new real-time sync system into the existing ax-billing application to replace polling-based data fetching.

## Overview

The sync system provides real-time order updates using the existing SSE infrastructure (`/api/v1/sync/events`) and integrates seamlessly with the current React patterns.

## Integration Steps

### 1. App-Level Integration

Add the SyncManagerProvider to your main app layout:

```tsx
// src/app/layout.tsx or src/app/page.tsx
import { SyncManagerProvider } from '@/lib/sync'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SyncManagerProvider 
          initialConfig={{ 
            autoReconnect: true,
            eventHistoryLimit: 100 
          }}
          enablePersistence={true}
        >
          {children}
        </SyncManagerProvider>
      </body>
    </html>
  )
}
```

### 2. Replace DashboardDataProvider

**Before (Polling-based):**
```tsx
// src/components/dashboard/DashboardDataProvider.tsx
export function DashboardDataProvider({ children, refreshInterval = 30000 }) {
  // ... polling logic with setInterval
}
```

**After (Real-time Sync):**
```tsx
// src/components/dashboard/SyncedDashboardProvider.tsx
import { useDashboardSync, useConnectionHealth } from '@/lib/sync'

export function SyncedDashboardProvider({ children }) {
  const [dashboardData, setDashboardData] = useState(null)
  
  const refreshData = useCallback(async () => {
    const result = await fetchDashboardData()
    if (result.success) {
      setDashboardData(result.data)
    }
  }, [])

  // Replace polling with real-time sync
  useDashboardSync(refreshData)

  // Initial data fetch
  useEffect(() => {
    refreshData()
  }, [refreshData])

  return (
    <DashboardContext.Provider value={{ ...dashboardData, refreshData }}>
      {children}
    </DashboardContext.Provider>
  )
}
```

### 3. Enhance OrderPageView

Add real-time sync to the existing OrderPageView component:

```tsx
// src/components/orders/OrderPageView.tsx
import { 
  useOrderSync, 
  useOrderStageChange, 
  useAutoRefresh,
  useConnectionHealth 
} from '@/lib/sync'

export function OrderPageView({ orderId, initialOrderData }) {
  const [orderData, setOrderData] = useState(initialOrderData)
  const health = useConnectionHealth()

  // Subscribe to order-specific events
  const { events: orderEvents } = useOrderSync(orderId)

  // Handle stage changes
  useOrderStageChange(orderId, (event, prevStage, newStage) => {
    console.log(`Order ${orderId} stage: ${prevStage} → ${newStage}`)
    
    // Show notifications or trigger actions
    if (newStage === 'paid') {
      // Show success notification
    } else if (newStage === 'initiated') {
      // Customer connected notification
    }
  })

  // Auto-refresh order data on relevant events
  useAutoRefresh(orderId, fetchFullOrderData, {
    eventTypes: ['stage_change', 'status_update', 'payment_update'],
    debounceMs: 500
  })

  return (
    <div>
      {/* Connection status indicator */}
      <div className="flex items-center gap-2">
        <span>Status: {health.status}</span>
        {health.isConnected && <span className="text-green-400">● Live</span>}
      </div>
      
      {/* Existing order content */}
      {/* ... */}
    </div>
  )
}
```

### 4. Dashboard Components

Update dashboard components to use real-time data:

```tsx
// src/components/dashboard/OrdersList.tsx
import { useSyncManager } from '@/lib/sync'

export function OrdersList() {
  const { events } = useSyncManager()
  const [orders, setOrders] = useState([])

  // Subscribe to order events for real-time updates
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (['stage_change', 'order_created', 'order_deleted'].includes(event.eventType)) {
        // Refresh orders list
        refreshOrders()
      }
    })
    return unsubscribe
  }, [])

  return (
    <div>
      {/* Orders list with real-time updates */}
    </div>
  )
}
```

### 5. Connection Status Component

Create a reusable connection status component:

```tsx
// src/components/ui/ConnectionStatus.tsx
import { useConnectionHealth, useSyncManager } from '@/lib/sync'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

export function ConnectionStatus() {
  const health = useConnectionHealth()
  const { reconnect } = useSyncManager()

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return <Wifi className="w-4 h-4 text-green-400" />
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-400" />
      default: return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <span className="text-sm capitalize">{health.status}</span>
      {health.status === 'error' && (
        <button onClick={reconnect} className="text-xs text-blue-400">
          Retry
        </button>
      )}
    </div>
  )
}
```

## Migration Strategy

### Phase 1: Parallel Implementation
1. Keep existing polling system running
2. Add sync system alongside existing components
3. Test sync system thoroughly
4. Compare data consistency between both systems

### Phase 2: Gradual Migration
1. Start with non-critical components (connection status, event logs)
2. Migrate dashboard components one by one
3. Update order pages to use real-time sync
4. Add user preference to choose between polling and real-time

### Phase 3: Complete Migration
1. Remove polling-based components
2. Update all components to use sync system
3. Add comprehensive error handling
4. Optimize performance and memory usage

## Configuration Options

### Development Environment
```tsx
<SyncManagerProvider
  initialConfig={{
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectDelay: 500,
    eventHistoryLimit: 200
  }}
  enablePersistence={true}
>
```

### Production Environment
```tsx
<SyncManagerProvider
  initialConfig={{
    autoReconnect: true,
    maxReconnectAttempts: 5,
    reconnectDelay: 1000,
    eventHistoryLimit: 50
  }}
  enablePersistence={true}
>
```

## Error Handling

Add comprehensive error handling:

```tsx
function ErrorBoundary({ children }) {
  const { error, connectionState } = useSyncManager()

  if (connectionState === ConnectionState.ERROR) {
    return (
      <div className="error-banner">
        <p>Connection lost. Some features may not work properly.</p>
        <button onClick={() => window.location.reload()}>
          Refresh Page
        </button>
      </div>
    )
  }

  return children
}
```

## Performance Monitoring

Add performance monitoring:

```tsx
function PerformanceMonitor() {
  const { metrics } = useSyncManager()

  useEffect(() => {
    console.log('Sync Performance:', {
      totalEvents: metrics.totalEvents,
      uptime: metrics.uptime,
      reconnects: metrics.totalReconnects,
      eventCounts: metrics.eventCounts
    })
  }, [metrics])

  return null
}
```

## Testing Integration

Update existing tests to work with sync system:

```tsx
// Test wrapper with sync provider
function TestWrapper({ children }) {
  return (
    <SyncManagerProvider enablePersistence={false}>
      {children}
    </SyncManagerProvider>
  )
}

// Mock SSE for tests
beforeEach(() => {
  global.EventSource = MockEventSource
})
```

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Feature Flag**: Use environment variable to toggle between systems
2. **Component Swap**: Replace sync components with original polling components
3. **Gradual Rollback**: Rollback components one by one if needed

```tsx
const USE_REAL_TIME_SYNC = process.env.NEXT_PUBLIC_USE_SYNC === 'true'

function Dashboard() {
  return USE_REAL_TIME_SYNC ? (
    <SyncedDashboardProvider>
      <DashboardContent />
    </SyncedDashboardProvider>
  ) : (
    <DashboardDataProvider>
      <DashboardContent />
    </DashboardDataProvider>
  )
}
```

## Benefits After Integration

1. **Real-time Updates**: Instant order status changes
2. **Reduced Server Load**: No more polling requests
3. **Better User Experience**: Live connection status and notifications
4. **Improved Performance**: Event-driven updates instead of periodic fetching
5. **Offline Resilience**: localStorage persistence and automatic reconnection
6. **Developer Experience**: Type-safe hooks and comprehensive error handling

## Next Steps

1. Review the sync system implementation
2. Test with existing SSE infrastructure
3. Start with Phase 1 migration (parallel implementation)
4. Monitor performance and error rates
5. Gradually migrate components to real-time sync
6. Remove polling-based components once migration is complete
