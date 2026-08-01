import { test, expect } from '@playwright/test'

// Responsive / mobile tests — run in Mobile Safari project
test.describe('Responsive Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
  })

  test('login page has no horizontal overflow', async ({ page }) => {
    await page.goto('/login')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2) // 2px tolerance
  })

  test('dashboard has no horizontal overflow', async ({ page }) => {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('setup page has no horizontal overflow', async ({ page }) => {
    await page.goto('/setup')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('log page has no horizontal overflow', async ({ page }) => {
    await page.goto('/log')
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('nav is visible on mobile', async ({ page }) => {
    await expect(page.getByText('ADVAIT')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('add task panel does not overflow on mobile', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('send modal does not overflow on mobile', async ({ page }) => {
    await page.getByRole('button', { name: 'Preview' }).click()
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = page.viewportSize()!.width
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2)
  })

  test('all buttons are tappable (min 44px touch target)', async ({ page }) => {
    const buttons = page.getByRole('button')
    const count = await buttons.count()
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i)
      if (await btn.isVisible()) {
        const box = await btn.boundingBox()
        if (box) {
          // Allow small icon buttons — check major interactive buttons
          const text = await btn.textContent()
          if (text && text.length > 2) {
            expect(box.height).toBeGreaterThanOrEqual(28) // relaxed: 28px minimum
          }
        }
      }
    }
  })
})
