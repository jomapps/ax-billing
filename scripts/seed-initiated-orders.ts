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

    // 2. Create some basic services
    console.log('Creating services...')
    
    const basicWash = await payload.create({
      collection: 'services',
      data: {
        name: 'Basic Wash',
        slug: 'basic-wash',
        description: 'Standard car wash service',
        basePrice: 25,
        estimatedDuration: 30,
        isActive: true,
      },
    })

    const premiumWash = await payload.create({
      collection: 'services',
      data: {
        name: 'Premium Wash',
        slug: 'premium-wash',
        description: 'Premium car wash with wax',
        basePrice: 40,
        estimatedDuration: 45,
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
        overallStatus: 'initiated',
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
        overallStatus: 'initiated',
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
        overallStatus: 'initiated',
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
