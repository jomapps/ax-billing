#!/usr/bin/env node

import { VehicleProcessingService } from '../src/lib/whatsapp/vehicle-processing-service.ts'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const TEST_IMAGE_URL = 'https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg'

async function testVehicleService() {
  console.log('🔍 Testing Vehicle Processing Service with Fal.ai')
  console.log('=' .repeat(60))
  
  try {
    const service = new VehicleProcessingService()
    
    console.log('🚀 Processing vehicle image...')
    console.log(`   Image URL: ${TEST_IMAGE_URL}`)
    console.log('')
    
    const startTime = Date.now()
    const result = await service.processVehiclePhoto(TEST_IMAGE_URL)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`⏱️  Processing completed in ${duration}ms`)
    console.log('')
    
    if (result.success && result.vehicleInfo) {
      console.log('✅ Vehicle processing SUCCESSFUL!')
      console.log('📋 Extracted Information:')
      console.log(`   Vehicle Type: ${result.vehicleInfo.vehicleType}`)
      console.log(`   License Plate: ${result.vehicleInfo.licensePlate}`)
      console.log(`   Confidence: ${result.vehicleInfo.confidence}`)
      if (result.vehicleInfo.extractedText) {
        console.log(`   Extracted Text: ${result.vehicleInfo.extractedText}`)
      }
      console.log('')
      console.log('🎉 Vehicle Processing Service test PASSED!')
    } else {
      console.log('❌ Vehicle processing FAILED!')
      console.log(`   Error: ${result.error}`)
      console.log('')
      console.log('❌ Vehicle Processing Service test FAILED!')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:')
    console.error(`   ${error.message}`)
    console.log('')
    console.log('❌ Vehicle Processing Service test FAILED!')
    process.exit(1)
  }
}

// Run the test
testVehicleService().catch(console.error)
