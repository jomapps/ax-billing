import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load seed data
const servicesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'))
const categoriesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'service-categories.json'), 'utf8'),
)
const optionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'service-options.json'), 'utf8'),
)

async function cleanSeed() {
  const payload = await getPayload({ config })

  console.log('🧹 Starting clean database seed...')

  try {
    // Clear all collections
    console.log('🗑️  Clearing database...')

    const collections = [
      'orders',
      'users',
      'vehicles',
      'services',
      'service-categories',
      'service-options',
      'intake',
      'delivery',
      'media',
    ]

    for (const collection of collections) {
      try {
        const result = await payload.find({ collection, limit: 1000 })
        if (result.docs.length > 0) {
          console.log(`   Deleting ${result.docs.length} records from ${collection}...`)
          for (const doc of result.docs) {
            await payload.delete({ collection, id: doc.id })
          }
        }
      } catch (error) {
        console.log(`   Collection ${collection} might not exist, skipping...`)
      }
    }

    console.log('✅ Database cleared')

    // Create admin user from environment variables
    console.log('👤 Creating admin user...')

    const adminData = {
      firstName: process.env.ADMIN_NAME?.split(' ')[0] || 'Admin',
      lastName: process.env.ADMIN_NAME?.split(' ').slice(1).join(' ') || 'User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'password123',
      whatsappNumber: process.env.ADMIN_PHONE || '',
      role: 'admin',
      isActive: true,
    }

    const adminUser = await payload.create({
      collection: 'users',
      data: adminData,
    })

    console.log(`✅ Admin user created: ${adminUser.email}`)

    // Create service categories
    console.log('📂 Creating service categories...')
    const categoryMap = new Map()

    for (const categoryData of categoriesData) {
      const category = await payload.create({
        collection: 'service-categories',
        data: {
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          isActive: categoryData.isActive,
        },
      })

      // Map the reference name to the actual ID
      const refName = categoryData.name.toLowerCase().replace(/\s+/g, '-')
      categoryMap.set(refName, category.id)
      console.log(`   ✅ Created category: ${category.name}`)
    }

    // Create service options
    console.log('⚙️  Creating service options...')
    const optionMap = new Map()

    for (const optionData of optionsData) {
      const option = await payload.create({
        collection: 'service-options',
        data: {
          name: optionData.name,
          description: optionData.description,
          additionalPrice: optionData.additionalPrice,
          isActive: optionData.isActive,
        },
      })

      // Map the reference name to the actual ID
      const refName = optionData.name.toLowerCase().replace(/\s+/g, '-')
      optionMap.set(refName, option.id)
      console.log(`   ✅ Created option: ${option.name}`)
    }

    // Create services
    console.log('🚗 Creating services...')

    for (const serviceData of servicesData) {
      // Map category reference to actual ID
      const categoryId = categoryMap.get(serviceData.categoryRef)

      // Map option references to actual IDs
      const availableOptions =
        serviceData.availableOptionsRefs
          ?.map((ref: string) => optionMap.get(ref))
          .filter(Boolean) || []

      const service = await payload.create({
        collection: 'services',
        data: {
          name: serviceData.name,
          description: serviceData.description,
          category: categoryId,
          basePrice: serviceData.basePrice,
          estimatedMinutes: serviceData.estimatedMinutes,
          isActive: serviceData.isActive,
          steps: serviceData.steps,
          availableOptions: availableOptions,
        },
      })

      console.log(
        `   ✅ Created service: ${service.name} (${service.basePrice} RM, ${service.estimatedMinutes} min)`,
      )
    }

    console.log('\n🎉 Clean seed completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   👤 Admin user: ${adminUser.email}`)
    console.log(`   📂 Categories: ${categoriesData.length}`)
    console.log(`   ⚙️  Options: ${optionsData.length}`)
    console.log(`   🚗 Services: ${servicesData.length}`)
    console.log(`   📦 Orders: 0 (clean start)`)
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

// Run the seeding
cleanSeed()
  .then(() => {
    console.log('✅ Seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
