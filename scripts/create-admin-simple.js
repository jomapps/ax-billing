import { spawn } from 'child_process'

async function createAdmin() {
  console.log('🧹 Database cleared successfully!')
  console.log('👤 Creating admin user...')

  const adminEmail = process.env.ADMIN_EMAIL || 'jomapps.jb@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Shlok@2000'

  console.log(`Creating admin with email: ${adminEmail}`)

  // Use payload CLI to create admin user
  const createUser = spawn(
    'npx',
    ['payload', 'create-first-user', '--email', adminEmail, '--password', adminPassword],
    {
      stdio: 'inherit',
      env: { ...process.env },
    },
  )

  createUser.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Admin user created successfully!')
      console.log('\n🎉 Database reset completed!')
      console.log('\n📊 Next steps:')
      console.log('1. Start the dev server: pnpm run dev')
      console.log('2. Go to http://localhost:3000/admin')
      console.log(`3. Login with: ${adminEmail}`)
      console.log(
        '4. Manually create service categories, options, and services through the admin interface',
      )
      console.log('\n📝 Service Categories to create:')
      console.log('- Exterior Wash')
      console.log('- Interior Detailing')
      console.log('- Full Service')
      console.log('- Express Service')
      console.log('- Premium Detailing')
      console.log('\n⚙️ Service Options to create:')
      console.log('- Wax Coating (RM15)')
      console.log('- Tire Shine (RM8)')
      console.log('- Interior Fragrance (RM5)')
      console.log('- Leather Conditioning (RM20)')
      console.log('- Engine Bay Cleaning (RM25)')
      console.log('- Ceramic Coating (RM50)')
      console.log('- Headlight Restoration (RM30)')
      console.log('\n🚗 Services to create:')
      console.log('- Basic Wash (RM25, 30min)')
      console.log('- Premium Wash (RM45, 60min)')
      console.log('- Express Wash (RM15, 15min)')
      console.log('- Deluxe Detailing (RM85, 120min)')
      console.log('- Interior Only (RM35, 45min)')
    } else {
      console.error('❌ Failed to create admin user')
    }
  })
}

createAdmin()
