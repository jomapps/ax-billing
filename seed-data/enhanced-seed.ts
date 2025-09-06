import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Helper function to read JSON files
function readSeedData(filename: string) {
  const filePath = path.join(__dirname, filename)
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

async function enhancedSeedData() {
  console.log('🌱 Starting enhanced database seeding...')

  // Initialize payload
  const payload = await getPayload({ config })

  try {
    // Load seed data from JSON files
    const serviceCategories = readSeedData('service-categories.json')
    const serviceOptions = readSeedData('service-options.json')
    const customerTiers = readSeedData('customer-tiers.json')
    const services = readSeedData('services.json')
    const users = readSeedData('users.json')
    const vehicles = readSeedData('vehicles.json')
    const orders = readSeedData('orders.json')

    // Maps to store created entities for reference resolution
    const categoryMap = new Map()
    const optionMap = new Map()
    const tierMap = new Map()
    const serviceMap = new Map()
    const userMap = new Map()
    const vehicleMap = new Map()

    // 1. Create Service Categories
    console.log('Creating service categories...')
    for (const category of serviceCategories) {
      const created = await payload.create({
        collection: 'service-categories',
        data: category,
      })
      categoryMap.set(category.name.toLowerCase().replace(/\s+/g, '-'), created.id)
      console.log(`✅ Created category: ${category.name}`)
    }

    // 2. Create Service Options
    console.log('Creating service options...')
    for (const option of serviceOptions) {
      const created = await payload.create({
        collection: 'service-options',
        data: option,
      })
      optionMap.set(option.name.toLowerCase().replace(/\s+/g, '-'), created.id)
      console.log(`✅ Created option: ${option.name}`)
    }

    // 3. Create Customer Tiers
    console.log('Creating customer tiers...')
    for (const tier of customerTiers) {
      const created = await payload.create({
        collection: 'customer-tiers',
        data: {
          ...tier,
          pricingOverrides: [], // Will be updated after services are created
        },
      })
      tierMap.set(tier.tierName.toLowerCase().replace(/\s+/g, '-'), created.id)
      console.log(`✅ Created tier: ${tier.tierName}`)
    }

    // 4. Create Services
    console.log('Creating services...')
    for (const service of services) {
      const serviceData = {
        ...service,
        category: categoryMap.get(service.categoryRef),
        compatibleOptions:
          service.availableOptionsRefs?.map((ref: string) => optionMap.get(ref)).filter(Boolean) ||
          [],
      }
      delete serviceData.categoryRef
      delete serviceData.availableOptionsRefs

      const created = await payload.create({
        collection: 'services',
        data: serviceData,
      })
      serviceMap.set(service.name.toLowerCase().replace(/\s+/g, '-'), created.id)
      console.log(`✅ Created service: ${service.name}`)
    }

    // 5. Update Customer Tiers with pricing overrides
    console.log('Updating customer tier pricing overrides...')
    for (const tier of customerTiers) {
      if (tier.pricingOverrides && tier.pricingOverrides.length > 0) {
        const overrides = tier.pricingOverrides
          .map((override: any) => ({
            service: serviceMap.get(override.serviceRef),
            overriddenPrice: override.overriddenPrice,
          }))
          .filter((override: any) => override.service)

        await payload.update({
          collection: 'customer-tiers',
          id: tierMap.get(tier.tierName.toLowerCase().replace(/\s+/g, '-')),
          data: { pricingOverrides: overrides },
        })
        console.log(`✅ Updated pricing for tier: ${tier.tierName}`)
      }
    }

    // 6. Create Users
    console.log('Creating users...')
    for (const user of users) {
      const userData = {
        ...user,
        customerClassification: user.customerClassificationRef
          ? tierMap.get(user.customerClassificationRef)
          : undefined,
      }
      delete userData.customerClassificationRef

      const created = await payload.create({
        collection: 'users',
        data: userData,
      })
      userMap.set(user.email, created.id)
      console.log(`✅ Created user: ${user.email}`)
    }

    // 7. Create Vehicles
    console.log('Creating vehicles...')
    for (const vehicle of vehicles) {
      const vehicleData = {
        ...vehicle,
        owner: userMap.get(vehicle.ownerRef),
      }
      delete vehicleData.ownerRef

      const created = await payload.create({
        collection: 'vehicles',
        data: vehicleData,
      })
      vehicleMap.set(vehicle.licensePlate, created.id)
      console.log(`✅ Created vehicle: ${vehicle.licensePlate}`)
    }

    // 8. Create Orders
    console.log('Creating orders...')
    for (const order of orders) {
      const orderData = {
        ...order,
        customer: userMap.get(order.customerRef),
        vehicle: vehicleMap.get(order.vehicleRef),
        servicesRendered: order.servicesRendered.map((service: any) => ({
          service: serviceMap.get(service.serviceRef),
          selectedOptions:
            service.selectedOptionsRefs?.map((ref: string) => optionMap.get(ref)).filter(Boolean) ||
            [],
          servicePrice: service.servicePrice,
          optionsPrice: service.optionsPrice,
        })),
      }
      delete orderData.customerRef
      delete orderData.vehicleRef

      const created = await payload.create({
        collection: 'orders',
        data: orderData,
      })
      console.log(`✅ Created order: ${order.orderID}`)
    }

    console.log('✅ Enhanced database seeding completed successfully!')
    console.log(`
📊 Summary:
- ${serviceCategories.length} Service Categories
- ${serviceOptions.length} Service Options
- ${customerTiers.length} Customer Tiers
- ${services.length} Services
- ${users.length} Users
- ${vehicles.length} Vehicles
- ${orders.length} Orders
    `)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }

  process.exit(0)
}

enhancedSeedData()
