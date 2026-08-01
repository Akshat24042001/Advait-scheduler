/**
 * Unified data access layer.
 * Uses Supabase when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set,
 * otherwise falls back to the in-memory mock store (great for demos / local dev).
 */
import { supabase, isSupabaseConfigured } from './supabase'
import { store, type TeamMember, type Project, type Task, type SendLog } from './store'

// ── Team Members ─────────────────────────────────────────────────────────────

export async function listActiveMembers(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) return store.members.list()
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('active', true)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as TeamMember[]
}

export async function listAllMembers(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) return store.members.all()
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []) as TeamMember[]
}

export async function getMember(id: string): Promise<TeamMember | undefined> {
  if (!isSupabaseConfigured()) return store.members.get(id)
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return data as TeamMember
}

export async function createMember(data: Omit<TeamMember, 'id' | 'created_at'>): Promise<TeamMember> {
  if (!isSupabaseConfigured()) return store.members.create(data)
  const { data: row, error } = await supabase
    .from('team_members')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as TeamMember
}

export async function updateMember(id: string, data: Partial<TeamMember>): Promise<TeamMember | undefined> {
  if (!isSupabaseConfigured()) return store.members.update(id, data)
  const { data: row, error } = await supabase
    .from('team_members')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row as TeamMember
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return store.projects.list()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []) as Project[]
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (!isSupabaseConfigured()) return store.projects.get(id)
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return data as Project
}

export async function createProject(data: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
  if (!isSupabaseConfigured()) return store.projects.create(data)
  const { data: row, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as Project
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project | undefined> {
  if (!isSupabaseConfigured()) return store.projects.update(id, data)
  const { data: row, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row as Project
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function listTasks(filters?: { project?: string; member?: string; status?: string }): Promise<Task[]> {
  if (!isSupabaseConfigured()) {
    let tasks = store.tasks.list()
    if (filters?.project) tasks = tasks.filter(t => t.project_id === filters.project)
    if (filters?.member) tasks = tasks.filter(t => t.assigned_to === filters.member)
    if (filters?.status && filters.status !== 'all') tasks = tasks.filter(t => t.status === filters.status)
    return tasks
  }
  let q = supabase.from('tasks').select('*').order('created_at')
  if (filters?.project) q = q.eq('project_id', filters.project)
  if (filters?.member) q = q.eq('assigned_to', filters.member)
  if (filters?.status && filters.status !== 'all') q = q.eq('status', filters.status)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function getTask(id: string): Promise<Task | undefined> {
  if (!isSupabaseConfigured()) return store.tasks.get(id)
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return data as Task
}

export async function createTask(data: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
  if (!isSupabaseConfigured()) return store.tasks.create(data)
  const { data: row, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as Task
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
  if (!isSupabaseConfigured()) return store.tasks.update(id, data)
  const { data: row, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return row as Task
}

export async function deleteTask(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return store.tasks.delete(id)
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function getScheduledTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured()) return store.tasks.list().filter(t => t.send_tonight && t.status !== 'done')
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('send_tonight', true)
    .neq('status', 'done')
  if (error) throw error
  return (data ?? []) as Task[]
}

export async function clearSendTonight(taskIds: string[]): Promise<void> {
  if (taskIds.length === 0) return
  if (!isSupabaseConfigured()) {
    taskIds.forEach(id => store.tasks.update(id, { send_tonight: false }))
    return
  }
  const { error } = await supabase
    .from('tasks')
    .update({ send_tonight: false })
    .in('id', taskIds)
  if (error) throw error
}

// ── Send Logs ─────────────────────────────────────────────────────────────────

export async function listLogs(): Promise<SendLog[]> {
  if (!isSupabaseConfigured()) return store.logs.list()
  const { data, error } = await supabase
    .from('send_logs')
    .select('*')
    .order('sent_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as SendLog[]
}

export async function createLog(data: Omit<SendLog, 'id'>): Promise<SendLog> {
  if (!isSupabaseConfigured()) return store.logs.create(data)
  const { data: row, error } = await supabase
    .from('send_logs')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return row as SendLog
}
