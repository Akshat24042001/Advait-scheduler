import { test, expect } from '@playwright/test'

test.describe('Setup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    await page.getByRole('link', { name: 'Setup' }).click()
    await page.waitForURL('/setup')
    await page.waitForTimeout(500)
  })

  test('renders Team Members section heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Team Members' }).or(page.getByText('Team Members').first())).toBeVisible()
  })

  test('renders known dummy members', async ({ page }) => {
    await expect(page.getByText('Gunjan').first()).toBeVisible()
    await expect(page.getByText('Ravi').first()).toBeVisible()
    await expect(page.getByText('Priya').first()).toBeVisible()
  })

  test('renders team column headers', async ({ page }) => {
    await expect(page.getByText('Name').first()).toBeVisible()
    await expect(page.getByText('Phone').first()).toBeVisible()
    await expect(page.getByText('Role').first()).toBeVisible()
  })

  test('renders known projects', async ({ page }) => {
    await expect(page.getByText('Mediterranean Villa').first()).toBeVisible()
    await expect(page.getByText('Aikyam Residence').first()).toBeVisible()
    await expect(page.getByText('Skyline Office').first()).toBeVisible()
  })

  test('project status badge is a clickable button', async ({ page }) => {
    // Status buttons in project rows — look for capitalize text buttons in the project section
    const statusBtns = page.locator('button').filter({ hasText: /^(active|on hold|completed)$/i })
    const count = await statusBtns.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('clicking project status cycles it', async ({ page }) => {
    const onHoldBtn = page.locator('button').filter({ hasText: /^on hold$/i }).first()
    await onHoldBtn.click()
    await page.waitForTimeout(400)
    await expect(page.locator('button').filter({ hasText: /^completed$/i }).first()).toBeVisible()
  })

  test('Edit button opens inline edit row for member', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: 'Edit' })
    await editBtns.first().click()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  })

  test('editing member name saves correctly', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: 'Edit' })
    await editBtns.first().click()
    const nameInput = page.locator('input').first()
    await nameInput.fill('EditedNameQA')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.waitForTimeout(400)
    await expect(page.getByText('EditedNameQA').first()).toBeVisible()
  })

  test('cancelling member edit does not save', async ({ page }) => {
    const editBtns = page.getByRole('button', { name: 'Edit' })
    await editBtns.first().click()
    await page.getByRole('button', { name: '✕' }).click()
    await page.waitForTimeout(300)
    // Save button should be gone
    await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  })

  test('toggling member active status works', async ({ page }) => {
    const activeBtns = page.locator('button').filter({ hasText: /^Active$/ })
    const countBefore = await activeBtns.count()
    if (countBefore > 0) {
      await activeBtns.first().click()
      await page.waitForTimeout(400)
      const countAfter = await page.locator('button').filter({ hasText: /^Active$/ }).count()
      expect(countAfter).toBe(countBefore - 1)
    }
  })

  // Add Member
  test('Add Member inputs are visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Name', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('91XXXXXXXXXX')).toBeVisible()
  })

  test('adds a new team member', async ({ page }) => {
    await page.getByPlaceholder('Name', { exact: true }).fill('QATestMember')
    await page.getByPlaceholder('91XXXXXXXXXX').fill('919800000001')
    await page.getByRole('button', { name: '+ Add' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('QATestMember').first()).toBeVisible()
  })

  test('Add Member button does nothing when name is empty', async ({ page }) => {
    // Only fill phone, leave name blank
    await page.getByPlaceholder('91XXXXXXXXXX').fill('919800000099')
    const countBefore = await page.getByRole('button', { name: 'Edit' }).count()
    await page.getByRole('button', { name: '+ Add' }).first().click()
    await page.waitForTimeout(300)
    const countAfter = await page.getByRole('button', { name: 'Edit' }).count()
    expect(countAfter).toBe(countBefore)
  })

  // Add Project
  test('Add Project inputs are visible', async ({ page }) => {
    await expect(page.getByPlaceholder('Project name')).toBeVisible()
    await expect(page.getByPlaceholder('Client name')).toBeVisible()
  })

  test('adds a new project', async ({ page }) => {
    await page.getByPlaceholder('Project name').fill('QA Test Project')
    await page.getByPlaceholder('Client name').fill('QA Client')
    await page.getByRole('button', { name: '+ Add' }).last().click()
    await page.waitForTimeout(500)
    await expect(page.getByText('QA Test Project').first()).toBeVisible()
  })

  test('Add Project button does nothing when name is empty', async ({ page }) => {
    await page.getByPlaceholder('Client name').fill('Should not be added')
    // Count project rows by counting "active|on hold|completed" buttons
    const countBefore = await page.locator('button').filter({ hasText: /^(active|on hold|completed)$/i }).count()
    await page.getByRole('button', { name: '+ Add' }).last().click()
    await page.waitForTimeout(300)
    const countAfter = await page.locator('button').filter({ hasText: /^(active|on hold|completed)$/i }).count()
    expect(countAfter).toBe(countBefore)
  })

  test('navigation to dashboard from setup works', async ({ page }) => {
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL('/dashboard')
  })
})
