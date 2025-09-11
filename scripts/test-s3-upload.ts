#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testS3Upload() {
  console.log('🧪 Testing S3 Storage Upload...')

  // Debug environment variables
  console.log('\n🔍 Debug Environment Variables:')
  console.log(
    'PAYLOAD_SECRET:',
    process.env.PAYLOAD_SECRET
      ? 'Set (length: ' + process.env.PAYLOAD_SECRET.length + ')'
      : 'Missing',
  )
  console.log('DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Missing')

  try {
    // Initialize Payload with proper config
    const payload = await getPayload({
      config,
    })
    console.log('✅ Payload initialized successfully')

    // Check environment variables
    console.log('\n📋 Environment Variables:')
    console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT ? '✅ Set' : '❌ Missing')
    console.log('S3_BUCKET:', process.env.S3_BUCKET ? '✅ Set' : '❌ Missing')
    console.log('S3_ACCESS_KEY_ID:', process.env.S3_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing')
    console.log('S3_SECRET_ACCESS_KEY:', process.env.S3_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing')
    console.log('S3_REGION:', process.env.S3_REGION || 'auto')

    // Create a test image file (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
      0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x01, 0x01,
      0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ])

    const testImagePath = path.join(__dirname, 'test-image.png')
    fs.writeFileSync(testImagePath, testImageBuffer)
    console.log('\n📁 Created test image:', testImagePath)

    // Test uploading to media collection
    console.log('\n📤 Testing media upload...')

    try {
      const mediaDoc = await payload.create({
        collection: 'media',
        data: {
          alt: 'Test image for S3 upload',
          caption: 'Testing S3 storage functionality',
          category: 'general',
        },
        file: {
          data: testImageBuffer,
          mimetype: 'image/png',
          name: 'test-image.png',
          size: testImageBuffer.length,
        },
      })

      console.log('✅ Media upload successful!')
      console.log('📄 Media document created:')
      console.log('   ID:', mediaDoc.id)
      console.log('   Filename:', mediaDoc.filename)
      console.log('   URL:', mediaDoc.url)
      console.log('   Thumbnail URL:', mediaDoc.thumbnailURL)
      console.log('   File size:', mediaDoc.filesize)
      console.log('   MIME type:', mediaDoc.mimeType)

      // Test if the file is accessible
      if (mediaDoc.url) {
        console.log('\n🌐 Testing file accessibility...')
        try {
          const response = await fetch(mediaDoc.url)
          if (response.ok) {
            console.log('✅ File is accessible via URL')
            console.log('   Status:', response.status)
            console.log('   Content-Type:', response.headers.get('content-type'))
          } else {
            console.log('❌ File not accessible')
            console.log('   Status:', response.status)
            console.log('   Status Text:', response.statusText)
          }
        } catch (error) {
          console.log(
            '❌ Error accessing file:',
            error instanceof Error ? error.message : String(error),
          )
        }
      }

      // Clean up test file
      fs.unlinkSync(testImagePath)
      console.log('\n🧹 Cleaned up test image file')

      return mediaDoc
    } catch (uploadError) {
      console.error('❌ Media upload failed:', uploadError)

      // Clean up test file on error
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath)
      }

      throw uploadError
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testS3Upload()
    .then((result) => {
      console.log('\n🎉 S3 upload test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 S3 upload test failed:', error)
      process.exit(1)
    })
}

export { testS3Upload }
