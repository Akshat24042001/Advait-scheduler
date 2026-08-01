import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('redirects root to /login', async ({ page }) => {
    await expect(page).toHaveURL('/login')
  })

  test('renders login form elements', async ({ page }) => {
    await expect(page.getByText('ADVAIT Scheduler')).toBeVisible()
    await expect(page.getByPlaceholder('vinay@advait.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('pre-fills email and password in demo mode', async ({ page }) => {
    const email = page.getByPlaceholder('vinay@advait.com')
    const password = page.getByPlaceholder('••••••••')
    await expect(email).toHaveValue('vinay@advait.com')
    await expect(password).toHaveValue('demo123')
  })

  test('shows loading state on submit', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible()
  })

  test('redirects to /dashboard after login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('login works with any non-empty credentials', async ({ page }) => {
    await page.getByPlaceholder('vinay@advait.com').fill('test@test.com')
    await page.getByPlaceholder('••••••••').fill('anypassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
  })

  test('shows error when fields are empty', async ({ page }) => {
    await page.getByPlaceholder('vinay@advait.com').fill('')
    await page.getByPlaceholder('••••••••').fill('')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // In demo mode with empty email, HTML5 validation blocks submit (input[type=email] required)
    // The page should NOT navigate away — still on /login
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL('/login')
  })

  test('demo mode notice visible', async ({ page }) => {
    await expect(page.getByText(/demo mode/i)).toBeVisible()
  })

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/ADVAIT Scheduler/)
  })
})
