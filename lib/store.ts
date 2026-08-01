// In-memory mock store — used when Supabase env vars are placeholders
import { v4 as uuidv4 } from 'uuid'

export type TeamMember = {
  id: string
  name: string
  phone: string
  role: string
  active: boolean
  created_at: string
}

export type Project = {
  id: string
  name: string
  client: string
  status: 'active' | 'on_hold' | 'completed'
  created_at: string
}

export type Task = {
  id: string
  title: string
  notes: string
  project_id: string | null
  assigned_to: string | null
  status: 'pending' | 'in_progress' | 'done'
  send_tonight: boolean
  due_date: string | null
  created_at: string
}

export type SendLog = {
  id: string
  member_id: string
  task_ids: string[]
  message_sent: string
  sent_at: string
  status: 'success' | 'failed'
}

const now = () => new Date().toISOString()

const MEMBERS: TeamMember[] = [
  { id: 'mem1', name: 'Gunjan', phone: '919198765432', role: 'Architect', active: true, created_at: now() },
  { id: 'mem2', name: 'Ravi', phone: '919187654321', role: 'Drafter', active: true, created_at: now() },
  { id: 'mem3', name: 'Priya', phone: '919176543210', role: 'Intern', active: true, created_at: now() },
]

const PROJECTS: Project[] = [
  { id: 'proj1', name: 'Mediterranean Villa', client: 'Sharma Ji', status: 'active', created_at: now() },
  { id: 'proj2', name: 'Aikyam Residence', client: 'Mehta Ji', status: 'active', created_at: now() },
  { id: 'proj3', name: 'Skyline Office', client: 'Gupta Infra', status: 'on_hold', created_at: now() },
]

const TASKS: Task[] = [
  { id: 'task1', title: 'Revise bedroom layout', notes: 'Client wants wardrobe on east wall', project_id: 'proj1', assigned_to: 'mem1', status: 'pending', send_tonight: true, due_date: null, created_at: now() },
  { id: 'task2', title: 'Stone texture research', notes: '', project_id: 'proj2', assigned_to: 'mem2', status: 'pending', send_tonight: false, due_date: null, created_at: now() },
  { id: 'task3', title: 'Section drawings — Floor 2', notes: 'Reference the Mehta brief doc', project_id: 'proj2', assigned_to: 'mem1', status: 'in_progress', send_tonight: true, due_date: null, created_at: now() },
  { id: 'task4', title: 'Compile mood board', notes: '', project_id: 'proj1', assigned_to: 'mem3', status: 'pending', send_tonight: false, due_date: null, created_at: now() },
  { id: 'task5', title: 'Structural consultancy call notes', notes: 'Meet at 11am', project_id: 'proj3', assigned_to: 'mem2', status: 'done', send_tonight: false, due_date: null, created_at: now() },
]

const LOGS: SendLog[] = [
  { id: 'log1', member_id: 'mem1', task_ids: ['task1', 'task3'], message_sent: '1. Revise bedroom layout — Mediterranean Villa\n2. Section drawings — Aikyam Residence', sent_at: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
  { id: 'log2', member_id: 'mem2', task_ids: ['task2'], message_sent: '1. Stone texture research — Aikyam Residence', sent_at: new Date(Date.now() - 86400000).toISOString(), status: 'success' },
]

// Singleton in-memory state
let members = [...MEMBERS]
let projects = [...PROJECTS]
let tasks = [...TASKS]
let logs = [...LOGS]

export function resetStore() {
  members = MEMBERS.map(m => ({ ...m }))
  projects = PROJECTS.map(p => ({ ...p }))
  tasks = TASKS.map(t => ({ ...t }))
  logs = LOGS.map(l => ({ ...l }))
}

export const store = {
  members: {
    list: () => members.filter(m => m.active),
    all: () => members,
    get: (id: string) => members.find(m => m.id === id),
    create: (data: Omit<TeamMember, 'id' | 'created_at'>) => {
      const m = { ...data, id: uuidv4(), created_at: now() }
      members.push(m)
      return m
    },
    update: (id: string, data: Partial<TeamMember>) => {
      members = members.map(m => m.id === id ? { ...m, ...data } : m)
      return members.find(m => m.id === id)
    },
  },
  projects: {
    list: () => projects,
    get: (id: string) => projects.find(p => p.id === id),
    create: (data: Omit<Project, 'id' | 'created_at'>) => {
      const p = { ...data, id: uuidv4(), created_at: now() }
      projects.push(p)
      return p
    },
    update: (id: string, data: Partial<Project>) => {
      projects = projects.map(p => p.id === id ? { ...p, ...data } : p)
      return projects.find(p => p.id === id)
    },
  },
  tasks: {
    list: () => tasks,
    get: (id: string) => tasks.find(t => t.id === id),
    create: (data: Omit<Task, 'id' | 'created_at'>) => {
      const t = { ...data, id: uuidv4(), created_at: now() }
      tasks.push(t)
      return t
    },
    update: (id: string, data: Partial<Task>) => {
      tasks = tasks.map(t => t.id === id ? { ...t, ...data } : t)
      return tasks.find(t => t.id === id)
    },
    delete: (id: string) => {
      tasks = tasks.filter(t => t.id !== id)
    },
  },
  logs: {
    list: () => [...logs].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()),
    create: (data: Omit<SendLog, 'id'>) => {
      const l = { ...data, id: uuidv4() }
      logs.push(l)
      return l
    },
  },
}
