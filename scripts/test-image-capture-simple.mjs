#!/usr/bin/env node

import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Create a simple test image file (1x1 pixel PNG)
const createTestImage = () => {
  // Base64 encoded 1x1 pixel transparent PNG
  const base64Data =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
  const buffer = Buffer.from(base64Data, 'base64')
  const testImagePath = path.join(__dirname, 'test-image.png')
  fs.writeFileSync(testImagePath, buffer)
  return testImagePath
}

async function testImageCapture() {
  try {
    console.log('🚀 Testing image capture with existing order...')

    // Step 1: Create customer first (using PayloadCMS users API)
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

    // Step 2: Create an empty order
    console.log('📝 Step 2: Creating empty order...')
    const createOrderResponse = await axios.post(
      `${APP_URL}/api/v1/orders/create-empty`,
      {
        queue: 'regular',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (!createOrderResponse.data.success) {
      throw new Error(`Failed to create order: ${createOrderResponse.data.error}`)
    }

    const orderID = createOrderResponse.data.orderID
    const orderDocId = createOrderResponse.data.id
    console.log('✅ Order created successfully:', orderID)

    // Step 3: Link customer to order
    console.log('🔗 Step 3: Linking customer to order...')
    const linkResponse = await axios.patch(
      `${APP_URL}/api/orders/${orderDocId}`,
      {
        customer: customerId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('✅ Customer linked to order successfully')

    // Step 4: Create test image file
    console.log('📸 Step 4: Creating test image file...')
    const testImagePath = createTestImage()
    console.log('✅ Test image created:', testImagePath)

    // Step 5: Simulate multi-image capture
    console.log('🔄 Step 5: Simulating multi-image capture...')

    const formData = new FormData()
    formData.append('orderId', orderID)
    formData.append('captureStage', 'intake')
    formData.append('imageCount', '4')

    // Add 4 test images with different types
    const imageTypes = ['front', 'back', 'left', 'right']

    for (let i = 0; i < imageTypes.length; i++) {
      formData.append(`image_${i}`, fs.createReadStream(testImagePath), {
        filename: `test-${imageTypes[i]}.png`,
        contentType: 'image/png',
      })
      formData.append(`imageType_${i}`, imageTypes[i])
    }

    console.log('📤 Uploading images via multi-capture API...')
    const captureResponse = await axios.post(
      `${APP_URL}/api/v1/staff/capture-vehicle-multi`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 60000, // 60 second timeout for AI processing
      },
    )

    if (captureResponse.data.success) {
      console.log('✅ Multi-image capture successful!')
      console.log(`   Vehicle ID: ${captureResponse.data.vehicle.id}`)
      console.log(`   License Plate: ${captureResponse.data.vehicle.licensePlate}`)
      console.log(`   Images processed: ${captureResponse.data.processedImages}`)
      console.log(`   Vehicle Number: ${captureResponse.data.vehicleNumber || 'Not detected'}`)
      console.log(`   Overall Condition: ${captureResponse.data.overallCondition || 'Unknown'}`)
      console.log(`   Damages Found: ${captureResponse.data.allDamages?.length || 0}`)

      console.log('')
      console.log('🎉 Test completed successfully!')
      console.log('')
      console.log(`🌐 View the order at: ${APP_URL}/order/${orderID}/initiated`)
      console.log('')
      console.log('🔧 You should now see:')
      console.log('   1. Image thumbnails in the Vehicle Capture section')
      console.log('   2. Analysis status badges on each image')
      console.log('   3. Reanalysis buttons for any failed analyses')
      console.log('   4. Full-screen modal when clicking images')
    } else {
      console.log('❌ Multi-image capture failed:', captureResponse.data.error)
      console.log('   Details:', captureResponse.data.details)

      if (captureResponse.data.uploadedImages) {
        console.log('   Some images were uploaded but analysis failed')
        console.log(`🌐 Still check the order at: ${APP_URL}/order/${orderID}/initiated`)
        console.log('   You should see uploaded images with failed analysis status')
      }
    }

    // Clean up test image
    fs.unlinkSync(testImagePath)
    console.log('🧹 Cleaned up test image file')
  } catch (error) {
    console.error('❌ Error during test:', error.response?.data || error.message)

    if (error.code === 'ECONNREFUSED') {
      console.log('')
      console.log('💡 Make sure the development server is running:')
      console.log('   npm run dev')
    }
  }
}

// Run the test
testImageCapture().catch(console.error)
