import { test, expect } from '@playwright/test'

test.describe('Dashboard Detailed Check', () => {
  test('should check stats cards and error states', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    // Wait a bit more for any async operations
    await page.waitForTimeout(2000)

    console.log('=== STATS CARDS ANALYSIS ===')

    // Look for cards with different selectors
    const cardSelectors = [
      '[class*="card"]',
      '.card',
      '[data-testid*="card"]',
      '[class*="Card"]',
      'div[class*="rounded"]',
      'div[class*="bg-dark"]',
      'div[class*="border"]',
    ]

    for (const selector of cardSelectors) {
      const count = await page.locator(selector).count()
      console.log(`Cards found with selector "${selector}": ${count}`)
    }

    // Look specifically for stats content
    const statsElements = await page
      .locator(
        ':has-text("Today\'s Orders"), :has-text("Active Jobs"), :has-text("Revenue"), :has-text("Completion")',
      )
      .count()
    console.log('Stats text elements found:', statsElements)

    // Check for specific stats values
    const statsTexts = await page.locator('body').textContent()
    const todayOrdersMatch = statsTexts?.match(/Today's Orders.*?(\d+)/s)
    const activeJobsMatch = statsTexts?.match(/Active Jobs.*?(\d+)/s)
    const revenueMatch = statsTexts?.match(/Revenue.*?RM\s*([\d.]+)/s)

    console.log("Today's Orders value:", todayOrdersMatch?.[1] || 'Not found')
    console.log('Active Jobs value:', activeJobsMatch?.[1] || 'Not found')
    console.log('Revenue value:', revenueMatch?.[1] || 'Not found')

    console.log('=== ERROR STATE ANALYSIS ===')

    // Check for error states more specifically
    const errorSelectors = [
      '[class*="error"]',
      '.error',
      '[role="alert"]',
      '[class*="text-red"]',
      ':has-text("error")',
      ':has-text("Error")',
      ':has-text("failed")',
      ':has-text("Failed")',
    ]

    for (const selector of errorSelectors) {
      const elements = await page.locator(selector).all()
      if (elements.length > 0) {
        console.log(`Error elements with selector "${selector}": ${elements.length}`)
        for (let i = 0; i < elements.length; i++) {
          const text = await elements[i].textContent()
          const isVisible = await elements[i].isVisible()
          console.log(`  Error ${i + 1}: "${text}" (visible: ${isVisible})`)
        }
      }
    }

    // Check for retry button (indicates error state)
    const retryButton = await page.locator('button:has-text("Retry")').count()
    console.log('Retry button present:', retryButton > 0)

    if (retryButton > 0) {
      const retryButtonText = await page.locator('button:has-text("Retry")').textContent()
      console.log('Retry button text:', retryButtonText)
    }

    console.log('=== LOADING STATE ANALYSIS ===')

    // Check for loading states
    const loadingSelectors = [
      '[class*="loading"]',
      '.loading',
      '[class*="spinner"]',
      '.spinner',
      ':has-text("Loading")',
      ':has-text("loading")',
    ]

    for (const selector of loadingSelectors) {
      const count = await page.locator(selector).count()
      if (count > 0) {
        console.log(`Loading elements with selector "${selector}": ${count}`)
      }
    }

    console.log('=== NETWORK REQUESTS ===')

    // Check for API calls
    const responses: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        responses.push(`${response.status()} ${response.url()}`)
      }
    })

    // Trigger a refresh to see API calls
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    console.log('API responses:', responses)

    console.log('=== CSS AND STYLING ===')

    // Check if Tailwind dark classes are working
    const darkElements = await page.locator('[class*="dark"], [class*="bg-dark"]').count()
    console.log('Dark theme elements:', darkElements)

    // Check for primary color classes
    const primaryElements = await page.locator('[class*="primary"]').count()
    console.log('Primary color elements:', primaryElements)

    // Check for gaming-style classes
    const gamingElements = await page.locator('[class*="gaming"], [class*="neon"]').count()
    console.log('Gaming style elements:', gamingElements)

    // Take a screenshot of just the stats section
    const statsSection = page.locator('div').filter({ hasText: "Today's Orders" }).first()
    if ((await statsSection.count()) > 0) {
      await statsSection.screenshot({ path: 'stats-section-debug.png' })
      console.log('Stats section screenshot saved')
    }

    // Check computed styles of stats cards
    const cardStyles = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="rounded"], [class*="border"]')
      const styles: any[] = []

      cards.forEach((card, index) => {
        if (index < 5) {
          // Check first 5 cards
          const computedStyle = window.getComputedStyle(card)
          styles.push({
            index,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            backgroundColor: computedStyle.backgroundColor,
            borderColor: computedStyle.borderColor,
            className: card.className,
          })
        }
      })

      return styles
    })

    console.log('Card styles:', JSON.stringify(cardStyles, null, 2))
  })
})
