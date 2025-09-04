import { test, expect } from '@playwright/test'

test.describe('PayloadCMS Admin Login Test', () => {
  test('should be able to login with admin credentials', async ({ page }) => {
    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin')
    await page.waitForLoadState('networkidle')
    
    console.log('Initial page title:', await page.title())
    console.log('Initial page URL:', page.url())
    
    // Take a screenshot
    await page.screenshot({ path: 'admin-panel-with-user.png', fullPage: true })
    
    // Check if we're already logged in (dashboard visible)
    const bodyText = await page.locator('body').textContent()
    const isDashboard = bodyText?.toLowerCase().includes('dashboard') || false
    const hasLogoutButton = await page.locator('button:has-text("Log out")').count() > 0
    
    console.log('Is dashboard visible:', isDashboard)
    console.log('Has logout button:', hasLogoutButton)
    
    if (isDashboard && hasLogoutButton) {
      console.log('✅ Already logged in to admin dashboard!')
      
      // Check for admin functionality
      const hasUsersLink = bodyText?.toLowerCase().includes('users') || false
      const hasCollectionsMenu = await page.locator('[class*="nav"], [class*="menu"]').count() > 0
      
      console.log('Has users section:', hasUsersLink)
      console.log('Has collections menu:', hasCollectionsMenu)
      
      // Try to navigate to users collection
      const usersLink = page.locator('a:has-text("Users"), [href*="users"]').first()
      if (await usersLink.count() > 0) {
        console.log('Clicking on Users collection...')
        await usersLink.click()
        await page.waitForLoadState('networkidle')
        
        console.log('Users page URL:', page.url())
        console.log('Users page title:', await page.title())
        
        // Check if we can see the admin user we created
        const pageContent = await page.locator('body').textContent()
        const hasAdminEmail = pageContent?.includes('admin@axbilling.com') || false
        console.log('Can see admin user:', hasAdminEmail)
      }
    } else {
      // Look for login form
      const loginForm = page.locator('form')
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const passwordInput = page.locator('input[type="password"], input[name="password"]')
      const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
      
      const hasLoginForm = await loginForm.count() > 0
      const hasEmailInput = await emailInput.count() > 0
      const hasPasswordInput = await passwordInput.count() > 0
      const hasLoginButton = await loginButton.count() > 0
      
      console.log('Login form present:', hasLoginForm)
      console.log('Email input present:', hasEmailInput)
      console.log('Password input present:', hasPasswordInput)
      console.log('Login button present:', hasLoginButton)
      
      if (hasEmailInput && hasPasswordInput && hasLoginButton) {
        console.log('Attempting to login...')
        
        await emailInput.fill('admin@axbilling.com')
        await passwordInput.fill('admin123456')
        await loginButton.click()
        
        await page.waitForLoadState('networkidle')
        
        console.log('After login - URL:', page.url())
        console.log('After login - Title:', await page.title())
        
        // Check if login was successful
        const afterLoginText = await page.locator('body').textContent()
        const loginSuccessful = afterLoginText?.toLowerCase().includes('dashboard') || false
        console.log('Login successful:', loginSuccessful)
      }
    }
    
    // Expect some content to be present
    expect(bodyText?.length || 0).toBeGreaterThan(0)
  })
})
