const http = require('http');

async function testCustomerData() {
  console.log('🔍 Testing customer data structure...');
  
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000/api/orders?limit=1&depth=2', (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('✅ API Response Status:', res.statusCode);
          
          if (json.docs && json.docs.length > 0) {
            const order = json.docs[0];
            console.log('\n📋 Order Structure:');
            console.log('- Order ID:', order.orderID);
            console.log('- Customer Type:', typeof order.customer);
            
            if (order.customer && typeof order.customer === 'object') {
              console.log('- Customer Object Keys:', Object.keys(order.customer));
              console.log('- Customer firstName:', order.customer.firstName);
              console.log('- Customer lastName:', order.customer.lastName);
              console.log('- Customer email:', order.customer.email);
              
              const fullName = `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim();
              console.log('- Computed Full Name:', fullName || 'Unknown Customer');
            } else {
              console.log('- Customer:', order.customer);
            }
            
            console.log('\n🚗 Vehicle Info:');
            if (order.vehicle && typeof order.vehicle === 'object') {
              console.log('- Vehicle Type:', typeof order.vehicle);
              console.log('- License Plate:', order.vehicle.licensePlate);
            } else {
              console.log('- Vehicle:', order.vehicle);
            }
            
          } else {
            console.log('❌ No orders found in response');
          }
          
          resolve();
        } catch (error) {
          console.error('❌ Failed to parse JSON:', error.message);
          console.log('Raw response:', data.substring(0, 500));
          reject(error);
        }
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

testCustomerData().catch(console.error);
