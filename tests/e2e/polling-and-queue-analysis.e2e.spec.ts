import { test, expect } from '@playwright/test'

test.describe('Polling and Queue Analysis', () => {
  test('should analyze polling behavior and queue button formatting', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('=== POLLING AND QUEUE ANALYSIS ===')
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'polling-queue-issues.png', fullPage: true })
    
    // 1. ANALYZE POLLING BEHAVIOR
    console.log('=== 1. POLLING BEHAVIOR ANALYSIS ===')
    
    const networkRequests: string[] = []
    const pageNavigations: string[] = []
    
    // Monitor network requests
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('localhost')) {
        networkRequests.push(`${request.method()} ${request.url()}`)
      }
    })
    
    // Monitor page navigations/refreshes
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        pageNavigations.push(`Navigation to: ${frame.url()}`)
      }
    })
    
    // Wait for potential polling activity
    console.log('Monitoring for 10 seconds to detect polling behavior...')
    await page.waitForTimeout(10000)
    
    console.log(`Network requests detected: ${networkRequests.length}`)
    networkRequests.forEach(req => console.log(`  ${req}`))
    
    console.log(`Page navigations detected: ${pageNavigations.length}`)
    pageNavigations.forEach(nav => console.log(`  ${nav}`))
    
    // Check for client-side vs server-side patterns
    const pollingAnalysis = await page.evaluate(() => {
      // Check for intervals/timeouts
      const hasActiveIntervals = (window as any).__activeIntervals || 0
      
      // Check for fetch/axios usage
      const hasFetchPolling = !!(window as any).fetch
      
      // Check for React state updates
      const hasReactState = document.querySelector('[data-reactroot]') !== null
      
      // Check for loading indicators
      const hasLoadingIndicators = document.querySelector('[class*="loading"], [class*="spinner"]') !== null
      
      return {
        hasActiveIntervals,
        hasFetchPolling,
        hasReactState,
        hasLoadingIndicators,
        userAgent: navigator.userAgent.includes('Chrome')
      }
    })
    
    console.log('=== POLLING PATTERN ANALYSIS ===')
    console.log(`Active intervals: ${pollingAnalysis.hasActiveIntervals}`)
    console.log(`Fetch API available: ${pollingAnalysis.hasFetchPolling}`)
    console.log(`React state: ${pollingAnalysis.hasReactState}`)
    console.log(`Loading indicators: ${pollingAnalysis.hasLoadingIndicators}`)
    
    // 2. ANALYZE QUEUE BUTTONS
    console.log('=== 2. QUEUE BUTTONS ANALYSIS ===')
    
    const queueButtonAnalysis = await page.evaluate(() => {
      // Find queue filter buttons
      const allButtons = Array.from(document.querySelectorAll('button'))
      const queueButtons = allButtons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return text.includes('all') || text.includes('vip') || text.includes('regular') || text.includes('remnant')
      })
      
      const buttonData = queueButtons.map((btn, index) => {
        const styles = window.getComputedStyle(btn)
        const rect = btn.getBoundingClientRect()
        
        return {
          index,
          text: btn.textContent?.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderWidth: styles.borderWidth,
          borderRadius: styles.borderRadius,
          color: styles.color,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          padding: styles.padding,
          boxShadow: styles.boxShadow,
          className: btn.className
        }
      })
      
      return buttonData
    })
    
    console.log(`Found ${queueButtonAnalysis.length} queue buttons:`)
    queueButtonAnalysis.forEach(btn => {
      console.log(`Button "${btn.text}":`)
      console.log(`  Size: ${btn.width}x${btn.height}px`)
      console.log(`  Position: (${btn.x}, ${btn.y})`)
      console.log(`  Background: ${btn.backgroundColor}`)
      console.log(`  Border: ${btn.borderWidth} ${btn.borderColor}`)
      console.log(`  Border Radius: ${btn.borderRadius}`)
      console.log(`  Text Color: ${btn.color}`)
      console.log(`  Font: ${btn.fontSize} ${btn.fontWeight}`)
      console.log(`  Box Shadow: ${btn.boxShadow}`)
      console.log(`  Classes: ${btn.className.substring(0, 100)}...`)
      console.log('---')
    })
    
    // Check for gaming-style button effects
    const gamingButtonChecks = queueButtonAnalysis.map(btn => ({
      text: btn.text,
      hasGamingBackground: btn.backgroundColor !== 'rgba(0, 0, 0, 0)' && btn.backgroundColor !== 'rgb(239, 239, 239)',
      hasGamingBorder: btn.borderColor.includes('233') || btn.borderWidth !== '0px',
      hasRoundedCorners: parseFloat(btn.borderRadius) >= 8,
      hasProperShadow: btn.boxShadow !== 'none',
      hasGamingFont: btn.fontSize !== '13.3333px' && btn.fontWeight !== '400'
    }))
    
    console.log('=== QUEUE BUTTON GAMING STYLE CHECK ===')
    gamingButtonChecks.forEach(check => {
      console.log(`Button "${check.text}":`)
      console.log(`  ${check.hasGamingBackground ? '✅' : '❌'} Gaming background`)
      console.log(`  ${check.hasGamingBorder ? '✅' : '❌'} Gaming border`)
      console.log(`  ${check.hasRoundedCorners ? '✅' : '❌'} Rounded corners`)
      console.log(`  ${check.hasProperShadow ? '✅' : '❌'} Gaming shadow`)
      console.log(`  ${check.hasGamingFont ? '✅' : '❌'} Gaming font`)
      console.log('---')
    })
    
    // 3. CHECK FOR REFRESH PATTERNS
    console.log('=== 3. REFRESH PATTERN CHECK ===')
    
    // Check if page is doing meta refresh or location.reload
    const refreshPatterns = await page.evaluate(() => {
      // Check for meta refresh
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]')
      
      // Check for location.reload in scripts
      const scripts = Array.from(document.querySelectorAll('script'))
      const hasLocationReload = scripts.some(script => 
        script.textContent?.includes('location.reload') || 
        script.textContent?.includes('window.location.reload')
      )
      
      // Check for form submissions that might cause refresh
      const forms = document.querySelectorAll('form')
      
      return {
        hasMetaRefresh: !!metaRefresh,
        metaRefreshContent: metaRefresh?.getAttribute('content') || null,
        hasLocationReload,
        formCount: forms.length
      }
    })
    
    console.log(`Meta refresh: ${refreshPatterns.hasMetaRefresh}`)
    if (refreshPatterns.metaRefreshContent) {
      console.log(`Meta refresh content: ${refreshPatterns.metaRefreshContent}`)
    }
    console.log(`Location.reload detected: ${refreshPatterns.hasLocationReload}`)
    console.log(`Forms found: ${refreshPatterns.formCount}`)
    
    // SUMMARY
    console.log('=== ISSUES SUMMARY ===')
    const issues: string[] = []
    
    if (pageNavigations.length > 1) {
      issues.push(`❌ Page refreshes detected: ${pageNavigations.length}`)
    }
    
    if (refreshPatterns.hasMetaRefresh || refreshPatterns.hasLocationReload) {
      issues.push(`❌ Server-side refresh patterns detected`)
    }
    
    const badQueueButtons = gamingButtonChecks.filter(btn => 
      !btn.hasGamingBackground || !btn.hasGamingBorder || !btn.hasRoundedCorners
    )
    
    if (badQueueButtons.length > 0) {
      issues.push(`❌ Queue buttons not properly styled: ${badQueueButtons.map(b => b.text).join(', ')}`)
    }
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected')
    } else {
      issues.forEach(issue => console.log(issue))
    }
    
    expect(queueButtonAnalysis.length).toBeGreaterThan(0)
  })
})
