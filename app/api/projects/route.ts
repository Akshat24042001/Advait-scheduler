import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  return NextResponse.json(store.projects.list())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const project = store.projects.create({
    name: body.name,
    client: body.client ?? '',
    status: body.status ?? 'active',
  })
  return NextResponse.json(project, { status: 201 })
}
