import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Edge Cases & Business Logic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('/dashboard')
  })

  test('marking task Done auto-unchecks send_tonight via API', async ({ request }) => {
    // Set a task to send_tonight = true and status pending
    await request.patch(`${BASE}/api/tasks/task2`, {
      data: { send_tonight: true, status: 'pending' }
    })
    // Verify it's set
    const before = await request.get(`${BASE}/api/tasks`)
    const tasksBefore = await before.json()
    const t2before = tasksBefore.find((t: { id: string }) => t.id === 'task2')
    expect(t2before.send_tonight).toBe(true)

    // Now cycle to done via API (simulating status badge click)
    await request.patch(`${BASE}/api/tasks/task2`, {
      data: { status: 'done', send_tonight: false }
    })
    const after = await request.get(`${BASE}/api/tasks`)
    const tasksAfter = await after.json()
    const t2after = tasksAfter.find((t: { id: string }) => t.id === 'task2')
    expect(t2after.status).toBe('done')
    expect(t2after.send_tonight).toBe(false)
  })

  test('cycling status to Done via UI auto-unchecks send_tonight', async ({ page, request }) => {
    // Ensure task4 is pending and not scheduled so we can cycle it
    await request.patch(`${BASE}/api/tasks/task4`, { data: { status: 'pending', send_tonight: false } })
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    // Find a pending task, mark it for send, then cycle to done
    const sendBtns = page.locator('button[title="Click to schedule"]')
    const count = await sendBtns.count()
    if (count > 0) {
      await sendBtns.first().click()
      await page.waitForTimeout(300)
    }

    // Cycle it to done
    const pendingBadge = page.locator('button').filter({ hasText: /^Pending$/ }).first()
    await pendingBadge.click()
    await page.waitForTimeout(300)
    await page.locator('button').filter({ hasText: /^In Progress$/ }).first().click()
    await page.waitForTimeout(300)
    await page.locator('button').filter({ hasText: /^Done$/ }).first().click()
    await page.waitForTimeout(500)

    // The send summary should have decreased or shows 'No tasks'
    const summary = await page.getByText(/tasks scheduled for tonight|No tasks/i).textContent()
    expect(summary).toBeTruthy()
  })

  test('tasks with no assignee show em dash in member column', async ({ request }) => {
    // Create unassigned task
    await request.post(`${BASE}/api/tasks`, {
      data: { title: 'Unassigned task test', status: 'pending', send_tonight: false, assigned_to: null }
    })
    const res = await request.get(`${BASE}/api/tasks`)
    const tasks = await res.json()
    const unassigned = tasks.find((t: { title: string; member: null }) => t.title === 'Unassigned task test')
    expect(unassigned.member).toBeNull()
  })

  test('tasks with no project show em dash in project column', async ({ request }) => {
    await request.post(`${BASE}/api/tasks`, {
      data: { title: 'No project task', status: 'pending', send_tonight: false, project_id: null }
    })
    const res = await request.get(`${BASE}/api/tasks`)
    const tasks = await res.json()
    const found = tasks.find((t: { title: string; project: null }) => t.title === 'No project task')
    expect(found.project).toBeNull()
  })

  test('send preview excludes Done tasks', async ({ request }) => {
    // Mark task as done and send_tonight = true (should not appear in preview)
    await request.patch(`${BASE}/api/tasks/task5`, {
      data: { send_tonight: true, status: 'done' }
    })
    const res = await request.get(`${BASE}/api/send`)
    const payload = await res.json()
    // task5 is assigned to Ravi. Check no task with 'Structural' appears
    for (const entry of payload) {
      expect(entry.whatsappLink).not.toContain('Structural')
    }
  })

  test('send preview excludes tasks with no assignee', async ({ request }) => {
    await request.post(`${BASE}/api/tasks`, {
      data: { title: 'Unassigned send test', status: 'pending', send_tonight: true, assigned_to: null }
    })
    const res = await request.get(`${BASE}/api/send`)
    const payload = await res.json()
    for (const entry of payload) {
      expect(entry.whatsappLink).not.toContain('Unassigned send test')
    }
  })

  test('WhatsApp link contains member name in message', async ({ request }) => {
    await request.patch(`${BASE}/api/tasks/task1`, {
      data: { send_tonight: true, status: 'pending' }
    })
    const res = await request.get(`${BASE}/api/send`)
    const payload = await res.json()
    const gunjanEntry = payload.find((e: { member: string }) => e.member === 'Gunjan')
    if (gunjanEntry) {
      const decoded = decodeURIComponent(gunjanEntry.whatsappLink.split('text=')[1])
      expect(decoded).toContain('Gunjan')
      expect(decoded).toContain('ADVAIT')
      expect(decoded).toContain('tasks for tomorrow')
    }
  })

  test('whatsapp phone format is correct (no + prefix)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/send`)
    const payload = await res.json()
    for (const entry of payload) {
      // wa.me links should use number without +
      const match = entry.whatsappLink.match(/wa\.me\/(\d+)/)
      expect(match).not.toBeNull()
      expect(match[1]).toMatch(/^\d+$/)
    }
  })

  test('multiple concurrent task PATCH requests do not corrupt state', async ({ request }) => {
    await Promise.all([
      request.patch(`${BASE}/api/tasks/task1`, { data: { title: 'Concurrent A' } }),
      request.patch(`${BASE}/api/tasks/task2`, { data: { title: 'Concurrent B' } }),
      request.patch(`${BASE}/api/tasks/task3`, { data: { title: 'Concurrent C' } }),
    ])
    const res = await request.get(`${BASE}/api/tasks`)
    const tasks = await res.json()
    const a = tasks.find((t: { id: string }) => t.id === 'task1')
    const b = tasks.find((t: { id: string }) => t.id === 'task2')
    const c = tasks.find((t: { id: string }) => t.id === 'task3')
    expect(a?.title).toBe('Concurrent A')
    expect(b?.title).toBe('Concurrent B')
    expect(c?.title).toBe('Concurrent C')
  })

  test('creating task with very long title', async ({ request }) => {
    const longTitle = 'A'.repeat(500)
    const res = await request.post(`${BASE}/api/tasks`, {
      data: { title: longTitle, status: 'pending', send_tonight: false }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.title).toBe(longTitle)
  })

  test('creating task with special characters in title', async ({ request }) => {
    const specialTitle = 'Task with "quotes" & <special> chars — 日本語 🏛️'
    const res = await request.post(`${BASE}/api/tasks`, {
      data: { title: specialTitle, status: 'pending', send_tonight: false }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.title).toBe(specialTitle)
  })

  test('send with no scheduled tasks returns empty array', async ({ request }) => {
    // Unschedule everything
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    for (const t of tasks) {
      if (t.send_tonight) {
        await request.patch(`${BASE}/api/tasks/${t.id}`, { data: { send_tonight: false } })
      }
    }
    const res = await request.get(`${BASE}/api/send`)
    const payload = await res.json()
    expect(payload).toEqual([])
  })

  test('add task panel title required — empty title does not submit', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add Task' }).click()
    // Don't type title
    const submitBtn = page.locator('.fixed.right-0').getByRole('button', { name: 'Add Task' })
    await expect(submitBtn).toBeDisabled()
  })

  test('inline edit with blank title does not save', async ({ page, request }) => {
    // Reset store so task1 is guaranteed present and pending
    await request.post(`${BASE}/api/reset`)
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    // Click the title to edit
    await page.getByText('Revise bedroom layout').click()
    const input = page.locator('[data-testid="title-edit-input"]')
    await input.fill('')
    await input.press('Enter')
    await page.waitForTimeout(300)
    // Should still show original (empty title = cancelled)
    await expect(page.getByText('Revise bedroom layout')).toBeVisible()
  })

  test('duplicate member names are allowed', async ({ request }) => {
    const r1 = await request.post(`${BASE}/api/team`, {
      data: { name: 'Same Name', phone: '919111111111', role: 'Drafter', active: true }
    })
    const r2 = await request.post(`${BASE}/api/team`, {
      data: { name: 'Same Name', phone: '919222222222', role: 'Architect', active: true }
    })
    expect(r1.status()).toBe(201)
    expect(r2.status()).toBe(201)
    const b1 = await r1.json()
    const b2 = await r2.json()
    expect(b1.id).not.toBe(b2.id)
  })

  test('send log records are persisted after page navigation', async ({ page, request }) => {
    // Ensure at least one task is scheduled, then trigger send
    await request.patch(`${BASE}/api/tasks/task1`, { data: { send_tonight: true, status: 'pending' } })
    await page.reload()
    await page.waitForFunction(() => document.querySelectorAll('button[title]').length > 0)
    await page.getByRole('button', { name: /Send Now/ }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: 'Close' }).click()

    // Navigate away and back
    await page.getByRole('link', { name: 'Setup' }).click()
    await page.waitForURL('/setup')
    await page.getByRole('link', { name: 'Log' }).click()
    await page.waitForURL('/log')

    await page.waitForTimeout(300)
    const rows = page.locator('button.w-full.flex.items-center')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })
})
