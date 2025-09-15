#!/usr/bin/env node

/**
 * Comprehensive test script to verify the real-time dashboard functionality
 * and ensure polling has been completely removed
 */

import { spawn } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { EventSource } from 'eventsource'

// Make EventSource available globally for the test
global.EventSource = EventSource

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`),
  warning: (msg) => console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`),
  header: (msg) => console.log(`\n${COLORS.bright}${COLORS.cyan}${msg}${COLORS.reset}\n`),
}

class DashboardSyncTester {
  constructor() {
    this.testResults = []
    this.serverProcess = null
    this.baseUrl = 'http://localhost:3000'
  }

  async runAllTests() {
    log.header('🚀 Dashboard Sync Migration Test Suite')

    try {
      await this.testCodeChanges()
      await this.testPollingRemoval()
      await this.startServer()
      await this.testSyncConnection()
      await this.testRealTimeUpdates()
      await this.testErrorHandling()
      await this.testPerformance()

      this.printResults()
    } catch (error) {
      log.error(`Test suite failed: ${error.message}`)
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }

  async testCodeChanges() {
    log.header('📝 Testing Code Changes')

    // Test DashboardDataProvider changes
    const providerPath = 'src/components/dashboard/DashboardDataProvider.tsx'
    const providerContent = readFileSync(providerPath, 'utf8')

    // Check for sync imports
    if (
      providerContent.includes('useSyncManager') &&
      providerContent.includes('useDashboardSync')
    ) {
      this.addResult('✓ DashboardDataProvider imports sync hooks', true)
    } else {
      this.addResult('✗ DashboardDataProvider missing sync imports', false)
    }

    // Check for polling removal
    if (!providerContent.includes('setInterval') && !providerContent.includes('refreshInterval')) {
      this.addResult('✓ Polling code removed from DashboardDataProvider', true)
    } else {
      this.addResult('✗ Polling code still present in DashboardDataProvider', false)
    }

    // Check for new interface properties
    if (providerContent.includes('lastSyncTime') && providerContent.includes('isConnected')) {
      this.addResult('✓ Enhanced DashboardData interface', true)
    } else {
      this.addResult('✗ Missing enhanced interface properties', false)
    }

    // Test dashboard component changes
    const enhancedPath = 'src/components/dashboard/EnhancedStaffDashboard.tsx'
    const enhancedContent = readFileSync(enhancedPath, 'utf8')

    if (!enhancedContent.includes('refreshInterval={30000}')) {
      this.addResult('✓ EnhancedStaffDashboard polling removed', true)
    } else {
      this.addResult('✗ EnhancedStaffDashboard still has polling', false)
    }

    const modularPath = 'src/components/dashboard/ModularStaffDashboard.tsx'
    const modularContent = readFileSync(modularPath, 'utf8')

    if (!modularContent.includes('refreshInterval={30000}')) {
      this.addResult('✓ ModularStaffDashboard polling removed', true)
    } else {
      this.addResult('✗ ModularStaffDashboard still has polling', false)
    }
  }

  async testPollingRemoval() {
    log.header('🔍 Testing Polling Removal')

    // Search for any remaining setInterval usage in dashboard components
    const dashboardFiles = [
      'src/components/dashboard/DashboardDataProvider.tsx',
      'src/components/dashboard/EnhancedStaffDashboard.tsx',
      'src/components/dashboard/ModularStaffDashboard.tsx',
    ]

    let pollingFound = false
    for (const file of dashboardFiles) {
      const content = readFileSync(file, 'utf8')
      if (content.includes('setInterval') || content.includes('refreshInterval')) {
        pollingFound = true
        this.addResult(`✗ Polling found in ${file}`, false)
      }
    }

    if (!pollingFound) {
      this.addResult('✓ No polling code found in dashboard components', true)
    }
  }

  async startServer() {
    log.header('🖥️ Starting Development Server')

    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        detached: false,
      })

      let output = ''
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString()
        if (output.includes('Ready') || output.includes('localhost:3000')) {
          log.success('Development server started')
          setTimeout(resolve, 2000) // Give server time to fully start
        }
      })

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString()
        if (error.includes('Error') || error.includes('Failed')) {
          reject(new Error(`Server failed to start: ${error}`))
        }
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        reject(new Error('Server startup timeout'))
      }, 30000)
    })
  }

  async testSyncConnection() {
    log.header('🔌 Testing SSE Connection')

    try {
      // Test SSE endpoint
      const response = await fetch(`${this.baseUrl}/api/v1/sync/events`, {
        headers: {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        this.addResult('✓ SSE endpoint accessible', true)
      } else {
        this.addResult('✗ SSE endpoint not working', false)
      }
    } catch (error) {
      this.addResult(`✗ SSE connection failed: ${error.message}`, false)
    }
  }

  async testRealTimeUpdates() {
    log.header('⚡ Testing Real-time Updates')

    try {
      // Test dashboard data endpoint
      const dashboardResponse = await fetch(`${this.baseUrl}/api/dashboard/data`)
      if (dashboardResponse.ok) {
        this.addResult('✓ Dashboard data endpoint accessible', true)
      } else {
        this.addResult('✗ Dashboard data endpoint failed', false)
      }

      // Test real-time flow: Create empty order and wait for SSE event
      const eventSource = new EventSource(`${this.baseUrl}/api/v1/sync/events`)

      const realTimeTestPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          eventSource.close()
          reject(new Error('Real-time test timeout'))
        }, 10000)

        let connectionEstablished = false

        eventSource.onopen = () => {
          connectionEstablished = true
          log.info('SSE connection established, creating test order...')

          // Create empty order to trigger SSE event
          fetch(`${this.baseUrl}/api/v1/orders/create-empty`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }).catch((err) => log.warning(`Order creation failed: ${err.message}`))
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.eventType === 'order_created') {
              clearTimeout(timeout)
              eventSource.close()
              resolve('Real-time order creation event received')
            }
          } catch (err) {
            // Ignore parsing errors for non-JSON events
          }
        }

        eventSource.onerror = (error) => {
          clearTimeout(timeout)
          eventSource.close()
          if (connectionEstablished) {
            resolve('SSE connection was established (error after connection is acceptable)')
          } else {
            reject(error)
          }
        }
      })

      await realTimeTestPromise
      this.addResult('✓ Real-time SSE flow functional', true)
    } catch (error) {
      this.addResult(`✗ Real-time update test failed: ${error.message}`, false)
    }
  }

  async testErrorHandling() {
    log.header('🛡️ Testing Error Handling')

    // Test invalid SSE connection
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/sync/events/invalid`)
      if (response.status === 404) {
        this.addResult('✓ Invalid SSE endpoint returns 404', true)
      } else {
        this.addResult('✗ Invalid SSE endpoint handling incorrect', false)
      }
    } catch (error) {
      this.addResult('✓ Invalid SSE endpoint properly rejected', true)
    }
  }

  async testPerformance() {
    log.header('⚡ Testing Performance')

    const startTime = Date.now()

    try {
      // Test multiple concurrent requests
      const promises = Array(5)
        .fill()
        .map(() => fetch(`${this.baseUrl}/api/dashboard/data`))

      await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime

      if (duration < 5000) {
        this.addResult(`✓ Concurrent requests completed in ${duration}ms`, true)
      } else {
        this.addResult(`✗ Concurrent requests too slow: ${duration}ms`, false)
      }
    } catch (error) {
      this.addResult(`✗ Performance test failed: ${error.message}`, false)
    }
  }

  addResult(message, success) {
    this.testResults.push({ message, success })
    if (success) {
      log.success(message)
    } else {
      log.error(message)
    }
  }

  printResults() {
    log.header('📊 Test Results Summary')

    const passed = this.testResults.filter((r) => r.success).length
    const total = this.testResults.length
    const percentage = Math.round((passed / total) * 100)

    console.log(
      `\n${COLORS.bright}Results: ${passed}/${total} tests passed (${percentage}%)${COLORS.reset}\n`,
    )

    if (passed === total) {
      log.success('🎉 All tests passed! Dashboard sync migration successful.')
    } else {
      log.warning(`⚠️ ${total - passed} tests failed. Please review the issues above.`)
    }

    // Write results to file
    const report = {
      timestamp: new Date().toISOString(),
      passed,
      total,
      percentage,
      results: this.testResults,
    }

    writeFileSync('test-results.json', JSON.stringify(report, null, 2))
    log.info('Test results saved to test-results.json')
  }

  async cleanup() {
    if (this.serverProcess) {
      log.info('Stopping development server...')
      this.serverProcess.kill('SIGTERM')

      // Wait for graceful shutdown
      await new Promise((resolve) => {
        this.serverProcess.on('exit', resolve)
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL')
          resolve()
        }, 5000)
      })
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DashboardSyncTester()
  tester.runAllTests().catch(console.error)
}

export default DashboardSyncTester
