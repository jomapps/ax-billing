#!/usr/bin/env node

import axios from 'axios'

const APP_URL = 'http://localhost:3000'

async function testVehicleCreation() {
  try {
    console.log('🧪 Testing vehicle creation...')

    // Step 1: Create a customer first
    console.log('👤 Step 1: Creating customer...')
    const timestamp = Date.now()
    const customerResponse = await axios.post(
      `${APP_URL}/api/users`,
      {
        email: `test${timestamp}@example.com`,
        password: 'testpassword123',
        role: 'customer',
        firstName: 'Test',
        lastName: 'Customer',
        whatsappNumber: '+1234567890',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const customerId = customerResponse.data.doc.id
    console.log('✅ Customer created successfully:', customerId)

    // Step 2: Try to create a vehicle directly
    console.log('🚗 Step 2: Creating vehicle...')
    const vehicleResponse = await axios.post(
      `${APP_URL}/api/vehicles`,
      {
        licensePlate: `TEST-${timestamp}`,
        vehicleType: 'sedan',
        owner: customerId,
        aiClassificationConfidence: 0.8,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const vehicleId = vehicleResponse.data.doc.id
    console.log('✅ Vehicle created successfully:', vehicleId)

    // Step 3: Verify vehicle exists
    console.log('🔍 Step 3: Verifying vehicle exists...')
    const verifyResponse = await axios.get(`${APP_URL}/api/vehicles/${vehicleId}`)
    console.log('✅ Vehicle verified:', verifyResponse.data.licensePlate)

    // Step 4: List all vehicles
    console.log('📋 Step 4: Listing all vehicles...')
    const listResponse = await axios.get(`${APP_URL}/api/vehicles`)
    console.log('📊 Total vehicles:', listResponse.data.docs.length)
    console.log('🚗 Vehicles:', listResponse.data.docs.map(v => ({ id: v.id, licensePlate: v.licensePlate })))

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message)
  }
}

testVehicleCreation()
