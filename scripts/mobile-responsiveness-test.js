import { chromium } from 'playwright'
import fs from 'fs'

async function testMobileResponsiveness() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('🔍 Testing Mobile Responsiveness Across Pages...')

  const screenshotsDir = 'mobile-responsiveness-test'
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir)
  }

  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      passed: 0,
      failed: 0,
      total: 0
    }
  }

  const addTest = (name, passed, details) => {
    testResults.tests.push({ name, passed, details })
    testResults.summary.total++
    if (passed) testResults.summary.passed++
    else testResults.summary.failed++
    console.log(`${passed ? '✅' : '❌'} ${name}`)
  }

  // Test different viewports
  const viewports = [
    { width: 320, height: 568, name: 'Small Mobile' },
    { width: 375, height: 667, name: 'Mobile' },
    { width: 414, height: 896, name: 'Large Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop Small' }
  ]

  // Test pages
  const testPages = [
    { url: 'https://local.ft.tc/', name: 'Dashboard' },
    { url: 'https://local.ft.tc/order/AX-20250907-0699/initiated', name: 'Initiated Order' }
  ]

  try {
    for (const testPage of testPages) {
      console.log(`\n📄 Testing ${testPage.name}...`)
      
      try {
        await page.goto(testPage.url, { waitUntil: 'networkidle', timeout: 30000 })
        
        for (const viewport of viewports) {
          console.log(`  📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`)
          
          await page.setViewportSize({ width: viewport.width, height: viewport.height })
          
          // Wait for any animations to complete
          await page.waitForTimeout(1000)
          
          // Take screenshot
          const screenshotName = `${testPage.name.toLowerCase().replace(/\s+/g, '-')}-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`
          await page.screenshot({
            path: `${screenshotsDir}/${screenshotName}`,
            fullPage: true,
          })

          // Test for mobile issues
          const mobileTest = await page.evaluate((viewportWidth) => {
            const issues = []
            
            // Check for horizontal overflow
            const bodyScrollWidth = document.body.scrollWidth
            const bodyClientWidth = document.body.clientWidth
            const hasHorizontalScroll = bodyScrollWidth > bodyClientWidth
            
            if (hasHorizontalScroll) {
              issues.push({
                type: 'horizontal-overflow',
                overflow: bodyScrollWidth - bodyClientWidth
              })
            }

            // Check for elements breaking out of viewport
            const breakingElements = []
            const allElements = document.querySelectorAll('*')
            
            Array.from(allElements).slice(0, 50).forEach(el => {
              const rect = el.getBoundingClientRect()
              if (rect.right > viewportWidth && rect.width > 10) { // Ignore tiny elements
                breakingElements.push({
                  tagName: el.tagName.toLowerCase(),
                  className: el.className,
                  overflow: rect.right - viewportWidth,
                  width: rect.width
                })
              }
            })

            // Check touch targets (buttons should be at least 44px)
            const buttons = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]')
            const smallTouchTargets = Array.from(buttons).filter(btn => {
              const rect = btn.getBoundingClientRect()
              return (rect.width < 44 || rect.height < 44) && rect.width > 0 && rect.height > 0
            }).length

            // Check for text that might be too small
            const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6')
            const tinyText = Array.from(textElements).filter(el => {
              const styles = window.getComputedStyle(el)
              const fontSize = parseFloat(styles.fontSize)
              return fontSize < 12 && el.textContent.trim().length > 0
            }).length

            return {
              hasHorizontalScroll,
              breakingElementsCount: breakingElements.length,
              smallTouchTargetsCount: smallTouchTargets,
              tinyTextCount: tinyText,
              issues: issues.length,
              breakingElements: breakingElements.slice(0, 3) // First 3 for details
            }
          }, viewport.width)

          // Evaluate test results
          const testName = `${testPage.name} - ${viewport.name}`
          const passed = !mobileTest.hasHorizontalScroll && 
                       mobileTest.breakingElementsCount === 0 && 
                       mobileTest.smallTouchTargetsCount === 0

          addTest(testName, passed, {
            viewport: viewport,
            horizontalScroll: mobileTest.hasHorizontalScroll,
            breakingElements: mobileTest.breakingElementsCount,
            smallTouchTargets: mobileTest.smallTouchTargetsCount,
            tinyText: mobileTest.tinyTextCount,
            details: mobileTest.breakingElements
          })

          // Additional specific tests for mobile viewports
          if (viewport.width <= 414) {
            // Test navigation accessibility
            const navTest = await page.evaluate(() => {
              const navElements = document.querySelectorAll('nav, [role="navigation"], header')
              let navAccessible = true
              
              navElements.forEach(nav => {
                const rect = nav.getBoundingClientRect()
                if (rect.width > window.innerWidth) {
                  navAccessible = false
                }
              })

              return { navAccessible }
            })

            addTest(`${testName} - Navigation`, navTest.navAccessible, 'Navigation fits in viewport')

            // Test form elements
            const formTest = await page.evaluate(() => {
              const inputs = document.querySelectorAll('input, textarea, select')
              let formsAccessible = true
              
              Array.from(inputs).forEach(input => {
                const rect = input.getBoundingClientRect()
                if (rect.width > window.innerWidth * 0.95) {
                  formsAccessible = false
                }
              })

              return { formsAccessible }
            })

            addTest(`${testName} - Forms`, formTest.formsAccessible, 'Form elements fit properly')
          }
        }
      } catch (error) {
        console.error(`❌ Error testing ${testPage.name}:`, error.message)
        addTest(`${testPage.name} - Load Test`, false, error.message)
      }
    }

    // Generate summary report
    console.log('\n📊 Test Summary:')
    console.log(`✅ Passed: ${testResults.summary.passed}`)
    console.log(`❌ Failed: ${testResults.summary.failed}`)
    console.log(`📊 Total: ${testResults.summary.total}`)
    console.log(`🎯 Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`)

    // Detailed failure analysis
    const failures = testResults.tests.filter(test => !test.passed)
    if (failures.length > 0) {
      console.log('\n🔍 Failed Tests Analysis:')
      failures.forEach(failure => {
        console.log(`❌ ${failure.name}`)
        if (failure.details.horizontalScroll) {
          console.log(`   - Horizontal scroll detected`)
        }
        if (failure.details.breakingElements > 0) {
          console.log(`   - ${failure.details.breakingElements} elements breaking out of viewport`)
          failure.details.details?.forEach(el => {
            console.log(`     • ${el.tagName}.${el.className} overflows by ${el.overflow.toFixed(1)}px`)
          })
        }
        if (failure.details.smallTouchTargets > 0) {
          console.log(`   - ${failure.details.smallTouchTargets} touch targets too small`)
        }
      })
    }

    // Save detailed results
    fs.writeFileSync(
      `${screenshotsDir}/test-results.json`,
      JSON.stringify(testResults, null, 2)
    )

    console.log(`\n📁 Screenshots and results saved to: ${screenshotsDir}/`)
    console.log(`📄 Detailed report: ${screenshotsDir}/test-results.json`)

  } catch (error) {
    console.error('❌ Test error:', error)
  } finally {
    await browser.close()
  }

  return testResults.summary.failed === 0
}

// Run the test
testMobileResponsiveness()
  .then(success => {
    console.log(success ? '\n🎉 All mobile responsiveness tests passed!' : '\n⚠️  Some tests failed. Check the results above.')
    process.exit(success ? 0 : 1)
  })
  .catch(console.error)
