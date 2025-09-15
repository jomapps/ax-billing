I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The codebase has a **well-implemented SSE sync system** with:
- **Complete SyncManager**: Connection management, exponential backoff, event handling, and localStorage persistence
- **Existing Reconnection Logic**: Handles temporary failures with exponential backoff up to maxReconnectAttempts
- **Sync-Aware Components**: DashboardDataProvider and order components already use the sync system
- **Status Indicators**: SyncStatus component shows connection state with visual feedback

**Missing capabilities** for robust error handling:
- No polling fallback when SSE permanently fails (after max reconnect attempts)
- No error boundaries to catch sync-related runtime errors
- No "polling mode" state in UI indicators
- No mechanism to periodically retry SSE while in polling mode

### Approach

I'll implement **robust error handling and fallback mechanisms** for the existing SSE sync system. The solution focuses on four key areas:

1. **Enhanced Reconnection Logic**: Extend the existing exponential backoff to handle permanent failures gracefully
2. **Polling Fallback System**: When SSE fails permanently, automatically switch to polling mode using existing data fetching functions
3. **Error Boundaries**: Add React error boundaries to catch and handle sync-related runtime errors
4. **Enhanced Status Indicators**: Update UI components to show polling mode and provide better user feedback

The approach leverages the existing SyncManager infrastructure while adding minimal complexity. It maintains backward compatibility and provides seamless fallback without disrupting the user experience.

### Reasoning

I analyzed the existing sync system implementation and found a comprehensive SyncManager with connection state management, exponential backoff reconnection, and event handling. I examined the DashboardDataProvider and order stage components to understand how they integrate with the sync system. I reviewed the SyncStatus component to see how connection state is displayed to users. I identified that the current system handles temporary connection failures well but lacks mechanisms for permanent failure scenarios and polling fallback.

## Mermaid Diagram

sequenceDiagram
    participant User as User Browser
    participant Sync as SyncManager
    participant SSE as SSE Endpoint
    participant Poll as Polling System
    participant UI as UI Components
    participant Boundary as Error Boundary
    
    User->>Sync: Initial connection
    Sync->>SSE: Establish SSE connection
    SSE-->>Sync: Connection successful
    Sync->>UI: Update status: Connected
    
    Note over SSE: Network failure occurs
    SSE-->>Sync: Connection error
    Sync->>Sync: Start exponential backoff
    Sync->>UI: Update status: Reconnecting
    
    loop Reconnection attempts (max 5)
        Sync->>SSE: Attempt reconnection
        SSE-->>Sync: Connection failed
        Sync->>Sync: Increase backoff delay
    end
    
    Sync->>Sync: Max attempts exceeded
    Sync->>Poll: Start polling fallback
    Sync->>UI: Update status: Polling Mode
    
    loop Polling mode
        Poll->>Poll: Fetch data every 15-30s
        Poll->>Sync: Emit synthetic events
        Sync->>UI: Update with polled data
        
        Note over Sync: Periodic SSE retry
        Sync->>SSE: Attempt SSE reconnection
        SSE-->>Sync: Still failing
    end
    
    Note over SSE: Network restored
    Sync->>SSE: Successful reconnection
    SSE-->>Sync: Connection established
    Sync->>Poll: Stop polling
    Sync->>UI: Update status: Connected
    
    Note over Sync: Runtime error occurs
    Sync-->>Boundary: Error thrown
    Boundary->>Boundary: Catch error
    Boundary->>UI: Show error fallback
    User->>Boundary: Click retry
    Boundary->>Sync: Reset and reconnect

## Proposed File Changes

### src/lib/sync/types.ts(MODIFY)

Add new types and interfaces for polling fallback and error handling:

**Polling Fallback Types:**
- Add `isPollingFallback: boolean` to `SyncManagerHookReturn` interface
- Add `pollingInterval: number` and `sseRetryInterval: number` to `SyncConfiguration` interface
- Add `'polling'` as a new health status option in connection health types
- Add `startPolling: () => void` and `stopPolling: () => void` to `SyncMethods` interface

**Error Boundary Types:**
- Add `SyncErrorInfo` interface with error details, timestamp, and recovery options
- Add `ErrorBoundaryState` interface for error boundary component state
- Add `SyncErrorHandler` function type for custom error handling

**Enhanced Connection States:**
- Add `POLLING_FALLBACK` to `ConnectionState` enum
- Update `ConnectionMetrics` to include polling statistics (pollingSessions, totalPollingTime)

**Default Configuration Updates:**
- Add `pollingInterval: 15000` (15 seconds) to `DEFAULT_SYNC_CONFIG`
- Add `sseRetryInterval: 120000` (2 minutes) to `DEFAULT_SYNC_CONFIG`
- Add `enablePollingFallback: true` to `DEFAULT_SYNC_CONFIG`

These type additions ensure type safety for the new polling fallback and error handling features while maintaining backward compatibility with existing code.

### src/lib/sync/polling.ts(NEW)

References: 

- src/lib/sync/SyncManager.tsx(MODIFY)

Create a utility module for managing polling fallback functionality:

**Core Polling Manager:**
- `createPoller(fetchFunction, interval)` - Creates a polling instance with start/stop controls
- `PollingManager` class to handle multiple concurrent pollers
- Automatic cleanup and memory management for polling timers
- Configurable retry logic with exponential backoff for failed polling attempts

**Integration with SyncManager:**
- `SyncPoller` class that integrates with the existing SyncManager context
- Emits synthetic events when polling fetches new data
- Handles transition between SSE and polling modes seamlessly
- Maintains event history and metrics during polling mode

**Error Handling:**
- Graceful handling of polling function failures
- Automatic retry with backoff for failed polling attempts
- Logging and metrics collection for polling performance
- Circuit breaker pattern to prevent excessive polling on persistent errors

**Configuration Options:**
- Configurable polling intervals for different data types (dashboard vs order data)
- Maximum polling attempts before giving up
- Jitter to prevent thundering herd problems
- Debug mode for detailed polling logs

The module provides a clean abstraction for polling that can be used by any component needing fallback data fetching capabilities.

### src/lib/sync/SyncManager.tsx(MODIFY)

References: 

- src/lib/sync/polling.ts(NEW)
- src/lib/sync/types.ts(MODIFY)

Enhance the SyncManager with polling fallback and improved reconnection logic:

**Add Polling Fallback State:**
- Add `isPollingFallback: boolean` state to track when in polling mode
- Add `pollingTimerRef` and `sseRetryTimerRef` refs for timer management
- Add `pollingCallbacks` ref to store functions that should be called during polling

**Enhanced Reconnection Logic:**
- Modify `scheduleReconnect()` to transition to polling mode after max attempts exceeded
- Add `startPollingFallback()` method that begins polling and schedules periodic SSE retry attempts
- Add `stopPollingFallback()` method that cleans up polling when SSE reconnects
- Update connection state to `POLLING_FALLBACK` when in polling mode

**Polling Integration:**
- Add `registerPollingCallback(callback)` method for components to register their data fetch functions
- Add `unregisterPollingCallback(id)` method for cleanup
- Implement polling loop that calls registered callbacks at configured intervals
- Emit synthetic `polling_data_refresh` events to maintain event-driven architecture

**SSE Retry While Polling:**
- Add periodic SSE reconnection attempts every `sseRetryInterval` while in polling mode
- When SSE reconnects successfully, automatically stop polling and resume normal operation
- Update metrics to track polling sessions and SSE retry attempts

**Enhanced Error Handling:**
- Add try-catch blocks around polling callbacks with individual error handling
- Implement circuit breaker logic to pause polling if too many consecutive failures
- Add detailed error logging and metrics for debugging

**Context Value Updates:**
- Add `isPollingFallback`, `startPolling`, `stopPolling` to context value
- Add `registerPollingCallback` and `unregisterPollingCallback` methods
- Update computed state to handle new connection states

The enhancements maintain full backward compatibility while adding robust fallback capabilities.

### src/lib/sync/useSyncManager.ts(MODIFY)

References: 

- src/lib/sync/SyncManager.tsx(MODIFY)
- src/lib/sync/types.ts(MODIFY)

Update the useSyncManager hook to support polling fallback functionality:

**Add Polling Support to Main Hook:**
- Add `isPollingFallback`, `registerPollingCallback`, `unregisterPollingCallback` to the returned interface
- Ensure all new SyncManager methods are properly exposed through the hook
- Add type safety for the new polling-related methods

**Enhance useConnectionHealth Hook:**
- Update health status calculation to return `'polling'` when `isPollingFallback` is true
- Add polling-specific metrics to connection info (polling sessions, retry attempts)
- Include polling interval and next SSE retry time in connection details

**Add usePollingFallback Hook:**
- Create new specialized hook for components that need polling fallback
- Automatically register/unregister polling callbacks with proper cleanup
- Handle component unmounting and callback updates gracefully
- Provide status information about polling state and performance

**Enhance useDashboardSync Hook:**
- Integrate with polling fallback system for dashboard data
- Register dashboard refresh function as a polling callback when SSE fails
- Maintain existing event-driven behavior while adding polling support
- Add configuration options for polling interval specific to dashboard data

**Add useOrderPolling Hook:**
- Specialized hook for order page components that need polling fallback
- Register order data fetch functions for specific orders
- Handle order-specific polling intervals and retry logic
- Integrate with existing `useAutoRefresh` functionality

**Error Handling Integration:**
- Add error boundaries integration to hooks
- Provide error recovery mechanisms through hook interfaces
- Add debugging helpers for troubleshooting polling issues

All enhancements maintain backward compatibility and follow existing hook patterns in the codebase.

### src/components/common/SyncErrorBoundary.tsx(NEW)

References: 

- src/lib/sync/SyncManager.tsx(MODIFY)

Create a React error boundary component specifically for sync-related errors:

**Core Error Boundary Implementation:**
- Extend `React.Component` with proper error boundary lifecycle methods
- Implement `static getDerivedStateFromError()` to update state when errors occur
- Implement `componentDidCatch()` for error logging and reporting
- Handle both sync-specific errors and general React errors

**Error State Management:**
- Track error details including stack trace, timestamp, and component context
- Differentiate between recoverable and non-recoverable errors
- Store error history for debugging purposes
- Provide retry mechanisms for recoverable errors

**User Interface:**
- Display user-friendly error messages instead of white screen
- Provide "Retry" button that re-mounts the sync system
- Show "Refresh Page" option for non-recoverable errors
- Include "Report Issue" functionality for error reporting
- Display sync status and fallback mode information

**Integration with SyncManager:**
- Detect sync-specific errors vs general React errors
- Provide context about sync state when errors occur
- Allow manual recovery by resetting sync connections
- Integrate with polling fallback when sync errors occur

**Error Logging and Reporting:**
- Log errors to console with detailed context information
- Send error reports to monitoring service (if configured)
- Include sync metrics and connection history in error reports
- Provide debugging information for development mode

**Recovery Mechanisms:**
- Automatic retry for transient errors after a delay
- Manual retry button for user-initiated recovery
- Fallback to polling mode when sync system fails
- Page refresh as last resort for critical errors

**Props Interface:**
- `fallbackComponent` prop for custom error UI
- `onError` callback for custom error handling
- `enableAutoRetry` flag for automatic recovery attempts
- `retryDelay` configuration for retry timing

The error boundary provides comprehensive error handling while maintaining a good user experience during failures.

### src/app/(frontend)/layout.tsx(MODIFY)

References: 

- src/components/common/SyncErrorBoundary.tsx(NEW)
- src/lib/sync/SyncManager.tsx(MODIFY)

Wrap the SyncManagerProvider with the new SyncErrorBoundary for comprehensive error handling:

**Add Error Boundary Wrapper:**
- Import `SyncErrorBoundary` from `@/components/common/SyncErrorBoundary`
- Wrap the existing `<SyncManagerProvider>` with `<SyncErrorBoundary>`
- Configure error boundary with appropriate props for frontend layout

**Error Boundary Configuration:**
- Enable automatic retry with reasonable delay (5 seconds)
- Provide custom error fallback UI that matches the application design
- Configure error reporting for production environments
- Add development-specific debugging features

**Fallback UI Integration:**
- Design error fallback that maintains the layout structure
- Include sync status information in error display
- Provide clear user actions (retry, refresh, contact support)
- Maintain responsive design for mobile devices

**Error Handling Strategy:**
- Catch sync-related errors before they crash the entire application
- Allow other parts of the application to continue functioning
- Provide graceful degradation to manual refresh functionality
- Log errors for monitoring and debugging purposes

The integration ensures that sync system failures don't crash the entire frontend application while providing users with clear recovery options.

### src/components/dashboard/DashboardDataProvider.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)
- src/lib/sync/SyncManager.tsx(MODIFY)

Integrate the DashboardDataProvider with the new polling fallback system:

**Remove Existing Debounce Logic:**
- Remove the manual debounce implementation since polling fallback will handle timing
- Keep the `fetchData` function as it will be used for both sync events and polling
- Simplify the `onSyncEvent` callback to just call `fetchData` directly

**Add Polling Fallback Integration:**
- Import `usePollingFallback` hook from the enhanced sync system
- Register the `fetchData` function as a polling callback when component mounts
- Configure polling interval specifically for dashboard data (15 seconds)
- Automatically unregister polling callback when component unmounts

**Enhanced Connection Management:**
- Use `isPollingFallback` state to update the dashboard interface
- Show polling mode status in the dashboard UI
- Provide manual refresh option that works in both SSE and polling modes
- Handle connection state transitions gracefully

**Error Handling:**
- Add error handling for polling failures
- Implement retry logic for failed data fetches
- Provide user feedback when data fetching fails
- Maintain error state consistency between SSE and polling modes

**Performance Optimizations:**
- Prevent duplicate data fetches when transitioning between modes
- Implement request deduplication for rapid polling/event combinations
- Add loading state management for polling operations
- Optimize re-renders during mode transitions

**Backward Compatibility:**
- Maintain existing `DashboardData` interface without breaking changes
- Keep all existing methods and properties available
- Ensure components using `useDashboardData` continue to work unchanged
- Preserve existing error handling patterns

The integration provides seamless fallback functionality while maintaining all existing dashboard features and performance characteristics.

### src/components/dashboard/SyncStatus.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)

Enhance the SyncStatus component to display polling fallback mode and improved error states:

**Add Polling Mode Display:**
- Add new status case for `'polling'` in `getStatusIcon()`, `getStatusColor()`, and `getStatusText()`
- Use a distinctive icon for polling mode (e.g., `RefreshCw` with different styling or `Wifi` with dotted border)
- Use blue/cyan color scheme for polling mode to differentiate from error (red) and connected (green)
- Display "Polling Mode" text to clearly indicate fallback state

**Enhanced Status Detection:**
- Import and use `isPollingFallback` from `useSyncManager` hook
- Update status logic: if `isPollingFallback` is true, return `'polling'` status
- Maintain existing status logic for other connection states
- Add tooltip or hover information explaining polling mode

**Improved Error Display:**
- Show more specific error messages for different failure types
- Display "Switching to polling..." message during transition
- Add countdown timer for next SSE retry attempt while in polling mode
- Show polling interval and last successful data fetch time

**Enhanced User Controls:**
- Add "Force SSE Retry" button when in polling mode
- Provide "Switch to Manual" option to disable automatic polling
- Add "Refresh Now" button that works in both SSE and polling modes
- Include "View Details" option for expanded connection information

**Detailed Status Information:**
- Update `DetailedSyncStatus` to show polling-specific metrics
- Display polling interval, success rate, and retry schedule
- Show transition history between SSE and polling modes
- Add performance metrics for both connection types

**Responsive Design:**
- Ensure polling status displays properly on mobile devices
- Maintain compact mode functionality with new status types
- Optimize icon and text sizing for different screen sizes
- Preserve accessibility features for all status states

The enhancements provide clear visual feedback about the current sync mode while maintaining the existing clean design and user experience.

### src/components/orders/stages/OrderInitiatedView.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)
- src/components/dashboard/SyncStatus.tsx(MODIFY)

Integrate OrderInitiatedView with polling fallback for robust order data synchronization:

**Add Polling Fallback Support:**
- Import `usePollingFallback` hook from the enhanced sync system
- Register the existing `fetchFullOrderData` function as a polling callback
- Configure order-specific polling interval (30 seconds for order data)
- Handle automatic cleanup when component unmounts or order changes

**Enhanced Data Fetching:**
- Modify data fetching to work seamlessly in both SSE and polling modes
- Add error handling for polling failures with retry logic
- Implement request deduplication to prevent duplicate API calls
- Maintain loading states during mode transitions

**Connection Status Integration:**
- Import and display `SyncStatus` component in the order interface
- Show connection mode (SSE vs polling) to users for transparency
- Provide manual refresh option that works in both modes
- Add visual indicators for sync activity and data freshness

**Error Handling:**
- Wrap critical sync operations in try-catch blocks
- Provide user-friendly error messages for sync failures
- Implement graceful degradation when both SSE and polling fail
- Add manual refresh fallback for critical errors

**Performance Optimizations:**
- Prevent unnecessary re-renders during sync mode transitions
- Optimize polling frequency based on order stage and activity
- Implement intelligent polling that reduces frequency for inactive orders
- Add request cancellation for component unmounting

**User Experience:**
- Maintain existing auto-navigation functionality in both sync modes
- Ensure real-time updates work whether using SSE or polling
- Provide clear feedback about data freshness and sync status
- Preserve all existing order management features

The integration ensures the order initiated view remains fully functional even when SSE connections fail, providing a robust user experience.

### src/components/orders/stages/OrderOpenView.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)
- src/components/dashboard/SyncStatus.tsx(MODIFY)

Integrate OrderOpenView with polling fallback and enhanced error handling:

**Polling Fallback Integration:**
- Add `usePollingFallback` hook to register order data fetching for polling mode
- Configure appropriate polling interval for the open stage (30 seconds)
- Ensure service selection and order updates work in both SSE and polling modes
- Handle automatic transition between sync modes without losing user state

**Enhanced Error Boundaries:**
- Wrap service selection operations in error handling
- Provide fallback UI for sync failures that maintains service selection functionality
- Add retry mechanisms for failed service updates
- Ensure order progression works even with sync issues

**Connection Status Display:**
- Add `SyncStatus` component to show current sync mode
- Provide visual feedback about data synchronization status
- Show last update time and sync health information
- Add manual refresh controls for user-initiated updates

**Service Management Resilience:**
- Ensure service addition/removal works in polling mode
- Implement optimistic updates with rollback for service changes
- Add conflict resolution for concurrent service modifications
- Maintain service state consistency across sync mode transitions

**Auto-Navigation Robustness:**
- Ensure automatic navigation to billed stage works in both sync modes
- Add fallback navigation triggers for polling mode
- Implement navigation retry logic for failed transitions
- Preserve navigation state during sync failures

**Performance Considerations:**
- Optimize polling frequency based on user activity
- Implement smart polling that increases frequency during active service selection
- Add request deduplication for service updates
- Minimize unnecessary API calls during sync mode transitions

The integration maintains all existing service selection functionality while adding robust fallback capabilities for sync failures.

### src/components/orders/stages/OrderBilledView.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)
- src/components/dashboard/SyncStatus.tsx(MODIFY)

Integrate OrderBilledView with polling fallback for reliable payment processing:

**Payment Status Polling:**
- Add polling fallback for payment status updates using `usePollingFallback` hook
- Configure frequent polling (15 seconds) for payment-critical operations
- Ensure payment link generation and QR codes work in polling mode
- Handle payment status changes reliably in both sync modes

**Error Handling for Payments:**
- Add comprehensive error boundaries around payment operations
- Provide fallback UI that maintains payment functionality during sync failures
- Implement retry logic for failed payment status checks
- Ensure payment completion detection works even with sync issues

**Real-time Payment Updates:**
- Maintain real-time payment status updates in both SSE and polling modes
- Add visual indicators for payment processing status
- Implement optimistic updates for payment operations with rollback capability
- Ensure automatic navigation to paid stage works reliably

**Connection Status for Payments:**
- Display sync status prominently since payments are time-sensitive
- Add manual refresh controls for payment status verification
- Show last payment status check time for transparency
- Provide "Force Refresh" option for critical payment operations

**Billing Data Consistency:**
- Ensure billing calculations remain accurate during sync mode transitions
- Add validation for billing data integrity
- Implement conflict resolution for concurrent billing updates
- Maintain discount and tax calculations in all sync modes

**User Experience:**
- Provide clear feedback about payment processing status
- Ensure payment links and QR codes remain functional
- Add loading states for payment operations in polling mode
- Maintain responsive design for payment interfaces

The integration ensures critical payment operations remain reliable even when real-time sync connections fail.

### src/components/orders/stages/OrderPaidView.tsx(MODIFY)

References: 

- src/lib/sync/useSyncManager.ts(MODIFY)
- src/components/dashboard/SyncStatus.tsx(MODIFY)

Integrate OrderPaidView with polling fallback for completion status updates:

**Completion Status Polling:**
- Add polling fallback for order completion and delivery status updates
- Configure moderate polling interval (60 seconds) since paid orders are less time-sensitive
- Ensure completion workflows work reliably in both sync modes
- Handle final order status updates and archival processes

**Error Handling for Completion:**
- Add error boundaries around completion operations
- Provide fallback UI for completion status display
- Implement retry logic for completion status updates
- Ensure order finalization works even with sync issues

**Final Stage Reliability:**
- Maintain completion status accuracy in both SSE and polling modes
- Add validation for final order state consistency
- Implement completion confirmation mechanisms
- Ensure pickup/delivery status updates work reliably

**Connection Status Display:**
- Show sync status for transparency in final order stage
- Add manual refresh controls for completion status verification
- Display last status update time for completion tracking
- Provide completion history and audit trail

**Order Finalization:**
- Ensure order completion workflows work in all sync modes
- Add confirmation mechanisms for final order status
- Implement completion notification systems
- Maintain order history and completion records

**Performance Optimization:**
- Use longer polling intervals for completed orders
- Implement smart polling that reduces frequency for finalized orders
- Add efficient caching for completion status
- Optimize resource usage for final stage operations

The integration ensures order completion processes remain reliable and provide proper closure even when real-time sync connections are unavailable.

### docs/sync-error-handling.md(NEW)

References: 

- src/lib/sync/SyncManager.tsx(MODIFY)
- src/components/common/SyncErrorBoundary.tsx(NEW)
- docs/dashboard-sync-migration.md

Create comprehensive documentation for the enhanced sync system error handling and fallback mechanisms:

**Overview Section:**
- Explain the multi-layered approach to sync reliability
- Document the progression from SSE → reconnection → polling fallback
- Describe error boundary integration and user experience
- Outline monitoring and debugging capabilities

**Reconnection Logic Documentation:**
- Detail the exponential backoff algorithm and configuration
- Explain maxReconnectAttempts and reconnectDelay settings
- Document when the system transitions to polling mode
- Describe SSE retry attempts while in polling mode

**Polling Fallback System:**
- Document polling intervals for different data types (dashboard: 15s, orders: 30s, payments: 15s)
- Explain how components register polling callbacks
- Detail the transition process between SSE and polling modes
- Document polling performance optimization strategies

**Error Boundary Implementation:**
- Explain SyncErrorBoundary component usage and configuration
- Document error recovery mechanisms and user options
- Detail error logging and reporting capabilities
- Provide troubleshooting guide for common error scenarios

**UI Status Indicators:**
- Document all connection states and their visual representations
- Explain SyncStatus component usage across different pages
- Detail user controls for manual reconnection and refresh
- Document accessibility features for status indicators

**Configuration Guide:**
- Document all configuration options for reconnection and polling
- Provide recommended settings for different environments
- Explain how to customize polling intervals and retry logic
- Detail debugging and monitoring configuration

**Troubleshooting Section:**
- Common issues and their solutions
- Performance optimization tips
- Debugging tools and techniques
- Monitoring and alerting recommendations

**Migration Guide:**
- How existing components automatically benefit from new error handling
- Breaking changes (none expected) and compatibility notes
- Testing strategies for error scenarios
- Deployment considerations and rollback procedures

The documentation provides comprehensive guidance for developers working with the enhanced sync system.