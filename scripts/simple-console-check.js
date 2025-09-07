const https = require('https');
const http = require('http');

async function checkHomepage() {
  console.log('🔍 Checking homepage for basic functionality...');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/staff-dashboard', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Homepage responded with status: ${res.statusCode}`);
        
        // Check for basic React elements
        const hasReact = data.includes('__NEXT_DATA__');
        const hasTitle = data.includes('<title>');
        const hasBody = data.includes('<body>');
        
        console.log(`React app detected: ${hasReact ? '✅' : '❌'}`);
        console.log(`Has title tag: ${hasTitle ? '✅' : '❌'}`);
        console.log(`Has body tag: ${hasBody ? '✅' : '❌'}`);
        
        // Check for obvious error indicators in HTML
        const hasError = data.toLowerCase().includes('error') || 
                        data.toLowerCase().includes('failed') ||
                        data.toLowerCase().includes('undefined');
        
        if (hasError) {
          console.log('⚠️  Potential error indicators found in HTML');
        } else {
          console.log('✅ No obvious error indicators in HTML');
        }
        
        resolve({
          status: res.statusCode,
          hasReact,
          hasTitle,
          hasBody,
          hasError
        });
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      console.error('❌ Request timed out');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkAPI() {
  console.log('\n🔍 Checking API endpoints...');
  
  const endpoints = [
    '/api/orders',
    '/api/orders?limit=5'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            console.log(`${endpoint}: ${res.statusCode === 200 ? '✅' : '❌'} ${res.statusCode}`);
            
            if (res.statusCode === 200) {
              try {
                const json = JSON.parse(data);
                console.log(`  - Response is valid JSON: ✅`);
                console.log(`  - Has docs array: ${json.docs ? '✅' : '❌'}`);
              } catch (e) {
                console.log(`  - Response is NOT valid JSON: ❌`);
              }
            }
            
            resolve();
          });
        });
        
        req.on('error', (err) => {
          console.log(`${endpoint}: ❌ ${err.message}`);
          resolve();
        });
        
        req.setTimeout(5000, () => {
          console.log(`${endpoint}: ❌ Timeout`);
          req.destroy();
          resolve();
        });
      });
    } catch (error) {
      console.log(`${endpoint}: ❌ ${error.message}`);
    }
  }
}

async function main() {
  console.log('=== SIMPLE CONSOLE CHECK ===\n');
  
  try {
    await checkHomepage();
    await checkAPI();
    
    console.log('\n=== SUMMARY ===');
    console.log('✅ Basic functionality check completed');
    console.log('📝 For detailed console error analysis, open browser dev tools');
    console.log('🌐 Homepage: http://localhost:3000/staff-dashboard');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

main();
