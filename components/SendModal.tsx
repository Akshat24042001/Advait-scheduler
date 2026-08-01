'use client'
import { useEffect, useState } from 'react'

type SendResult = {
  member: string
  phone: string
  whatsappLink: string
  taskCount: number
  success: boolean
}

export default function SendModal({ onClose }: { onClose: () => void }) {
  const [results, setResults] = useState<SendResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/send').then(r => r.json()).then(data => {
      setResults(data)
      setLoading(false)
    })
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border shadow-2xl"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h2 className="text-sm font-semibold text-white">WhatsApp Send Preview</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Click a button to open WhatsApp with the message ready</p>
            </div>
            <button onClick={onClose} style={{ color: 'var(--muted)' }}>✕</button>
          </div>

          <div className="p-5 space-y-3">
            {loading && (
              <p className="text-sm text-center py-6" style={{ color: 'var(--muted)' }}>Loading…</p>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No tasks scheduled for tonight.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Toggle the send checkbox on tasks first.</p>
              </div>
            )}

            {results.map((r, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3"
                style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--accent)', color: 'white' }}>
                    {r.member[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.member}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{r.taskCount} task{r.taskCount !== 1 ? 's' : ''} · +{r.phone.replace('91', '')}</p>
                  </div>
                </div>
                <a
                  href={r.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#25D366', color: 'white' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Open WhatsApp → {r.member}
                </a>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'transparent' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
