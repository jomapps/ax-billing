import fetch from 'node-fetch'

async function createAdminUser() {
  const API_URL = 'http://localhost:3000/api'

  try {
    console.log('🔧 Creating admin user via API...')

    // Try to create the first user via the API
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@axbilling.com',
        password: 'admin123456',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      }),
    })

    if (response.ok) {
      const user = (await response.json()) as { email: string }
      console.log('✅ Admin user created successfully:', user.email)
    } else {
      const error = await response.text()
      console.log('Response status:', response.status)
      console.log('Response error:', error)

      // If it's a 401, it might mean we need to use the first user registration endpoint
      if (response.status === 401) {
        console.log('🔄 Trying first user registration endpoint...')

        const firstUserResponse = await fetch(`${API_URL}/users/first-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@axbilling.com',
            password: 'admin123456',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
          }),
        })

        if (firstUserResponse.ok) {
          const user = (await firstUserResponse.json()) as { email: string }
          console.log('✅ First admin user created successfully:', user.email)
        } else {
          const firstUserError = await firstUserResponse.text()
          console.log('First user registration failed:', firstUserError)
        }
      }
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  }
}

createAdminUser()
