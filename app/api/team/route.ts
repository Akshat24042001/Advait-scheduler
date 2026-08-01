import { NextRequest, NextResponse } from 'next/server'
import { listAllMembers, createMember } from '@/lib/db'

export async function GET() {
  return NextResponse.json(await listAllMembers())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const member = await createMember({
    name: body.name,
    phone: body.phone,
    role: body.role ?? '',
    active: body.active ?? true,
  })
  return NextResponse.json(member, { status: 201 })
}
