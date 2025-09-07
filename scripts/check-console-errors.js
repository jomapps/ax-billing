const puppeteer = require('puppeteer');

async function checkConsoleErrors() {
  console.log('🔍 Starting console error check...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Arrays to collect different types of errors
  const consoleErrors = [];
  const consoleWarnings = [];
  const consoleMessages = [];
  const networkErrors = [];
  const pageErrors = [];
  
  // Listen for console messages
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    consoleMessages.push(`[${type}] ${text}`);
    
    if (type === 'error') {
      consoleErrors.push(text);
    } else if (type === 'warning') {
      consoleWarnings.push(text);
    }
  });
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });
  
  // Listen for failed network requests
  page.on('response', (response) => {
    if (!response.ok()) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('📱 Navigating to homepage...');
    await page.goto('http://localhost:3000/staff-dashboard', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to fully load...');
    await page.waitForTimeout(5000);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'homepage-debug.png', fullPage: true });
    
    console.log('\n=== CONSOLE ERRORS ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((error, index) => {
        console.log(`❌ ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No console errors found!');
    }
    
    console.log('\n=== CONSOLE WARNINGS ===');
    if (consoleWarnings.length > 0) {
      consoleWarnings.forEach((warning, index) => {
        console.log(`⚠️  ${index + 1}. ${warning}`);
      });
    } else {
      console.log('✅ No console warnings found!');
    }
    
    console.log('\n=== PAGE ERRORS ===');
    if (pageErrors.length > 0) {
      pageErrors.forEach((error, index) => {
        console.log(`💥 ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No page errors found!');
    }
    
    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length > 0) {
      networkErrors.forEach((error, index) => {
        console.log(`🌐 ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No network errors found!');
    }
    
    console.log('\n=== ALL CONSOLE MESSAGES ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Console warnings: ${consoleWarnings.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Network errors: ${networkErrors.length}`);
    
  } catch (error) {
    console.error('❌ Error during page check:', error.message);
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
  }
}

checkConsoleErrors().catch(console.error);
