import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...')
  
  // Initialize payload
  const payload = await getPayload({ config })

  try {
    const collections = [
      'orders',
      'vehicles', 
      'users',
      'services',
      'service-options',
      'service-categories',
      'customer-tiers'
    ]

    for (const collection of collections) {
      try {
        // Get all documents in the collection
        const docs = await payload.find({
          collection,
          limit: 1000, // Adjust if you have more than 1000 docs
        })

        // Delete all documents
        for (const doc of docs.docs) {
          await payload.delete({
            collection,
            id: doc.id,
          })
        }

        console.log(`✅ Cleared ${docs.totalDocs} documents from ${collection}`)
      } catch (error) {
        console.log(`⚠️  Could not clear ${collection}: ${error.message}`)
      }
    }

    console.log('✅ Database cleanup completed!')

  } catch (error) {
    console.error('❌ Error clearing database:', error)
  }

  process.exit(0)
}

clearDatabase()
