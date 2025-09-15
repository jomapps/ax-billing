import { chromium } from 'playwright'

async function testVehicleThumbnails() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('🌐 Navigating to real order page...')
    await page.goto('https://local.ft.tc/order/AX-20250915-4780/initiated')

    // Wait for page to load
    await page.waitForTimeout(3000)

    console.log('📋 Page title:', await page.title())

    // Check if Vehicle Capture section exists
    console.log('\n🔍 Checking Vehicle Capture section...')
    const vehicleCaptureSection = await page.locator('text=Vehicle Capture').first()
    const vehicleCaptureExists = await vehicleCaptureSection.isVisible()
    console.log('Vehicle Capture section visible:', vehicleCaptureExists)

    // Check for VehicleImageThumbnails component
    console.log('\n🖼️ Checking for image thumbnails...')
    const thumbnailsContainer = await page.locator('[data-testid="vehicle-image-thumbnails"]')
    const thumbnailsExist = await thumbnailsContainer.isVisible().catch(() => false)
    console.log('Thumbnails container visible:', thumbnailsExist)

    // Check for individual thumbnail images
    const thumbnailImages = await page.locator('img[alt*="Vehicle image"]')
    const thumbnailCount = await thumbnailImages.count()
    console.log('Number of thumbnail images found:', thumbnailCount)

    // Check for status badges
    const statusBadges = await page.locator('.bg-green-100, .bg-red-100, .bg-yellow-100')
    const badgeCount = await statusBadges.count()
    console.log('Number of status badges found:', badgeCount)

    // Check for reanalysis buttons
    const reanalysisButtons = await page.locator('button:has-text("Reanalyze")')
    const reanalysisButtonCount = await reanalysisButtons.count()
    console.log('Number of reanalysis buttons found:', reanalysisButtonCount)

    // Check the entire page content for debugging
    console.log('\n📄 Page content analysis...')
    const pageText = await page.textContent('body')
    const hasVehicleInfo = pageText.includes('Vehicle Information')
    const hasVehicleImages =
      pageText.includes('vehicle image') || pageText.includes('Vehicle image')
    const hasAnalysisStatus = pageText.includes('Analysis') || pageText.includes('analysis')

    console.log('Page contains "Vehicle Information":', hasVehicleInfo)
    console.log('Page contains vehicle image references:', hasVehicleImages)
    console.log('Page contains analysis references:', hasAnalysisStatus)

    // Check for VehicleInfoCard component
    console.log('\n🚗 Checking VehicleInfoCard component...')
    const vehicleInfoCard = await page.locator('.bg-white.rounded-lg.shadow-sm').first()
    const vehicleInfoExists = await vehicleInfoCard.isVisible().catch(() => false)
    console.log('VehicleInfoCard visible:', vehicleInfoExists)

    if (vehicleInfoExists) {
      const cardText = await vehicleInfoCard.textContent()
      console.log(
        'VehicleInfoCard contains thumbnails:',
        cardText.includes('thumbnail') || cardText.includes('image'),
      )
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'order-page-screenshot.png', fullPage: true })
    console.log('📸 Screenshot saved as order-page-screenshot.png')

    // Check console errors
    const consoleMessages = []
    page.on('console', (msg) => consoleMessages.push(msg.text()))
    await page.reload()
    await page.waitForTimeout(2000)

    console.log('\n🐛 Console messages:')
    consoleMessages.forEach((msg) => console.log('  -', msg))
  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await browser.close()
  }
}

testVehicleThumbnails()
