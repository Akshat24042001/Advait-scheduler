import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('API Routes', () => {

  // Tasks
  test('GET /api/tasks returns array with enriched data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/tasks`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
    // Each task should have member and project enrichment
    expect(body[0]).toHaveProperty('id')
    expect(body[0]).toHaveProperty('title')
    expect(body[0]).toHaveProperty('send_tonight')
    expect(body[0]).toHaveProperty('status')
    expect(body[0]).toHaveProperty('member')
    expect(body[0]).toHaveProperty('project')
  })

  test('GET /api/tasks filters by project', async ({ request }) => {
    // Get a project id first
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    const taskWithProject = tasks.find((t: { project: { id: string } | null }) => t.project !== null)
    if (!taskWithProject) return

    const filtered = await request.get(`${BASE}/api/tasks?project=${taskWithProject.project.id}`)
    const filteredTasks = await filtered.json()
    for (const t of filteredTasks) {
      expect(t.project?.id).toBe(taskWithProject.project.id)
    }
  })

  test('GET /api/tasks filters by member', async ({ request }) => {
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    const taskWithMember = tasks.find((t: { member: { id: string } | null }) => t.member !== null)
    if (!taskWithMember) return

    const filtered = await request.get(`${BASE}/api/tasks?member=${taskWithMember.member.id}`)
    const filteredTasks = await filtered.json()
    for (const t of filteredTasks) {
      expect(t.member?.id).toBe(taskWithMember.member.id)
    }
  })

  test('GET /api/tasks filters by status', async ({ request }) => {
    const res = await request.get(`${BASE}/api/tasks?status=pending`)
    const tasks = await res.json()
    for (const t of tasks) {
      expect(t.status).toBe('pending')
    }
  })

  test('POST /api/tasks creates a task', async ({ request }) => {
    const res = await request.post(`${BASE}/api/tasks`, {
      data: { title: 'API test task', notes: 'Created by API test', status: 'pending', send_tonight: false }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('API test task')
    expect(body.id).toBeTruthy()
  })

  test('PATCH /api/tasks/:id updates a task', async ({ request }) => {
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    const id = tasks[0].id

    const res = await request.patch(`${BASE}/api/tasks/${id}`, {
      data: { title: 'Patched title' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.title).toBe('Patched title')
  })

  test('PATCH /api/tasks/:id can toggle send_tonight', async ({ request }) => {
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    const task = tasks[0]

    const res = await request.patch(`${BASE}/api/tasks/${task.id}`, {
      data: { send_tonight: !task.send_tonight }
    })
    expect(res.status()).toBe(200)
    const updated = await res.json()
    expect(updated.send_tonight).toBe(!task.send_tonight)
  })

  test('PATCH /api/tasks/:id with unknown id returns 404', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/tasks/nonexistent-id-xyz`, {
      data: { title: 'fail' }
    })
    expect(res.status()).toBe(404)
  })

  test('DELETE /api/tasks/:id removes the task', async ({ request }) => {
    // Create a task to delete
    const createRes = await request.post(`${BASE}/api/tasks`, {
      data: { title: 'To be deleted', status: 'pending', send_tonight: false }
    })
    const created = await createRes.json()

    const delRes = await request.delete(`${BASE}/api/tasks/${created.id}`)
    expect(delRes.status()).toBe(200)

    // Verify it's gone
    const allRes = await request.get(`${BASE}/api/tasks`)
    const all = await allRes.json()
    const found = all.find((t: { id: string }) => t.id === created.id)
    expect(found).toBeUndefined()
  })

  // Team
  test('GET /api/team returns array of members', async ({ request }) => {
    const res = await request.get(`${BASE}/api/team`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
    expect(body[0]).toHaveProperty('name')
    expect(body[0]).toHaveProperty('phone')
    expect(body[0]).toHaveProperty('role')
  })

  test('POST /api/team creates a member', async ({ request }) => {
    const res = await request.post(`${BASE}/api/team`, {
      data: { name: 'API Test Member', phone: '919123456789', role: 'Architect', active: true }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('API Test Member')
    expect(body.id).toBeTruthy()
  })

  test('PATCH /api/team/:id updates a member', async ({ request }) => {
    const membersRes = await request.get(`${BASE}/api/team`)
    const members = await membersRes.json()
    const id = members[0].id

    const res = await request.patch(`${BASE}/api/team/${id}`, {
      data: { role: 'Designer' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.role).toBe('Designer')
  })

  test('PATCH /api/team/:id with unknown id returns 404', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/team/bad-id`, {
      data: { name: 'fail' }
    })
    expect(res.status()).toBe(404)
  })

  // Projects
  test('GET /api/projects returns array of projects', async ({ request }) => {
    const res = await request.get(`${BASE}/api/projects`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
    expect(body[0]).toHaveProperty('name')
    expect(body[0]).toHaveProperty('status')
  })

  test('POST /api/projects creates a project', async ({ request }) => {
    const res = await request.post(`${BASE}/api/projects`, {
      data: { name: 'API Test Project', client: 'Test Client', status: 'active' }
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('API Test Project')
  })

  test('PATCH /api/projects/:id updates status', async ({ request }) => {
    const projRes = await request.get(`${BASE}/api/projects`)
    const projects = await projRes.json()
    const id = projects[0].id

    const res = await request.patch(`${BASE}/api/projects/${id}`, {
      data: { status: 'on_hold' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('on_hold')
  })

  test('PATCH /api/projects/:id with unknown id returns 404', async ({ request }) => {
    const res = await request.patch(`${BASE}/api/projects/bad-id`, {
      data: { name: 'fail' }
    })
    expect(res.status()).toBe(404)
  })

  // Send
  test('GET /api/send returns preview payload', async ({ request }) => {
    const res = await request.get(`${BASE}/api/send`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    // Each entry has wa link
    for (const entry of body) {
      expect(entry).toHaveProperty('whatsappLink')
      expect(entry.whatsappLink).toContain('wa.me/')
      expect(entry).toHaveProperty('member')
      expect(entry).toHaveProperty('taskCount')
    }
  })

  test('POST /api/send without auth returns 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/send`)
    expect(res.status()).toBe(401)
  })

  test('POST /api/send with x-manual-send header works', async ({ request }) => {
    const res = await request.post(`${BASE}/api/send`, {
      headers: { 'x-manual-send': 'true' }
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('sent')
  })

  test('POST /api/send with correct cron secret works', async ({ request }) => {
    const res = await request.post(`${BASE}/api/send`, {
      headers: { 'x-cron-secret': 'placeholder_cron_secret_change_this' }
    })
    expect(res.status()).toBe(200)
  })

  test('POST /api/send resets send_tonight on sent tasks', async ({ request }) => {
    // Ensure at least one task is scheduled
    await request.patch(`${BASE}/api/tasks/task1`, {
      data: { send_tonight: true, status: 'pending' }
    })

    // Send
    await request.post(`${BASE}/api/send`, {
      headers: { 'x-manual-send': 'true' }
    })

    // Check tasks
    const tasksRes = await request.get(`${BASE}/api/tasks`)
    const tasks = await tasksRes.json()
    const task1 = tasks.find((t: { id: string }) => t.id === 'task1')
    expect(task1?.send_tonight).toBe(false)
  })

  // Log
  test('GET /api/log returns array of log entries', async ({ request }) => {
    const res = await request.get(`${BASE}/api/log`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /api/log entries include member info', async ({ request }) => {
    await request.post(`${BASE}/api/send`, { headers: { 'x-manual-send': 'true' } })
    const res = await request.get(`${BASE}/api/log`)
    const body = await res.json()
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('member')
      expect(body[0]).toHaveProperty('sent_at')
      expect(body[0]).toHaveProperty('status')
    }
  })

  test('GET /api/log returns newest entries first', async ({ request }) => {
    const res = await request.get(`${BASE}/api/log`)
    const body = await res.json()
    if (body.length >= 2) {
      const t1 = new Date(body[0].sent_at).getTime()
      const t2 = new Date(body[1].sent_at).getTime()
      expect(t1).toBeGreaterThanOrEqual(t2)
    }
  })
})
