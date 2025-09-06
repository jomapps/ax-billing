import { chromium } from 'playwright'
import fs from 'fs'

async function auditLayout() {
  console.log('🔍 Starting layout audit...')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  })
  const page = await context.newPage()

  try {
    // Navigate to the main page
    console.log('📱 Navigating to localhost:3000...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Take screenshot of main page
    await page.screenshot({
      path: 'audit-screenshots/main-page.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: audit-screenshots/main-page.png')

    // Check for card elements
    const cards = await page.locator('[class*="card"], .card, [data-testid*="card"]').all()
    console.log(`🃏 Found ${cards.length} card elements`)

    // Check grid/flex layouts
    const gridContainers = await page.locator('[class*="grid"], .grid').all()
    const flexContainers = await page.locator('[class*="flex"], .flex').all()

    console.log(`📐 Found ${gridContainers.length} grid containers`)
    console.log(`📐 Found ${flexContainers.length} flex containers`)

    // Analyze card layouts
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      const card = cards[i]
      const boundingBox = await card.boundingBox()
      const styles = await card.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          display: computed.display,
          flexDirection: computed.flexDirection,
          gridTemplateColumns: computed.gridTemplateColumns,
          width: computed.width,
          height: computed.height,
          className: el.className,
        }
      })

      console.log(`🃏 Card ${i + 1}:`, {
        position: boundingBox,
        styles: styles,
      })
    }

    // Check staff dashboard if it exists
    try {
      console.log('🏢 Checking staff dashboard...')
      await page.goto('http://localhost:3000/staff-dashboard', { waitUntil: 'networkidle' })
      await page.screenshot({
        path: 'audit-screenshots/staff-dashboard.png',
        fullPage: true,
      })
      console.log('📸 Screenshot saved: audit-screenshots/staff-dashboard.png')

      // Check dashboard cards
      const dashboardCards = await page.locator('[class*="card"], .card').all()
      console.log(`🃏 Found ${dashboardCards.length} cards on staff dashboard`)
    } catch (error) {
      console.log('⚠️ Staff dashboard not accessible:', error.message)
    }

    // Check responsive behavior
    console.log('📱 Testing responsive layouts...')

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: 'audit-screenshots/mobile-view.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: audit-screenshots/mobile-view.png')

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: 'audit-screenshots/tablet-view.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: audit-screenshots/tablet-view.png')

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.screenshot({
      path: 'audit-screenshots/desktop-view.png',
      fullPage: true,
    })
    console.log('📸 Screenshot saved: audit-screenshots/desktop-view.png')

    console.log('✅ Layout audit completed!')
    console.log('📁 Check audit-screenshots/ folder for visual results')
  } catch (error) {
    console.error('❌ Error during audit:', error)
  } finally {
    await browser.close()
  }
}

// Create screenshots directory
if (!fs.existsSync('audit-screenshots')) {
  fs.mkdirSync('audit-screenshots')
}

auditLayout().catch(console.error)
