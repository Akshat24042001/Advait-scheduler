import { NextRequest, NextResponse } from 'next/server'
import { listTasks, listActiveMembers, listProjects, createTask } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filters = {
    project: searchParams.get('project') ?? undefined,
    member: searchParams.get('member') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  }

  const [tasks, members, projects] = await Promise.all([
    listTasks(filters),
    listActiveMembers(),
    listProjects(),
  ])

  const enriched = tasks.map(t => ({
    ...t,
    member: members.find(m => m.id === t.assigned_to) ?? null,
    project: projects.find(p => p.id === t.project_id) ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const task = await createTask({
    title: body.title,
    notes: body.notes ?? '',
    project_id: body.project_id ?? null,
    assigned_to: body.assigned_to ?? null,
    status: body.status ?? 'pending',
    send_tonight: body.send_tonight ?? false,
    due_date: body.due_date ?? null,
  })
  return NextResponse.json(task, { status: 201 })
}
