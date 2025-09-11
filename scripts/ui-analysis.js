import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function analyzeUI() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Create screenshots directory
  const screenshotsDir = 'ui-analysis-screenshots'
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir)
  }

  console.log('🔍 Starting UI Analysis...')

  try {
    // Navigate to the main page
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' })

    console.log('📱 Testing Desktop View (1920x1080)...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.screenshot({
      path: `${screenshotsDir}/desktop-1920x1080.png`,
      fullPage: true,
    })

    // Analyze font sizes on desktop
    const desktopFontAnalysis = await page.evaluate(() => {
      const elements = []

      // Check headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el, index) => {
        const styles = window.getComputedStyle(el)
        elements.push({
          type: 'heading',
          tag: el.tagName.toLowerCase(),
          text: el.textContent.substring(0, 50),
          fontSize: styles.fontSize,
          fontSizePixels: parseFloat(styles.fontSize),
          lineHeight: styles.lineHeight,
          fontWeight: styles.fontWeight,
          classes: el.className,
        })
      })

      // Check buttons
      document.querySelectorAll('button, .btn').forEach((el, index) => {
        if (index < 10) {
          // Limit to first 10 buttons
          const styles = window.getComputedStyle(el)
          elements.push({
            type: 'button',
            text: el.textContent.substring(0, 30),
            fontSize: styles.fontSize,
            fontSizePixels: parseFloat(styles.fontSize),
            padding: styles.padding,
            height: styles.height,
            classes: el.className,
          })
        }
      })

      // Check cards and containers
      document.querySelectorAll('[class*="card"], .card, [class*="bg-"]').forEach((el, index) => {
        if (index < 5) {
          // Limit to first 5 cards
          const styles = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          elements.push({
            type: 'card',
            width: rect.width,
            height: rect.height,
            padding: styles.padding,
            margin: styles.margin,
            classes: el.className,
          })
        }
      })

      return elements
    })

    console.log('📱 Testing Tablet View (768x1024)...')
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({
      path: `${screenshotsDir}/tablet-768x1024.png`,
      fullPage: true,
    })

    const tabletFontAnalysis = await page.evaluate(() => {
      const elements = []
      document.querySelectorAll('h1, h2, h3').forEach((el) => {
        const styles = window.getComputedStyle(el)
        elements.push({
          tag: el.tagName.toLowerCase(),
          fontSize: styles.fontSize,
          fontSizePixels: parseFloat(styles.fontSize),
        })
      })
      return elements
    })

    console.log('📱 Testing Mobile View (375x667)...')
    await page.setViewportSize({ width: 375, height: 667 })
    await page.screenshot({
      path: `${screenshotsDir}/mobile-375x667.png`,
      fullPage: true,
    })

    const mobileFontAnalysis = await page.evaluate(() => {
      const elements = []
      document.querySelectorAll('h1, h2, h3').forEach((el) => {
        const styles = window.getComputedStyle(el)
        elements.push({
          tag: el.tagName.toLowerCase(),
          fontSize: styles.fontSize,
          fontSizePixels: parseFloat(styles.fontSize),
        })
      })
      return elements
    })

    console.log('📱 Testing Small Mobile View (320x568)...')
    await page.setViewportSize({ width: 320, height: 568 })
    await page.screenshot({
      path: `${screenshotsDir}/mobile-320x568.png`,
      fullPage: true,
    })

    // Test navigation and interaction on mobile
    console.log('🔍 Testing Mobile Navigation...')

    // Check if elements are properly clickable on mobile
    const mobileInteractionTest = await page.evaluate(() => {
      const results = []

      // Check button sizes
      document.querySelectorAll('button').forEach((btn, index) => {
        if (index < 5) {
          const rect = btn.getBoundingClientRect()
          const styles = window.getComputedStyle(btn)
          results.push({
            type: 'button',
            width: rect.width,
            height: rect.height,
            minTouchTarget: rect.width >= 44 && rect.height >= 44, // Apple's recommended minimum
            fontSize: styles.fontSize,
            text: btn.textContent.substring(0, 20),
          })
        }
      })

      // Check spacing between interactive elements
      const buttons = Array.from(document.querySelectorAll('button'))
      for (let i = 0; i < buttons.length - 1 && i < 3; i++) {
        const rect1 = buttons[i].getBoundingClientRect()
        const rect2 = buttons[i + 1].getBoundingClientRect()

        const verticalGap = Math.abs(rect2.top - rect1.bottom)
        const horizontalGap = Math.abs(rect2.left - rect1.right)

        results.push({
          type: 'spacing',
          verticalGap,
          horizontalGap,
          adequateSpacing: verticalGap >= 8 || horizontalGap >= 8,
        })
      }

      return results
    })

    // Generate analysis report
    const report = {
      timestamp: new Date().toISOString(),
      viewports: {
        desktop: { width: 1920, height: 1080 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 },
        smallMobile: { width: 320, height: 568 },
      },
      fontAnalysis: {
        desktop: desktopFontAnalysis,
        tablet: tabletFontAnalysis,
        mobile: mobileFontAnalysis,
      },
      mobileInteraction: mobileInteractionTest,
      issues: [],
      recommendations: [],
    }

    // Analyze issues
    const headings = desktopFontAnalysis.filter((el) => el.type === 'heading')
    const largeHeadings = headings.filter((h) => h.fontSizePixels > 48)

    if (largeHeadings.length > 0) {
      report.issues.push({
        type: 'font-size',
        severity: 'high',
        description: 'Headings are too large on desktop',
        elements: largeHeadings.map((h) => `${h.tag}: ${h.fontSize}`),
      })

      report.recommendations.push({
        type: 'font-size',
        description:
          'Reduce heading font sizes. H1 should be max 32-36px, H2 max 28px, H3 max 24px',
        implementation: 'Update CSS clamp() values in styles.css and gaming-theme.css',
      })
    }

    const smallTouchTargets = mobileInteractionTest.filter(
      (el) => el.type === 'button' && !el.minTouchTarget,
    )

    if (smallTouchTargets.length > 0) {
      report.issues.push({
        type: 'touch-targets',
        severity: 'high',
        description: 'Buttons too small for mobile touch interaction',
        elements: smallTouchTargets,
      })

      report.recommendations.push({
        type: 'touch-targets',
        description: 'Ensure all interactive elements are at least 44x44px',
        implementation: 'Update button component sizes and add proper mobile padding',
      })
    }

    // Save report
    fs.writeFileSync(`${screenshotsDir}/ui-analysis-report.json`, JSON.stringify(report, null, 2))

    console.log('\n📊 UI Analysis Complete!')
    console.log(`📁 Screenshots saved to: ${screenshotsDir}/`)
    console.log(`📄 Report saved to: ${screenshotsDir}/ui-analysis-report.json`)

    // Print summary
    console.log('\n🔍 Issues Found:')
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.description} (${issue.severity})`)
    })

    console.log('\n💡 Recommendations:')
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.description}`)
    })
  } catch (error) {
    console.error('❌ Error during UI analysis:', error)
  } finally {
    await browser.close()
  }
}

// Run the analysis
analyzeUI().catch(console.error)
