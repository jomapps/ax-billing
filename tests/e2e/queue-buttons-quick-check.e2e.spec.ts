import { test, expect } from '@playwright/test'

test.describe('Queue Buttons Quick Check', () => {
  test('should verify queue buttons are now properly styled', async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(5000)
    
    console.log('=== QUEUE BUTTONS STYLING CHECK ===')
    
    // Take screenshot
    await page.screenshot({ path: 'queue-buttons-improved.png', fullPage: true })
    
    // Find and analyze queue buttons
    const queueButtonAnalysis = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'))
      const queueButtons = allButtons.filter(btn => {
        const text = btn.textContent?.toLowerCase() || ''
        return text.includes('all') || text.includes('vip') || text.includes('regular') || text.includes('remnant')
      })
      
      return queueButtons.map((btn, index) => {
        const styles = window.getComputedStyle(btn)
        const rect = btn.getBoundingClientRect()
        
        return {
          index,
          text: btn.textContent?.trim(),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          backgroundColor: styles.backgroundColor,
          borderColor: styles.borderColor,
          borderRadius: styles.borderRadius,
          color: styles.color,
          fontSize: styles.fontSize,
          fontWeight: styles.fontWeight,
          boxShadow: styles.boxShadow,
          backgroundImage: styles.backgroundImage
        }
      })
    })
    
    console.log(`Found ${queueButtonAnalysis.length} queue buttons:`)
    
    queueButtonAnalysis.forEach(btn => {
      console.log(`\nButton "${btn.text}":`)
      console.log(`  Size: ${btn.width}x${btn.height}px`)
      console.log(`  Background: ${btn.backgroundColor}`)
      console.log(`  Background Image: ${btn.backgroundImage}`)
      console.log(`  Border Color: ${btn.borderColor}`)
      console.log(`  Border Radius: ${btn.borderRadius}`)
      console.log(`  Text Color: ${btn.color}`)
      console.log(`  Font: ${btn.fontSize} weight ${btn.fontWeight}`)
      console.log(`  Box Shadow: ${btn.boxShadow}`)
    })
    
    // Check for gaming improvements
    const improvements = queueButtonAnalysis.map(btn => {
      const hasGamingBackground = btn.backgroundColor !== 'rgb(239, 239, 239)' && btn.backgroundColor !== 'rgba(0, 0, 0, 0)'
      const hasGradient = btn.backgroundImage.includes('gradient')
      const hasRoundedCorners = parseFloat(btn.borderRadius) >= 6
      const hasGamingBorder = !btn.borderColor.includes('0, 0, 0')
      const hasProperShadow = btn.boxShadow !== 'none'
      const hasGamingFont = btn.fontSize !== '13.3333px'
      
      return {
        text: btn.text,
        hasGamingBackground,
        hasGradient,
        hasRoundedCorners,
        hasGamingBorder,
        hasProperShadow,
        hasGamingFont,
        score: [hasGamingBackground, hasGradient, hasRoundedCorners, hasGamingBorder, hasProperShadow, hasGamingFont].filter(Boolean).length
      }
    })
    
    console.log('\n=== GAMING STYLE IMPROVEMENTS ===')
    improvements.forEach(improvement => {
      console.log(`\nButton "${improvement.text}" (Score: ${improvement.score}/6):`)
      console.log(`  ${improvement.hasGamingBackground ? '✅' : '❌'} Gaming background`)
      console.log(`  ${improvement.hasGradient ? '✅' : '❌'} Gradient effect`)
      console.log(`  ${improvement.hasRoundedCorners ? '✅' : '❌'} Rounded corners`)
      console.log(`  ${improvement.hasGamingBorder ? '✅' : '❌'} Gaming border`)
      console.log(`  ${improvement.hasProperShadow ? '✅' : '❌'} Gaming shadow`)
      console.log(`  ${improvement.hasGamingFont ? '✅' : '❌'} Gaming font`)
    })
    
    const averageScore = improvements.reduce((sum, imp) => sum + imp.score, 0) / improvements.length
    console.log(`\n🎯 OVERALL IMPROVEMENT SCORE: ${averageScore.toFixed(1)}/6 (${Math.round(averageScore/6*100)}%)`)
    
    const allButtonsImproved = improvements.every(imp => imp.score >= 4)
    console.log(`${allButtonsImproved ? '✅' : '❌'} All buttons properly styled: ${allButtonsImproved}`)
    
    expect(queueButtonAnalysis.length).toBeGreaterThan(0)
    expect(averageScore).toBeGreaterThan(3) // At least 50% improvement
  })
})
