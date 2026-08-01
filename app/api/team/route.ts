import { NextRequest, NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  return NextResponse.json(store.members.all())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const member = store.members.create({
    name: body.name,
    phone: body.phone,
    role: body.role ?? '',
    active: body.active ?? true,
  })
  return NextResponse.json(member, { status: 201 })
}
