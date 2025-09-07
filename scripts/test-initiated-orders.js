const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testInitiatedOrders() {
  try {
    console.log('🔍 Testing initiated orders API...');
    
    // Test the initiated orders endpoint
    const initiatedResponse = await makeRequest('http://localhost:3000/api/orders?where={"qrCodeGenerated":{"equals":true}}&depth=2&limit=5');
    
    console.log('\n📊 Initiated Orders (qrCodeGenerated: true):');
    console.log(`Found ${initiatedResponse.docs?.length || 0} orders`);
    
    if (initiatedResponse.docs && initiatedResponse.docs.length > 0) {
      initiatedResponse.docs.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1}: ${order.orderID} ---`);
        console.log('Customer type:', typeof order.customer);
        
        if (order.customer && typeof order.customer === 'object') {
          console.log(`Customer: ${order.customer.firstName} ${order.customer.lastName}`);
          console.log('Customer email:', order.customer.email);
        } else {
          console.log('Customer:', order.customer);
        }
        
        console.log('Overall status:', order.overallStatus);
        console.log('QR Code Generated:', order.qrCodeGenerated);
        console.log('QR Code Scanned At:', order.qrCodeScannedAt);
        console.log('WhatsApp Number:', order.whatsappNumber);
      });
    } else {
      console.log('❌ No initiated orders found');
      
      // Check if there are any orders at all
      console.log('\n🔍 Checking for any orders...');
      const allOrdersResponse = await makeRequest('http://localhost:3000/api/orders?limit=5&depth=2');
      console.log(`Found ${allOrdersResponse.docs?.length || 0} total orders`);
      
      if (allOrdersResponse.docs && allOrdersResponse.docs.length > 0) {
        allOrdersResponse.docs.forEach((order, index) => {
          console.log(`Order ${index + 1}: ${order.orderID} - QR Generated: ${order.qrCodeGenerated}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInitiatedOrders();
