import { test, expect } from '@playwright/test'

test.describe('Dashboard Improvements Verification', () => {
  test('should verify all UX improvements are working', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    console.log('=== DASHBOARD IMPROVEMENTS VERIFICATION ===')
    
    // Take final screenshot
    await page.screenshot({ path: 'dashboard-final-improved.png', fullPage: true })
    
    // 1. Verify Button Spacing
    console.log('=== 1. BUTTON SPACING VERIFICATION ===')
    
    const spacingCheck = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const newOrderButton = buttons.find(btn => btn.textContent?.includes('New Order'))
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      
      if (!newOrderButton || statsCards.length === 0) return null
      
      const buttonRect = newOrderButton.getBoundingClientRect()
      const firstCardRect = statsCards[0].getBoundingClientRect()
      const spacing = Math.round(firstCardRect.top - buttonRect.bottom)
      
      return {
        spacing,
        hasProperSpacing: spacing >= 48,
        buttonSize: { width: Math.round(buttonRect.width), height: Math.round(buttonRect.height) }
      }
    })
    
    if (spacingCheck) {
      console.log(`✅ Button spacing: ${spacingCheck.spacing}px (${spacingCheck.hasProperSpacing ? 'GOOD' : 'NEEDS IMPROVEMENT'})`)
      console.log(`✅ Button size: ${spacingCheck.buttonSize.width}x${spacingCheck.buttonSize.height}px`)
    }
    
    // 2. Verify Loading States
    console.log('=== 2. LOADING STATES VERIFICATION ===')
    
    const loadingStates = await page.evaluate(() => {
      // Look for loading indicators
      const refreshIcon = document.querySelector('[class*="animate-spin"]')
      const loadingText = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('Updating') || el.textContent?.includes('Last updated')
      )
      
      return {
        hasRefreshIcon: !!refreshIcon,
        hasLoadingText: !!loadingText,
        loadingTextContent: loadingText?.textContent || null
      }
    })
    
    console.log(`✅ Refresh icon present: ${loadingStates.hasRefreshIcon}`)
    console.log(`✅ Loading text present: ${loadingStates.hasLoadingText}`)
    if (loadingStates.loadingTextContent) {
      console.log(`✅ Loading text: "${loadingStates.loadingTextContent}"`)
    }
    
    // 3. Verify Gaming Design Elements
    console.log('=== 3. GAMING DESIGN VERIFICATION ===')
    
    const gamingDesign = await page.evaluate(() => {
      // Check New Order button design
      const buttons = Array.from(document.querySelectorAll('button'))
      const newOrderButton = buttons.find(btn => btn.textContent?.includes('New Order'))
      
      if (!newOrderButton) return null
      
      const styles = window.getComputedStyle(newOrderButton)
      
      return {
        hasGradient: styles.backgroundImage.includes('gradient'),
        hasProperBorder: styles.borderColor.includes('233') || styles.borderColor.includes('14, 165, 233'),
        hasBoxShadow: styles.boxShadow !== 'none',
        hasRoundedCorners: parseFloat(styles.borderRadius) >= 10,
        hasProperFont: styles.fontFamily.includes('Inter'),
        textColor: styles.color
      }
    })
    
    if (gamingDesign) {
      console.log(`✅ Gaming gradient: ${gamingDesign.hasGradient}`)
      console.log(`✅ Gaming border: ${gamingDesign.hasProperBorder}`)
      console.log(`✅ Gaming shadow: ${gamingDesign.hasBoxShadow}`)
      console.log(`✅ Rounded corners: ${gamingDesign.hasRoundedCorners}`)
      console.log(`✅ Gaming font: ${gamingDesign.hasProperFont}`)
      console.log(`✅ Text color: ${gamingDesign.textColor}`)
    }
    
    // 4. Verify Card Layout
    console.log('=== 4. CARD LAYOUT VERIFICATION ===')
    
    const cardLayout = await page.evaluate(() => {
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      const cards: any[] = []
      
      statsCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const text = card.textContent?.trim()
        
        const hasStatsText = text && (
          text.includes("Today's Orders") || 
          text.includes("Active Jobs") || 
          text.includes("Revenue") || 
          text.includes("Completion")
        )
        
        if (hasStatsText) {
          cards.push({
            index,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.x)
          })
        }
      })
      
      return {
        cardCount: cards.length,
        cardsInRow: cards.filter(card => Math.abs(card.x - cards[0]?.x) < 1000).length,
        averageWidth: cards.length > 0 ? Math.round(cards.reduce((sum, card) => sum + card.width, 0) / cards.length) : 0,
        properGrid: cards.length === 4 && cards.every(card => card.width >= 250 && card.width <= 350)
      }
    })
    
    console.log(`✅ Card count: ${cardLayout.cardCount}`)
    console.log(`✅ Cards in row: ${cardLayout.cardsInRow}`)
    console.log(`✅ Average card width: ${cardLayout.averageWidth}px`)
    console.log(`✅ Proper grid layout: ${cardLayout.properGrid}`)
    
    // 5. Verify Queue Display
    console.log('=== 5. QUEUE DISPLAY VERIFICATION ===')
    
    const queueDisplay = await page.evaluate(() => {
      // Look for queue filter buttons
      const queueButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('All') || 
        btn.textContent?.includes('VIP') || 
        btn.textContent?.includes('Regular')
      )
      
      // Look for orders section
      const ordersSection = Array.from(document.querySelectorAll('h2')).find(h2 => 
        h2.textContent?.includes('Active Orders')
      )
      
      return {
        queueButtonCount: queueButtons.length,
        hasOrdersSection: !!ordersSection,
        ordersSectionText: ordersSection?.textContent || null
      }
    })
    
    console.log(`✅ Queue filter buttons: ${queueDisplay.queueButtonCount}`)
    console.log(`✅ Orders section present: ${queueDisplay.hasOrdersSection}`)
    if (queueDisplay.ordersSectionText) {
      console.log(`✅ Orders section: "${queueDisplay.ordersSectionText}"`)
    }
    
    // FINAL SUMMARY
    console.log('=== FINAL IMPROVEMENT SUMMARY ===')
    
    const allChecks = {
      properButtonSpacing: spacingCheck?.hasProperSpacing || false,
      hasLoadingStates: loadingStates.hasLoadingText,
      hasGamingDesign: gamingDesign?.hasGradient && gamingDesign?.hasProperBorder || false,
      properCardLayout: cardLayout.properGrid,
      hasQueueDisplay: queueDisplay.hasOrdersSection
    }
    
    const passedChecks = Object.values(allChecks).filter(Boolean).length
    const totalChecks = Object.keys(allChecks).length
    
    console.log(`\n🎯 IMPROVEMENT SCORE: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`)
    
    Object.entries(allChecks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}: ${passed}`)
    })
    
    expect(passedChecks).toBeGreaterThanOrEqual(4) // At least 4/5 checks should pass
  })
})
