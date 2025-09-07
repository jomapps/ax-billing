import dotenv from 'dotenv'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Load environment variables explicitly
dotenv.config()

async function resetAndSeed() {
  console.log('🧹 Starting database reset and clean seed...')
  
  // Debug environment loading
  console.log('Environment check:')
  console.log('- PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Missing')
  console.log('- DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Missing')
  console.log('- ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'Missing')

  if (!process.env.PAYLOAD_SECRET) {
    console.error('❌ PAYLOAD_SECRET is missing from environment')
    process.exit(1)
  }

  try {
    const payload = await getPayload({ config })
    console.log('✅ Payload initialized successfully')

    // Clear all collections
    console.log('🗑️  Clearing database...')
    
    const collections = ['orders', 'users', 'vehicles', 'services', 'service-categories', 'service-options', 'intake', 'delivery', 'media']

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

    // Create admin user
    console.log('👤 Creating admin user...')
    
    const adminData = {
      firstName: process.env.ADMIN_NAME?.split(' ')[0] || 'Admin',
      lastName: process.env.ADMIN_NAME?.split(' ').slice(1).join(' ') || 'User',
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'password123',
      whatsappNumber: process.env.ADMIN_PHONE || '',
      role: 'admin',
      isActive: true
    }

    const adminUser = await payload.create({
      collection: 'users',
      data: adminData
    })

    console.log(`✅ Admin user created: ${adminUser.email}`)

    // Create service categories
    console.log('📂 Creating service categories...')
    
    const categories = [
      { name: 'Exterior Wash', description: 'External vehicle cleaning services', icon: 'car', isActive: true },
      { name: 'Interior Detailing', description: 'Internal vehicle cleaning services', icon: 'sparkles', isActive: true },
      { name: 'Full Service', description: 'Complete interior and exterior packages', icon: 'star', isActive: true },
      { name: 'Express Service', description: 'Quick wash services', icon: 'zap', isActive: true },
      { name: 'Premium Detailing', description: 'High-end detailing services', icon: 'crown', isActive: true }
    ]

    const categoryMap = new Map()
    
    for (const categoryData of categories) {
      const category = await payload.create({
        collection: 'service-categories',
        data: categoryData
      })
      
      const refName = categoryData.name.toLowerCase().replace(/\s+/g, '-')
      categoryMap.set(refName, category.id)
      console.log(`   ✅ Created category: ${category.name}`)
    }

    // Create service options
    console.log('⚙️  Creating service options...')
    
    const options = [
      { name: 'Wax Coating', description: 'Premium wax protection', additionalPrice: 15, isActive: true },
      { name: 'Tire Shine', description: 'Professional tire shine', additionalPrice: 8, isActive: true },
      { name: 'Interior Fragrance', description: 'Pleasant vehicle fragrance', additionalPrice: 5, isActive: true },
      { name: 'Leather Conditioning', description: 'Professional leather conditioning', additionalPrice: 20, isActive: true },
      { name: 'Engine Bay Cleaning', description: 'Thorough engine cleaning', additionalPrice: 25, isActive: true },
      { name: 'Ceramic Coating', description: 'Advanced ceramic protection', additionalPrice: 50, isActive: true },
      { name: 'Headlight Restoration', description: 'Restore cloudy headlights', additionalPrice: 30, isActive: true }
    ]

    const optionMap = new Map()
    
    for (const optionData of options) {
      const option = await payload.create({
        collection: 'service-options',
        data: optionData
      })
      
      const refName = optionData.name.toLowerCase().replace(/\s+/g, '-')
      optionMap.set(refName, option.id)
      console.log(`   ✅ Created option: ${option.name}`)
    }

    // Create services
    console.log('🚗 Creating services...')
    
    const services = [
      {
        name: 'Basic Wash',
        description: 'Standard exterior wash and dry service',
        categoryRef: 'exterior-wash',
        basePrice: 25,
        estimatedMinutes: 30,
        isActive: true,
        steps: [
          { stepName: 'Pre-wash', estimatedMinutes: 5 },
          { stepName: 'Soap & Scrub', estimatedMinutes: 15 },
          { stepName: 'Rinse', estimatedMinutes: 5 },
          { stepName: 'Dry', estimatedMinutes: 5 }
        ],
        availableOptionsRefs: ['wax-coating', 'tire-shine', 'interior-fragrance']
      },
      {
        name: 'Premium Wash',
        description: 'Complete exterior and interior cleaning service',
        categoryRef: 'full-service',
        basePrice: 45,
        estimatedMinutes: 60,
        isActive: true,
        steps: [
          { stepName: 'Pre-wash', estimatedMinutes: 5 },
          { stepName: 'Exterior Wash', estimatedMinutes: 20 },
          { stepName: 'Interior Vacuum', estimatedMinutes: 15 },
          { stepName: 'Interior Wipe', estimatedMinutes: 10 },
          { stepName: 'Final Dry', estimatedMinutes: 10 }
        ],
        availableOptionsRefs: ['wax-coating', 'tire-shine', 'interior-fragrance', 'leather-conditioning']
      },
      {
        name: 'Express Wash',
        description: 'Quick exterior wash for busy customers',
        categoryRef: 'express-service',
        basePrice: 15,
        estimatedMinutes: 15,
        isActive: true,
        steps: [
          { stepName: 'Quick Rinse', estimatedMinutes: 3 },
          { stepName: 'Soap Wash', estimatedMinutes: 8 },
          { stepName: 'Final Rinse & Dry', estimatedMinutes: 4 }
        ],
        availableOptionsRefs: ['tire-shine']
      },
      {
        name: 'Deluxe Detailing',
        description: 'Comprehensive interior and exterior detailing',
        categoryRef: 'premium-detailing',
        basePrice: 85,
        estimatedMinutes: 120,
        isActive: true,
        steps: [
          { stepName: 'Pre-wash & Inspection', estimatedMinutes: 10 },
          { stepName: 'Exterior Deep Clean', estimatedMinutes: 30 },
          { stepName: 'Interior Deep Clean', estimatedMinutes: 40 },
          { stepName: 'Wax Application', estimatedMinutes: 20 },
          { stepName: 'Final Inspection', estimatedMinutes: 10 },
          { stepName: 'Quality Check', estimatedMinutes: 10 }
        ],
        availableOptionsRefs: ['ceramic-coating', 'leather-conditioning', 'engine-bay-cleaning', 'headlight-restoration']
      },
      {
        name: 'Interior Only',
        description: 'Comprehensive interior cleaning and detailing',
        categoryRef: 'interior-detailing',
        basePrice: 35,
        estimatedMinutes: 45,
        isActive: true,
        steps: [
          { stepName: 'Vacuum', estimatedMinutes: 15 },
          { stepName: 'Dashboard Clean', estimatedMinutes: 10 },
          { stepName: 'Seat Cleaning', estimatedMinutes: 15 },
          { stepName: 'Final Touch', estimatedMinutes: 5 }
        ],
        availableOptionsRefs: ['interior-fragrance', 'leather-conditioning']
      }
    ]
    
    for (const serviceData of services) {
      const categoryId = categoryMap.get(serviceData.categoryRef)
      const availableOptions = serviceData.availableOptionsRefs
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
          availableOptions: availableOptions
        }
      })
      
      console.log(`   ✅ Created service: ${service.name} (RM${service.basePrice}, ${service.estimatedMinutes} min)`)
    }

    console.log('\n🎉 Database reset and seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   👤 Admin user: ${adminUser.email}`)
    console.log(`   📂 Categories: ${categories.length}`)
    console.log(`   ⚙️  Options: ${options.length}`)
    console.log(`   🚗 Services: ${services.length}`)
    console.log(`   📦 Orders: 0 (clean start)`)

  } catch (error) {
    console.error('❌ Error during reset and seeding:', error)
    throw error
  }
}

// Run the reset and seeding
resetAndSeed()
  .then(() => {
    console.log('✅ Reset and seeding completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Reset and seeding failed:', error)
    process.exit(1)
  })
