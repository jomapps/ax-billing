#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testVehicleCreationFix() {
  console.log('🔍 Testing Vehicle Creation Fix')
  console.log('=' .repeat(60))
  
  const baseUrl = 'http://localhost:3001'
  const orderId = 'AX-20250908-5336'
  
  try {
    console.log('🧪 Testing manual vehicle data entry (no media upload)...')
    console.log(`   Order ID: ${orderId}`)
    console.log('')
    
    // Test with manual data (no image upload)
    const formData = new FormData()
    formData.append('orderId', orderId)
    formData.append('useManualData', 'true')
    formData.append('licensePlate', 'TEST-123')
    formData.append('vehicleType', 'sedan')
    
    const response = await axios.post(
      `${baseUrl}/api/v1/staff/capture-vehicle`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    )
    
    console.log('✅ Manual vehicle data test successful!')
    console.log('📋 Response:')
    console.log(JSON.stringify(response.data, null, 2))
    
    if (response.data.success) {
      console.log('')
      console.log('🎉 Vehicle creation with manual data SUCCESSFUL!')
      console.log('✅ BSON ObjectId error has been FIXED!')
      
      if (response.data.vehicle) {
        console.log('🚗 Vehicle Details:')
        console.log(`   ID: ${response.data.vehicle.id}`)
        console.log(`   License Plate: ${response.data.vehicle.licensePlate}`)
        console.log(`   Vehicle Type: ${response.data.vehicle.vehicleType}`)
        console.log(`   Owner: ${response.data.vehicle.owner}`)
        console.log(`   Image: ${response.data.vehicle.image || 'None (manual entry)'}`)
      }
    } else {
      console.log('❌ Vehicle creation failed')
      console.log(`   Error: ${response.data.error}`)
    }
    
  } catch (error) {
    console.error('❌ Test failed:')
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`)
      console.error(`   Error: ${error.response.data?.error || error.message}`)
      
      if (error.response.data) {
        console.error('   Response data:')
        console.error(JSON.stringify(error.response.data, null, 2))
      }
      
      // Check if it's still a BSON error
      if (error.response.data?.error?.includes('BSON') || error.response.data?.error?.includes('24 character hex')) {
        console.log('')
        console.log('❌ BSON ObjectId error still exists!')
        console.log('   The fix needs more work.')
      }
    } else {
      console.error(`   Network error: ${error.message}`)
    }
    
    console.log('')
    console.log('❌ Vehicle creation test FAILED!')
  }
}

// Test the database connection and customer lookup
async function testCustomerLookup() {
  console.log('')
  console.log('🔧 Testing Customer Lookup')
  console.log('-' .repeat(40))
  
  try {
    const orderId = 'AX-20250908-5336'
    
    // Test if we can access the order and customer data
    const response = await axios.get(`http://localhost:3001/api/v1/orders/${orderId}`)
    
    if (response.data && response.data.customer) {
      console.log('✅ Customer lookup successful')
      console.log(`   Customer ID: ${response.data.customer.id || response.data.customer}`)
      console.log(`   Customer Type: ${typeof response.data.customer}`)
      
      if (typeof response.data.customer === 'object') {
        console.log(`   Customer Name: ${response.data.customer.name || 'N/A'}`)
        console.log(`   Customer Phone: ${response.data.customer.phone || 'N/A'}`)
      }
    } else {
      console.log('⚠️  No customer data found for order')
    }
    
  } catch (error) {
    console.log('⚠️  Could not test customer lookup (API might not exist)')
    console.log(`   Error: ${error.message}`)
  }
}

// Run the tests
console.log('Starting vehicle creation fix tests...\n')
await testVehicleCreationFix()
await testCustomerLookup()

console.log('\n' + '=' .repeat(60))
console.log('🏁 Test completed!')
console.log('')
console.log('💡 If the test passed:')
console.log('   ✅ BSON ObjectId error is fixed')
console.log('   ✅ PayloadCMS v3 media pattern is working')
console.log('   ✅ Vehicle creation with manual data works')
console.log('')
console.log('💡 Next: Test with actual image upload at:')
console.log('   http://localhost:3001/order/AX-20250908-5336/initiated')
