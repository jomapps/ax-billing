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
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function debugCustomerData() {
  try {
    console.log('🔍 Fetching orders with QR codes generated...');
    const ordersResponse = await makeRequest('http://localhost:3000/api/orders?where={"qrCodeGenerated":{"equals":true}}&depth=2&limit=3');
    
    if (ordersResponse.docs && ordersResponse.docs.length > 0) {
      console.log(`\n📊 Found ${ordersResponse.docs.length} orders with QR codes`);
      
      ordersResponse.docs.forEach((order, index) => {
        console.log(`\n--- Order ${index + 1}: ${order.orderID} ---`);
        console.log('Customer field type:', typeof order.customer);
        console.log('Customer field value:', order.customer);
        
        if (order.customer && typeof order.customer === 'object') {
          console.log('Customer ID:', order.customer.id);
          console.log('Customer firstName:', order.customer.firstName);
          console.log('Customer lastName:', order.customer.lastName);
          console.log('Customer email:', order.customer.email);
          
          const fullName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
          console.log('Computed full name:', fullName || 'Unknown Customer');
        } else if (typeof order.customer === 'string') {
          console.log('Customer is a string ID:', order.customer);
        } else {
          console.log('Customer is null or undefined');
        }
        
        console.log('Overall status:', order.overallStatus);
        console.log('QR Code Generated:', order.qrCodeGenerated);
        console.log('Created at:', order.createdAt);
      });
    } else {
      console.log('\n❌ No orders found with QR codes generated');
      
      // Try to fetch any orders
      console.log('\n🔍 Fetching any orders...');
      const anyOrdersResponse = await makeRequest('http://localhost:3000/api/orders?limit=3&depth=2');
      
      if (anyOrdersResponse.docs && anyOrdersResponse.docs.length > 0) {
        console.log(`\n📊 Found ${anyOrdersResponse.docs.length} total orders`);
        
        anyOrdersResponse.docs.forEach((order, index) => {
          console.log(`\n--- Order ${index + 1}: ${order.orderID} ---`);
          console.log('Customer field:', order.customer);
          console.log('QR Code Generated:', order.qrCodeGenerated);
          console.log('Overall status:', order.overallStatus);
        });
      } else {
        console.log('\n❌ No orders found at all');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCustomerData();
