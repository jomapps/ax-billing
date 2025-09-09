import { chromium } from 'playwright'

async function testResponsiveFonts() {
  console.log('🔍 Testing Responsive Font Sizes...\n')

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    console.log('📱 Testing different viewport sizes...\n')

    // Test different viewport sizes
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
    ]

    for (const viewport of viewports) {
      console.log(`\n=== ${viewport.name} (${viewport.width}x${viewport.height}) ===`)

      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(1000)

      // Test button font sizes
      const buttonAnalysis = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button')
        const results = []

        buttons.forEach((btn, index) => {
          if (index < 5) {
            // Test first 5 buttons
            const styles = window.getComputedStyle(btn)
            const text = btn.textContent?.trim()

            if (text && text.length > 0) {
              results.push({
                text: text.substring(0, 30),
                fontSize: styles.fontSize,
                fontSizePixels: parseFloat(styles.fontSize),
                minHeight: styles.minHeight,
                padding: styles.padding,
                isVisible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
              })
            }
          }
        })

        return results
      })

      console.log('🔘 Button Analysis:')
      buttonAnalysis.forEach((btn, i) => {
        console.log(`  Button ${i + 1}: "${btn.text}"`)
        console.log(`    Font Size: ${btn.fontSize} (${btn.fontSizePixels}px)`)
        console.log(`    Min Height: ${btn.minHeight}`)
        console.log(`    Visible: ${btn.isVisible ? '✅' : '❌'}`)

        // Check if font size is appropriate for viewport
        const minFontSize = viewport.width < 768 ? 14 : 12
        const isAppropriate = btn.fontSizePixels >= minFontSize
        console.log(`    Size Check: ${isAppropriate ? '✅' : '❌'} (min: ${minFontSize}px)`)
      })

      // Test card titles
      const cardAnalysis = await page.evaluate(() => {
        const cardTitles = document.querySelectorAll('h1, h2, h3, [class*="CardTitle"]')
        const results = []

        cardTitles.forEach((title, index) => {
          if (index < 3) {
            // Test first 3 titles
            const styles = window.getComputedStyle(title)
            const text = title.textContent?.trim()

            if (text && text.length > 0) {
              results.push({
                text: text.substring(0, 30),
                fontSize: styles.fontSize,
                fontSizePixels: parseFloat(styles.fontSize),
                tagName: title.tagName,
                isVisible: title.offsetWidth > 0 && title.offsetHeight > 0,
              })
            }
          }
        })

        return results
      })

      console.log('\n📝 Title/Heading Analysis:')
      cardAnalysis.forEach((title, i) => {
        console.log(`  ${title.tagName} ${i + 1}: "${title.text}"`)
        console.log(`    Font Size: ${title.fontSize} (${title.fontSizePixels}px)`)
        console.log(`    Visible: ${title.isVisible ? '✅' : '❌'}`)

        // Check if font size is appropriate for viewport
        const minFontSize = viewport.width < 768 ? 16 : 14
        const isAppropriate = title.fontSizePixels >= minFontSize
        console.log(`    Size Check: ${isAppropriate ? '✅' : '❌'} (min: ${minFontSize}px)`)
      })

      // Test responsive utility classes
      const responsiveClassAnalysis = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          '[class*="text-responsive"], [class*="text-btn"]',
        )
        const results = []

        elements.forEach((el, index) => {
          if (index < 5) {
            // Test first 5 elements
            const styles = window.getComputedStyle(el)
            const classes = el.className

            results.push({
              classes: classes,
              fontSize: styles.fontSize,
              fontSizePixels: parseFloat(styles.fontSize),
              isVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
            })
          }
        })

        return results
      })

      console.log('\n🎨 Responsive Class Analysis:')
      responsiveClassAnalysis.forEach((el, i) => {
        console.log(`  Element ${i + 1}: ${el.classes}`)
        console.log(`    Font Size: ${el.fontSize} (${el.fontSizePixels}px)`)
        console.log(`    Visible: ${el.isVisible ? '✅' : '❌'}`)
      })

      // Take a screenshot for visual verification
      await page.screenshot({
        path: `responsive-font-test-${viewport.name.toLowerCase()}.png`,
        fullPage: false,
      })
      console.log(`📸 Screenshot saved: responsive-font-test-${viewport.name.toLowerCase()}.png`)
    }

    console.log('\n✅ Responsive font size testing completed!')
    console.log('\n📋 Summary:')
    console.log('- Tested button font sizes across mobile, tablet, and desktop')
    console.log('- Verified heading and title responsiveness')
    console.log('- Checked custom responsive utility classes')
    console.log('- Screenshots saved for visual verification')
  } catch (error) {
    console.error('❌ Error during testing:', error)
  } finally {
    await browser.close()
  }
}

// Run the test
testResponsiveFonts().catch(console.error)
