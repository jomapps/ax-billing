#!/usr/bin/env node

/**
 * SSE Sync Flow Test Script
 *
 * This script tests the end-to-end event flow from order update to SSE broadcast.
 *
 * Prerequisites:
 * 1. Install dependencies: npm install eventsource node-fetch
 * 2. Ensure the development server is running on localhost:3000
 * 3. Ensure PayloadCMS is properly configured with OrderSyncEvents collection
 *
 * Usage:
 * node scripts/test-sync-flow.mjs
 *
 * Tests performed:
 * - SSE connection establishment
 * - Order stage updates via API
 * - Real-time event reception
 * - Event filtering by orderID and eventType
 * - Multiple client connections
 * - Error handling for invalid requests
 *
 * The script will output detailed logs and a final test results summary.
 */

// Dependencies check
try {
  await import('eventsource')
  await import('node-fetch')
} catch (error) {
  console.error('❌ Missing dependencies. Please install:')
  console.error('npm install eventsource node-fetch')
  process.exit(1)
}

import { EventSource } from 'eventsource'
import fetch from 'node-fetch'

// Configuration
const BASE_URL = 'http://localhost:3000'
// Comment 6: Test assumes a test order exists; add setup or configurable order ID
const TEST_ORDER_ID = process.env.TEST_ORDER_ID || 'TEST_ORDER_123'
const SSE_ENDPOINT = `${BASE_URL}/api/v1/sync/events`
const ORDER_UPDATE_ENDPOINT = `${BASE_URL}/api/v1/orders/${TEST_ORDER_ID}/update-stage`

// Comment 6: Fail fast if TEST_ORDER_ID is not provided
if (!process.env.TEST_ORDER_ID) {
  console.error('❌ TEST_ORDER_ID environment variable is required')
  console.error('Usage: TEST_ORDER_ID=your_order_id node scripts/test-sync-flow.mjs')
  process.exit(1)
}

// Test state
let testResults = {
  sseConnection: false,
  orderUpdate: false,
  eventReceived: false,
  syncEventCreated: false,
  filtering: false,
  multipleClients: false,
  errorHandling: false,
}

let receivedEvents = []
let activeConnections = []

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Test 1: Basic SSE Connection
async function testSSEConnection() {
  log('Testing SSE connection...', 'info')

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(`${SSE_ENDPOINT}?orderID=${TEST_ORDER_ID}`)

    // Comment 4: Test script listens to `onmessage` but events are named; use addEventListener
    eventSource.addEventListener('connected', () => {
      log('SSE connection established', 'success')
      testResults.sseConnection = true
      activeConnections.push(eventSource)
      resolve(eventSource)
    })

    eventSource.onerror = (error) => {
      log(`SSE connection failed: ${error.message}`, 'error')
      reject(error)
    }

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!testResults.sseConnection) {
        eventSource.close()
        reject(new Error('SSE connection timeout'))
      }
    }, 10000)
  })
}

// Test 2: Order Update via API
async function testOrderUpdate() {
  log('Testing order update via API...', 'info')

  try {
    const response = await fetch(ORDER_UPDATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'open',
        notes: 'Test update from sync flow test',
      }),
    })

    const result = await response.json()

    if (response.ok && result.success) {
      log('Order update successful', 'success')
      log(`Sync event created: ${result.syncEvent ? 'Yes' : 'No'}`)
      log(`SSE event broadcast: ${result.sseEventBroadcast ? 'Yes' : 'No'}`)
      testResults.orderUpdate = true
      testResults.syncEventCreated = !!result.syncEvent
      return result
    } else {
      throw new Error(result.error || 'Order update failed')
    }
  } catch (error) {
    log(`Order update failed: ${error.message}`, 'error')
    throw error
  }
}

// Test 3: Event Reception
async function testEventReception(eventSource) {
  log('Testing event reception...', 'info')

  return new Promise((resolve, reject) => {
    let eventReceived = false

    // Comment 4: Use addEventListener for named events
    eventSource.addEventListener('stage_change', (event) => {
      try {
        const data = JSON.parse(event.data)
        log(`Event received: ${JSON.stringify(data, null, 2)}`, 'success')
        receivedEvents.push(data)

        if (data.orderID === TEST_ORDER_ID && data.eventType === 'stage_change') {
          testResults.eventReceived = true
          eventReceived = true
          resolve(data)
        }
      } catch (error) {
        log(`Failed to parse event data: ${error.message}`, 'error')
      }
    })

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!eventReceived) {
        reject(new Error('Event reception timeout'))
      }
    }, 15000)
  })
}

// Test 4: Filtering Test
async function testFiltering() {
  log('Testing event filtering...', 'info')

  try {
    // Comment 5: SSE filtering test uses `eventType` query param; endpoint expects `eventTypes`
    const filteredEventSource = new EventSource(
      `${SSE_ENDPOINT}?orderID=${TEST_ORDER_ID}&eventTypes=stage_change`,
    )
    activeConnections.push(filteredEventSource)

    let filteredEventReceived = false

    // Comment 4: Use addEventListener for named events
    filteredEventSource.addEventListener('stage_change', (event) => {
      const data = JSON.parse(event.data)
      if (data.orderID === TEST_ORDER_ID) {
        filteredEventReceived = true
        log('Filtered event received correctly', 'success')
      }
    })

    // Wait for connection to establish
    await sleep(2000)

    // Update the order again
    await testOrderUpdate()

    // Wait for event
    await sleep(3000)

    if (filteredEventReceived) {
      testResults.filtering = true
      log('Filtering test passed', 'success')
    } else {
      throw new Error('Filtered event not received')
    }

    filteredEventSource.close()
  } catch (error) {
    log(`Filtering test failed: ${error.message}`, 'error')
    throw error
  }
}

// Test 5: Multiple Clients Test
async function testMultipleClients() {
  log('Testing multiple clients...', 'info')

  try {
    const clients = []
    const clientEvents = []

    // Create 3 SSE clients
    for (let i = 0; i < 3; i++) {
      const client = new EventSource(`${SSE_ENDPOINT}?orderID=${TEST_ORDER_ID}`)
      clients.push(client)
      activeConnections.push(client)
      clientEvents.push([])

      // Comment 4: Use addEventListener for named events
      client.addEventListener('stage_change', (event) => {
        const data = JSON.parse(event.data)
        clientEvents[i].push(data)
      })
    }

    // Wait for connections to establish
    await sleep(3000)

    // Update order
    await testOrderUpdate()

    // Wait for events
    await sleep(5000)

    // Check if all clients received the event
    const allReceived = clientEvents.every((events) =>
      events.some((event) => event.orderID === TEST_ORDER_ID),
    )

    if (allReceived) {
      testResults.multipleClients = true
      log('Multiple clients test passed', 'success')
    } else {
      throw new Error('Not all clients received the event')
    }

    // Close clients
    clients.forEach((client) => client.close())
  } catch (error) {
    log(`Multiple clients test failed: ${error.message}`, 'error')
    throw error
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  log('Testing error handling...', 'info')

  try {
    // Test with invalid order ID
    const response = await fetch(`${BASE_URL}/api/v1/orders/INVALID_ORDER/update-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stage: 'open',
      }),
    })

    if (response.status === 404) {
      log('Error handling test passed - invalid order correctly rejected', 'success')
      testResults.errorHandling = true
    } else {
      throw new Error('Expected 404 for invalid order')
    }
  } catch (error) {
    log(`Error handling test failed: ${error.message}`, 'error')
    throw error
  }
}

// Cleanup function
function cleanup() {
  log('Cleaning up connections...', 'info')
  activeConnections.forEach((connection) => {
    if (connection.readyState !== EventSource.CLOSED) {
      connection.close()
    }
  })
  activeConnections = []
}

// Comment 6: Verify order existence before running tests
async function verifyOrderExists() {
  log('Verifying test order exists...', 'info')

  try {
    const response = await fetch(`${BASE_URL}/api/v1/orders/${TEST_ORDER_ID}`)
    if (response.ok) {
      log('Test order exists', 'success')
      return true
    } else if (response.status === 404) {
      log(
        `Test order ${TEST_ORDER_ID} not found. Please create it first or use an existing order ID.`,
        'error',
      )
      return false
    } else {
      log(`Failed to verify order existence: ${response.status}`, 'error')
      return false
    }
  } catch (error) {
    log(`Error verifying order existence: ${error.message}`, 'error')
    return false
  }
}

// Main test runner
async function runTests() {
  log('Starting sync flow tests...', 'info')
  log(`Testing with order ID: ${TEST_ORDER_ID}`, 'info')

  try {
    // Comment 6: Verify order exists before running tests
    const orderExists = await verifyOrderExists()
    if (!orderExists) {
      log('Aborting tests - test order does not exist', 'error')
      process.exit(1)
    }

    // Test 1: SSE Connection
    const eventSource = await testSSEConnection()

    // Test 2 & 3: Order Update and Event Reception (run in parallel)
    const [updateResult] = await Promise.all([testOrderUpdate(), testEventReception(eventSource)])

    // Test 4: Filtering
    await testFiltering()

    // Test 5: Multiple Clients
    await testMultipleClients()

    // Test 6: Error Handling
    await testErrorHandling()

    // Print results
    log('\n=== TEST RESULTS ===', 'info')
    Object.entries(testResults).forEach(([test, passed]) => {
      log(`${test}: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'success' : 'error')
    })

    const allPassed = Object.values(testResults).every((result) => result)
    log(
      `\nOverall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`,
      allPassed ? 'success' : 'error',
    )

    log(`\nEvents received: ${receivedEvents.length}`, 'info')
    receivedEvents.forEach((event, index) => {
      log(`Event ${index + 1}: ${JSON.stringify(event)}`, 'info')
    })
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error')
  } finally {
    cleanup()
    process.exit(0)
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('Test interrupted by user', 'info')
  cleanup()
  process.exit(0)
})

process.on('SIGTERM', () => {
  log('Test terminated', 'info')
  cleanup()
  process.exit(0)
})

// Database verification function
async function verifyOrderSyncEvents() {
  log('Verifying OrderSyncEvents in database...', 'info')

  try {
    // This would require PayloadCMS Local API access
    // For now, we'll rely on the API response confirmation
    log('Database verification would require PayloadCMS Local API setup', 'info')
    log('Relying on API response confirmation for sync event creation', 'info')
    return true
  } catch (error) {
    log(`Database verification failed: ${error.message}`, 'error')
    return false
  }
}

// Enhanced logging for debugging
function logTestProgress(testName, step, details = '') {
  log(`[${testName}] ${step}${details ? ': ' + details : ''}`, 'info')
}

// Heartbeat test
async function testHeartbeat(eventSource) {
  log('Testing SSE heartbeat...', 'info')

  return new Promise((resolve) => {
    let heartbeatReceived = false

    // Comment 4: Use addEventListener for heartbeat events
    eventSource.addEventListener('heartbeat', (event) => {
      heartbeatReceived = true
      log('Heartbeat received', 'success')
      resolve(true)
    })

    // Wait for heartbeat (should come every 30 seconds)
    setTimeout(() => {
      resolve(heartbeatReceived)
    }, 35000)
  })
}

// Run the tests
runTests()
