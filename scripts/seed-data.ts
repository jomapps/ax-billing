import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Verify environment variables are loaded
console.log('Environment check:')
console.log('DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Missing')
console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? 'Set' : 'Missing')

async function seedData() {
  // Initialize payload with the correct pattern for v3
  const payload = await getPayload({
    config,
  })

  console.log('🌱 Starting database seeding...')

  try {
    // Check if admin user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        role: { equals: 'admin' },
      },
    })

    if (existingUsers.totalDocs === 0) {
      console.log('Creating admin user...')
      const adminUser = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@axbilling.com',
          password: 'admin123456',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
      })
      console.log('✅ Admin user created:', adminUser.email)
    } else {
      console.log('✅ Admin user already exists')
    }

    // Create Service Categories
    console.log('Creating service categories...')
    const exteriorCategory = await payload.create({
      collection: 'service-categories',
      data: {
        name: 'Exterior Wash',
        description: 'External vehicle cleaning services',
        icon: 'car',
        isActive: true,
      },
    })

    const interiorCategory = await payload.create({
      collection: 'service-categories',
      data: {
        name: 'Interior Detailing',
        description: 'Internal vehicle cleaning and detailing',
        icon: 'sparkles',
        isActive: true,
      },
    })

    // Create Service Options
    console.log('Creating service options...')
    const waxOption = await payload.create({
      collection: 'service-options',
      data: {
        name: 'Wax Coating',
        description: 'Premium wax protection',
        additionalPrice: 15,
        isActive: true,
      },
    })

    const tireShineOption = await payload.create({
      collection: 'service-options',
      data: {
        name: 'Tire Shine',
        description: 'Professional tire shine treatment',
        additionalPrice: 8,
        isActive: true,
      },
    })

    // Create Services
    console.log('Creating services...')
    const basicWash = await payload.create({
      collection: 'services',
      data: {
        name: 'Basic Wash',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Standard exterior wash and dry',
                  },
                ],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: exteriorCategory.id,
        basePrice: 25,
        estimatedMinutes: 30,
        isActive: true,
        steps: [
          { stepName: 'Pre-wash', estimatedMinutes: 5 },
          { stepName: 'Soap & Scrub', estimatedMinutes: 15 },
          { stepName: 'Rinse', estimatedMinutes: 5 },
          { stepName: 'Dry', estimatedMinutes: 5 },
        ],
        compatibleOptions: [waxOption.id, tireShineOption.id],
      },
    })

    const premiumWash = await payload.create({
      collection: 'services',
      data: {
        name: 'Premium Wash',
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [
                  {
                    type: 'text',
                    version: 1,
                    text: 'Complete exterior and interior cleaning',
                  },
                ],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: exteriorCategory.id,
        basePrice: 45,
        estimatedMinutes: 60,
        isActive: true,
        steps: [
          { stepName: 'Pre-wash', estimatedMinutes: 5 },
          { stepName: 'Exterior Wash', estimatedMinutes: 20 },
          { stepName: 'Interior Vacuum', estimatedMinutes: 15 },
          { stepName: 'Interior Wipe', estimatedMinutes: 10 },
          { stepName: 'Final Dry', estimatedMinutes: 10 },
        ],
        compatibleOptions: [waxOption.id, tireShineOption.id],
      },
    })

    // Create Customer Tiers
    console.log('Creating customer tiers...')
    const standardTier = await payload.create({
      collection: 'customer-tiers',
      data: {
        tierName: 'Standard',
        description: 'Regular customers',
        defaultQueue: 'regular',
        isActive: true,
      },
    })

    const vipTier = await payload.create({
      collection: 'customer-tiers',
      data: {
        tierName: 'VIP Member',
        description: 'Premium customers with priority service',
        defaultQueue: 'vip',
        isActive: true,
        pricingOverrides: [
          {
            service: basicWash.id,
            overriddenPrice: 20,
          },
          {
            service: premiumWash.id,
            overriddenPrice: 40,
          },
        ],
      },
    })

    // Create Sample Users
    console.log('Creating sample users...')
    const customer1 = await payload.create({
      collection: 'users',
      data: {
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'John',
        lastName: 'Doe',
        whatsappNumber: '+60123456789',
        customerTier: standardTier.id,
      },
    })

    const customer2 = await payload.create({
      collection: 'users',
      data: {
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'Jane',
        lastName: 'Smith',
        whatsappNumber: '+60123456790',
        customerTier: vipTier.id,
      },
    })

    const staff1 = await payload.create({
      collection: 'users',
      data: {
        email: 'staff@axbilling.com',
        password: 'staff123',
        role: 'staff',
        firstName: 'Staff',
        lastName: 'Member',
      },
    })

    // Create Sample Vehicles
    console.log('Creating sample vehicles...')
    const vehicle1 = await payload.create({
      collection: 'vehicles',
      data: {
        licensePlate: 'ABC123',
        vehicleType: 'sedan',
        owner: customer1.id,
        isActive: true,
      },
    })

    const vehicle2 = await payload.create({
      collection: 'vehicles',
      data: {
        licensePlate: 'XYZ789',
        vehicleType: 'mpv_van',
        owner: customer2.id,
        isActive: true,
      },
    })

    // Create Sample Orders
    console.log('Creating sample orders...')
    const order1 = await payload.create({
      collection: 'orders',
      data: {
        orderID: 'AX-20241204-0001',
        orderStage: 'paid',
        customer: customer1.id,
        vehicle: vehicle1.id,
        servicesRendered: [
          {
            service: basicWash.id,
            selectedOptions: [tireShineOption.id],
            servicePrice: 25,
            optionsPrice: 8,
          },
        ],
        totalAmount: 33,
        paymentStatus: 'paid',
        queue: 'regular',
        overallStatus: 'in_progress',
        estimatedCompletionTime: new Date(Date.now() + 30 * 60000).toISOString(),
        jobStatus: [
          {
            stepName: 'Pre-wash',
            status: 'completed',
            timestamp: new Date().toISOString(),
          },
          {
            stepName: 'Soap & Scrub',
            status: 'in_progress',
          },
          {
            stepName: 'Rinse',
            status: 'pending',
          },
          {
            stepName: 'Dry',
            status: 'pending',
          },
        ],
      },
    })

    const order2 = await payload.create({
      collection: 'orders',
      data: {
        orderID: 'AX-20241204-0002',
        orderStage: 'open',
        customer: customer2.id,
        vehicle: vehicle2.id,
        servicesRendered: [
          {
            service: premiumWash.id,
            selectedOptions: [waxOption.id, tireShineOption.id],
            servicePrice: 40, // VIP pricing
            optionsPrice: 23,
          },
        ],
        totalAmount: 63,
        paymentStatus: 'paid',
        queue: 'vip',
        overallStatus: 'pending',
        estimatedCompletionTime: new Date(Date.now() + 60 * 60000).toISOString(),
        jobStatus: [
          {
            stepName: 'Pre-wash',
            status: 'pending',
          },
          {
            stepName: 'Exterior Wash',
            status: 'pending',
          },
          {
            stepName: 'Interior Vacuum',
            status: 'pending',
          },
          {
            stepName: 'Interior Wipe',
            status: 'pending',
          },
          {
            stepName: 'Final Dry',
            status: 'pending',
          },
        ],
      },
    })

    console.log('✅ Database seeding completed successfully!')
    console.log(`Created:
    - 2 Service Categories
    - 2 Service Options  
    - 2 Services
    - 2 Customer Tiers
    - 3 Users (2 customers, 1 staff)
    - 2 Vehicles
    - 2 Orders`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }

  process.exit(0)
}

seedData()
