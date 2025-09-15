# Sync Error Handling and Polling Fallback

This document outlines how the SSE-based sync system handles errors and transitions into a resilient polling fallback mode, plus how to configure and consume it in the app.

## Configuration

Configure the SyncManager via `initialConfig` on the provider or at runtime:

- `enablePollingFallback: boolean` — enable automatic fallback to polling after max SSE reconnect attempts
- `pollingInterval?: number` — interval in ms for polling callbacks (default 15000)
- `sseRetryInterval?: number` — how often to attempt SSE reconnects while in polling mode (default 120000)
- `maxReconnectAttempts: number` — attempts before switching to polling

Example:

```tsx
<SyncManagerProvider
  initialConfig={{
    autoConnect: true,
    autoReconnect: true,
    enablePollingFallback: true,
    pollingInterval: 15000,
    sseRetryInterval: 120000,
    maxReconnectAttempts: 5,
  }}
>
  {children}
</SyncManagerProvider>
```

## Runtime API

From `useSyncManager()` you now get:

- `isPollingFallback: boolean`
- `startPolling(): void` and `stopPolling(): void`
- `registerPollingCallback(cb, intervalMs?) => id: string`
- `unregisterPollingCallback(id): void`

There is also a helper hook:

- `usePollingFallback(callback, intervalMs?)` — registers and cleans up automatically

## Behavior

1. When SSE errors occur, SyncManager retries with exponential backoff.
2. If reconnect attempts exceed `maxReconnectAttempts` and `enablePollingFallback` is true, it transitions to polling fallback:
   - `connectionState` = `POLLING_FALLBACK`
   - `isPollingFallback` = `true`
   - All registered polling callbacks start
   - A periodic SSE retry continues in the background every `sseRetryInterval`
3. On successful SSE reconnect (`connected` event), polling stops and normal real‑time flow resumes.

## UI Indicators

`useConnectionHealth()` will return `status: 'polling'` in fallback mode. `SyncStatus` shows a cyan animated icon and a "Try SSE" button to manually trigger `reconnect()`.

## Usage Patterns

- Dashboard: register a polling callback to refresh aggregate data.

```tsx
useDashboardSync(onSyncEvent)
usePollingFallback(fetchData)
```

- Order pages: register a polling callback to refetch the order when in fallback.

```tsx
useAutoRefresh(orderId, onEvent, { eventTypes: [...], debounceMs: 1000 })
usePollingFallback(fetchFullOrderData)
```

## Metrics

`ConnectionMetrics` now tracks basic polling session metrics (`pollingSessions`, `totalPollingTime`).

## Error Boundary

`<SyncErrorBoundary>` wraps the app content to contain unexpected runtime errors in the sync UI and provide a quick retry option.

