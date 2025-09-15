/**
 * Test file for SyncManager functionality
 * Tests the core sync system components and hooks
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { SyncManagerProvider, useSyncManager } from '../index'
import { ConnectionState, EventType } from '../types'

// Mock EventSource for testing
class MockEventSource {
  static lastInstance: MockEventSource | null = null

  url: string
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  private listeners: Map<string, ((event: MessageEvent) => void)[]> = new Map()

  constructor(url: string) {
    this.url = url
    MockEventSource.lastInstance = this
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = 1
      this.dispatchEvent('connected', {
        clientId: 'test-client',
        timestamp: new Date().toISOString(),
        message: 'SSE connection established',
      })
    }, 100)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)!.push(listener)
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  dispatchEvent(type: string, data: any) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      }) as any
      event.type = type
      listeners.forEach((listener) => listener(event))
    }
  }

  close() {
    this.readyState = 2
  }

  // Helper method to simulate server events
  simulateEvent(eventType: EventType, data: any, orderID?: string) {
    this.dispatchEvent(eventType, {
      eventType,
      data,
      orderID,
      timestamp: new Date().toISOString(),
    })
  }
}

// Create a controllable mock factory
function createMockEventSourceFactory() {
  return (url: string) => {
    return new MockEventSource(url)
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any

// Test component that uses the sync manager
function TestComponent() {
  const { connectionState, isConnected, events, connect, disconnect, subscribe } = useSyncManager()

  React.useEffect(() => {
    // Auto-connect for testing
    connect()
  }, [connect])

  return (
    <div>
      <div data-testid="connection-state">{connectionState}</div>
      <div data-testid="is-connected">{isConnected.toString()}</div>
      <div data-testid="event-count">{events.length}</div>
      <button onClick={() => connect()} data-testid="connect-btn">
        Connect
      </button>
      <button onClick={disconnect} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  )
}

describe('SyncManager', () => {
  beforeEach(() => {
    // Use fake timers for better test control
    jest.useFakeTimers()
    // Clear localStorage before each test
    localStorage.clear()
    // Reset mock instance
    MockEventSource.lastInstance = null
  })

  afterEach(() => {
    // Clean up any remaining connections
    jest.clearAllTimers()
    // Restore real timers
    jest.useRealTimers()
  })

  test('should provide sync manager context', () => {
    render(
      <SyncManagerProvider>
        <TestComponent />
      </SyncManagerProvider>,
    )

    expect(screen.getByTestId('connection-state')).toBeInTheDocument()
    expect(screen.getByTestId('is-connected')).toBeInTheDocument()
    expect(screen.getByTestId('event-count')).toBeInTheDocument()
  })

  test('should establish SSE connection', async () => {
    render(
      <SyncManagerProvider>
        <TestComponent />
      </SyncManagerProvider>,
    )

    // Initially disconnected
    expect(screen.getByTestId('connection-state')).toHaveTextContent(ConnectionState.DISCONNECTED)
    expect(screen.getByTestId('is-connected')).toHaveTextContent('false')

    // Advance timers to trigger connection
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Wait for auto-connection
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent(ConnectionState.CONNECTED)
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
    })
  })

  test('should receive and store events', async () => {
    const mockFactory = createMockEventSourceFactory()

    render(
      <SyncManagerProvider eventSourceFactory={mockFactory}>
        <TestComponent />
      </SyncManagerProvider>,
    )

    // Advance timers to trigger connection
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Wait for connection and get the actual EventSource instance
    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
      expect(MockEventSource.lastInstance).toBeTruthy()
    })

    // Simulate a stage change event on the actual instance
    act(() => {
      MockEventSource.lastInstance!.simulateEvent(
        'stage_change',
        {
          previousStage: 'empty',
          newStage: 'initiated',
          order: { orderID: 'TEST-001' },
        },
        'TEST-001',
      )
    })

    // Should have received the event (plus the initial connected event)
    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('2')
    })
  })

  test('should handle disconnection', async () => {
    render(
      <SyncManagerProvider>
        <TestComponent />
      </SyncManagerProvider>,
    )

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
    })

    // Disconnect
    act(() => {
      screen.getByTestId('disconnect-btn').click()
    })

    expect(screen.getByTestId('connection-state')).toHaveTextContent(ConnectionState.DISCONNECTED)
    expect(screen.getByTestId('is-connected')).toHaveTextContent('false')
  })

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useSyncManagerContext must be used within a SyncManagerProvider')

    consoleSpy.mockRestore()
  })

  test('should persist state to localStorage and restore across remounts', async () => {
    // Mock URL constructor to spy on SSE URL construction
    const originalURL = global.URL
    const mockURL = jest.fn().mockImplementation((url, base) => {
      const urlObj = new originalURL(url, base)
      mockURL.lastConstructedURL = urlObj.toString()
      return urlObj
    })
    global.URL = mockURL as any

    // First mount - establish connection and generate events
    const { unmount } = render(
      <SyncManagerProvider enablePersistence={true}>
        <TestComponent />
      </SyncManagerProvider>,
    )

    // Advance timers to trigger connection
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
      expect(MockEventSource.lastInstance).toBeTruthy()
    })

    // Simulate some events with lastEventId
    act(() => {
      const event = new MessageEvent('stage_change', {
        data: JSON.stringify({
          eventType: 'stage_change',
          data: { previousStage: 'empty', newStage: 'initiated' },
          orderID: 'TEST-001',
          timestamp: new Date().toISOString(),
        }),
      })
      // Add lastEventId to the event
      ;(event as any).lastEventId = 'event_123456'

      const listeners = MockEventSource.lastInstance!.listeners.get('stage_change')
      if (listeners) {
        listeners.forEach((listener) => listener(event))
      }
    })

    // Wait for event to be processed
    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('2') // connected + stage_change
    })

    // Check if state was persisted
    let persistedState: any
    await waitFor(() => {
      const persistedData = localStorage.getItem('ax-billing-sync-state')
      expect(persistedData).toBeTruthy()
      persistedState = JSON.parse(persistedData!)
      expect(persistedState.events).toHaveLength(2)
      expect(persistedState.lastEventId).toBe('event_123456')
    })

    // Unmount the component
    unmount()

    // Clear the mock instance
    MockEventSource.lastInstance = null

    // Second mount - should restore from localStorage
    render(
      <SyncManagerProvider enablePersistence={true}>
        <TestComponent />
      </SyncManagerProvider>,
    )

    // Should restore events from localStorage (excluding old events > 1h)
    await waitFor(() => {
      expect(screen.getByTestId('event-count')).toHaveTextContent('2')
    })

    // Wait for new connection attempt and check if lastEventId is applied to SSE URL
    await waitFor(() => {
      expect(MockEventSource.lastInstance).toBeTruthy()
      expect(mockURL.lastConstructedURL).toContain('lastEventId=event_123456')
    })

    // Restore original URL constructor
    global.URL = originalURL
  })

  test('should filter events by orderID', async () => {
    const TestFilterComponent = () => {
      const { connect, events } = useSyncManager()

      React.useEffect(() => {
        connect({ orderID: 'TEST-001' })
      }, [connect])

      return <div data-testid="filtered-events">{events.length}</div>
    }

    render(
      <SyncManagerProvider>
        <TestFilterComponent />
      </SyncManagerProvider>,
    )

    // Wait for connection
    await waitFor(() => {
      expect(screen.getByTestId('filtered-events')).toBeInTheDocument()
    })

    // The component should connect with orderID filter
    // This would be tested more thoroughly with actual SSE endpoint
    expect(screen.getByTestId('filtered-events')).toHaveTextContent('1') // connected event
  })
})

describe('SyncManager Hooks', () => {
  test('useOrderSync should filter events by orderID', async () => {
    const TestOrderSyncComponent = () => {
      const { events, latestEvent } = useOrderSync('TEST-001')

      return (
        <div>
          <div data-testid="order-events">{events.length}</div>
          <div data-testid="latest-event">{latestEvent?.eventType || 'none'}</div>
          <div data-testid="filtered-order-ids">{events.map((e) => e.orderID).join(',')}</div>
        </div>
      )
    }

    render(
      <SyncManagerProvider>
        <TestOrderSyncComponent />
      </SyncManagerProvider>,
    )

    // Advance timers to trigger connection
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Wait for connection
    await waitFor(() => {
      expect(MockEventSource.lastInstance).toBeTruthy()
    })

    // Initially should have no filtered events
    expect(screen.getByTestId('order-events')).toHaveTextContent('0')
    expect(screen.getByTestId('latest-event')).toHaveTextContent('none')

    // Simulate events with different orderIDs
    act(() => {
      // This event should NOT be included (different orderID)
      MockEventSource.lastInstance!.simulateEvent(
        'stage_change',
        {
          previousStage: 'empty',
          newStage: 'initiated',
          order: { orderID: 'TEST-999' },
        },
        'TEST-999',
      )
    })

    act(() => {
      // This event SHOULD be included (matching orderID)
      MockEventSource.lastInstance!.simulateEvent(
        'stage_change',
        {
          previousStage: 'initiated',
          newStage: 'in_progress',
          order: { orderID: 'TEST-001' },
        },
        'TEST-001',
      )
    })

    act(() => {
      // Another event that should NOT be included
      MockEventSource.lastInstance!.simulateEvent(
        'payment_update',
        {
          amount: 100,
          order: { orderID: 'TEST-888' },
        },
        'TEST-888',
      )
    })

    act(() => {
      // Another event that SHOULD be included
      MockEventSource.lastInstance!.simulateEvent(
        'status_update',
        {
          status: 'completed',
          order: { orderID: 'TEST-001' },
        },
        'TEST-001',
      )
    })

    // Should only have events with orderID 'TEST-001'
    await waitFor(() => {
      expect(screen.getByTestId('order-events')).toHaveTextContent('2')
      expect(screen.getByTestId('latest-event')).toHaveTextContent('status_update')
      expect(screen.getByTestId('filtered-order-ids')).toHaveTextContent('TEST-001,TEST-001')
    })
  })

  test('useConnectionHealth should provide connection status', () => {
    const TestHealthComponent = () => {
      const health = useConnectionHealth()

      return (
        <div>
          <div data-testid="health-status">{health.status}</div>
          <div data-testid="health-connected">{health.isConnected.toString()}</div>
        </div>
      )
    }

    render(
      <SyncManagerProvider>
        <TestHealthComponent />
      </SyncManagerProvider>,
    )

    expect(screen.getByTestId('health-status')).toHaveTextContent('disconnected')
    expect(screen.getByTestId('health-connected')).toHaveTextContent('false')
  })
})

// Import the hooks for testing
import { useOrderSync, useConnectionHealth } from '../useSyncManager'
