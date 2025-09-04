import { test, expect } from '@playwright/test'

test.describe('UI Quality Analysis', () => {
  test('should analyze UI display quality issues', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    console.log('=== UI QUALITY ANALYSIS ===')

    // Take high-quality screenshots for analysis
    await page.screenshot({
      path: 'ui-quality-full.png',
      fullPage: true,
    })

    await page.screenshot({
      path: 'ui-quality-viewport.png',
    })

    // Analyze typography and font rendering
    const fontAnalysis = await page.evaluate(() => {
      const elements = document.querySelectorAll('h1, h2, h3, p, span, div')
      const fontIssues: any[] = []

      elements.forEach((el, index) => {
        if (index < 20) {
          // Check first 20 elements
          const styles = window.getComputedStyle(el)
          const text = el.textContent?.trim()

          if (text && text.length > 0) {
            fontIssues.push({
              element: el.tagName,
              text: text.substring(0, 50),
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
              lineHeight: styles.lineHeight,
              letterSpacing: styles.letterSpacing,
              color: styles.color,
              textShadow: styles.textShadow,
              antialiasing: styles.webkitFontSmoothing || styles.fontSmooth,
            })
          }
        }
      })

      return fontIssues
    })

    console.log('=== FONT ANALYSIS ===')
    fontAnalysis.forEach((font, index) => {
      console.log(`Element ${index + 1} (${font.element}):`)
      console.log(`  Text: "${font.text}"`)
      console.log(`  Font: ${font.fontSize} ${font.fontFamily}`)
      console.log(`  Weight: ${font.fontWeight}, Line Height: ${font.lineHeight}`)
      console.log(`  Color: ${font.color}`)
      console.log(`  Text Shadow: ${font.textShadow}`)
      console.log(`  Antialiasing: ${font.antialiasing}`)
      console.log('---')
    })

    // Analyze spacing and layout issues
    const layoutAnalysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="rounded"]')
      const layoutIssues: any[] = []

      cards.forEach((card, index) => {
        if (index < 5) {
          const styles = window.getComputedStyle(card)
          const rect = card.getBoundingClientRect()

          layoutIssues.push({
            index,
            width: rect.width,
            height: rect.height,
            padding: styles.padding,
            margin: styles.margin,
            borderRadius: styles.borderRadius,
            boxShadow: styles.boxShadow,
            transform: styles.transform,
            opacity: styles.opacity,
          })
        }
      })

      return layoutIssues
    })

    console.log('=== LAYOUT ANALYSIS ===')
    layoutAnalysis.forEach((layout) => {
      console.log(`Card ${layout.index}:`)
      console.log(`  Size: ${layout.width}x${layout.height}px`)
      console.log(`  Padding: ${layout.padding}`)
      console.log(`  Margin: ${layout.margin}`)
      console.log(`  Border Radius: ${layout.borderRadius}`)
      console.log(`  Box Shadow: ${layout.boxShadow}`)
      console.log(`  Opacity: ${layout.opacity}`)
      console.log('---')
    })

    // Check for visual artifacts and rendering issues
    const renderingIssues = await page.evaluate(() => {
      const issues: string[] = []

      // Check for blurry elements
      const blurryElements = document.querySelectorAll('[style*="blur"], [class*="blur"]')
      if (blurryElements.length > 0) {
        issues.push(`Found ${blurryElements.length} potentially blurry elements`)
      }

      // Check for low-quality images
      const images = document.querySelectorAll('img')
      images.forEach((img) => {
        if (img.naturalWidth > 0 && img.clientWidth > 0) {
          const ratio = img.naturalWidth / img.clientWidth
          if (ratio < 1) {
            issues.push(`Low-res image: ${img.src} (ratio: ${ratio.toFixed(2)})`)
          }
        }
      })

      // Check for pixelated elements
      const pixelatedElements = document.querySelectorAll(
        '[style*="pixelated"], [class*="pixelated"]',
      )
      if (pixelatedElements.length > 0) {
        issues.push(`Found ${pixelatedElements.length} pixelated elements`)
      }

      // Check viewport and scaling
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        zoom: window.outerWidth / window.innerWidth || 1,
      }

      return { issues, viewport }
    })

    console.log('=== RENDERING ISSUES ===')
    renderingIssues.issues.forEach((issue) => {
      console.log(`  ${issue}`)
    })

    console.log('=== VIEWPORT INFO ===')
    console.log(`  Size: ${renderingIssues.viewport.width}x${renderingIssues.viewport.height}`)
    console.log(`  Device Pixel Ratio: ${renderingIssues.viewport.devicePixelRatio}`)
    console.log(`  Zoom Level: ${renderingIssues.viewport.zoom}`)

    // Check color contrast and accessibility
    const contrastAnalysis = await page.evaluate(() => {
      const textElements = document.querySelectorAll('h1, h2, h3, p, span, button')
      const contrastIssues: any[] = []

      textElements.forEach((el, index) => {
        if (index < 10) {
          const styles = window.getComputedStyle(el)
          const text = el.textContent?.trim()

          if (text && text.length > 0) {
            contrastIssues.push({
              text: text.substring(0, 30),
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight,
            })
          }
        }
      })

      return contrastIssues
    })

    console.log('=== CONTRAST ANALYSIS ===')
    contrastAnalysis.forEach((contrast, index) => {
      console.log(`Text ${index + 1}: "${contrast.text}"`)
      console.log(`  Color: ${contrast.color} on ${contrast.backgroundColor}`)
      console.log(`  Font: ${contrast.fontSize} weight ${contrast.fontWeight}`)
      console.log('---')
    })

    // Check for CSS animation performance
    const animationAnalysis = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll(
        '[class*="animate"], [class*="transition"]',
      )
      const animations: any[] = []

      animatedElements.forEach((el, index) => {
        if (index < 5) {
          const styles = window.getComputedStyle(el)
          animations.push({
            element: el.tagName,
            className: el.className,
            transition: styles.transition,
            animation: styles.animation,
            transform: styles.transform,
            willChange: styles.willChange,
          })
        }
      })

      return animations
    })

    console.log('=== ANIMATION ANALYSIS ===')
    animationAnalysis.forEach((anim, index) => {
      console.log(`Animated Element ${index + 1} (${anim.element}):`)
      console.log(`  Transition: ${anim.transition}`)
      console.log(`  Animation: ${anim.animation}`)
      console.log(`  Transform: ${anim.transform}`)
      console.log(`  Will Change: ${anim.willChange}`)
      console.log('---')
    })

    expect(fontAnalysis.length).toBeGreaterThan(0)
  })
})
