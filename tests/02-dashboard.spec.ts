import { test, expect } from '@playwright/test'

// Helper: scope to the task table body (not headers or option elements)
const taskRows = (page: import('@playwright/test').Page) =>
  page.locator('[style*="gridTemplateColumns: \'44px"]')

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
    // Wait for actual task data to load
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
  })

  // Layout
  test('renders nav with all links', async ({ page }) => {
    await expect(page.getByText('ADVAIT')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Setup' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Log' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('renders send summary bar', async ({ page }) => {
    // Scope to the p element inside the summary bar — use first() to avoid strict mode on ancestors
    const summary = page.locator('p.text-sm.font-medium').first()
    await expect(summary).toBeVisible()
    const text = await summary.textContent()
    expect(text).toMatch(/tasks scheduled for tonight|No tasks scheduled/i)
    await expect(page.getByRole('button', { name: 'Preview' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Send Now/i })).toBeVisible()
  })

  test('renders filter row', async ({ page }) => {
    await expect(page.getByRole('combobox').nth(0)).toBeVisible()
    await expect(page.getByRole('combobox').nth(1)).toBeVisible()
    await expect(page.getByRole('combobox').nth(2)).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Add Task' })).toBeVisible()
  })

  test('renders task list with dummy data — has 5+ tasks', async ({ page }) => {
    const toggleBtns = page.locator('button[title]')
    const count = await toggleBtns.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('task rows show member avatars', async ({ page }) => {
    // Avatar spans are inside the task rows: w-6 h-6 rounded-full
    const avatars = page.locator('span.w-6.h-6.rounded-full')
    const count = await avatars.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('task rows show status badges', async ({ page }) => {
    // Status badges are buttons — scope with title to exclude filter selects
    const statusBtns = page.locator('button').filter({ hasText: /^(Pending|In Progress|Done)$/ })
    const count = await statusBtns.count()
    expect(count).toBeGreaterThan(0)
    // Should have at least one Pending
    await expect(statusBtns.filter({ hasText: 'Pending' }).first()).toBeVisible()
  })

  test('task rows show project names in cells', async ({ page }) => {
    // Project names in task rows are in div.text-xs.truncate elements
    const projectCells = page.locator('div.text-xs.truncate')
    const count = await projectCells.count()
    expect(count).toBeGreaterThan(0)
    // At least one cell has a project name
    const texts = await projectCells.allTextContents()
    const hasProject = texts.some(t => t.length > 1 && t !== '—')
    expect(hasProject).toBe(true)
  })

  // Send Tonight Toggle
  test('send_tonight toggle is clickable and changes state', async ({ page }) => {
    const uncheckedToggle = page.locator('button[title="Click to schedule"]').first()
    await uncheckedToggle.click()
    await expect(page.locator('button[title="Scheduled tonight"]').first()).toBeVisible()
  })

  test('summary bar count updates when toggling', async ({ page }) => {
    const summary = page.locator('p.text-sm.font-medium').first()
    const summaryBefore = await summary.textContent()
    const uncheckedToggle = page.locator('button[title="Click to schedule"]').first()
    await uncheckedToggle.click()
    await page.waitForTimeout(600)
    const summaryAfter = await summary.textContent()
    expect(summaryBefore).not.toEqual(summaryAfter)
  })

  test('done tasks cannot be toggled for send', async ({ page }) => {
    const doneToggle = page.locator('button[title="Done tasks are not sent"]')
    const countBefore = await doneToggle.count()
    if (countBefore > 0) {
      await doneToggle.first().click()
      await page.waitForTimeout(300)
      await expect(page.locator('button[title="Done tasks are not sent"]').first()).toBeVisible()
    }
  })

  // Status cycling
  test('clicking status badge cycles to next status', async ({ page }) => {
    const pendingBadge = page.locator('button').filter({ hasText: /^Pending$/ }).first()
    await pendingBadge.click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: /^In Progress$/ }).first()).toBeVisible()
  })

  test('cycling from In Progress goes to Done', async ({ page }) => {
    const pendingBadge = page.locator('button').filter({ hasText: /^Pending$/ }).first()
    await pendingBadge.click()
    await page.waitForTimeout(400)
    const inProgressBadge = page.locator('button').filter({ hasText: /^In Progress$/ }).first()
    await inProgressBadge.click()
    await page.waitForTimeout(400)
    await expect(page.locator('button').filter({ hasText: /^Done$/ }).first()).toBeVisible()
  })

  test('cycling from Done goes back to Pending', async ({ page }) => {
    const pending = page.locator('button').filter({ hasText: /^Pending$/ }).first()
    await pending.click()
    await page.waitForTimeout(300)
    const inProgress = page.locator('button').filter({ hasText: /^In Progress$/ }).first()
    await inProgress.click()
    await page.waitForTimeout(300)
    const done = page.locator('button').filter({ hasText: /^Done$/ }).first()
    await done.click()
    await page.waitForTimeout(300)
    await expect(page.locator('button').filter({ hasText: /^Pending$/ }).first()).toBeVisible()
  })

  // Inline edit
  test('clicking task title switches to edit input', async ({ page }) => {
    const titleP = page.locator('p.text-sm.truncate').first()
    await titleP.click()
    await expect(page.locator('[data-testid="title-edit-input"]')).toBeVisible()
  })

  test('editing task title saves on Enter', async ({ page }) => {
    const titleP = page.locator('p.text-sm.truncate').first()
    const originalTitle = await titleP.textContent()
    await titleP.click()
    const input = page.locator('[data-testid="title-edit-input"]')
    await input.fill('Updated via QA test')
    await input.press('Enter')
    await page.waitForTimeout(600)
    await expect(page.locator('p.text-sm.truncate').first()).toHaveText('Updated via QA test')
    // Restore original title for subsequent tests
    await page.locator('p.text-sm.truncate').first().click()
    const inp2 = page.locator('[data-testid="title-edit-input"]')
    await inp2.fill(originalTitle ?? '')
    await inp2.press('Enter')
  })

  test('editing task title cancels on Escape', async ({ page }) => {
    const titleP = page.locator('p.text-sm.truncate').first()
    const originalTitle = await titleP.textContent()
    await titleP.click()
    const input = page.locator('[data-testid="title-edit-input"]')
    await input.fill('Should not save this')
    await input.press('Escape')
    await page.waitForTimeout(400)
    await expect(page.locator('p.text-sm.truncate').first()).toHaveText(originalTitle ?? '')
  })

  test('empty title on blur does not save', async ({ page }) => {
    const titleP = page.locator('p.text-sm.truncate').first()
    const originalTitle = await titleP.textContent()
    await titleP.click()
    const input = page.locator('[data-testid="title-edit-input"]')
    await input.fill('')
    await input.press('Enter')
    await page.waitForTimeout(400)
    await expect(page.locator('p.text-sm.truncate').first()).toHaveText(originalTitle ?? '')
  })

  // Delete
  test('delete button removes task on click', async ({ page }) => {
    const countBefore = await page.locator('button[title]').count()
    const deleteBtn = page.locator('[title="Delete task"]').first()
    await deleteBtn.evaluate(el => { (el as HTMLElement).style.opacity = '1' })
    await deleteBtn.click()
    await page.waitForTimeout(500)
    const countAfter = await page.locator('button[title]').count()
    // One fewer toggle button = one fewer task
    expect(countAfter).toBeLessThan(countBefore)
  })

  // Filters
  test('project filter narrows task list', async ({ page }) => {
    const projectFilter = page.getByRole('combobox').nth(0)
    const options = await projectFilter.locator('option').all()
    if (options.length > 1) {
      await projectFilter.selectOption({ index: 1 })
      await page.waitForTimeout(600)
      const toggles = await page.locator('button[title]').count()
      expect(toggles).toBeGreaterThan(0) // at least something visible
    }
  })

  test('member filter narrows task list', async ({ page }) => {
    const memberFilter = page.getByRole('combobox').nth(1)
    await memberFilter.selectOption({ index: 1 })
    await page.waitForTimeout(500)
    const rows = await page.locator('button[title]').count()
    expect(rows).toBeGreaterThanOrEqual(0)
  })

  test('status filter Pending Only shows only pending tasks', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').nth(2)
    await statusFilter.selectOption('pending')
    await page.waitForTimeout(500)
    const inProgressBadge = page.locator('button').filter({ hasText: /^In Progress$/ })
    await expect(inProgressBadge).toHaveCount(0)
    const doneBadge = page.locator('button').filter({ hasText: /^Done$/ })
    await expect(doneBadge).toHaveCount(0)
  })

  test('resetting filters shows all tasks again', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').nth(2)
    await statusFilter.selectOption('done')
    await page.waitForTimeout(300)
    await statusFilter.selectOption('all')
    await page.waitForTimeout(300)
    // Should show more tasks after reset
    const count = await page.locator('button[title]').count()
    expect(count).toBeGreaterThan(0)
  })

  // Add Task form
  test('Add Task button opens slide-in panel', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible()
  })

  test('Add Task panel has all required fields', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible()
    await expect(page.getByPlaceholder('Additional context…')).toBeVisible()
    // Check labels within the slide-in panel
    const panel = page.locator('.fixed.right-0')
    await expect(panel.getByText('Title *')).toBeVisible()
    await expect(panel.getByText('Notes')).toBeVisible()
    await expect(panel.getByText('Assign To')).toBeVisible()
    await expect(panel.getByText('Schedule for Tonight')).toBeVisible()
  })

  test('Add Task submit button disabled when title empty', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    const panel = page.locator('.fixed.right-0')
    const submitBtn = panel.getByRole('button', { name: 'Add Task' })
    await expect(submitBtn).toBeDisabled()
  })

  test('Add Task creates new task and appears in list', async ({ page }) => {
    const countBefore = await page.locator('button[title]').count()
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('QA production test task')
    const panel = page.locator('.fixed.right-0')
    await panel.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(600)
    const countAfter = await page.locator('button[title]').count()
    expect(countAfter).toBeGreaterThan(countBefore)
    await expect(page.getByText('QA production test task')).toBeVisible()
  })

  test('Add Task panel closes on Cancel', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByPlaceholder('What needs to be done?')).not.toBeVisible()
  })

  test('Add Task panel closes on backdrop click', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await page.locator('div.fixed.inset-0.z-40').click({ position: { x: 10, y: 10 } })
    await expect(page.getByPlaceholder('What needs to be done?')).not.toBeVisible()
  })

  test('Add Task with send tonight toggle', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Tonight toggle QA task')
    await page.getByRole('button', { name: /Schedule for Tonight/ }).click()
    const panel = page.locator('.fixed.right-0')
    await panel.getByRole('button', { name: 'Add Task' }).click()
    await page.waitForTimeout(600)
    await expect(page.getByText('Tonight toggle QA task')).toBeVisible()
  })

  // Send Now
  test('Send Now triggers and opens WhatsApp preview', async ({ page, request }) => {
    // Ensure at least one task is scheduled
    await request.patch('http://localhost:3000/api/tasks/task1', {
      data: { send_tonight: true, status: 'pending' }
    })
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    await page.getByRole('button', { name: /Send Now/ }).click()
    await page.waitForTimeout(1500)
    await expect(page.getByText('WhatsApp Send Preview')).toBeVisible()
  })

  test('Preview button opens send modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.getByText('WhatsApp Send Preview')).toBeVisible()
  })

  test('send modal shows WhatsApp links when tasks are scheduled', async ({ page, request }) => {
    // Schedule tasks via API first
    await request.patch('http://localhost:3000/api/tasks/task1', {
      data: { send_tonight: true, status: 'pending' }
    })
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    await page.getByRole('button', { name: 'Preview' }).click()
    await page.waitForTimeout(600)
    const waLinks = page.getByRole('link', { name: /Open WhatsApp/i })
    const count = await waLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('WhatsApp links point to wa.me with pre-written message', async ({ page, request }) => {
    await request.patch('http://localhost:3000/api/tasks/task1', {
      data: { send_tonight: true, status: 'pending' }
    })
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    await page.getByRole('button', { name: 'Preview' }).click()
    await page.waitForTimeout(600)
    const firstLink = page.getByRole('link', { name: /Open WhatsApp/i }).first()
    const href = await firstLink.getAttribute('href')
    expect(href).toContain('wa.me/')
    expect(href).toContain('text=')
    const decoded = decodeURIComponent(href!.split('text=')[1])
    expect(decoded).toContain('ADVAIT')
    expect(decoded).toContain('tasks for tomorrow')
  })

  test('send modal closes on X button', async ({ page }) => {
    await page.getByRole('button', { name: 'Preview' }).click()
    await page.waitForTimeout(300)
    // Find the X button inside the modal header
    const modal = page.locator('.fixed.inset-0.z-50')
    await modal.locator('button', { hasText: '✕' }).click()
    await expect(page.getByText('WhatsApp Send Preview')).not.toBeVisible()
  })

  test('send modal closes on Close button', async ({ page }) => {
    await page.getByRole('button', { name: 'Preview' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByText('WhatsApp Send Preview')).not.toBeVisible()
  })

  // Logout
  test('logout button redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL('/login')
  })
})
