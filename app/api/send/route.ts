import { NextRequest, NextResponse } from 'next/server'
import { buildSendPayload, markTasksSent } from '@/lib/sendTasks'
import { createLog } from '@/lib/db'

export async function GET() {
  const payload = await buildSendPayload()
  return NextResponse.json(payload)
}

export async function POST(req: NextRequest) {
  const isManual = req.headers.get('x-manual-send') === 'true'
  const secret = req.headers.get('x-cron-secret')

  if (!isManual && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await buildSendPayload()

  for (const r of payload) {
    await createLog({
      member_id: r.memberId,
      task_ids: r.taskIds,
      message_sent: r.message,
      sent_at: new Date().toISOString(),
      status: 'success',
    })
  }

  await markTasksSent()

  return NextResponse.json({ sent: payload.length, results: payload })
}
