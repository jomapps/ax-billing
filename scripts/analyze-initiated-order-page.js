import { chromium } from 'playwright'
import fs from 'fs'

async function analyzeInitiatedOrderPage() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  console.log('🔍 Analyzing Initiated Order Page...')

  const screenshotsDir = 'initiated-order-analysis'
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir)
  }

  try {
    // Navigate to the initiated order page
    await page.goto('https://local.ft.tc/order/AX-20250907-0699/initiated', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })

    console.log('📱 Testing Mobile View Issues...')
    
    // Test mobile view (375x667)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.screenshot({
      path: `${screenshotsDir}/mobile-375x667-before.png`,
      fullPage: true,
    })

    // Analyze layout issues
    const mobileIssues = await page.evaluate(() => {
      const issues = []
      const viewport = { width: window.innerWidth, height: window.innerHeight }
      
      // Check for horizontal overflow
      const bodyScrollWidth = document.body.scrollWidth
      const bodyClientWidth = document.body.clientWidth
      const hasHorizontalScroll = bodyScrollWidth > bodyClientWidth
      
      if (hasHorizontalScroll) {
        issues.push({
          type: 'horizontal-overflow',
          description: 'Page has horizontal scroll',
          scrollWidth: bodyScrollWidth,
          clientWidth: bodyClientWidth,
          overflow: bodyScrollWidth - bodyClientWidth
        })
      }

      // Check for elements breaking out of containers
      const allElements = document.querySelectorAll('*')
      const breakingElements = []
      
      allElements.forEach((el, index) => {
        if (index > 100) return // Limit to first 100 elements for performance
        
        const rect = el.getBoundingClientRect()
        const styles = window.getComputedStyle(el)
        
        // Check if element extends beyond viewport
        if (rect.right > viewport.width) {
          const tagName = el.tagName.toLowerCase()
          const classes = el.className
          const id = el.id
          
          breakingElements.push({
            element: `${tagName}${id ? '#' + id : ''}${classes ? '.' + classes.split(' ').join('.') : ''}`,
            right: rect.right,
            width: rect.width,
            overflow: rect.right - viewport.width,
            position: styles.position,
            display: styles.display,
            textContent: el.textContent ? el.textContent.substring(0, 50) + '...' : ''
          })
        }
      })

      // Check for specific problematic patterns
      const wideElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const rect = el.getBoundingClientRect()
        return rect.width > viewport.width
      }).slice(0, 10).map(el => ({
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        width: el.getBoundingClientRect().width,
        computedWidth: window.getComputedStyle(el).width,
        textContent: el.textContent ? el.textContent.substring(0, 30) + '...' : ''
      }))

      // Check for fixed widths that might cause issues
      const fixedWidthElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const styles = window.getComputedStyle(el)
        const width = styles.width
        return width && width.includes('px') && parseInt(width) > viewport.width
      }).slice(0, 5).map(el => ({
        tagName: el.tagName.toLowerCase(),
        className: el.className,
        width: window.getComputedStyle(el).width,
        textContent: el.textContent ? el.textContent.substring(0, 30) + '...' : ''
      }))

      // Check for tables or grids that might overflow
      const tables = Array.from(document.querySelectorAll('table, [class*="grid"], [class*="flex"]')).map(el => {
        const rect = el.getBoundingClientRect()
        const styles = window.getComputedStyle(el)
        return {
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          width: rect.width,
          overflows: rect.width > viewport.width,
          display: styles.display,
          gridTemplateColumns: styles.gridTemplateColumns,
          flexDirection: styles.flexDirection
        }
      })

      return {
        viewport,
        hasHorizontalScroll,
        breakingElements: breakingElements.slice(0, 10),
        wideElements,
        fixedWidthElements,
        tables,
        totalIssues: issues.length + breakingElements.length
      }
    })

    console.log('📊 Mobile Analysis Results:')
    console.log(`- Horizontal scroll: ${mobileIssues.hasHorizontalScroll ? 'YES' : 'NO'}`)
    console.log(`- Breaking elements: ${mobileIssues.breakingElements.length}`)
    console.log(`- Wide elements: ${mobileIssues.wideElements.length}`)
    console.log(`- Fixed width elements: ${mobileIssues.fixedWidthElements.length}`)

    // Test small mobile view (320x568)
    console.log('📱 Testing Small Mobile View...')
    await page.setViewportSize({ width: 320, height: 568 })
    await page.screenshot({
      path: `${screenshotsDir}/mobile-320x568-before.png`,
      fullPage: true,
    })

    // Test tablet view for comparison
    console.log('📱 Testing Tablet View...')
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.screenshot({
      path: `${screenshotsDir}/tablet-768x1024-before.png`,
      fullPage: true,
    })

    // Analyze specific components that might be problematic
    const componentAnalysis = await page.evaluate(() => {
      const components = []
      
      // Check forms
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        const rect = form.getBoundingClientRect()
        components.push({
          type: 'form',
          width: rect.width,
          className: form.className,
          hasOverflow: rect.width > window.innerWidth
        })
      })

      // Check buttons
      const buttons = document.querySelectorAll('button')
      const buttonIssues = Array.from(buttons).filter(btn => {
        const rect = btn.getBoundingClientRect()
        return rect.width > window.innerWidth * 0.9 // Buttons taking more than 90% width
      }).map(btn => ({
        type: 'button',
        width: btn.getBoundingClientRect().width,
        className: btn.className,
        textContent: btn.textContent.substring(0, 30)
      }))

      // Check cards
      const cards = document.querySelectorAll('[class*="card"], .card')
      const cardIssues = Array.from(cards).filter(card => {
        const rect = card.getBoundingClientRect()
        return rect.width > window.innerWidth
      }).map(card => ({
        type: 'card',
        width: card.getBoundingClientRect().width,
        className: card.className
      }))

      // Check inputs
      const inputs = document.querySelectorAll('input, textarea, select')
      const inputIssues = Array.from(inputs).filter(input => {
        const rect = input.getBoundingClientRect()
        return rect.width > window.innerWidth * 0.95
      }).map(input => ({
        type: 'input',
        width: input.getBoundingClientRect().width,
        className: input.className,
        type: input.type || input.tagName.toLowerCase()
      }))

      return {
        forms: components,
        buttonIssues,
        cardIssues,
        inputIssues
      }
    })

    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      url: 'https://local.ft.tc/order/AX-20250907-0699/initiated',
      mobileIssues,
      componentAnalysis,
      recommendations: []
    }

    // Generate recommendations based on findings
    if (mobileIssues.hasHorizontalScroll) {
      report.recommendations.push({
        priority: 'high',
        issue: 'Horizontal scroll detected',
        solution: 'Add overflow-x: hidden to body or implement responsive containers'
      })
    }

    if (mobileIssues.breakingElements.length > 0) {
      report.recommendations.push({
        priority: 'high',
        issue: `${mobileIssues.breakingElements.length} elements breaking out of viewport`,
        solution: 'Apply max-width: 100% and proper responsive classes to breaking elements'
      })
    }

    if (mobileIssues.fixedWidthElements.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        issue: 'Fixed width elements detected',
        solution: 'Replace fixed widths with responsive units (%, vw, or max-width)'
      })
    }

    if (componentAnalysis.cardIssues.length > 0) {
      report.recommendations.push({
        priority: 'medium',
        issue: 'Cards overflowing on mobile',
        solution: 'Apply responsive padding and max-width to card components'
      })
    }

    // Save report
    fs.writeFileSync(
      `${screenshotsDir}/analysis-report.json`,
      JSON.stringify(report, null, 2)
    )

    console.log('\n📋 Issues Summary:')
    if (mobileIssues.breakingElements.length > 0) {
      console.log('🔴 Breaking Elements:')
      mobileIssues.breakingElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.element} - overflows by ${el.overflow.toFixed(1)}px`)
      })
    }

    if (mobileIssues.wideElements.length > 0) {
      console.log('🟡 Wide Elements:')
      mobileIssues.wideElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tagName}.${el.className} - width: ${el.width.toFixed(1)}px`)
      })
    }

    console.log('\n💡 Recommendations:')
    report.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`)
      console.log(`   Solution: ${rec.solution}`)
    })

    console.log(`\n📁 Analysis complete! Files saved to: ${screenshotsDir}/`)
    console.log(`📄 Detailed report: ${screenshotsDir}/analysis-report.json`)

  } catch (error) {
    console.error('❌ Error analyzing page:', error)
  } finally {
    await browser.close()
  }
}

// Run the analysis
analyzeInitiatedOrderPage().catch(console.error)
