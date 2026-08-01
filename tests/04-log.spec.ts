import { test, expect } from '@playwright/test'

test.describe('Log Page', () => {
  test.beforeEach(async ({ page, request }) => {
    // Ensure there are tasks to send
    await request.patch('http://localhost:3000/api/tasks/task1', {
      data: { send_tonight: true, status: 'pending' }
    })
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    // Trigger a send so log has entries
    await request.post('http://localhost:3000/api/send', {
      headers: { 'x-manual-send': 'true' }
    })
    await page.getByRole('link', { name: 'Log' }).click()
    await page.waitForURL('/log')
    await page.waitForTimeout(600)
  })

  test('renders log page heading', async ({ page }) => {
    await expect(page.getByText('Send History')).toBeVisible()
  })

  test('shows log entries after send', async ({ page }) => {
    const rows = page.locator('button.w-full.flex.items-center')
    await expect(rows.first()).toBeVisible()
  })

  test('log entry rows show member avatar', async ({ page }) => {
    // Avatars are w-8 h-8 rounded-full divs inside the log rows
    const avatars = page.locator('.w-8.h-8.rounded-full')
    await expect(avatars.first()).toBeVisible()
  })

  test('log entries show success badge', async ({ page }) => {
    await expect(page.getByText('✓ Delivered').first()).toBeVisible()
  })

  test('log entry shows task count', async ({ page }) => {
    const countText = page.locator('p.text-xs').filter({ hasText: /task/ }).first()
    await expect(countText).toBeVisible()
  })

  test('clicking log entry expands message preview', async ({ page }) => {
    await page.locator('button.w-full.flex.items-center').first().click()
    await expect(page.getByText('Message sent:')).toBeVisible()
  })

  test('expanded entry shows actual message content in pre element', async ({ page }) => {
    await page.locator('button.w-full.flex.items-center').first().click()
    const preview = page.locator('pre')
    await expect(preview).toBeVisible()
    const text = await preview.textContent()
    expect(text!.length).toBeGreaterThan(0)
  })

  test('clicking expanded entry again collapses it', async ({ page }) => {
    const row = page.locator('button.w-full.flex.items-center').first()
    await row.click()
    await expect(page.getByText('Message sent:')).toBeVisible()
    await row.click()
    await expect(page.getByText('Message sent:')).not.toBeVisible()
  })

  test('navigation back to dashboard works', async ({ page }) => {
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL('/dashboard')
  })
})
