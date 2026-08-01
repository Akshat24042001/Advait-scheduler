'use client'
import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'

type Log = {
  id: string
  member_id: string
  task_ids: string[]
  message_sent: string
  sent_at: string
  status: 'success' | 'failed'
  member: { id: string; name: string; phone: string } | null
}

export default function LogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/log').then(r => r.json()).then(data => {
      setLogs(data)
      setLoading(false)
    })
  }, [])

  function fmt(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-base font-semibold text-white mb-6">Send History</h2>

        {loading && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading…</p>
        )}

        {!loading && logs.length === 0 && (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No sends yet.</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Logs appear after you use "Send Now" on the dashboard.</p>
          </div>
        )}

        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left"
                onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--accent)', color: 'white' }}>
                    {log.member?.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{log.member?.name ?? 'Unknown'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmt(log.sent_at)} · {log.task_ids.length} task{log.task_ids.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-lg"
                    style={log.status === 'success' ? { background: '#0d1f12', color: '#22c55e' } : { background: '#2d1515', color: '#ef4444' }}>
                    {log.status === 'success' ? '✓ Delivered' : '✕ Failed'}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{expanded === log.id ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === log.id && (
                <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>Message sent:</p>
                  <pre className="text-xs rounded-lg p-3 whitespace-pre-wrap"
                    style={{ background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'inherit' }}>
                    {log.message_sent}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
