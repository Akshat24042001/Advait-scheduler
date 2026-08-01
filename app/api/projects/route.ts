import { NextRequest, NextResponse } from 'next/server'
import { listProjects, createProject } from '@/lib/db'

export async function GET() {
  return NextResponse.json(await listProjects())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const project = await createProject({
    name: body.name,
    client: body.client ?? '',
    status: body.status ?? 'active',
  })
  return NextResponse.json(project, { status: 201 })
}
