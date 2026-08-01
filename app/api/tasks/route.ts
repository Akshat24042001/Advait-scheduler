import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const project = searchParams.get('project')
  const member = searchParams.get('member')
  const status = searchParams.get('status')

  let tasks = store.tasks.list()
  const members = store.members.all()
  const projects = store.projects.list()

  if (project) tasks = tasks.filter(t => t.project_id === project)
  if (member) tasks = tasks.filter(t => t.assigned_to === member)
  if (status && status !== 'all') tasks = tasks.filter(t => t.status === status)

  const enriched = tasks.map(t => ({
    ...t,
    member: members.find(m => m.id === t.assigned_to) ?? null,
    project: projects.find(p => p.id === t.project_id) ?? null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const task = store.tasks.create({
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
