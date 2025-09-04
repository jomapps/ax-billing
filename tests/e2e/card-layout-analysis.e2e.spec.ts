import { test, expect } from '@playwright/test'

test.describe('Card Layout Analysis', () => {
  test('should analyze current card layout and identify issues', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('=== CARD LAYOUT ANALYSIS ===')
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'card-layout-current.png', fullPage: true })
    
    // Analyze stats cards layout
    const cardAnalysis = await page.evaluate(() => {
      // Look for stats cards specifically
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      const cardData: any[] = []
      
      statsCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect()
        const styles = window.getComputedStyle(card)
        const text = card.textContent?.trim()
        
        // Check if this looks like a stats card
        const hasStatsText = text && (
          text.includes("Today's Orders") || 
          text.includes("Active Jobs") || 
          text.includes("Revenue") || 
          text.includes("Completion")
        )
        
        if (hasStatsText) {
          cardData.push({
            index,
            width: rect.width,
            height: rect.height,
            x: rect.x,
            y: rect.y,
            text: text?.substring(0, 50),
            display: styles.display,
            gridColumn: styles.gridColumn,
            gridRow: styles.gridRow,
            flexBasis: styles.flexBasis,
            flexGrow: styles.flexGrow,
            className: card.className
          })
        }
      })
      
      return cardData
    })
    
    console.log('=== STATS CARDS ANALYSIS ===')
    cardAnalysis.forEach(card => {
      console.log(`Card ${card.index}:`)
      console.log(`  Size: ${card.width}x${card.height}px`)
      console.log(`  Position: (${card.x}, ${card.y})`)
      console.log(`  Text: "${card.text}"`)
      console.log(`  Grid Column: ${card.gridColumn}`)
      console.log(`  Flex Basis: ${card.flexBasis}`)
      console.log(`  Classes: ${card.className.substring(0, 100)}...`)
      console.log('---')
    })
    
    // Check grid layout
    const gridAnalysis = await page.evaluate(() => {
      const statsContainer = document.querySelector('[class*="grid"]')
      if (statsContainer) {
        const styles = window.getComputedStyle(statsContainer)
        return {
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
          gridTemplateRows: styles.gridTemplateRows,
          gap: styles.gap,
          gridGap: styles.gridGap,
          className: statsContainer.className
        }
      }
      return null
    })
    
    console.log('=== GRID CONTAINER ANALYSIS ===')
    if (gridAnalysis) {
      console.log(`Display: ${gridAnalysis.display}`)
      console.log(`Grid Template Columns: ${gridAnalysis.gridTemplateColumns}`)
      console.log(`Grid Gap: ${gridAnalysis.gap || gridAnalysis.gridGap}`)
      console.log(`Container Classes: ${gridAnalysis.className}`)
    } else {
      console.log('No grid container found')
    }
    
    // Check if cards are taking full width
    const layoutIssues: string[] = []
    
    cardAnalysis.forEach(card => {
      if (card.width > 600) { // Cards wider than 600px are likely too wide
        layoutIssues.push(`Card ${card.index} is too wide (${card.width}px)`)
      }
      
      if (card.width === 1280) { // Full viewport width
        layoutIssues.push(`Card ${card.index} is taking full row width`)
      }
    })
    
    console.log('=== LAYOUT ISSUES IDENTIFIED ===')
    if (layoutIssues.length > 0) {
      layoutIssues.forEach(issue => {
        console.log(`  ❌ ${issue}`)
      })
    } else {
      console.log('  ✅ No layout issues found')
    }
    
    // Check responsive design
    const responsiveCheck = await page.evaluate(() => {
      const statsCards = document.querySelectorAll('[class*="rounded-xl"]')
      let responsiveClasses = 0
      
      statsCards.forEach(card => {
        const className = card.className
        if (className.includes('md:') || className.includes('lg:') || className.includes('sm:')) {
          responsiveClasses++
        }
      })
      
      return responsiveClasses
    })
    
    console.log('=== RESPONSIVE DESIGN ===')
    console.log(`Cards with responsive classes: ${responsiveCheck}`)
    
    expect(cardAnalysis.length).toBeGreaterThan(0)
  })
})
