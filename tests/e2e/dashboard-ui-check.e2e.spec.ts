import { test, expect } from '@playwright/test'

test.describe('Dashboard UI Check', () => {
  test('should check dashboard UI layout and styling', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    console.log('Dashboard page title:', await page.title())
    console.log('Dashboard page URL:', page.url())
    
    // Take a full page screenshot for visual inspection
    await page.screenshot({ path: 'dashboard-ui-debug.png', fullPage: true })
    
    // Check for JavaScript errors
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    // Check if CSS is loading properly
    const stylesheets = await page.locator('link[rel="stylesheet"]').count()
    console.log('Number of stylesheets loaded:', stylesheets)
    
    // Check for Tailwind CSS classes
    const bodyClasses = await page.locator('body').getAttribute('class')
    console.log('Body classes:', bodyClasses)
    
    // Check if main content is visible
    const mainContent = page.locator('main, [role="main"], .main')
    const hasMainContent = await mainContent.count() > 0
    console.log('Has main content container:', hasMainContent)
    
    // Check for dashboard header
    const headerText = await page.locator('h1, h2, h3').first().textContent()
    console.log('Main header text:', headerText)
    
    // Check for stats cards
    const statsCards = await page.locator('[class*="card"], .card, [data-testid*="card"]').count()
    console.log('Number of stats cards found:', statsCards)
    
    // Check for buttons
    const buttons = await page.locator('button').count()
    console.log('Number of buttons found:', buttons)
    
    // Check for loading states
    const loadingElements = await page.locator('[class*="loading"], .loading, [class*="spinner"], .spinner').count()
    console.log('Loading elements found:', loadingElements)
    
    // Check for error messages
    const errorElements = await page.locator('[class*="error"], .error, [role="alert"]').count()
    console.log('Error elements found:', errorElements)
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('[class*="error"], .error, [role="alert"]').allTextContents()
      console.log('Error messages:', errorTexts)
    }
    
    // Check computed styles of key elements
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
      }
    })
    console.log('Body computed styles:', bodyStyles)
    
    // Check if Tailwind CSS is working by looking for specific classes
    const tailwindElements = await page.locator('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]').count()
    console.log('Elements with Tailwind classes:', tailwindElements)
    
    // Check for specific dashboard components
    const dashboardTitle = await page.locator(':has-text("AX BILLING")').count()
    console.log('Dashboard title present:', dashboardTitle > 0)
    
    const newOrderButton = await page.locator('button:has-text("New Order")').count()
    console.log('New Order button present:', newOrderButton > 0)
    
    // Check for stats display
    const statsText = await page.locator('body').textContent()
    const hasStatsNumbers = /\d+/.test(statsText || '')
    console.log('Has numeric stats:', hasStatsNumbers)
    
    // Check viewport and responsive design
    const viewport = page.viewportSize()
    console.log('Viewport size:', viewport)
    
    // Check for mobile responsiveness indicators
    const responsiveElements = await page.locator('[class*="sm:"], [class*="md:"], [class*="lg:"]').count()
    console.log('Responsive design elements:', responsiveElements)
    
    // Log any JavaScript errors found
    if (errors.length > 0) {
      console.log('JavaScript errors detected:', errors)
    }
    
    // Check if the page content is actually visible (not just white screen)
    const bodyText = await page.locator('body').textContent()
    const hasVisibleContent = (bodyText?.trim().length || 0) > 100
    console.log('Has visible content:', hasVisibleContent)
    console.log('Body text length:', bodyText?.length || 0)
    
    if (bodyText && bodyText.length > 0) {
      console.log('Body text preview (first 300 chars):', bodyText.substring(0, 300))
    }
    
    // Basic expectation - page should have some content
    expect(bodyText?.length || 0).toBeGreaterThan(0)
  })

  test('should check specific UI components', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Check for specific components that should be present
    const components = {
      header: await page.locator('header, [role="banner"]').count(),
      navigation: await page.locator('nav, [role="navigation"]').count(),
      main: await page.locator('main, [role="main"]').count(),
      footer: await page.locator('footer, [role="contentinfo"]').count(),
    }
    
    console.log('Component presence:', components)
    
    // Check for specific dashboard elements
    const dashboardElements = {
      title: await page.locator(':has-text("AX BILLING")').count(),
      subtitle: await page.locator(':has-text("Staff Dashboard")').count(),
      newOrderBtn: await page.locator('button:has-text("New Order")').count(),
      statsCards: await page.locator('[class*="card"]').count(),
    }
    
    console.log('Dashboard elements:', dashboardElements)
    
    // Check for layout issues
    const layoutCheck = await page.evaluate(() => {
      const elements = document.querySelectorAll('*')
      let hiddenElements = 0
      let overflowElements = 0
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el)
        if (styles.display === 'none' || styles.visibility === 'hidden') {
          hiddenElements++
        }
        if (styles.overflow === 'hidden' && el.scrollWidth > el.clientWidth) {
          overflowElements++
        }
      })
      
      return { hiddenElements, overflowElements, totalElements: elements.length }
    })
    
    console.log('Layout analysis:', layoutCheck)
  })
})
