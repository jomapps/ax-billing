import { test, expect } from '@playwright/test'

test.describe('Final UI Check', () => {
  test('should verify dashboard UI is now working', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    
    console.log('=== FINAL UI CHECK ===')
    console.log('Page title:', await page.title())
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-final-check.png', fullPage: true })
    
    // Check card backgrounds
    const cardInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('div[class*="rounded-xl"]')
      const results: any[] = []
      
      cards.forEach((card, index) => {
        if (index < 4) {
          const styles = window.getComputedStyle(card)
          results.push({
            index,
            className: card.className,
            backgroundColor: styles.backgroundColor,
            backgroundImage: styles.backgroundImage,
            borderColor: styles.borderColor,
            borderWidth: styles.borderWidth,
            isVisible: styles.display !== 'none' && styles.visibility !== 'hidden'
          })
        }
      })
      
      return results
    })
    
    console.log('=== CARD ANALYSIS ===')
    cardInfo.forEach(card => {
      console.log(`Card ${card.index}:`)
      console.log(`  Background: ${card.backgroundColor}`)
      console.log(`  Background Image: ${card.backgroundImage}`)
      console.log(`  Border: ${card.borderWidth} ${card.borderColor}`)
      console.log(`  Visible: ${card.isVisible}`)
      console.log(`  Classes: ${card.className.substring(0, 100)}...`)
      console.log('---')
    })
    
    // Check if cards have proper backgrounds now
    const hasProperBackgrounds = cardInfo.some(card => 
      card.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
      card.backgroundImage !== 'none'
    )
    
    console.log('Cards have proper backgrounds:', hasProperBackgrounds)
    
    // Check for stats content
    const bodyText = await page.locator('body').textContent()
    const hasStatsContent = bodyText?.includes("Today's Orders") && 
                           bodyText?.includes("Active Jobs") &&
                           bodyText?.includes("Revenue")
    
    console.log('Has stats content:', hasStatsContent)
    
    // Check for error states
    const errorElements = await page.locator('[role="alert"]').count()
    console.log('Error elements:', errorElements)
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('[role="alert"]').allTextContents()
      console.log('Error messages:', errorTexts.filter(text => text.trim().length > 0))
    }
    
    // Check overall layout
    const layoutCheck = await page.evaluate(() => {
      const body = document.body
      const bodyStyles = window.getComputedStyle(body)
      
      return {
        bodyBackground: bodyStyles.backgroundColor,
        bodyBackgroundImage: bodyStyles.backgroundImage,
        bodyColor: bodyStyles.color,
        hasContent: body.textContent && body.textContent.length > 100
      }
    })
    
    console.log('=== LAYOUT CHECK ===')
    console.log('Body background:', layoutCheck.bodyBackground)
    console.log('Body background image:', layoutCheck.bodyBackgroundImage)
    console.log('Body text color:', layoutCheck.bodyColor)
    console.log('Has content:', layoutCheck.hasContent)
    
    // Basic expectations
    expect(layoutCheck.hasContent).toBe(true)
    expect(hasStatsContent).toBe(true)
  })
})
