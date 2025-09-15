#!/usr/bin/env node

/**
 * Comprehensive test script for automatic navigation flow
 * Tests end-to-end SSE-driven navigation between order stages
 */

import { chromium } from 'playwright'
import fetch from 'node-fetch'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`
const SSE_PATH = process.env.NEXT_PUBLIC_SSE_PATH || '/api/v1/sync/events'

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  navigationTimeout: 5000,
  sseTimeout: 10000,
  debounceMs: 500,
}

// Test order data
const TEST_ORDERS = {
  initiated: 'AX-20241214-0001',
  open: 'AX-20241214-0002',
  billed: 'AX-20241214-0003',
}

class AutoNavigationTester {
  constructor() {
    this.browser = null
    this.contexts = []
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
    }
  }

  async setup() {
    console.log('🚀 Setting up test environment...')

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to true for CI
      devtools: true,
    })

    console.log('✅ Browser launched')
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...')

    // Close all contexts
    for (const context of this.contexts) {
      await context.close()
    }

    // Close browser
    if (this.browser) {
      await this.browser.close()
    }

    console.log('✅ Cleanup complete')
  }

  async createTestContext() {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    })

    this.contexts.push(context)
    return context
  }

  async createTestOrder(stage) {
    console.log(`📝 Creating test order in ${stage} stage...`)

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderID: `TEST-${Date.now()}`,
          orderStage: stage,
          totalAmount: 50.0,
          paymentStatus: 'pending',
          overallStatus: 'active',
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create test order: ${response.status}`)
      }

      const data = await response.json()
      const order = data.doc || data // Handle PayloadCMS response format
      console.log(`✅ Created test order: ${order.orderID}`)
      return order
    } catch (error) {
      console.error('❌ Failed to create test order:', error)
      throw error
    }
  }

  async updateOrderStage(orderId, newStage) {
    console.log(`🔄 Updating order ${orderId} to ${newStage} stage...`)

    try {
      // First, get the order ID from PayloadCMS
      const getResponse = await fetch(
        `${API_BASE}/orders?where[orderID][equals]=${orderId}&limit=1`,
      )
      if (!getResponse.ok) {
        throw new Error(`Failed to fetch order: ${getResponse.status}`)
      }

      const getData = await getResponse.json()
      if (!getData.docs || getData.docs.length === 0) {
        throw new Error(`Order ${orderId} not found`)
      }

      const order = getData.docs[0]

      // Update the order using PayloadCMS ID
      const response = await fetch(`${API_BASE}/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStage: newStage,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.status}`)
      }

      console.log(`✅ Updated order ${orderId} to ${newStage}`)
      return true
    } catch (error) {
      console.error('❌ Failed to update order:', error)
      throw error
    }
  }

  async testNavigationFlow(orderId, fromStage, toStage) {
    console.log(`\n🧪 Testing navigation: ${fromStage} → ${toStage}`)

    try {
      // Create browser context
      const context = await this.createTestContext()
      const page = await context.newPage()

      // Navigate to initial stage
      const initialUrl = `${BASE_URL}/order/${orderId}/${fromStage}`
      console.log(`📍 Navigating to: ${initialUrl}`)

      await page.goto(initialUrl, { waitUntil: 'networkidle' })

      // Wait for page to load and SyncManager to connect
      await page.waitForTimeout(2000)

      // Set up navigation listener
      let navigationOccurred = false
      const expectedUrl = `${BASE_URL}/order/${orderId}/${toStage}`

      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame() && frame.url() === expectedUrl) {
          navigationOccurred = true
          console.log(`✅ Navigation detected: ${frame.url()}`)
        }
      })

      // Trigger stage change via API
      await this.updateOrderStage(orderId, toStage)

      // Wait for automatic navigation
      const startTime = Date.now()
      while (!navigationOccurred && Date.now() - startTime < TEST_CONFIG.navigationTimeout) {
        await page.waitForTimeout(100)
      }

      if (navigationOccurred) {
        console.log(`✅ Test passed: ${fromStage} → ${toStage}`)
        this.results.passed++
      } else {
        const error = `Navigation timeout: ${fromStage} → ${toStage}`
        console.log(`❌ Test failed: ${error}`)
        this.results.failed++
        this.results.errors.push(error)
      }

      await context.close()
    } catch (error) {
      console.error(`❌ Test error: ${fromStage} → ${toStage}:`, error)
      this.results.failed++
      this.results.errors.push(`${fromStage} → ${toStage}: ${error.message}`)
    }
  }

  async testSSEConnection(orderId) {
    console.log(`\n🔌 Testing SSE connection for order ${orderId}`)

    try {
      const context = await this.createTestContext()
      const page = await context.newPage()

      // Monitor network requests
      const sseRequests = []
      page.on('request', (request) => {
        if (request.url().includes(SSE_PATH)) {
          sseRequests.push(request)
          console.log(`📡 SSE connection request: ${request.url()}`)
        }
      })

      // Navigate to order page
      await page.goto(`${BASE_URL}/order/${orderId}/initiated`)

      // Wait for SSE connection
      await page.waitForTimeout(3000)

      if (sseRequests.length > 0) {
        console.log(`✅ SSE connection established`)
        this.results.passed++
      } else {
        console.log(`❌ SSE connection failed`)
        this.results.failed++
        this.results.errors.push('SSE connection not established')
      }

      await context.close()
    } catch (error) {
      console.error('❌ SSE connection test error:', error)
      this.results.failed++
      this.results.errors.push(`SSE connection: ${error.message}`)
    }
  }

  async testMultiClientSync(orderId) {
    console.log(`\n👥 Testing multi-client synchronization for order ${orderId}`)

    try {
      // Create two browser contexts (simulating different users)
      const context1 = await this.createTestContext()
      const context2 = await this.createTestContext()

      const page1 = await context1.newPage()
      const page2 = await context2.newPage()

      // Navigate both to the same order
      await Promise.all([
        page1.goto(`${BASE_URL}/order/${orderId}/initiated`),
        page2.goto(`${BASE_URL}/order/${orderId}/initiated`),
      ])

      // Wait for connections
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)

      // Set up navigation listeners
      let page1Navigated = false
      let page2Navigated = false

      const expectedUrl = `${BASE_URL}/order/${orderId}/open`

      page1.on('framenavigated', (frame) => {
        if (frame === page1.mainFrame() && frame.url() === expectedUrl) {
          page1Navigated = true
        }
      })

      page2.on('framenavigated', (frame) => {
        if (frame === page2.mainFrame() && frame.url() === expectedUrl) {
          page2Navigated = true
        }
      })

      // Trigger stage change
      await this.updateOrderStage(orderId, 'open')

      // Wait for navigation on both clients
      const startTime = Date.now()
      while (
        (!page1Navigated || !page2Navigated) &&
        Date.now() - startTime < TEST_CONFIG.navigationTimeout
      ) {
        await page1.waitForTimeout(100)
      }

      if (page1Navigated && page2Navigated) {
        console.log(`✅ Multi-client sync successful`)
        this.results.passed++
      } else {
        console.log(`❌ Multi-client sync failed`)
        this.results.failed++
        this.results.errors.push('Multi-client synchronization failed')
      }

      await context1.close()
      await context2.close()
    } catch (error) {
      console.error('❌ Multi-client sync test error:', error)
      this.results.failed++
      this.results.errors.push(`Multi-client sync: ${error.message}`)
    }
  }

  async runAllTests() {
    console.log('🎯 Starting automatic navigation tests...\n')

    try {
      await this.setup()

      // Create test orders
      const initiatedOrder = await this.createTestOrder('initiated')
      const openOrder = await this.createTestOrder('open')
      const billedOrder = await this.createTestOrder('billed')

      // Test individual navigation flows
      await this.testNavigationFlow(initiatedOrder.orderID, 'initiated', 'open')
      await this.testNavigationFlow(openOrder.orderID, 'open', 'billed')
      await this.testNavigationFlow(billedOrder.orderID, 'billed', 'paid')

      // Test SSE connection
      await this.testSSEConnection(initiatedOrder.orderID)

      // Test multi-client synchronization
      await this.testMultiClientSync(initiatedOrder.orderID)

      // Print results
      this.printResults()
    } catch (error) {
      console.error('❌ Test suite error:', error)
    } finally {
      await this.cleanup()
    }
  }

  printResults() {
    console.log('\n📊 Test Results:')
    console.log('================')
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(
      `📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`,
    )

    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    console.log('\n🏁 Test suite complete')
  }
}

// Run tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AutoNavigationTester()
  tester.runAllTests().catch(console.error)
}

export default AutoNavigationTester
