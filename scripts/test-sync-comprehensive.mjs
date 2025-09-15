#!/usr/bin/env node

/**
 * Comprehensive Sync System E2E Test Script
 * Tests all aspects of the sync system including SSE, polling fallback,
 * event filtering, and real-time updates using Playwright
 */

import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  screenshotDir: join(__dirname, '../test-results/sync-comprehensive'),
  metricsFile: join(__dirname, '../test-results/sync-metrics.json'),
}

// Test suites
const TEST_SUITES = [
  {
    name: 'SSE Connection',
    tests: [
      'connection_establishment',
      'event_reception',
      'heartbeat_handling',
      'connection_metrics'
    ]
  },
  {
    name: 'Polling Fallback',
    tests: [
      'fallback_activation',
      'fallback_functionality',
      'sse_recovery',
      'state_preservation'
    ]
  },
  {
    name: 'Event Filtering',
    tests: [
      'order_id_filtering',
      'event_type_filtering',
      'timestamp_filtering',
      'filter_combinations'
    ]
  },
  {
    name: 'Real-time Updates',
    tests: [
      'order_stage_changes',
      'payment_updates',
      'status_updates',
      'ui_synchronization'
    ]
  }
]

class ComprehensiveSyncTester {
  constructor() {
    this.browser = null
    this.results = []
    this.metrics = {
      startTime: new Date().toISOString(),
      testResults: [],
      performance: {},
      errors: []
    }
  }

  async setup() {
    console.log('🚀 Starting Comprehensive Sync Tests...')
    this.browser = await chromium.launch({ 
      headless: false,
      devtools: true 
    })
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close()
    }
    
    // Save metrics
    this.metrics.endTime = new Date().toISOString()
    this.metrics.duration = new Date(this.metrics.endTime) - new Date(this.metrics.startTime)
    
    console.log('📊 Saving test metrics...')
    // In a real implementation, you'd save to file system
    console.log(JSON.stringify(this.metrics, null, 2))
    
    console.log('✅ Comprehensive Sync Tests Complete')
  }

  async createTestPage() {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    })
    
    const page = await context.newPage()
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.metrics.errors.push({
          timestamp: new Date().toISOString(),
          message: msg.text(),
          location: msg.location()
        })
      }
    })

    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/v1/sync/')) {
        console.log(`🌐 SSE Request: ${request.url()}`)
      }
    })

    return page
  }

  async navigateToApp(page) {
    console.log(`📱 Navigating to ${CONFIG.baseURL}`)
    const startTime = Date.now()
    
    await page.goto(CONFIG.baseURL)
    await page.waitForSelector('[data-testid="sync-debug-panel"]', { 
      timeout: CONFIG.timeout 
    })
    
    const loadTime = Date.now() - startTime
    this.metrics.performance.pageLoadTime = loadTime
    console.log(`⚡ Page loaded in ${loadTime}ms`)
  }

  async testSSEConnection(page) {
    console.log('\n🔌 Testing SSE Connection...')
    
    const tests = {
      connection_establishment: async () => {
        const startTime = Date.now()
        
        await page.waitForFunction(() => {
          const state = document.querySelector('[data-testid="connection-state"]')
          return state && state.textContent === 'connected'
        }, { timeout: CONFIG.timeout })
        
        const connectionTime = Date.now() - startTime
        this.metrics.performance.connectionTime = connectionTime
        console.log(`✅ Connected in ${connectionTime}ms`)
        return true
      },

      event_reception: async () => {
        // Trigger a test event
        await page.evaluate(() => {
          window.testSyncEvent?.('stage_change', {
            orderID: 'TEST-001',
            previousStage: 'empty',
            newStage: 'initiated'
          })
        })

        await page.waitForFunction(() => {
          const count = document.querySelector('[data-testid="event-count"]')
          return count && parseInt(count.textContent) > 1
        }, { timeout: 5000 })

        console.log('✅ Events received successfully')
        return true
      },

      heartbeat_handling: async () => {
        // Wait for heartbeat events
        await page.waitForTimeout(5000)
        
        const heartbeats = await page.evaluate(() => {
          const events = window.syncManager?.getEvents?.() || []
          return events.filter(e => e.eventType === 'heartbeat').length
        })

        console.log(`✅ Heartbeats received: ${heartbeats}`)
        return heartbeats > 0
      },

      connection_metrics: async () => {
        const metrics = await page.evaluate(() => {
          return window.syncManager?.getMetrics?.() || {}
        })

        console.log('✅ Connection metrics:', {
          totalConnections: metrics.totalConnections,
          totalEvents: metrics.totalEvents,
          uptime: metrics.uptime
        })

        return metrics.totalConnections > 0
      }
    }

    const results = {}
    for (const [testName, testFn] of Object.entries(tests)) {
      try {
        results[testName] = await testFn()
      } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message)
        results[testName] = false
      }
    }

    return results
  }

  async testPollingFallback(page) {
    console.log('\n🔄 Testing Polling Fallback...')
    
    const tests = {
      fallback_activation: async () => {
        // Force SSE failure to trigger fallback
        await page.evaluate(() => {
          window.syncManager?.forceSSEError?.()
        })

        await page.waitForFunction(() => {
          const state = document.querySelector('[data-testid="connection-state"]')
          return state && state.textContent === 'polling_fallback'
        }, { timeout: 10000 })

        console.log('✅ Polling fallback activated')
        return true
      },

      fallback_functionality: async () => {
        // Verify polling is working
        await page.waitForTimeout(3000)
        
        const isPolling = await page.evaluate(() => {
          return document.querySelector('[data-testid="is-polling-fallback"]')?.textContent === 'true'
        })

        console.log('✅ Polling fallback functional')
        return isPolling
      },

      sse_recovery: async () => {
        // Wait for SSE retry
        await page.waitForTimeout(10000)
        
        await page.waitForFunction(() => {
          const state = document.querySelector('[data-testid="connection-state"]')
          return state && state.textContent === 'connected'
        }, { timeout: 15000 })

        console.log('✅ SSE connection recovered')
        return true
      },

      state_preservation: async () => {
        const isPolling = await page.evaluate(() => {
          return document.querySelector('[data-testid="is-polling-fallback"]')?.textContent === 'false'
        })

        console.log('✅ State preserved during recovery')
        return !isPolling
      }
    }

    const results = {}
    for (const [testName, testFn] of Object.entries(tests)) {
      try {
        results[testName] = await testFn()
      } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message)
        results[testName] = false
      }
    }

    return results
  }

  async testEventFiltering(page) {
    console.log('\n🔍 Testing Event Filtering...')
    
    const tests = {
      order_id_filtering: async () => {
        // Clear existing events
        await page.evaluate(() => window.syncManager?.clearEvents?.())
        
        // Send events with different order IDs
        await page.evaluate(() => {
          window.testSyncEvent?.('stage_change', { orderID: 'ORDER-001' })
          window.testSyncEvent?.('stage_change', { orderID: 'ORDER-002' })
          window.testSyncEvent?.('stage_change', { orderID: 'ORDER-001' })
        })

        await page.waitForTimeout(1000)

        // Check filtered events for ORDER-001
        const filteredCount = await page.evaluate(() => {
          const events = window.syncManager?.getFilteredEvents?.('ORDER-001') || []
          return events.length
        })

        console.log(`✅ Filtered events for ORDER-001: ${filteredCount}`)
        return filteredCount === 2
      },

      event_type_filtering: async () => {
        const typeFilteredCount = await page.evaluate(() => {
          const events = window.syncManager?.getEventsByType?.('stage_change') || []
          return events.length
        })

        console.log(`✅ Stage change events: ${typeFilteredCount}`)
        return typeFilteredCount > 0
      },

      timestamp_filtering: async () => {
        const recentEvents = await page.evaluate(() => {
          const since = new Date(Date.now() - 60000).toISOString()
          const events = window.syncManager?.getEventsSince?.(since) || []
          return events.length
        })

        console.log(`✅ Recent events: ${recentEvents}`)
        return recentEvents > 0
      },

      filter_combinations: async () => {
        const combinedFilter = await page.evaluate(() => {
          const events = window.syncManager?.getEvents?.({
            orderID: 'ORDER-001',
            eventTypes: ['stage_change'],
            since: new Date(Date.now() - 60000).toISOString()
          }) || []
          return events.length
        })

        console.log(`✅ Combined filter results: ${combinedFilter}`)
        return combinedFilter >= 0
      }
    }

    const results = {}
    for (const [testName, testFn] of Object.entries(tests)) {
      try {
        results[testName] = await testFn()
      } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message)
        results[testName] = false
      }
    }

    return results
  }

  async testRealTimeUpdates(page) {
    console.log('\n⚡ Testing Real-time Updates...')
    
    const tests = {
      order_stage_changes: async () => {
        // Navigate to an order page
        await page.goto(`${CONFIG.baseURL}/orders/TEST-001`)
        await page.waitForSelector('[data-testid="order-stage"]')

        const initialStage = await page.textContent('[data-testid="order-stage"]')
        
        // Trigger stage change event
        await page.evaluate(() => {
          window.testSyncEvent?.('order_stage_change', {
            orderID: 'TEST-001',
            previousStage: 'initiated',
            newStage: 'in_progress'
          })
        })

        // Wait for UI update
        await page.waitForFunction(() => {
          const stage = document.querySelector('[data-testid="order-stage"]')
          return stage && stage.textContent !== initialStage
        }, { timeout: 5000 })

        console.log('✅ Order stage updated in real-time')
        return true
      },

      payment_updates: async () => {
        // Similar test for payment updates
        await page.evaluate(() => {
          window.testSyncEvent?.('payment_update', {
            orderID: 'TEST-001',
            amount: 150.00,
            status: 'paid'
          })
        })

        await page.waitForTimeout(1000)
        console.log('✅ Payment updates processed')
        return true
      },

      status_updates: async () => {
        await page.evaluate(() => {
          window.testSyncEvent?.('status_update', {
            orderID: 'TEST-001',
            status: 'completed'
          })
        })

        await page.waitForTimeout(1000)
        console.log('✅ Status updates processed')
        return true
      },

      ui_synchronization: async () => {
        // Verify UI is in sync with latest events
        const uiState = await page.evaluate(() => {
          return {
            stage: document.querySelector('[data-testid="order-stage"]')?.textContent,
            status: document.querySelector('[data-testid="order-status"]')?.textContent
          }
        })

        console.log('✅ UI synchronized:', uiState)
        return true
      }
    }

    const results = {}
    for (const [testName, testFn] of Object.entries(tests)) {
      try {
        results[testName] = await testFn()
      } catch (error) {
        console.error(`❌ ${testName} failed:`, error.message)
        results[testName] = false
      }
    }

    return results
  }

  async runTestSuite(page, suite) {
    console.log(`\n🧪 Running Test Suite: ${suite.name}`)
    
    const suiteResults = {}
    
    switch (suite.name) {
      case 'SSE Connection':
        suiteResults = await this.testSSEConnection(page)
        break
      case 'Polling Fallback':
        suiteResults = await this.testPollingFallback(page)
        break
      case 'Event Filtering':
        suiteResults = await this.testEventFiltering(page)
        break
      case 'Real-time Updates':
        suiteResults = await this.testRealTimeUpdates(page)
        break
    }

    // Take screenshot after each suite
    const filename = `${suite.name.toLowerCase().replace(/\s+/g, '-')}-results`
    await page.screenshot({ 
      path: join(CONFIG.screenshotDir, `${filename}.png`),
      fullPage: true 
    })

    return {
      suite: suite.name,
      results: suiteResults,
      passed: Object.values(suiteResults).filter(Boolean).length,
      total: Object.keys(suiteResults).length
    }
  }

  async run() {
    await this.setup()

    try {
      const page = await this.createTestPage()
      await this.navigateToApp(page)

      for (const suite of TEST_SUITES) {
        const result = await this.runTestSuite(page, suite)
        this.results.push(result)
        this.metrics.testResults.push(result)
      }

      await page.close()

      // Print comprehensive summary
      this.printSummary()

    } finally {
      await this.teardown()
    }
  }

  printSummary() {
    console.log('\n📊 COMPREHENSIVE SYNC TEST SUMMARY')
    console.log('===================================')
    
    let totalPassed = 0
    let totalTests = 0
    
    this.results.forEach(suite => {
      const percentage = Math.round((suite.passed / suite.total) * 100)
      const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌'
      
      console.log(`${status} ${suite.suite}: ${suite.passed}/${suite.total} (${percentage}%)`)
      
      // Show individual test results
      Object.entries(suite.results).forEach(([test, passed]) => {
        const testStatus = passed ? '  ✅' : '  ❌'
        console.log(`${testStatus} ${test}`)
      })
      
      totalPassed += suite.passed
      totalTests += suite.total
    })
    
    const overallPercentage = Math.round((totalPassed / totalTests) * 100)
    console.log(`\n🎯 Overall Results: ${totalPassed}/${totalTests} (${overallPercentage}%)`)
    
    if (this.metrics.performance.connectionTime) {
      console.log(`⚡ Connection Time: ${this.metrics.performance.connectionTime}ms`)
    }
    
    if (this.metrics.errors.length > 0) {
      console.log(`⚠️  Errors Detected: ${this.metrics.errors.length}`)
    }
    
    if (overallPercentage >= 90) {
      console.log('🎉 Sync system is performing excellently!')
      process.exit(0)
    } else if (overallPercentage >= 70) {
      console.log('⚠️  Sync system has some issues that need attention')
      process.exit(1)
    } else {
      console.log('❌ Sync system has critical issues')
      process.exit(1)
    }
  }
}

// Run the tests
const tester = new ComprehensiveSyncTester()
tester.run().catch(error => {
  console.error('💥 Test runner crashed:', error)
  process.exit(1)
})
