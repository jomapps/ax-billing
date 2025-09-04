import { test, expect } from '@playwright/test'

test.describe('CSS Debug', () => {
  test('should debug CSS classes and styles', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('=== CSS DEBUG ===')
    
    // Get all elements with rounded classes and their actual class names
    const cardInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('div[class*="rounded"]')
      const results: any[] = []
      
      cards.forEach((card, index) => {
        if (index < 5) {
          const styles = window.getComputedStyle(card)
          results.push({
            index,
            className: card.className,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
            borderColor: styles.borderColor,
            borderWidth: styles.borderWidth,
            borderStyle: styles.borderStyle
          })
        }
      })
      
      return results
    })
    
    console.log('Card class names and styles:')
    cardInfo.forEach(card => {
      console.log(`Card ${card.index}:`)
      console.log(`  Classes: ${card.className}`)
      console.log(`  Background Color: ${card.backgroundColor}`)
      console.log(`  Background Image: ${card.backgroundImage}`)
      console.log(`  Border: ${card.borderWidth} ${card.borderStyle} ${card.borderColor}`)
      console.log('---')
    })
    
    // Check if Tailwind CSS is loaded
    const stylesheets = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets)
      return sheets.map(sheet => {
        try {
          return {
            href: sheet.href,
            rules: sheet.cssRules ? sheet.cssRules.length : 0
          }
        } catch (e) {
          return { href: sheet.href, rules: 'Access denied' }
        }
      })
    })
    
    console.log('Loaded stylesheets:')
    stylesheets.forEach(sheet => {
      console.log(`  ${sheet.href}: ${sheet.rules} rules`)
    })
    
    // Check for specific CSS rules
    const hasBackgroundRules = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets)
      let foundRules: string[] = []
      
      sheets.forEach(sheet => {
        try {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach(rule => {
              const ruleText = rule.cssText
              if (ruleText.includes('bg-dark') || ruleText.includes('background') && ruleText.includes('dark')) {
                foundRules.push(ruleText.substring(0, 100))
              }
            })
          }
        } catch (e) {
          // Skip CORS-blocked stylesheets
        }
      })
      
      return foundRules
    })
    
    console.log('Found background-related CSS rules:')
    hasBackgroundRules.forEach(rule => {
      console.log(`  ${rule}...`)
    })
    
    // Check if the Card component is using the gaming variant
    const gamingCards = await page.locator('[class*="gaming"]').count()
    console.log('Elements with "gaming" in class:', gamingCards)
    
    // Check for gradient classes
    const gradientElements = await page.locator('[class*="gradient"]').count()
    console.log('Elements with "gradient" in class:', gradientElements)
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'css-debug-screenshot.png', fullPage: true })
    
    expect(cardInfo.length).toBeGreaterThan(0)
  })
})
