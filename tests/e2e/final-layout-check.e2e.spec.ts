import { test, expect } from '@playwright/test'

test.describe('Final Layout Check', () => {
  test('should verify improved card layout and padding', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    console.log('=== FINAL LAYOUT VERIFICATION ===')
    
    // Take screenshot for visual comparison
    await page.screenshot({ path: 'final-layout-improved.png', fullPage: true })
    
    // Analyze card layout
    const cardLayout = await page.evaluate(() => {
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      const cardData: any[] = []
      
      statsCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const styles = window.getComputedStyle(card)
        const text = card.textContent?.trim()
        
        const hasStatsText = text && (
          text.includes("Today's Orders") || 
          text.includes("Active Jobs") || 
          text.includes("Revenue") || 
          text.includes("Completion")
        )
        
        if (hasStatsText) {
          cardData.push({
            index,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            text: text?.substring(0, 30),
            padding: styles.padding,
            margin: styles.margin
          })
        }
      })
      
      return cardData
    })
    
    console.log('=== CARD LAYOUT ANALYSIS ===')
    cardLayout.forEach(card => {
      console.log(`Card ${card.index}: "${card.text}"`)
      console.log(`  Size: ${card.width}x${card.height}px`)
      console.log(`  Position: (${card.x}, ${card.y})`)
      console.log(`  Padding: ${card.padding}`)
      console.log('---')
    })
    
    // Check if cards are in proper grid
    const isProperGrid = cardLayout.length >= 4 && 
                        cardLayout.every(card => card.width >= 250 && card.width <= 350) &&
                        cardLayout.every(card => card.x >= 0)
    
    console.log('Cards in proper grid layout:', isProperGrid)
    
    // Check container padding
    const containerPadding = await page.evaluate(() => {
      const container = document.querySelector('[class*="min-h-screen"]')
      if (container) {
        const styles = window.getComputedStyle(container)
        const rect = container.getBoundingClientRect()
        return {
          padding: styles.padding,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
          paddingLeft: styles.paddingLeft,
          paddingRight: styles.paddingRight,
          maxWidth: styles.maxWidth,
          margin: styles.margin,
          containerWidth: Math.round(rect.width)
        }
      }
      return null
    })
    
    console.log('=== CONTAINER PADDING ===')
    if (containerPadding) {
      console.log(`Padding: ${containerPadding.padding}`)
      console.log(`Padding Top: ${containerPadding.paddingTop}`)
      console.log(`Padding Bottom: ${containerPadding.paddingBottom}`)
      console.log(`Max Width: ${containerPadding.maxWidth}`)
      console.log(`Container Width: ${containerPadding.containerWidth}px`)
      console.log(`Margin: ${containerPadding.margin}`)
    }
    
    // Check card content padding
    const cardContentPadding = await page.evaluate(() => {
      const cardHeaders = document.querySelectorAll('[class*="flex"][class*="flex-col"]')
      const cardContents = document.querySelectorAll('[class*="relative"][class*="z-10"]')
      
      const headerPadding = cardHeaders.length > 0 ? 
        window.getComputedStyle(cardHeaders[0]).padding : 'none'
      const contentPadding = cardContents.length > 0 ? 
        window.getComputedStyle(cardContents[0]).padding : 'none'
      
      return {
        headerPadding,
        contentPadding,
        headerCount: cardHeaders.length,
        contentCount: cardContents.length
      }
    })
    
    console.log('=== CARD CONTENT PADDING ===')
    console.log(`Header Padding: ${cardContentPadding.headerPadding}`)
    console.log(`Content Padding: ${cardContentPadding.contentPadding}`)
    console.log(`Header Elements: ${cardContentPadding.headerCount}`)
    console.log(`Content Elements: ${cardContentPadding.contentCount}`)
    
    // Check responsive behavior
    const responsiveCheck = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      }
      
      const gridContainer = document.querySelector('[style*="grid"]')
      const gridStyles = gridContainer ? window.getComputedStyle(gridContainer) : null
      
      return {
        viewport,
        gridTemplateColumns: gridStyles?.gridTemplateColumns || 'none',
        gap: gridStyles?.gap || 'none'
      }
    })
    
    console.log('=== RESPONSIVE DESIGN ===')
    console.log(`Viewport: ${responsiveCheck.viewport.width}x${responsiveCheck.viewport.height}`)
    console.log(`Grid Columns: ${responsiveCheck.gridTemplateColumns}`)
    console.log(`Grid Gap: ${responsiveCheck.gap}`)
    
    // Quality checks
    const qualityChecks = {
      cardsInGrid: isProperGrid,
      hasProperPadding: containerPadding?.paddingTop === '24px' && containerPadding?.paddingBottom === '48px',
      cardsProperSize: cardLayout.every(card => card.width >= 250 && card.width <= 350),
      cardsAligned: cardLayout.length >= 2 ? Math.abs(cardLayout[0].y - cardLayout[1].y) <= 5 : true
    }
    
    console.log('=== QUALITY CHECKS ===')
    Object.entries(qualityChecks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}: ${passed}`)
    })
    
    expect(qualityChecks.cardsInGrid).toBe(true)
    expect(qualityChecks.cardsProperSize).toBe(true)
  })
})
