const puppeteer = require('puppeteer');

async function testHydration() {
  console.log('🔍 Testing for hydration errors...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Arrays to collect different types of errors
  const consoleErrors = [];
  const hydrationErrors = [];
  
  // Listen for console messages
  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      consoleErrors.push(text);
      
      // Check for hydration-specific errors
      if (text.includes('Hydration') || 
          text.includes('hydration') || 
          text.includes('throwOnInvalidObjectType') ||
          text.includes('reconcileChildFibersImpl') ||
          text.includes('server-side') ||
          text.includes('client-side')) {
        hydrationErrors.push(text);
      }
    }
  });
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    consoleErrors.push(`Page Error: ${error.message}`);
    if (error.message.includes('Hydration') || error.message.includes('hydration')) {
      hydrationErrors.push(`Page Error: ${error.message}`);
    }
  });
  
  try {
    console.log('📱 Navigating to homepage...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait a bit for any delayed hydration errors
    await page.waitForTimeout(3000);
    
    console.log('\n=== HYDRATION TEST RESULTS ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Hydration-specific errors: ${hydrationErrors.length}`);
    
    if (hydrationErrors.length > 0) {
      console.log('\n❌ HYDRATION ERRORS FOUND:');
      hydrationErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ NO HYDRATION ERRORS DETECTED!');
    }
    
    if (consoleErrors.length > 0 && hydrationErrors.length === 0) {
      console.log('\n⚠️  OTHER CONSOLE ERRORS (not hydration-related):');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Test basic functionality
    console.log('\n🧪 Testing basic page functionality...');
    
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const hasReactRoot = await page.evaluate(() => {
      return document.querySelector('[data-reactroot]') !== null || 
             document.querySelector('#__next') !== null;
    });
    console.log(`React root found: ${hasReactRoot ? '✅' : '❌'}`);
    
    const hasButtons = await page.evaluate(() => {
      return document.querySelectorAll('button').length > 0;
    });
    console.log(`Interactive buttons found: ${hasButtons ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testHydration().catch(console.error);
