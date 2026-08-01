import { NextResponse } from 'next/server'
import { store } from '@/lib/store'

export async function GET() {
  const logs = store.logs.list()
  const members = store.members.all()

  const enriched = logs.map(l => ({
    ...l,
    member: members.find(m => m.id === l.member_id) ?? null,
  }))

  return NextResponse.json(enriched)
}
