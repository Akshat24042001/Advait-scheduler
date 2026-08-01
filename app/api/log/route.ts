import { NextResponse } from 'next/server'
import { listLogs, listAllMembers } from '@/lib/db'

export async function GET() {
  const [logs, members] = await Promise.all([listLogs(), listAllMembers()])

  const enriched = logs.map(l => ({
    ...l,
    member: members.find(m => m.id === l.member_id) ?? null,
  }))

  return NextResponse.json(enriched)
}
