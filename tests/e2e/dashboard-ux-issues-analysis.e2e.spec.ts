import { test, expect } from '@playwright/test'

test.describe('Dashboard UX Issues Analysis', () => {
  test('should identify spacing, layout, and refresh pattern issues', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    console.log('=== DASHBOARD UX ISSUES ANALYSIS ===')
    
    // Take full screenshot for visual analysis
    await page.screenshot({ path: 'dashboard-ux-issues.png', fullPage: true })
    
    // 1. BUTTON SPACING ANALYSIS
    console.log('=== 1. BUTTON SPACING ANALYSIS ===')
    
    const spacingAnalysis = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const newOrderButton = buttons.find(btn => btn.textContent?.includes('New Order'))
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      
      if (!newOrderButton || statsCards.length === 0) return null
      
      const buttonRect = newOrderButton.getBoundingClientRect()
      const firstCardRect = statsCards[0].getBoundingClientRect()
      
      return {
        buttonBottom: Math.round(buttonRect.bottom),
        firstCardTop: Math.round(firstCardRect.top),
        spacing: Math.round(firstCardRect.top - buttonRect.bottom),
        buttonPosition: { x: Math.round(buttonRect.x), y: Math.round(buttonRect.y) },
        cardPosition: { x: Math.round(firstCardRect.x), y: Math.round(firstCardRect.y) }
      }
    })
    
    if (spacingAnalysis) {
      console.log(`Button bottom: ${spacingAnalysis.buttonBottom}px`)
      console.log(`First card top: ${spacingAnalysis.firstCardTop}px`)
      console.log(`Spacing between button and cards: ${spacingAnalysis.spacing}px`)
      console.log(`Button position: (${spacingAnalysis.buttonPosition.x}, ${spacingAnalysis.buttonPosition.y})`)
      console.log(`Card position: (${spacingAnalysis.cardPosition.x}, ${spacingAnalysis.cardPosition.y})`)
      
      const hasProperSpacing = spacingAnalysis.spacing >= 48 // 3rem = 48px
      console.log(`${hasProperSpacing ? '✅' : '❌'} Proper spacing (>=48px): ${hasProperSpacing}`)
    }
    
    // 2. QUEUE/ORDERS DISPLAY ANALYSIS
    console.log('=== 2. QUEUE/ORDERS DISPLAY ANALYSIS ===')
    
    const queueAnalysis = await page.evaluate(() => {
      // Look for queue, orders, or list components
      const queueSelectors = [
        '[class*="queue"]',
        '[class*="order"]',
        '[class*="list"]',
        'table',
        '[role="table"]',
        '[class*="grid"][class*="gap"]'
      ]
      
      const queueElements: any[] = []
      
      queueSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect()
          const styles = window.getComputedStyle(el)
          const text = el.textContent?.trim()
          
          if (rect.height > 50 && text && text.length > 20) { // Likely content elements
            queueElements.push({
              selector,
              index,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              backgroundColor: styles.backgroundColor,
              padding: styles.padding,
              margin: styles.margin,
              textPreview: text.substring(0, 50)
            })
          }
        })
      })
      
      return queueElements
    })
    
    console.log(`Found ${queueAnalysis.length} potential queue/list elements:`)
    queueAnalysis.forEach((element, index) => {
      console.log(`Element ${index + 1} (${element.selector}):`)
      console.log(`  Size: ${element.width}x${element.height}px`)
      console.log(`  Position: (${element.x}, ${element.y})`)
      console.log(`  Background: ${element.backgroundColor}`)
      console.log(`  Padding: ${element.padding}`)
      console.log(`  Text: "${element.textPreview}..."`)
      console.log('---')
    })
    
    // 3. PAGE REFRESH PATTERN ANALYSIS
    console.log('=== 3. PAGE REFRESH PATTERN ANALYSIS ===')
    
    // Monitor network requests and page reloads
    const networkRequests: string[] = []
    const pageReloads: number[] = []
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(`${request.method()} ${request.url()}`)
      }
    })
    
    page.on('framenavigated', () => {
      pageReloads.push(Date.now())
    })
    
    // Wait and check for auto-refresh behavior
    console.log('Monitoring for auto-refresh patterns...')
    await page.waitForTimeout(5000)
    
    console.log(`Network requests detected: ${networkRequests.length}`)
    networkRequests.forEach(req => console.log(`  ${req}`))
    
    console.log(`Page reloads detected: ${pageReloads.length}`)
    
    // Check for client-side vs server-side rendering patterns
    const renderingAnalysis = await page.evaluate(() => {
      // Check for React/Next.js patterns
      const hasReactDevTools = !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
      const hasNextRouter = !!(window as any).__NEXT_DATA__
      
      // Check for client-side state management
      const hasClientState = document.querySelector('[data-testid], [data-state]') !== null
      
      // Check for loading states
      const hasLoadingStates = document.querySelector('[class*="loading"], [class*="spinner"]') !== null
      
      return {
        hasReactDevTools,
        hasNextRouter,
        hasClientState,
        hasLoadingStates,
        userAgent: navigator.userAgent
      }
    })
    
    console.log('=== RENDERING ANALYSIS ===')
    console.log(`React DevTools: ${renderingAnalysis.hasReactDevTools}`)
    console.log(`Next.js Router: ${renderingAnalysis.hasNextRouter}`)
    console.log(`Client State: ${renderingAnalysis.hasClientState}`)
    console.log(`Loading States: ${renderingAnalysis.hasLoadingStates}`)
    
    // 4. GENERAL LAYOUT ANALYSIS
    console.log('=== 4. GENERAL LAYOUT ANALYSIS ===')
    
    const layoutAnalysis = await page.evaluate(() => {
      const container = document.querySelector('[class*="min-h-screen"]')
      const allElements = document.querySelectorAll('*')
      
      let inconsistentSpacing = 0
      let elementsWithoutMargin = 0
      
      allElements.forEach(el => {
        const styles = window.getComputedStyle(el)
        if (styles.margin === '0px' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
          elementsWithoutMargin++
        }
      })
      
      const containerStyles = container ? window.getComputedStyle(container) : null
      
      return {
        containerPadding: containerStyles?.padding || 'none',
        containerMargin: containerStyles?.margin || 'none',
        elementsWithoutMargin,
        totalElements: allElements.length,
        spacingRatio: elementsWithoutMargin / allElements.length
      }
    })
    
    console.log(`Container padding: ${layoutAnalysis.containerPadding}`)
    console.log(`Container margin: ${layoutAnalysis.containerMargin}`)
    console.log(`Elements without margin: ${layoutAnalysis.elementsWithoutMargin}/${layoutAnalysis.totalElements}`)
    console.log(`Spacing ratio: ${(layoutAnalysis.spacingRatio * 100).toFixed(1)}%`)
    
    // SUMMARY OF ISSUES
    console.log('=== ISSUES SUMMARY ===')
    const issues: string[] = []
    
    if (spacingAnalysis && spacingAnalysis.spacing < 48) {
      issues.push(`❌ Insufficient button spacing: ${spacingAnalysis.spacing}px (should be >=48px)`)
    }
    
    if (queueAnalysis.length === 0) {
      issues.push(`⚠️ No queue/orders display elements found`)
    }
    
    if (pageReloads.length > 1) {
      issues.push(`❌ Multiple page reloads detected: ${pageReloads.length}`)
    }
    
    if (!renderingAnalysis.hasClientState) {
      issues.push(`❌ No client-side state management detected`)
    }
    
    if (layoutAnalysis.spacingRatio > 0.8) {
      issues.push(`❌ Poor spacing consistency: ${(layoutAnalysis.spacingRatio * 100).toFixed(1)}% elements without margin`)
    }
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected')
    } else {
      issues.forEach(issue => console.log(issue))
    }
    
    expect(spacingAnalysis).toBeTruthy()
  })
})
