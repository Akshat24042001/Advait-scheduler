'use client'
import { useState } from 'react'

type Member = { id: string; name: string; role: string }
type Project = { id: string; name: string; status: string }

export default function AddTaskForm({
  members,
  projects,
  onClose,
  onSaved,
}: {
  members: Member[]
  projects: Project[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [projectId, setProjectId] = useState('')
  const [sendTonight, setSendTonight] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        notes,
        assigned_to: assignedTo || null,
        project_id: projectId || null,
        send_tonight: sendTonight,
        status: 'pending',
      }),
    })
    setLoading(false)
    onSaved()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose} />

      {/* Slide-in panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm border-l shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold text-white">Add Task</h2>
          <button onClick={onClose} className="text-lg" style={{ color: 'var(--muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Title *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional context…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border resize-none"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Assign To</label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: assignedTo ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} — {m.role}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Project</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: projectId ? 'var(--text)' : 'var(--muted)' }}>
              <option value="">No Project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Send Tonight toggle */}
          <button
            type="button"
            onClick={() => setSendTonight(!sendTonight)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
            style={{
              background: sendTonight ? 'rgba(124,106,247,0.1)' : 'var(--surface2)',
              borderColor: sendTonight ? 'var(--accent)' : 'var(--border)',
            }}>
            <span className="text-sm font-medium" style={{ color: sendTonight ? 'var(--accent)' : 'var(--text)' }}>
              Schedule for Tonight
            </span>
            <div className="w-10 h-5 rounded-full transition-all flex items-center px-0.5"
              style={{ background: sendTonight ? 'var(--accent)' : 'var(--border)' }}>
              <div className="w-4 h-4 rounded-full bg-white transition-all shadow-sm"
                style={{ transform: sendTonight ? 'translateX(20px)' : 'translateX(0)' }} />
            </div>
          </button>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
              style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: !title.trim() ? 'var(--surface2)' : 'var(--accent)', cursor: !title.trim() ? 'default' : 'pointer' }}>
              {loading ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
