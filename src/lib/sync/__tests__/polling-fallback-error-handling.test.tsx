/**
 * Test to verify SSE error handling during polling fallback preserves polling state
 */

import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import { SyncManagerProvider, useSyncManager } from '../index'
import { ConnectionState } from '../types'

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

  close() {
    this.readyState = 2
  }

  triggerError() {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }

  simulateConnected() {
    this.readyState = 1
    const listeners = this.listeners.get('connected')
    if (listeners) {
      const event = new MessageEvent('connected', {
        data: JSON.stringify({
          clientId: 'test-client',
          timestamp: new Date().toISOString(),
          message: 'SSE connection established'
        })
      })
      listeners.forEach(listener => listener(event))
    }
  }
}

// Mock global EventSource
global.EventSource = MockEventSource as any

// Test component that uses the sync manager
function TestComponent() {
  const {
    connectionState,
    isPollingFallback,
    connect,
    disconnect
  } = useSyncManager()

  return (
    <div>
      <div data-testid="connection-state">{connectionState}</div>
      <div data-testid="is-polling-fallback">{isPollingFallback.toString()}</div>
      <button onClick={() => connect()} data-testid="connect-btn">
        Connect
      </button>
      <button onClick={disconnect} data-testid="disconnect-btn">
        Disconnect
      </button>
    </div>
  )
}

describe('Polling Fallback Error Handling', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    MockEventSource.lastInstance = null
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('SSE onerror during polling fallback should preserve POLLING_FALLBACK state', async () => {
    render(
      <SyncManagerProvider
        initialConfig={{
          enablePollingFallback: true,
          maxReconnectAttempts: 1 // Force quick fallback
        }}
      >
        <TestComponent />
      </SyncManagerProvider>
    )

    // Start connection
    act(() => {
      screen.getByTestId('connect-btn').click()
    })

    // Wait for connection attempt and force it to fail to trigger polling fallback
    await act(async () => {
      jest.advanceTimersByTime(100)
      if (MockEventSource.lastInstance) {
        MockEventSource.lastInstance.triggerError()
      }
      jest.advanceTimersByTime(2000) // Wait for reconnect attempts to exhaust
    })

    // Should be in polling fallback
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent('polling_fallback')
      expect(screen.getByTestId('is-polling-fallback')).toHaveTextContent('true')
    })

    // Now trigger another SSE error while in polling fallback
    act(() => {
      if (MockEventSource.lastInstance) {
        MockEventSource.lastInstance.triggerError()
      }
    })

    // Should remain in POLLING_FALLBACK state, not ERROR
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent('polling_fallback')
      expect(screen.getByTestId('is-polling-fallback')).toHaveTextContent('true')
    })
  })

  test('Normal SSE error when not in polling fallback should trigger ERROR state', async () => {
    render(
      <SyncManagerProvider
        initialConfig={{
          enablePollingFallback: false,
          autoReconnect: false // Disable reconnect for cleaner test
        }}
      >
        <TestComponent />
      </SyncManagerProvider>
    )

    // Start connection
    act(() => {
      screen.getByTestId('connect-btn').click()
    })

    // Trigger SSE error
    act(() => {
      if (MockEventSource.lastInstance) {
        MockEventSource.lastInstance.triggerError()
      }
    })

    // Should be in ERROR state
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent('error')
      expect(screen.getByTestId('is-polling-fallback')).toHaveTextContent('false')
    })
  })

  test('Successful SSE reconnect during polling should stop polling fallback', async () => {
    render(
      <SyncManagerProvider
        initialConfig={{
          enablePollingFallback: true,
          maxReconnectAttempts: 1,
          sseRetryInterval: 1000 // Short retry interval for testing
        }}
      >
        <TestComponent />
      </SyncManagerProvider>
    )

    // Start connection and force into polling fallback
    act(() => {
      screen.getByTestId('connect-btn').click()
    })

    await act(async () => {
      jest.advanceTimersByTime(100)
      if (MockEventSource.lastInstance) {
        MockEventSource.lastInstance.triggerError()
      }
      jest.advanceTimersByTime(2000) // Exhaust reconnect attempts
    })

    // Verify we're in polling fallback
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent('polling_fallback')
      expect(screen.getByTestId('is-polling-fallback')).toHaveTextContent('true')
    })

    // Advance time to trigger SSE retry and simulate successful connection
    await act(async () => {
      jest.advanceTimersByTime(1000) // Trigger SSE retry
      if (MockEventSource.lastInstance) {
        MockEventSource.lastInstance.simulateConnected()
      }
    })

    // Should exit polling fallback and be connected
    await waitFor(() => {
      expect(screen.getByTestId('connection-state')).toHaveTextContent('connected')
      expect(screen.getByTestId('is-polling-fallback')).toHaveTextContent('false')
    })
  })
})
