import { test, expect } from '@playwright/test'

test.describe('Button Design Analysis', () => {
  test('should analyze New Order button design', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('=== BUTTON DESIGN ANALYSIS ===')

    // Take screenshot for visual inspection
    await page.screenshot({ path: 'button-design-current.png', fullPage: true })

    // Find the New Order button
    const newOrderButton = page.locator('button:has-text("New Order")')
    const buttonExists = (await newOrderButton.count()) > 0

    console.log('New Order button exists:', buttonExists)

    if (buttonExists) {
      // Analyze button styling
      const buttonAnalysis = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((btn) => btn.textContent?.includes('New Order')) as HTMLElement
        if (!button) return null

        const styles = window.getComputedStyle(button)
        const rect = button.getBoundingClientRect()

        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderWidth: styles.borderWidth,
          borderStyle: styles.borderStyle,
          borderRadius: styles.borderRadius,
          color: styles.color,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          fontFamily: styles.fontFamily,
          padding: styles.padding,
          margin: styles.margin,
          boxShadow: styles.boxShadow,
          textShadow: styles.textShadow,
          transition: styles.transition,
          transform: styles.transform,
          className: button.className,
          textContent: button.textContent,
        }
      })

      console.log('=== BUTTON STYLING ANALYSIS ===')
      if (buttonAnalysis) {
        console.log(`Text: "${buttonAnalysis.textContent}"`)
        console.log(`Size: ${buttonAnalysis.width}x${buttonAnalysis.height}px`)
        console.log(`Position: (${buttonAnalysis.x}, ${buttonAnalysis.y})`)
        console.log(`Background: ${buttonAnalysis.backgroundColor}`)
        console.log(
          `Border: ${buttonAnalysis.borderWidth} ${buttonAnalysis.borderStyle} ${buttonAnalysis.borderColor}`,
        )
        console.log(`Border Radius: ${buttonAnalysis.borderRadius}`)
        console.log(`Text Color: ${buttonAnalysis.color}`)
        console.log(
          `Font: ${buttonAnalysis.fontSize} ${buttonAnalysis.fontWeight} ${buttonAnalysis.fontFamily}`,
        )
        console.log(`Padding: ${buttonAnalysis.padding}`)
        console.log(`Box Shadow: ${buttonAnalysis.boxShadow}`)
        console.log(`Text Shadow: ${buttonAnalysis.textShadow}`)
        console.log(`Transition: ${buttonAnalysis.transition}`)
        console.log(`Classes: ${buttonAnalysis.className}`)
      }

      // Check for gaming-style effects
      const hasGamingEffects = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((btn) => btn.textContent?.includes('New Order')) as HTMLElement
        if (!button) return false

        const styles = window.getComputedStyle(button)
        const className = button.className

        return {
          hasNeonColors: styles.color.includes('212, 255') || className.includes('neon'),
          hasGradient: styles.backgroundImage.includes('gradient'),
          hasGlow: styles.boxShadow.includes('rgba') && styles.boxShadow.includes('233'),
          hasHoverEffects: className.includes('hover:'),
          hasTransition: styles.transition !== 'none' && styles.transition !== '',
          hasGamingVariant: className.includes('gaming') || className.includes('neon'),
          hasProperShadow: styles.boxShadow !== 'none',
        }
      })

      console.log('=== GAMING EFFECTS CHECK ===')
      Object.entries(hasGamingEffects).forEach(([effect, present]) => {
        console.log(`${present ? '✅' : '❌'} ${effect}: ${present}`)
      })

      // Check button hover state
      console.log('=== TESTING HOVER STATE ===')
      await newOrderButton.hover()
      await page.waitForTimeout(500)

      const hoverAnalysis = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'))
        const button = buttons.find((btn) => btn.textContent?.includes('New Order')) as HTMLElement
        if (!button) return null

        const styles = window.getComputedStyle(button)
        return {
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
          transform: styles.transform,
          color: styles.color,
        }
      })

      if (hoverAnalysis) {
        console.log('Hover Background:', hoverAnalysis.backgroundColor)
        console.log('Hover Border:', hoverAnalysis.borderColor)
        console.log('Hover Shadow:', hoverAnalysis.boxShadow)
        console.log('Hover Transform:', hoverAnalysis.transform)
        console.log('Hover Color:', hoverAnalysis.color)
      }

      // Take screenshot of hover state
      await page.screenshot({ path: 'button-hover-state.png' })
    }

    // Check for other buttons for comparison
    const allButtons = await page.locator('button').count()
    console.log(`Total buttons found: ${allButtons}`)

    // Check if there are any other gaming-styled buttons
    const gamingButtons = await page
      .locator('button[class*="gaming"], button[class*="neon"]')
      .count()
    console.log(`Gaming-styled buttons: ${gamingButtons}`)

    expect(buttonExists).toBe(true)
  })
})
