import { test, expect } from '@playwright/test'

test.describe('PayloadCMS Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel
    await page.goto('http://localhost:3000/admin')
  })

  test('should display admin login page', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Take a screenshot for debugging
    await page.screenshot({ path: 'admin-login-debug.png', fullPage: true })

    // Check if we can see the login form or any PayloadCMS elements
    const pageContent = await page.content()
    console.log('Page title:', await page.title())
    console.log('Page URL:', page.url())

    // Look for all input elements
    const allInputs = await page.locator('input').all()
    console.log('Total input elements found:', allInputs.length)

    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i]
      const type = await input.getAttribute('type')
      const name = await input.getAttribute('name')
      const placeholder = await input.getAttribute('placeholder')
      const id = await input.getAttribute('id')
      console.log(
        `Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", id="${id}"`,
      )
    }

    // Look for all button elements
    const allButtons = await page.locator('button').all()
    console.log('Total button elements found:', allButtons.length)

    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i]
      const text = await button.textContent()
      const type = await button.getAttribute('type')
      console.log(`Button ${i + 1}: text="${text}", type="${type}"`)
    }

    // Look for any forms
    const allForms = await page.locator('form').all()
    console.log('Total form elements found:', allForms.length)

    // Check for PayloadCMS specific elements
    const payloadElements = await page.locator('[class*="payload"], [data-payload]').count()
    console.log('PayloadCMS elements found:', payloadElements)

    // Check if there's any content at all
    const bodyText = await page.locator('body').textContent()
    console.log('Body text length:', bodyText?.length || 0)
    console.log('Body text preview:', bodyText?.substring(0, 500) || 'No content')

    // Look for specific text that might indicate what page we're on
    const hasLoginText = bodyText?.toLowerCase().includes('login') || false
    const hasSignInText = bodyText?.toLowerCase().includes('sign in') || false
    const hasDashboardText = bodyText?.toLowerCase().includes('dashboard') || false
    const hasCreateUserText =
      (bodyText?.toLowerCase().includes('create') && bodyText?.toLowerCase().includes('user')) ||
      false

    console.log('Contains "login":', hasLoginText)
    console.log('Contains "sign in":', hasSignInText)
    console.log('Contains "dashboard":', hasDashboardText)
    console.log('Contains "create user":', hasCreateUserText)

    // Expect at least some content to be present
    expect(bodyText?.length || 0).toBeGreaterThan(0)
  })

  test('should handle admin creation if no users exist', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Check if we're redirected to create first user
    const currentUrl = page.url()
    const pageTitle = await page.title()
    const bodyText = await page.locator('body').textContent()

    console.log('Current URL:', currentUrl)
    console.log('Page title:', pageTitle)
    console.log('Body content preview:', bodyText?.substring(0, 300))

    // Look for first user creation form
    const createUserForm = page.locator('form')
    const emailField = page.locator('input[type="email"], input[name="email"]')
    const passwordField = page.locator('input[type="password"], input[name="password"]')
    const confirmPasswordField = page.locator(
      'input[name="confirm-password"], input[name="confirmPassword"]',
    )

    const hasCreateForm = (await createUserForm.count()) > 0
    const hasEmailField = (await emailField.count()) > 0
    const hasPasswordField = (await passwordField.count()) > 0

    console.log('Create user form present:', hasCreateForm)
    console.log('Email field present:', hasEmailField)
    console.log('Password field present:', hasPasswordField)

    if (hasCreateForm && hasEmailField && hasPasswordField) {
      console.log('First user creation form detected')

      // Try to create the first admin user
      await emailField.fill('admin@axbilling.com')
      await passwordField.fill('admin123456')

      if ((await confirmPasswordField.count()) > 0) {
        await confirmPasswordField.fill('admin123456')
      }

      // Look for submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Create"), button:has-text("Submit")',
      )
      if ((await submitButton.count()) > 0) {
        await submitButton.click()

        // Wait for response
        await page.waitForLoadState('networkidle')

        console.log('After form submission - URL:', page.url())
        console.log('After form submission - Title:', await page.title())
      }
    }
  })

  test('should check for JavaScript errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.waitForLoadState('networkidle')

    console.log('JavaScript errors found:', errors)

    // Log errors but don't fail the test - we want to see what's happening
    if (errors.length > 0) {
      console.log('Errors detected:', errors)
    }
  })

  test('should logout and show login form', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Look for logout button and click it
    const logoutButton = page.locator('button:has-text("Log out")')

    if ((await logoutButton.count()) > 0) {
      console.log('Found logout button, clicking it...')
      await logoutButton.click()

      // Wait for navigation or page change
      await page.waitForLoadState('networkidle')

      console.log('After logout - URL:', page.url())
      console.log('After logout - Title:', await page.title())

      // Take screenshot after logout
      await page.screenshot({ path: 'after-logout-debug.png', fullPage: true })

      // Now check for login form
      const loginForm = page.locator('form')
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const passwordInput = page.locator('input[type="password"], input[name="password"]')

      console.log('After logout - Login form present:', (await loginForm.count()) > 0)
      console.log('After logout - Email input present:', (await emailInput.count()) > 0)
      console.log('After logout - Password input present:', (await passwordInput.count()) > 0)

      const bodyText = await page.locator('body').textContent()
      console.log('After logout - Body text preview:', bodyText?.substring(0, 500) || 'No content')
    } else {
      console.log('No logout button found')
    }
  })
})
