#!/usr/bin/env tsx

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function testMediaUploadAPI() {
  console.log('🧪 Testing Media Upload via API...')

  try {
    // First, try to login to get authentication
    console.log('\n🔐 Attempting to authenticate...')

    const loginResponse = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'jomapps.jb@gmail.com',
        password: process.env.ADMIN_PASSWORD || 'Shlok@2000',
      }),
    })

    let authCookie = ''
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json()
      console.log('✅ Authentication successful')

      // Extract cookies from response
      const setCookieHeader = loginResponse.headers.get('set-cookie')
      if (setCookieHeader) {
        authCookie = setCookieHeader
        console.log('🍪 Got authentication cookie')
      }
    } else {
      console.log('⚠️  Authentication failed, trying without auth')
      console.log('   Status:', loginResponse.status)
      const errorText = await loginResponse.text()
      console.log('   Response:', errorText)
    }

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
    console.log('📁 Created test image:', testImagePath)

    // Test uploading via API
    console.log('\n📤 Testing media upload via API...')

    // Try a simpler approach - just upload the file first, then add metadata
    const formData = new FormData()

    // Create a proper File object
    const file = new File([testImageBuffer], 'test-image.png', {
      type: 'image/png',
      lastModified: Date.now(),
    })

    // Add the file first
    formData.append('file', file)

    // Add the metadata fields directly
    formData.append('alt', 'Test image for S3 upload')
    formData.append('caption', 'Testing S3 storage functionality')
    formData.append('category', 'general')

    const uploadHeaders: HeadersInit = {}
    if (authCookie) {
      uploadHeaders['Cookie'] = authCookie
    }

    const response = await fetch('http://localhost:3001/api/media', {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Media upload successful!')
      console.log('📄 Media document created:')
      console.log('   ID:', result.doc?.id)
      console.log('   Filename:', result.doc?.filename)
      console.log('   URL:', result.doc?.url)
      console.log('   Thumbnail URL:', result.doc?.thumbnailURL)
      console.log('   File size:', result.doc?.filesize)
      console.log('   MIME type:', result.doc?.mimeType)

      // Test if the file is accessible
      if (result.doc?.url) {
        console.log('\n🌐 Testing file accessibility...')
        try {
          const fileResponse = await fetch(result.doc.url)
          if (fileResponse.ok) {
            console.log('✅ File is accessible via URL')
            console.log('   Status:', fileResponse.status)
            console.log('   Content-Type:', fileResponse.headers.get('content-type'))
            console.log('   Content-Length:', fileResponse.headers.get('content-length'))
          } else {
            console.log('❌ File not accessible')
            console.log('   Status:', fileResponse.status)
            console.log('   Status Text:', fileResponse.statusText)
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

      return result.doc
    } else {
      const errorText = await response.text()
      console.error('❌ Media upload failed')
      console.error('   Status:', response.status)
      console.error('   Status Text:', response.statusText)
      console.error('   Response:', errorText)

      // Clean up test file on error
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath)
      }

      throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testMediaUploadAPI()
    .then((result) => {
      console.log('\n🎉 Media upload API test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Media upload API test failed:', error)
      process.exit(1)
    })
}

export { testMediaUploadAPI }
