#!/usr/bin/env node

/**
 * Test script for multi-image vehicle capture API
 * This script tests the new multi-image capture endpoint
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'

async function testMultiImageCapture() {
  console.log('🧪 Testing Multi-Image Vehicle Capture API')
  console.log('==========================================')

  // Test order ID (you should replace this with a real initiated order ID)
  const testOrderId = 'AX-20250907-1152'

  try {
    // Create a simple test image (1x1 pixel PNG)
    const createTestImage = (name) => {
      // Simple 1x1 pixel PNG data
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x00, 0x01, // width: 1
        0x00, 0x00, 0x00, 0x01, // height: 1
        0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE, // CRC
        0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
        0x49, 0x44, 0x41, 0x54, // IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // image data
        0xE2, 0x21, 0xBC, 0x33, // CRC
        0x00, 0x00, 0x00, 0x00, // IEND chunk length
        0x49, 0x45, 0x4E, 0x44, // IEND
        0xAE, 0x42, 0x60, 0x82  // CRC
      ])
      
      return new File([pngData], name, { type: 'image/png' })
    }

    // Create test images for all required types
    const testImages = [
      { file: createTestImage('front.png'), type: 'front' },
      { file: createTestImage('back.png'), type: 'back' },
      { file: createTestImage('left.png'), type: 'left' },
      { file: createTestImage('right.png'), type: 'right' },
      { file: createTestImage('damage.png'), type: 'damage' },
    ]

    console.log(`📋 Testing with order ID: ${testOrderId}`)
    console.log(`📸 Created ${testImages.length} test images`)

    // Create FormData
    const formData = new FormData()
    formData.append('orderId', testOrderId)
    formData.append('captureStage', 'intake')
    formData.append('imageCount', testImages.length.toString())

    // Add images to form data
    testImages.forEach((img, index) => {
      formData.append(`image_${index}`, img.file)
      formData.append(`imageType_${index}`, img.type)
    })

    console.log('🚀 Sending request to multi-image capture API...')

    const response = await fetch(`${API_BASE_URL}/api/v1/staff/capture-vehicle-multi`, {
      method: 'POST',
      body: formData,
    })

    console.log(`📡 Response status: ${response.status}`)

    const responseData = await response.json()

    if (response.ok) {
      console.log('✅ Multi-image capture successful!')
      console.log('📊 Response summary:')
      console.log(`   - Vehicle ID: ${responseData.vehicle?.id}`)
      console.log(`   - License Plate: ${responseData.vehicleNumber || 'Not detected'}`)
      console.log(`   - Images Processed: ${responseData.processedImages}`)
      console.log(`   - Damages Found: ${responseData.allDamages?.length || 0}`)
      console.log(`   - Overall Condition: ${responseData.overallCondition || 'Unknown'}`)
      
      if (responseData.allDamages && responseData.allDamages.length > 0) {
        console.log('⚠️  Damages detected:')
        responseData.allDamages.forEach((damage, index) => {
          console.log(`   ${index + 1}. ${damage.location}: ${damage.damageDescription} (${damage.severity})`)
        })
      }

      console.log('\n📋 Full response:')
      console.log(JSON.stringify(responseData, null, 2))
    } else {
      console.log('❌ Multi-image capture failed!')
      console.log('📋 Error response:')
      console.log(JSON.stringify(responseData, null, 2))
      
      if (responseData.error === 'Order not found') {
        console.log('\n💡 Tip: Make sure you have an initiated order with the ID:', testOrderId)
        console.log('   You can create one by visiting: http://localhost:3001/staff')
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure the development server is running:')
      console.log('   pnpm run dev')
    }
  }
}

// Check if we're running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMultiImageCapture()
}

export { testMultiImageCapture }
