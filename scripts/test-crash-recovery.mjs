#!/usr/bin/env node

/**
 * E2E Crash Recovery Test Script
 * Tests the sync system's ability to recover from various crash scenarios
 * using Playwright for browser automation
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
  retryAttempts: 3,
  screenshotDir: join(__dirname, '../test-results/crash-recovery'),
}

// Test scenarios
const CRASH_SCENARIOS = [
  {
    name: 'Tab Close and Reopen',
    description: 'Close tab and reopen to test localStorage persistence',
    action: async (page) => {
      await page.close()
      return 'tab_closed'
    }
  },
  {
    name: 'Browser Refresh',
    description: 'Refresh page to test state restoration',
    action: async (page) => {
      await page.reload()
      return 'page_refreshed'
    }
  },
  {
    name: 'Network Offline/Online',
    description: 'Simulate network interruption',
    action: async (page) => {
      await page.context().setOffline(true)
      await page.waitForTimeout(5000)
      await page.context().setOffline(false)
      return 'network_restored'
    }
  }
]

class CrashRecoveryTester {
  constructor() {
    this.browser = null
    this.results = []
  }

  async setup() {
    console.log('🚀 Starting Crash Recovery Tests...')
    this.browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      devtools: true 
    })
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close()
    }
    console.log('✅ Crash Recovery Tests Complete')
  }

  async createTestPage() {
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    })
    
    const page = await context.newPage()
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser Error: ${msg.text()}`)
      }
    })

    return page
  }

  async navigateToApp(page) {
    console.log(`📱 Navigating to ${CONFIG.baseURL}`)
    await page.goto(CONFIG.baseURL)
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="sync-status"]', { 
      timeout: CONFIG.timeout 
    })
  }

  async establishConnection(page) {
    console.log('🔌 Establishing sync connection...')
    
    // Wait for sync manager to connect
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="sync-status"]')
      return status && status.textContent.includes('connected')
    }, { timeout: CONFIG.timeout })

    console.log('✅ Connection established')
  }

  async triggerEvents(page, orderID = 'TEST-CRASH-001') {
    console.log(`📡 Triggering test events for order ${orderID}`)
    
    // Simulate order creation
    await page.evaluate((id) => {
      window.dispatchEvent(new CustomEvent('test-order-created', {
        detail: { orderID: id, stage: 'initiated' }
      }))
    }, orderID)

    // Wait for events to be processed
    await page.waitForTimeout(1000)

    // Verify events were received
    const eventCount = await page.evaluate(() => {
      const counter = document.querySelector('[data-testid="event-count"]')
      return counter ? parseInt(counter.textContent) : 0
    })

    console.log(`📊 Events received: ${eventCount}`)
    return eventCount
  }

  async captureState(page, label) {
    const state = await page.evaluate(() => {
      return {
        connectionState: document.querySelector('[data-testid="connection-state"]')?.textContent,
        eventCount: document.querySelector('[data-testid="event-count"]')?.textContent,
        isConnected: document.querySelector('[data-testid="is-connected"]')?.textContent,
        localStorage: localStorage.getItem('ax-billing-sync-state'),
        timestamp: new Date().toISOString()
      }
    })

    console.log(`📸 State captured (${label}):`, {
      connectionState: state.connectionState,
      eventCount: state.eventCount,
      isConnected: state.isConnected,
      hasPersistedData: !!state.localStorage
    })

    return state
  }

  async takeScreenshot(page, filename) {
    const screenshotPath = join(CONFIG.screenshotDir, `${filename}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📷 Screenshot saved: ${screenshotPath}`)
  }

  async runScenario(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name}`)
    console.log(`📝 ${scenario.description}`)

    try {
      const page = await this.createTestPage()
      
      // Step 1: Navigate and establish connection
      await this.navigateToApp(page)
      await this.establishConnection(page)
      
      // Step 2: Trigger events and capture initial state
      const initialEventCount = await this.triggerEvents(page)
      const preState = await this.captureState(page, 'pre-crash')
      await this.takeScreenshot(page, `${scenario.name.toLowerCase().replace(/\s+/g, '-')}-pre`)

      // Step 3: Execute crash scenario
      console.log(`💥 Executing crash scenario...`)
      const crashResult = await scenario.action(page)
      
      // Step 4: Handle tab close scenario
      if (crashResult === 'tab_closed') {
        // Create new page and navigate again
        const newPage = await this.createTestPage()
        await this.navigateToApp(newPage)
        
        // Wait for restoration
        await newPage.waitForTimeout(2000)
        
        const postState = await this.captureState(newPage, 'post-recovery')
        await this.takeScreenshot(newPage, `${scenario.name.toLowerCase().replace(/\s+/g, '-')}-post`)
        
        await newPage.close()
        
        return this.validateRecovery(preState, postState, scenario)
      } else {
        // For refresh and network scenarios, use same page
        await page.waitForTimeout(3000) // Wait for recovery
        
        const postState = await this.captureState(page, 'post-recovery')
        await this.takeScreenshot(page, `${scenario.name.toLowerCase().replace(/\s+/g, '-')}-post`)
        
        await page.close()
        
        return this.validateRecovery(preState, postState, scenario)
      }

    } catch (error) {
      console.error(`❌ Scenario failed: ${error.message}`)
      return {
        scenario: scenario.name,
        success: false,
        error: error.message
      }
    }
  }

  validateRecovery(preState, postState, scenario) {
    const result = {
      scenario: scenario.name,
      success: false,
      details: {}
    }

    // Check if connection was restored
    const connectionRestored = postState.connectionState === 'connected' || 
                              postState.connectionState === 'polling_fallback'
    
    // Check if events were persisted (for localStorage scenarios)
    const eventsRestored = scenario.name.includes('Close') ? 
      parseInt(postState.eventCount) >= parseInt(preState.eventCount) :
      parseInt(postState.eventCount) > 0

    // Check if localStorage persistence worked
    const persistenceWorked = !!postState.localStorage

    result.details = {
      connectionRestored,
      eventsRestored,
      persistenceWorked,
      preEventCount: preState.eventCount,
      postEventCount: postState.eventCount,
      preConnectionState: preState.connectionState,
      postConnectionState: postState.connectionState
    }

    result.success = connectionRestored && eventsRestored && persistenceWorked

    if (result.success) {
      console.log(`✅ ${scenario.name} recovery successful`)
    } else {
      console.log(`❌ ${scenario.name} recovery failed:`, result.details)
    }

    return result
  }

  async run() {
    await this.setup()

    try {
      for (const scenario of CRASH_SCENARIOS) {
        const result = await this.runScenario(scenario)
        this.results.push(result)
      }

      // Print summary
      console.log('\n📊 CRASH RECOVERY TEST SUMMARY')
      console.log('================================')
      
      const passed = this.results.filter(r => r.success).length
      const total = this.results.length
      
      this.results.forEach(result => {
        const status = result.success ? '✅' : '❌'
        console.log(`${status} ${result.scenario}`)
        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`)
        }
      })
      
      console.log(`\nResults: ${passed}/${total} scenarios passed`)
      
      if (passed === total) {
        console.log('🎉 All crash recovery tests passed!')
        process.exit(0)
      } else {
        console.log('⚠️  Some crash recovery tests failed')
        process.exit(1)
      }

    } finally {
      await this.teardown()
    }
  }
}

// Run the tests
const tester = new CrashRecoveryTester()
tester.run().catch(error => {
  console.error('💥 Test runner crashed:', error)
  process.exit(1)
})
