'use client'
import { useState, useEffect } from 'react'
import Nav from '@/components/Nav'

type Member = { id: string; name: string; phone: string; role: string; active: boolean }
type Project = { id: string; name: string; client: string; status: 'active' | 'on_hold' | 'completed' }

const ROLES = ['Architect', 'Drafter', 'Intern', 'Designer', 'Manager']
const PROJECT_STATUSES = ['active', 'on_hold', 'completed'] as const

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{children}</label>
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
      style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
    />
  )
}

export default function SetupPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // Add forms
  const [newMember, setNewMember] = useState({ name: '', phone: '', role: 'Architect' })
  const [newProject, setNewProject] = useState({ name: '', client: '', status: 'active' as const })
  const [editMember, setEditMember] = useState<string | null>(null)
  const [editProject, setEditProject] = useState<string | null>(null)

  async function fetchAll() {
    const [m, p] = await Promise.all([fetch('/api/team'), fetch('/api/projects')])
    setMembers(await m.json())
    setProjects(await p.json())
  }

  useEffect(() => { fetchAll() }, [])

  async function addMember() {
    if (!newMember.name || !newMember.phone) return
    await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember),
    })
    setNewMember({ name: '', phone: '', role: 'Architect' })
    fetchAll()
  }

  async function updateMember(id: string, data: Partial<Member>) {
    await fetch(`/api/team/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setEditMember(null)
    fetchAll()
  }

  async function addProject() {
    if (!newProject.name) return
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    })
    setNewProject({ name: '', client: '', status: 'active' })
    fetchAll()
  }

  async function updateProject(id: string, data: Partial<Project>) {
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setEditProject(null)
    fetchAll()
  }

  const statusColor = (s: string) => {
    if (s === 'active') return { bg: '#0d1f12', text: '#22c55e' }
    if (s === 'on_hold') return { bg: '#1c1a0e', text: '#f59e0b' }
    return { bg: '#1a1a1d', text: '#8b8b9a' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Team Members */}
        <section>
          <h2 className="text-base font-semibold text-white mb-4">Team Members</h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="grid px-4 py-3 text-xs font-medium border-b"
              style={{ gridTemplateColumns: '1fr 150px 120px 80px 80px', background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <span>Name</span><span>Phone</span><span>Role</span><span>Active</span><span></span>
            </div>

            {members.map((m, i) => (
              <div key={m.id} className="border-b" style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', borderColor: 'var(--border)' }}>
                {editMember === m.id ? (
                  <EditMemberRow member={m} onSave={(data) => updateMember(m.id, data)} onCancel={() => setEditMember(null)} />
                ) : (
                  <div className="grid items-center px-4 py-3"
                    style={{ gridTemplateColumns: '1fr 150px 120px 80px 80px' }}>
                    <span className="text-sm text-white font-medium">{m.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>+{m.phone}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{m.role}</span>
                    <button onClick={() => updateMember(m.id, { active: !m.active })}
                      className="text-xs px-2 py-1 rounded-lg w-fit"
                      style={m.active ? { background: '#0d1f12', color: '#22c55e' } : { background: 'var(--surface2)', color: 'var(--muted)' }}>
                      {m.active ? 'Active' : 'Off'}
                    </button>
                    <button onClick={() => setEditMember(m.id)}
                      className="text-xs" style={{ color: 'var(--accent)' }}>Edit</button>
                  </div>
                )}
              </div>
            ))}

            {/* Add row */}
            <div className="px-4 py-4 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>Add Member</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 150px 130px auto' }}>
                <Input value={newMember.name} onChange={v => setNewMember(p => ({ ...p, name: v }))} placeholder="Name" />
                <Input value={newMember.phone} onChange={v => setNewMember(p => ({ ...p, phone: v }))} placeholder="91XXXXXXXXXX" />
                <select value={newMember.role} onChange={e => setNewMember(p => ({ ...p, role: e.target.value }))}
                  className="px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                <button onClick={addMember}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section>
          <h2 className="text-base font-semibold text-white mb-4">Projects</h2>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="grid px-4 py-3 text-xs font-medium border-b"
              style={{ gridTemplateColumns: '1fr 180px 100px 60px', background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
              <span>Project Name</span><span>Client</span><span>Status</span><span></span>
            </div>

            {projects.map((p, i) => (
              <div key={p.id} className="border-b" style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', borderColor: 'var(--border)' }}>
                {editProject === p.id ? (
                  <EditProjectRow project={p} onSave={(data) => updateProject(p.id, data)} onCancel={() => setEditProject(null)} />
                ) : (
                  <div className="grid items-center px-4 py-3" style={{ gridTemplateColumns: '1fr 180px 100px 60px' }}>
                    <span className="text-sm text-white font-medium">{p.name}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{p.client || '—'}</span>
                    <button onClick={() => {
                      const next = PROJECT_STATUSES[(PROJECT_STATUSES.indexOf(p.status) + 1) % PROJECT_STATUSES.length]
                      updateProject(p.id, { status: next })
                    }} className="text-xs px-2 py-1 rounded-lg w-fit capitalize"
                      style={{ background: statusColor(p.status).bg, color: statusColor(p.status).text }}>
                      {p.status.replace('_', ' ')}
                    </button>
                    <button onClick={() => setEditProject(p.id)}
                      className="text-xs" style={{ color: 'var(--accent)' }}>Edit</button>
                  </div>
                )}
              </div>
            ))}

            {/* Add row */}
            <div className="px-4 py-4 border-t" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-medium mb-3" style={{ color: 'var(--muted)' }}>Add Project</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 180px 130px auto' }}>
                <Input value={newProject.name} onChange={v => setNewProject(p => ({ ...p, name: v }))} placeholder="Project name" />
                <Input value={newProject.client} onChange={v => setNewProject(p => ({ ...p, client: v }))} placeholder="Client name" />
                <select value={newProject.status} onChange={e => setNewProject(p => ({ ...p, status: e.target.value as typeof p.status }))}
                  className="px-3 py-2 rounded-lg text-sm border outline-none"
                  style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={addProject}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: 'var(--accent)', whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function EditMemberRow({ member, onSave, onCancel }: { member: Member; onSave: (d: Partial<Member>) => void; onCancel: () => void }) {
  const [name, setName] = useState(member.name)
  const [phone, setPhone] = useState(member.phone)
  const [role, setRole] = useState(member.role)
  return (
    <div className="grid items-center gap-2 px-4 py-2" style={{ gridTemplateColumns: '1fr 150px 120px 80px 80px' }}>
      <input value={name} onChange={e => setName(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--accent)', color: 'var(--text)' }} />
      <input value={phone} onChange={e => setPhone(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
      <select value={role} onChange={e => setRole(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        {['Architect', 'Drafter', 'Intern', 'Designer', 'Manager'].map(r => <option key={r}>{r}</option>)}
      </select>
      <div />
      <div className="flex gap-1">
        <button onClick={() => onSave({ name, phone, role })} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'white' }}>Save</button>
        <button onClick={onCancel} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
      </div>
    </div>
  )
}

function EditProjectRow({ project, onSave, onCancel }: { project: Project; onSave: (d: Partial<Project>) => void; onCancel: () => void }) {
  const [name, setName] = useState(project.name)
  const [client, setClient] = useState(project.client)
  const [status, setStatus] = useState(project.status)
  return (
    <div className="grid items-center gap-2 px-4 py-2" style={{ gridTemplateColumns: '1fr 180px 100px 60px' }}>
      <input value={name} onChange={e => setName(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--accent)', color: 'var(--text)' }} />
      <input value={client} onChange={e => setClient(e.target.value)} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }} />
      <select value={status} onChange={e => setStatus(e.target.value as Project['status'])} className="px-2 py-1.5 rounded-lg text-sm border outline-none" style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        <option value="active">Active</option>
        <option value="on_hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>
      <div className="flex gap-1">
        <button onClick={() => onSave({ name, client, status })} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent)', color: 'white' }}>Save</button>
        <button onClick={onCancel} className="text-xs px-2 py-1 rounded" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>✕</button>
      </div>
    </div>
  )
}
