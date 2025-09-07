#!/usr/bin/env tsx

import dotenv from 'dotenv'
import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'

// Load environment variables
dotenv.config()

async function testS3Connection() {
  console.log('🧪 Testing S3/Cloudflare R2 Connection...')
  
  try {
    // Check environment variables
    console.log('\n📋 Environment Variables:')
    console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT ? '✅ Set' : '❌ Missing')
    console.log('S3_BUCKET:', process.env.S3_BUCKET ? '✅ Set' : '❌ Missing')
    console.log('S3_ACCESS_KEY_ID:', process.env.S3_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing')
    console.log('S3_SECRET_ACCESS_KEY:', process.env.S3_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing')
    console.log('S3_REGION:', process.env.S3_REGION || 'auto')

    if (!process.env.S3_ENDPOINT || !process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
      throw new Error('Missing required S3 environment variables')
    }

    // Create S3 client
    const s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for R2
    })

    console.log('\n🔗 Testing S3 connection...')

    // Test listing objects
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        MaxKeys: 10,
      })

      const listResponse = await s3Client.send(listCommand)
      console.log('✅ Successfully connected to S3/R2')
      console.log('📁 Bucket contents:')
      
      if (listResponse.Contents && listResponse.Contents.length > 0) {
        listResponse.Contents.forEach((object, index) => {
          console.log(`   ${index + 1}. ${object.Key} (${object.Size} bytes, ${object.LastModified})`)
        })
      } else {
        console.log('   (Empty bucket or no objects found)')
      }

    } catch (listError) {
      console.error('❌ Failed to list objects:', listError.message)
      throw listError
    }

    // Test uploading a small test file
    console.log('\n📤 Testing file upload...')
    
    const testContent = 'Hello from AX Billing S3 test!'
    const testKey = `test/s3-connection-test-${Date.now()}.txt`

    try {
      const putCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      })

      await s3Client.send(putCommand)
      console.log('✅ Successfully uploaded test file')
      console.log('📄 Test file key:', testKey)

      // Construct the public URL
      const publicUrl = `${process.env.S3_PUBLIC_BUCKET}/${testKey}`
      console.log('🌐 Public URL:', publicUrl)

      // Test if the file is accessible via public URL
      try {
        const response = await fetch(publicUrl)
        if (response.ok) {
          const content = await response.text()
          console.log('✅ File is accessible via public URL')
          console.log('📄 Content:', content)
        } else {
          console.log('⚠️  File uploaded but not accessible via public URL')
          console.log('   Status:', response.status)
          console.log('   This might be expected if the bucket is not configured for public access')
        }
      } catch (fetchError) {
        console.log('⚠️  Could not test public URL access:', fetchError.message)
      }

    } catch (uploadError) {
      console.error('❌ Failed to upload test file:', uploadError.message)
      throw uploadError
    }

    return {
      connected: true,
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      testFileKey: testKey,
    }

  } catch (error) {
    console.error('❌ S3 connection test failed:', error)
    throw error
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testS3Connection()
    .then((result) => {
      console.log('\n🎉 S3 connection test completed successfully!')
      console.log('Result:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 S3 connection test failed:', error)
      process.exit(1)
    })
}

export { testS3Connection }
