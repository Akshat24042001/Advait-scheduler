'use client'
import { useState, useEffect, useCallback } from 'react'
import Nav from '@/components/Nav'
import AddTaskForm from '@/components/AddTaskForm'
import SendModal from '@/components/SendModal'

type Task = {
  id: string
  title: string
  notes: string
  project_id: string | null
  assigned_to: string | null
  status: 'pending' | 'in_progress' | 'done'
  send_tonight: boolean
  due_date: string | null
  member: { id: string; name: string; phone: string } | null
  project: { id: string; name: string } | null
}

type Member = { id: string; name: string; role: string; active: boolean }
type Project = { id: string; name: string; status: string }

const STATUS_CYCLE: Task['status'][] = ['pending', 'in_progress', 'done']
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }
const STATUS_COLORS = {
  pending: { bg: '#1a1a2e', text: '#818cf8' },
  in_progress: { bg: '#1c1a0e', text: '#f59e0b' },
  done: { bg: '#0d1f12', text: '#22c55e' },
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [filterProject, setFilterProject] = useState('all')
  const [filterMember, setFilterMember] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [sendLoading, setSendLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterProject !== 'all') params.set('project', filterProject)
    if (filterMember !== 'all') params.set('member', filterMember)
    if (filterStatus !== 'all') params.set('status', filterStatus)

    const [tasksRes, membersRes, projectsRes] = await Promise.all([
      fetch(`/api/tasks?${params}`),
      fetch('/api/team'),
      fetch('/api/projects'),
    ])
    setTasks(await tasksRes.json())
    setMembers(await membersRes.json())
    setProjects(await projectsRes.json())
  }, [filterProject, filterMember, filterStatus])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function toggleSendTonight(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ send_tonight: !task.send_tonight }),
    })
    fetchAll()
  }

  async function cycleStatus(task: Task) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length]
    const patch: Record<string, unknown> = { status: next }
    if (next === 'done') patch.send_tonight = false
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    fetchAll()
  }

  async function saveTitle(task: Task) {
    if (!editTitle.trim() || editTitle === task.title) { setEditingId(null); return }
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle }),
    })
    setEditingId(null)
    fetchAll()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    fetchAll()
  }

  async function handleSendNow() {
    setSendLoading(true)
    await fetch('/api/send', {
      method: 'POST',
      headers: { 'x-manual-send': 'true' },
    })
    setSendLoading(false)
    setShowSend(true)
    fetchAll()
  }

  const sendCount = tasks.filter(t => t.send_tonight && t.status !== 'done').length
  const sendMembers = new Set(tasks.filter(t => t.send_tonight && t.status !== 'done').map(t => t.assigned_to)).size

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Send summary bar */}
        <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div>
            <p className="text-sm font-medium text-white">
              {sendCount === 0
                ? 'No tasks scheduled for tonight'
                : `${sendCount} task${sendCount !== 1 ? 's' : ''} scheduled for tonight across ${sendMembers} member${sendMembers !== 1 ? 's' : ''}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Cron fires at 8PM IST · or send now manually</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSend(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface2)' }}>
              Preview
            </button>
            <button
              onClick={handleSendNow}
              disabled={sendLoading || sendCount === 0}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2"
              style={{
                background: sendCount === 0 ? 'var(--surface2)' : 'var(--accent)',
                cursor: sendCount === 0 ? 'default' : 'pointer',
                opacity: sendLoading ? 0.7 : 1,
              }}>
              {sendLoading ? '⏳ Sending…' : '▶ Send Now'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterMember} onChange={e => setFilterMember(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="all">All Members</option>
            {members.filter(m => m.active).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs border outline-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <div className="ml-auto">
            <button
              onClick={() => setShowAddTask(true)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'var(--accent)' }}>
              + Add Task
            </button>
          </div>
        </div>

        {/* Task table */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {/* Header */}
          <div className="grid text-xs font-medium px-4 py-3 border-b"
            style={{ gridTemplateColumns: '44px 1fr 130px 150px 120px 40px', background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <span>Send</span>
            <span>Task</span>
            <span>Member</span>
            <span>Project</span>
            <span>Status</span>
            <span></span>
          </div>

          {tasks.length === 0 && (
            <div className="px-4 py-12 text-center" style={{ color: 'var(--muted)', background: 'var(--surface)' }}>
              <p className="text-sm">No tasks found.</p>
              <p className="text-xs mt-1">Add a task to get started.</p>
            </div>
          )}

          {tasks.map((task, i) => {
            const sc = STATUS_COLORS[task.status]
            const isDone = task.status === 'done'
            return (
              <div key={task.id}
                className="grid items-center px-4 py-3.5 border-b transition-all group"
                style={{
                  gridTemplateColumns: '44px 1fr 130px 150px 120px 40px',
                  background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                  borderColor: 'var(--border)',
                  opacity: isDone ? 0.65 : 1,
                }}>

                {/* Send toggle */}
                <button
                  onClick={() => !isDone && toggleSendTonight(task)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all border text-xs"
                  title={isDone ? 'Done tasks are not sent' : task.send_tonight ? 'Scheduled tonight' : 'Click to schedule'}
                  style={{
                    background: task.send_tonight ? 'rgba(124,106,247,0.15)' : 'var(--surface2)',
                    borderColor: task.send_tonight ? 'var(--accent)' : 'var(--border)',
                    color: task.send_tonight ? 'var(--accent)' : 'var(--muted)',
                    cursor: isDone ? 'default' : 'pointer',
                  }}>
                  {task.send_tonight ? '✓' : '○'}
                </button>

                {/* Title */}
                <div className="pr-4 min-w-0">
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => saveTitle(task)}
                      onKeyDown={e => { if (e.key === 'Enter') saveTitle(task); if (e.key === 'Escape') setEditingId(null) }}
                      className="w-full px-2 py-1 rounded text-sm outline-none border"
                      style={{ background: 'var(--surface2)', borderColor: 'var(--accent)', color: 'var(--text)' }}
                    />
                  ) : (
                    <div>
                      <p
                        className="text-sm truncate cursor-text"
                        style={{ color: 'var(--text)', textDecoration: isDone ? 'line-through' : 'none' }}
                        onClick={() => { setEditingId(task.id); setEditTitle(task.title) }}>
                        {task.title}
                      </p>
                      {task.notes && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>📌 {task.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Member */}
                <div className="text-sm" style={{ color: task.member ? 'var(--text)' : 'var(--muted)' }}>
                  {task.member ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-semibold"
                        style={{ background: 'var(--accent)', color: 'white' }}>
                        {task.member.name[0]}
                      </span>
                      {task.member.name}
                    </span>
                  ) : '—'}
                </div>

                {/* Project */}
                <div className="text-xs truncate pr-2" style={{ color: 'var(--muted)' }}>
                  {task.project?.name ?? '—'}
                </div>

                {/* Status */}
                <div>
                  <button
                    onClick={() => cycleStatus(task)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: sc.bg, color: sc.text }}>
                    {STATUS_LABELS[task.status]}
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs transition-all w-7 h-7 rounded flex items-center justify-center"
                  style={{ color: 'var(--red)', background: 'transparent' }}
                  title="Delete task">
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {showAddTask && (
        <AddTaskForm
          members={members.filter(m => m.active)}
          projects={projects}
          onClose={() => setShowAddTask(false)}
          onSaved={() => { setShowAddTask(false); fetchAll() }}
        />
      )}

      {showSend && (
        <SendModal
          onClose={() => { setShowSend(false); fetchAll() }}
        />
      )}
    </div>
  )
}
