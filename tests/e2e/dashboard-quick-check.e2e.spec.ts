import { test, expect } from '@playwright/test'

test.describe('Dashboard Quick Check', () => {
  test('should check if dashboard UI is fixed', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    console.log('=== QUICK UI CHECK ===')
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())
    
    // Take a screenshot
    await page.screenshot({ path: 'dashboard-fixed-check.png', fullPage: true })
    
    // Check for cards with better selectors
    const cardElements = await page.locator('div[class*="rounded-xl"]').count()
    console.log('Rounded card elements:', cardElements)
    
    // Check for stats values
    const bodyText = await page.locator('body').textContent()
    const hasStats = bodyText?.includes("Today's Orders") && bodyText?.includes("Active Jobs")
    console.log('Has stats text:', hasStats)
    
    // Check for specific card backgrounds
    const cardStyles = await page.evaluate(() => {
      const cards = document.querySelectorAll('div[class*="rounded-xl"]')
      const results: any[] = []
      
      cards.forEach((card, index) => {
        if (index < 3) { // Check first 3 cards
          const styles = window.getComputedStyle(card)
          results.push({
            index,
            backgroundColor: styles.backgroundColor,
            borderColor: styles.borderColor,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity
          })
        }
      })
      
      return results
    })
    
    console.log('Card background styles:', JSON.stringify(cardStyles, null, 2))
    
    // Check for error states
    const errorElements = await page.locator('[role="alert"]').count()
    console.log('Error elements:', errorElements)
    
    if (errorElements > 0) {
      const errorTexts = await page.locator('[role="alert"]').allTextContents()
      console.log('Error messages:', errorTexts)
    }
    
    // Check if Tailwind classes are working
    const primaryElements = await page.locator('[class*="primary"]').count()
    console.log('Primary color elements:', primaryElements)
    
    const darkElements = await page.locator('[class*="dark"]').count()
    console.log('Dark theme elements:', darkElements)
    
    // Check computed body styles
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return {
        backgroundColor: styles.backgroundColor,
        backgroundImage: styles.backgroundImage,
        color: styles.color,
        fontFamily: styles.fontFamily
      }
    })
    
    console.log('Body styles:', bodyStyles)
    
    // Basic expectation
    expect(bodyText?.length || 0).toBeGreaterThan(0)
  })
})
