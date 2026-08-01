import { NextResponse } from 'next/server'
import { resetStore } from '@/lib/store'

// Test-only endpoint — resets in-memory store to initial dummy data
// Only available in development/test environments
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  resetStore()
  return NextResponse.json({ ok: true })
}
