import { getPayload } from 'payload'
import config from '@payload-config'

async function seedInitiatedOrders() {
  const payload = await getPayload({ config })

  try {
    console.log('🌱 Starting to seed initiated orders...')

    // 1. Create some basic users first
    console.log('Creating users...')

    const user1 = await payload.create({
      collection: 'users',
      data: {
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'John',
        lastName: 'Doe',
        whatsappNumber: '+60123456791',
      },
    })

    const user2 = await payload.create({
      collection: 'users',
      data: {
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'Jane',
        lastName: 'Smith',
        whatsappNumber: '+60123456792',
      },
    })

    const user3 = await payload.create({
      collection: 'users',
      data: {
        email: 'mike.johnson@example.com',
        password: 'password123',
        role: 'customer',
        firstName: 'Mike',
        lastName: 'Johnson',
        whatsappNumber: '+60123456793',
      },
    })

    console.log('✅ Created 3 users')

    // 2. Create service category first
    console.log('Creating service category...')

    const washCategory = await payload.create({
      collection: 'service-categories',
      data: {
        name: 'Car Wash',
        description: 'Vehicle washing services',
        isActive: true,
      },
    })

    // 3. Create some basic services
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
                children: [
                  {
                    type: 'text',
                    text: 'Standard car wash service',
                    version: 1,
                  },
                ],
                direction: 'ltr' as const,
                format: '',
                indent: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: washCategory.id,
        basePrice: 25,
        estimatedMinutes: 30,
        isActive: true,
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
                children: [
                  {
                    type: 'text',
                    text: 'Premium car wash with wax',
                    version: 1,
                  },
                ],
                direction: 'ltr' as const,
                format: '',
                indent: 0,
                version: 1,
              },
            ],
            direction: 'ltr' as const,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        category: washCategory.id,
        basePrice: 40,
        estimatedMinutes: 45,
        isActive: true,
      },
    })

    console.log('✅ Created 2 services')

    // 3. Create vehicles
    console.log('Creating vehicles...')

    const vehicle1 = await payload.create({
      collection: 'vehicles',
      data: {
        licensePlate: 'ABC123',
        vehicleType: 'sedan',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'White',
        owner: user1.id,
      },
    })

    const vehicle2 = await payload.create({
      collection: 'vehicles',
      data: {
        licensePlate: 'XYZ789',
        vehicleType: 'sedan',
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        color: 'Black',
        owner: user2.id,
      },
    })

    const vehicle3 = await payload.create({
      collection: 'vehicles',
      data: {
        licensePlate: 'DEF456',
        vehicleType: 'mpv_van',
        make: 'BMW',
        model: 'X5',
        year: 2022,
        color: 'Silver',
        owner: user3.id,
      },
    })

    console.log('✅ Created 3 vehicles')

    // 4. Create initiated orders (with qrCodeGenerated: true)
    console.log('Creating initiated orders...')

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    const order1 = await payload.create({
      collection: 'orders',
      data: {
        orderID: 'AX-20250907-3435',
        orderStage: 'initiated',
        customer: user1.id,
        vehicle: vehicle1.id,
        whatsappNumber: user1.whatsappNumber,
        qrCodeGenerated: true,
        qrCodeScannedAt: oneHourAgo.toISOString(),
        whatsappLinked: true,
        servicesRendered: [
          {
            service: basicWash.id,
            selectedOptions: [],
            servicePrice: 25,
            optionsPrice: 0,
          },
        ],
        totalAmount: 25,
        paymentStatus: 'pending',
        overallStatus: 'pending',
        queue: 'regular',
        estimatedCompletionTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        jobStatus: [
          {
            stepName: 'Order Initiated',
            status: 'completed',
            timestamp: oneHourAgo.toISOString(),
          },
          {
            stepName: 'Vehicle Capture',
            status: 'pending',
          },
        ],
      },
    })

    const order2 = await payload.create({
      collection: 'orders',
      data: {
        orderID: 'AX-20250907-3436',
        orderStage: 'initiated',
        customer: user2.id,
        vehicle: vehicle2.id,
        whatsappNumber: user2.whatsappNumber,
        qrCodeGenerated: true,
        qrCodeScannedAt: twoHoursAgo.toISOString(),
        whatsappLinked: true,
        servicesRendered: [
          {
            service: premiumWash.id,
            selectedOptions: [],
            servicePrice: 40,
            optionsPrice: 0,
          },
        ],
        totalAmount: 40,
        paymentStatus: 'pending',
        overallStatus: 'pending',
        queue: 'regular',
        estimatedCompletionTime: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
        jobStatus: [
          {
            stepName: 'Order Initiated',
            status: 'completed',
            timestamp: twoHoursAgo.toISOString(),
          },
          {
            stepName: 'Vehicle Capture',
            status: 'pending',
          },
        ],
      },
    })

    const order3 = await payload.create({
      collection: 'orders',
      data: {
        orderID: 'AX-20250907-3437',
        orderStage: 'initiated',
        customer: user3.id,
        vehicle: vehicle3.id,
        whatsappNumber: user3.whatsappNumber,
        qrCodeGenerated: true,
        qrCodeScannedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        whatsappLinked: true,
        servicesRendered: [
          {
            service: basicWash.id,
            selectedOptions: [],
            servicePrice: 25,
            optionsPrice: 0,
          },
        ],
        totalAmount: 25,
        paymentStatus: 'pending',
        overallStatus: 'pending',
        queue: 'regular',
        estimatedCompletionTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
        jobStatus: [
          {
            stepName: 'Order Initiated',
            status: 'completed',
            timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          },
          {
            stepName: 'Vehicle Capture',
            status: 'pending',
          },
        ],
      },
    })

    console.log('✅ Created 3 initiated orders')
    console.log(`Order 1: ${order1.orderID} - Customer: ${user1.firstName} ${user1.lastName}`)
    console.log(`Order 2: ${order2.orderID} - Customer: ${user2.firstName} ${user2.lastName}`)
    console.log(`Order 3: ${order3.orderID} - Customer: ${user3.firstName} ${user3.lastName}`)

    console.log('🎉 Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

// Run the seeding function
seedInitiatedOrders()
  .then(() => {
    console.log('✅ Seeding process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seeding process failed:', error)
    process.exit(1)
  })
