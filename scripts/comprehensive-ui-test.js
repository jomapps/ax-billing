import { chromium } from 'playwright'
import fs from 'fs'

async function comprehensiveUITest() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('🚀 Starting Comprehensive UI Test...')

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

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' })

    // Test 1: Font Size Validation
    console.log('\n📝 Testing Font Sizes...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    const fontSizes = await page.evaluate(() => {
      const h1 = document.querySelector('h1')
      const h2 = document.querySelector('h2')
      const h3 = document.querySelector('h3')
      
      return {
        h1: h1 ? parseFloat(window.getComputedStyle(h1).fontSize) : 0,
        h2: h2 ? parseFloat(window.getComputedStyle(h2).fontSize) : 0,
        h3: h3 ? parseFloat(window.getComputedStyle(h3).fontSize) : 0,
      }
    })

    addTest('H1 font size is reasonable (< 36px)', fontSizes.h1 < 36, `H1: ${fontSizes.h1}px`)
    addTest('H2 font size is reasonable (< 28px)', fontSizes.h2 < 28, `H2: ${fontSizes.h2}px`)
    addTest('H3 font size is reasonable (< 24px)', fontSizes.h3 < 24, `H3: ${fontSizes.h3}px`)

    // Test 2: Mobile Responsiveness
    console.log('\n📱 Testing Mobile Responsiveness...')
    await page.setViewportSize({ width: 375, height: 667 })
    
    const mobileLayout = await page.evaluate(() => {
      const statsGrid = document.querySelector('[class*="grid"]')
      const buttons = Array.from(document.querySelectorAll('button'))
      
      const buttonSizes = buttons.slice(0, 5).map(btn => {
        const rect = btn.getBoundingClientRect()
        return {
          width: rect.width,
          height: rect.height,
          meetsMinimum: rect.width >= 44 && rect.height >= 44
        }
      })

      return {
        hasGrid: !!statsGrid,
        buttonSizes,
        allButtonsMeetMinimum: buttonSizes.every(btn => btn.meetsMinimum)
      }
    })

    addTest('Mobile layout has grid system', mobileLayout.hasGrid, 'Grid system detected')
    addTest('All buttons meet touch target minimum (44px)', mobileLayout.allButtonsMeetMinimum, 
      `Button sizes: ${mobileLayout.buttonSizes.map(b => `${b.width}x${b.height}`).join(', ')}`)

    // Test 3: Information Density
    console.log('\n📊 Testing Information Density...')
    const densityTest = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card"], .card')
      const orderCards = document.querySelectorAll('[class*="order"]')
      
      let totalPadding = 0
      let cardCount = 0
      
      cards.forEach(card => {
        const styles = window.getComputedStyle(card)
        const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
        if (padding > 0) {
          totalPadding += padding
          cardCount++
        }
      })

      const avgPadding = cardCount > 0 ? totalPadding / cardCount : 0

      return {
        totalCards: cards.length,
        orderCards: orderCards.length,
        avgPadding,
        hasCompactLayout: avgPadding < 32 // Less than 32px total padding is considered compact
      }
    })

    addTest('Layout uses compact padding', densityTest.hasCompactLayout, 
      `Average padding: ${densityTest.avgPadding.toFixed(1)}px`)
    addTest('Multiple cards visible', densityTest.totalCards >= 4, 
      `${densityTest.totalCards} cards found`)

    // Test 4: Responsive Breakpoints
    console.log('\n📐 Testing Responsive Breakpoints...')
    const breakpoints = [
      { width: 320, height: 568, name: 'Small Mobile' },
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ]

    let responsiveTests = []
    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height })
      
      const layoutInfo = await page.evaluate(() => {
        const grids = document.querySelectorAll('[class*="grid"]')
        const visibleContent = document.querySelector('main')
        
        return {
          hasGrids: grids.length > 0,
          contentVisible: visibleContent && visibleContent.offsetHeight > 0,
          noHorizontalScroll: document.documentElement.scrollWidth <= window.innerWidth
        }
      })

      const allGood = layoutInfo.hasGrids && layoutInfo.contentVisible && layoutInfo.noHorizontalScroll
      responsiveTests.push({ breakpoint: bp.name, passed: allGood, details: layoutInfo })
    }

    const allBreakpointsWork = responsiveTests.every(test => test.passed)
    addTest('All responsive breakpoints work', allBreakpointsWork, 
      `${responsiveTests.filter(t => t.passed).length}/${responsiveTests.length} breakpoints passed`)

    // Test 5: Performance and Accessibility
    console.log('\n⚡ Testing Performance and Accessibility...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    const performanceTest = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      const buttons = document.querySelectorAll('button')
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      
      let accessibilityScore = 0
      let totalChecks = 0

      // Check if images have alt text
      images.forEach(img => {
        totalChecks++
        if (img.alt && img.alt.trim() !== '') accessibilityScore++
      })

      // Check if buttons have accessible text
      buttons.forEach(btn => {
        totalChecks++
        if (btn.textContent && btn.textContent.trim() !== '') accessibilityScore++
      })

      // Check heading hierarchy
      totalChecks++
      if (headings.length > 0) accessibilityScore++

      return {
        accessibilityScore: totalChecks > 0 ? (accessibilityScore / totalChecks) * 100 : 100,
        totalElements: images.length + buttons.length + headings.length,
        loadTime: performance.now()
      }
    })

    addTest('Good accessibility score', performanceTest.accessibilityScore >= 80, 
      `${performanceTest.accessibilityScore.toFixed(1)}% accessibility score`)
    addTest('Fast load time', performanceTest.loadTime < 5000, 
      `${performanceTest.loadTime.toFixed(0)}ms load time`)

    // Test 6: Visual Regression Check
    console.log('\n📸 Taking final screenshots...')
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.screenshot({ path: 'ui-analysis-screenshots/final-desktop.png', fullPage: true })
    
    await page.setViewportSize({ width: 375, height: 667 })
    await page.screenshot({ path: 'ui-analysis-screenshots/final-mobile.png', fullPage: true })

    addTest('Screenshots captured successfully', true, 'Desktop and mobile screenshots saved')

  } catch (error) {
    console.error('❌ Test error:', error)
    addTest('Test execution', false, error.message)
  } finally {
    await browser.close()
  }

  // Generate final report
  console.log('\n📋 Test Summary:')
  console.log(`✅ Passed: ${testResults.summary.passed}`)
  console.log(`❌ Failed: ${testResults.summary.failed}`)
  console.log(`📊 Total: ${testResults.summary.total}`)
  console.log(`🎯 Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`)

  // Save detailed results
  fs.writeFileSync('ui-analysis-screenshots/comprehensive-test-results.json', 
    JSON.stringify(testResults, null, 2))

  console.log('\n📄 Detailed results saved to: ui-analysis-screenshots/comprehensive-test-results.json')
  
  return testResults.summary.failed === 0
}

// Run the comprehensive test
comprehensiveUITest()
  .then(success => {
    console.log(success ? '\n🎉 All tests passed!' : '\n⚠️  Some tests failed. Check the results above.')
    process.exit(success ? 0 : 1)
  })
  .catch(console.error)
