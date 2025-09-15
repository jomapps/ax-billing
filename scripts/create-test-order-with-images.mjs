#!/usr/bin/env node

import axios from 'axios'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Test image URL (using an existing image from your media)
const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'

async function createTestOrderWithImages() {
  try {
    console.log('🚀 Creating test order with captured images...')

    // Step 1: Create an empty order
    console.log('📝 Step 1: Creating empty order...')
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

    const orderId = createOrderResponse.data.id
    const orderID = createOrderResponse.data.orderID
    console.log('✅ Order created successfully:', orderID)

    // Step 2: Create test images using FormData to simulate multi-image capture
    console.log('📸 Step 2: Simulating vehicle image capture...')

    // We'll create a mock FormData with test image URLs
    // Since we can't easily upload files in this script, we'll directly call the PayloadCMS API

    // First, let's create a vehicle record
    const vehicleData = {
      licensePlate: 'TEST-123',
      vehicleType: 'sedan',
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      color: 'white',
    }

    console.log('🚗 Creating vehicle record...')
    const vehicleResponse = await axios.post(`${APP_URL}/api/vehicles`, vehicleData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const vehicleId = vehicleResponse.data.doc.id
    console.log('✅ Vehicle created:', vehicleId)

    // Step 3: Create vehicle images with different analysis states
    const imageTypes = ['front', 'back', 'left', 'right']
    const vehicleImages = []

    for (let i = 0; i < imageTypes.length; i++) {
      const imageType = imageTypes[i]

      // Create a media record first
      const mediaData = {
        url: TEST_IMAGE_URL,
        alt: `${imageType} view of vehicle ${vehicleData.licensePlate}`,
        filename: `test-${imageType}-${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        filesize: 150000,
        width: 800,
        height: 600,
      }

      console.log(`📷 Creating media record for ${imageType} image...`)
      const mediaResponse = await axios.post(`${APP_URL}/api/media`, mediaData, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const mediaId = mediaResponse.data.doc.id

      // Create vehicle image record with different analysis states
      let aiAnalysis = null
      let damageDetected = false
      let damageDescription = null

      if (i === 0) {
        // First image: successful analysis
        aiAnalysis = {
          success: true,
          vehicleCondition: 'good',
          processingTime: 2.3,
          confidence: 0.95,
        }
      } else if (i === 1) {
        // Second image: failed analysis
        aiAnalysis = {
          success: false,
          error: 'AI analysis failed - unable to detect vehicle clearly',
          processingTime: 1.2,
        }
      } else if (i === 2) {
        // Third image: successful with damage
        aiAnalysis = {
          success: true,
          vehicleCondition: 'fair',
          processingTime: 1.8,
          confidence: 0.87,
        }
        damageDetected = true
        damageDescription = 'Minor scratches on left side panel'
      }
      // Fourth image: no analysis (pending)

      const vehicleImageData = {
        vehicle: vehicleId,
        image: mediaId,
        imageType: imageType,
        captureStage: 'intake',
        aiAnalysis: aiAnalysis,
        damageDetected: damageDetected,
        damageDescription: damageDescription,
      }

      console.log(`🖼️ Creating vehicle image record for ${imageType}...`)
      const vehicleImageResponse = await axios.post(
        `${APP_URL}/api/vehicleImages`,
        vehicleImageData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      vehicleImages.push(vehicleImageResponse.data.doc.id)
      console.log(`✅ Vehicle image created: ${imageType} (${vehicleImageResponse.data.doc.id})`)
    }

    // Step 4: Update the vehicle with the image references
    console.log('🔗 Linking images to vehicle...')
    await axios.patch(
      `${APP_URL}/api/vehicles/${vehicleId}`,
      {
        vehicleImages: vehicleImages,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    // Step 5: Update the order with the vehicle
    console.log('🔗 Linking vehicle to order...')
    await axios.patch(
      `${APP_URL}/api/orders/${orderId}`,
      {
        vehicle: vehicleId,
        orderStage: 'initiated',
        vehicleCapturedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    console.log('🎉 Test order with images created successfully!')
    console.log('')
    console.log('📋 Summary:')
    console.log(`   Order ID: ${orderID}`)
    console.log(`   Vehicle ID: ${vehicleId}`)
    console.log(`   Images created: ${vehicleImages.length}`)
    console.log(`   - front: ✅ successful analysis`)
    console.log(`   - back: ❌ failed analysis (can be reanalyzed)`)
    console.log(`   - left: ✅ successful with damage detected`)
    console.log(`   - right: ⏳ pending analysis`)
    console.log('')
    console.log(`🌐 View the order at: ${APP_URL}/order/${orderID}/initiated`)
    console.log('')
    console.log('🔧 You can now:')
    console.log('   1. See image thumbnails in the Vehicle Capture section')
    console.log('   2. Click on failed images to reanalyze them')
    console.log('   3. Use the "Reanalyze Failed" button for bulk reanalysis')
    console.log('   4. Click images to view them in full-screen modal')
  } catch (error) {
    console.error('❌ Error creating test order:', error.response?.data || error.message)

    if (error.response?.status === 409) {
      console.log('')
      console.log(
        '💡 The order might already exist. Try creating a new one or check existing orders.',
      )
    }
  }
}

// Run the script
createTestOrderWithImages().catch(console.error)
