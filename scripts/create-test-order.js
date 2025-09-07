const http = require('http');

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

function makeGetRequest(url) {
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

async function createTestOrder() {
  try {
    console.log('🚀 Creating test order...');

    // First, create a user
    console.log('Creating user...');
    const userData = {
      email: 'test.customer@example.com',
      password: 'password123',
      role: 'customer',
      firstName: 'Test',
      lastName: 'Customer',
      whatsappNumber: '+60123456999'
    };

    const userResponse = await makePostRequest('/api/users', userData);
    console.log('User created:', userResponse.id ? 'Success' : 'Failed');
    
    if (!userResponse.id) {
      console.log('User response:', userResponse);
      return;
    }

    // Create a vehicle
    console.log('Creating vehicle...');
    const vehicleData = {
      licensePlate: 'TEST123',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'White',
      owner: userResponse.id
    };

    const vehicleResponse = await makePostRequest('/api/vehicles', vehicleData);
    console.log('Vehicle created:', vehicleResponse.id ? 'Success' : 'Failed');
    
    if (!vehicleResponse.id) {
      console.log('Vehicle response:', vehicleResponse);
      return;
    }

    // Create an order with qrCodeGenerated: true
    console.log('Creating initiated order...');
    const orderData = {
      orderID: 'AX-TEST-001',
      customer: userResponse.id,
      vehicle: vehicleResponse.id,
      whatsappNumber: userData.whatsappNumber,
      qrCodeGenerated: true,
      qrCodeScannedAt: new Date().toISOString(),
      whatsappLinked: true,
      totalAmount: 25,
      paymentStatus: 'pending',
      overallStatus: 'initiated',
      queue: 'regular'
    };

    const orderResponse = await makePostRequest('/api/orders', orderData);
    console.log('Order created:', orderResponse.id ? 'Success' : 'Failed');
    
    if (orderResponse.id) {
      console.log(`✅ Test order created: ${orderResponse.orderID}`);
      
      // Now test the initiated orders endpoint
      console.log('\n🔍 Testing initiated orders endpoint...');
      const initiatedOrders = await makeGetRequest('http://localhost:3000/api/orders?where={"qrCodeGenerated":{"equals":true}}&depth=2');
      
      console.log(`Found ${initiatedOrders.docs?.length || 0} initiated orders`);
      if (initiatedOrders.docs && initiatedOrders.docs.length > 0) {
        initiatedOrders.docs.forEach((order, i) => {
          console.log(`Order ${i+1}: ${order.orderID}`);
          console.log(`Customer: ${order.customer?.firstName} ${order.customer?.lastName}`);
          console.log(`QR Generated: ${order.qrCodeGenerated}`);
        });
      }
    } else {
      console.log('Order response:', orderResponse);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestOrder();
