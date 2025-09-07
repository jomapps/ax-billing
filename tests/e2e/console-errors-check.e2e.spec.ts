import { test, expect } from '@playwright/test'

test.describe('Console Errors Check', () => {
  test('should capture and analyze console errors on homepage', async ({ page }) => {
    // Capture console messages and errors
    const consoleMessages: string[] = []
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const networkErrors: string[] = []

    // Listen for console messages
    page.on('console', (msg) => {
      const text = msg.text()
      consoleMessages.push(`[${msg.type()}] ${text}`)
      
      if (msg.type() === 'error') {
        consoleErrors.push(text)
      }
    })

    // Listen for page errors (uncaught exceptions)
    page.on('pageerror', (error) => {
      pageErrors.push(error.message)
    })

    // Listen for network failures
    page.on('response', (response) => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`)
      }
    })

    // Navigate to the homepage
    console.log('=== NAVIGATING TO HOMEPAGE ===')
    await page.goto('http://localhost:3001/staff-dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Wait for any async operations

    console.log('=== PAGE INFORMATION ===')
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())

    // Take a screenshot for visual reference
    await page.screenshot({ path: 'homepage-console-errors.png', fullPage: true })

    console.log('=== CONSOLE MESSAGES ===')
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`)
    })

    console.log('=== CONSOLE ERRORS ===')
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`ERROR ${index + 1}: ${error}`)
      })
    } else {
      console.log('No console errors found!')
    }

    console.log('=== PAGE ERRORS ===')
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, index) => {
        console.log(`PAGE ERROR ${index + 1}: ${error}`)
      })
    } else {
      console.log('No page errors found!')
    }

    console.log('=== NETWORK ERRORS ===')
    if (networkErrors.length > 0) {
      networkErrors.forEach((error, index) => {
        console.log(`NETWORK ERROR ${index + 1}: ${error}`)
      })
    } else {
      console.log('No network errors found!')
    }

    // Check for specific error patterns
    console.log('=== ERROR ANALYSIS ===')
    const reactErrors = consoleErrors.filter(error => 
      error.includes('React') || error.includes('react')
    )
    const apiErrors = consoleErrors.filter(error => 
      error.includes('API') || error.includes('fetch') || error.includes('Failed to load')
    )
    const typeErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || error.includes('undefined')
    )

    if (reactErrors.length > 0) {
      console.log('React-related errors:', reactErrors.length)
      reactErrors.forEach(error => console.log(`  - ${error}`))
    }

    if (apiErrors.length > 0) {
      console.log('API-related errors:', apiErrors.length)
      apiErrors.forEach(error => console.log(`  - ${error}`))
    }

    if (typeErrors.length > 0) {
      console.log('Type-related errors:', typeErrors.length)
      typeErrors.forEach(error => console.log(`  - ${error}`))
    }

    // Check if critical components are loaded
    console.log('=== COMPONENT CHECK ===')
    const statsCards = await page.locator('[data-testid="stats-cards"], .stats-card, [class*="stats"]').count()
    const orderCards = await page.locator('[data-testid="order-cards"], .order-card, [class*="order"]').count()
    const quickActions = await page.locator('[data-testid="quick-actions"], .quick-action, button').count()

    console.log(`Stats cards found: ${statsCards}`)
    console.log(`Order cards found: ${orderCards}`)
    console.log(`Quick action buttons found: ${quickActions}`)

    // Summary
    console.log('=== SUMMARY ===')
    console.log(`Total console messages: ${consoleMessages.length}`)
    console.log(`Total console errors: ${consoleErrors.length}`)
    console.log(`Total page errors: ${pageErrors.length}`)
    console.log(`Total network errors: ${networkErrors.length}`)
  })
})
