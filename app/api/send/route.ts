import { NextRequest, NextResponse } from 'next/server'
import { buildSendPayload, markTasksSent } from '@/lib/sendTasks'
import { store } from '@/lib/store'

export async function GET() {
  // Preview what will be sent without actually sending
  const payload = buildSendPayload()
  return NextResponse.json(payload)
}

export async function POST(req: NextRequest) {
  const isManual = req.headers.get('x-manual-send') === 'true'
  const secret = req.headers.get('x-cron-secret')

  if (!isManual && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = buildSendPayload()

  // Log each member's send
  for (const r of payload) {
    const member = store.members.all().find(m => m.name === r.member)
    const sentTasks = store.tasks.list().filter(t => t.send_tonight && t.status !== 'done' && t.assigned_to === member?.id)
    if (member) {
      store.logs.create({
        member_id: member.id,
        task_ids: sentTasks.map(t => t.id),
        message_sent: `${sentTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}`,
        sent_at: new Date().toISOString(),
        status: 'success',
      })
    }
  }

  markTasksSent()

  return NextResponse.json({ sent: payload.length, results: payload })
}
