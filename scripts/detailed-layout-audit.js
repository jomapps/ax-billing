import { chromium } from 'playwright'
import fs from 'fs'

async function detailedLayoutAudit() {
  console.log('🔍 Starting detailed layout audit...')
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  try {
    // Navigate to the main page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    
    // Wait for content to load
    await page.waitForTimeout(2000)

    console.log('📊 Analyzing grid containers...')
    
    // Find all grid containers
    const gridContainers = await page.locator('[class*="grid"]').all()
    
    for (let i = 0; i < gridContainers.length; i++) {
      const container = gridContainers[i]
      const analysis = await container.evaluate(el => {
        const computed = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return {
          className: el.className,
          display: computed.display,
          gridTemplateColumns: computed.gridTemplateColumns,
          gridGap: computed.gridGap,
          gap: computed.gap,
          width: rect.width,
          height: rect.height,
          childCount: el.children.length,
          innerHTML: el.innerHTML.substring(0, 200) + '...'
        }
      })
      
      console.log(`\n🏗️ Grid Container ${i + 1}:`)
      console.log(`  Classes: ${analysis.className}`)
      console.log(`  Display: ${analysis.display}`)
      console.log(`  Grid Template Columns: ${analysis.gridTemplateColumns}`)
      console.log(`  Gap: ${analysis.gap || analysis.gridGap}`)
      console.log(`  Size: ${analysis.width}x${analysis.height}`)
      console.log(`  Children: ${analysis.childCount}`)
      
      // Check if this container has card children
      const cardChildren = await container.locator('[class*="card"], .card').all()
      if (cardChildren.length > 0) {
        console.log(`  📦 Contains ${cardChildren.length} card(s)`)
        
        for (let j = 0; j < Math.min(cardChildren.length, 3); j++) {
          const card = cardChildren[j]
          const cardAnalysis = await card.evaluate(el => {
            const computed = window.getComputedStyle(el)
            const rect = el.getBoundingClientRect()
            return {
              className: el.className,
              display: computed.display,
              width: rect.width,
              height: rect.height,
              flexBasis: computed.flexBasis,
              gridColumn: computed.gridColumn,
              gridRow: computed.gridRow,
              position: computed.position,
              float: computed.float
            }
          })
          
          console.log(`    🃏 Card ${j + 1}:`)
          console.log(`      Classes: ${cardAnalysis.className}`)
          console.log(`      Size: ${cardAnalysis.width}x${cardAnalysis.height}`)
          console.log(`      Display: ${cardAnalysis.display}`)
          console.log(`      Grid Column: ${cardAnalysis.gridColumn}`)
          console.log(`      Flex Basis: ${cardAnalysis.flexBasis}`)
        }
      }
    }

    // Check for potential layout issues
    console.log('\n🚨 Checking for layout issues...')
    
    // Look for cards that are too wide
    const allCards = await page.locator('[class*="card"], .card').all()
    const layoutIssues = []
    
    for (let i = 0; i < allCards.length; i++) {
      const card = allCards[i]
      const rect = await card.boundingBox()
      
      if (rect && rect.width > 800) {
        layoutIssues.push(`Card ${i + 1} is too wide: ${rect.width}px`)
      }
      
      if (rect && rect.width > 1500) {
        layoutIssues.push(`Card ${i + 1} is taking full row: ${rect.width}px`)
      }
    }
    
    if (layoutIssues.length > 0) {
      console.log('❌ Layout Issues Found:')
      layoutIssues.forEach(issue => console.log(`  - ${issue}`))
    } else {
      console.log('✅ No obvious layout issues detected')
    }

    // Check Tailwind CSS classes
    console.log('\n🎨 Checking Tailwind CSS compilation...')
    
    const tailwindCheck = await page.evaluate(() => {
      // Check if grid classes are working
      const testEl = document.createElement('div')
      testEl.className = 'grid grid-cols-3 gap-4'
      document.body.appendChild(testEl)
      
      const computed = window.getComputedStyle(testEl)
      const result = {
        display: computed.display,
        gridTemplateColumns: computed.gridTemplateColumns,
        gap: computed.gap
      }
      
      document.body.removeChild(testEl)
      return result
    })
    
    console.log('Tailwind Grid Test:')
    console.log(`  Display: ${tailwindCheck.display}`)
    console.log(`  Grid Template Columns: ${tailwindCheck.gridTemplateColumns}`)
    console.log(`  Gap: ${tailwindCheck.gap}`)
    
    if (tailwindCheck.display !== 'grid') {
      console.log('❌ Tailwind CSS grid classes not working properly!')
    } else {
      console.log('✅ Tailwind CSS grid classes working correctly')
    }

    // Take a final screenshot with annotations
    await page.addStyleTag({
      content: `
        [class*="grid"] {
          outline: 2px solid red !important;
          outline-offset: -2px !important;
        }
        [class*="card"], .card {
          outline: 2px solid blue !important;
          outline-offset: -2px !important;
        }
      `
    })
    
    await page.screenshot({ 
      path: 'audit-screenshots/annotated-layout.png', 
      fullPage: true 
    })
    console.log('📸 Annotated screenshot saved: audit-screenshots/annotated-layout.png')

  } catch (error) {
    console.error('❌ Error during detailed audit:', error)
  } finally {
    await browser.close()
  }
}

// Create screenshots directory
if (!fs.existsSync('audit-screenshots')) {
  fs.mkdirSync('audit-screenshots')
}

detailedLayoutAudit().catch(console.error)
