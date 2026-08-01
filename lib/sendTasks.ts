import { store } from './store'

export function buildWhatsAppLink(phone: string, message: string): string {
  // phone format: 91XXXXXXXXXX → strip country code prefix for wa.me
  const clean = phone.replace(/^\+/, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function buildTaskMessage(memberName: string, taskLines: string[]): string {
  const list = taskLines.join('\n')
  return `Hello ${memberName}! 🌙\n\nHere are your tasks for tomorrow at ADVAIT:\n\n${list}\n\nReview tonight so you're ready in the morning.\n\n— ADVAIT Studio`
}

export type SendResult = {
  member: string
  phone: string
  whatsappLink: string
  taskCount: number
  success: boolean
}

export function buildSendPayload(): SendResult[] {
  const tasks = store.tasks.list().filter(t => t.send_tonight && t.status !== 'done')
  const members = store.members.all()
  const projects = store.projects.list()

  const grouped: Record<string, { member: (typeof members)[0]; tasks: typeof tasks }> = {}

  for (const task of tasks) {
    if (!task.assigned_to) continue
    const member = members.find(m => m.id === task.assigned_to)
    if (!member) continue
    if (!grouped[member.id]) grouped[member.id] = { member, tasks: [] }
    grouped[member.id].tasks.push(task)
  }

  return Object.values(grouped).map(({ member, tasks: mt }) => {
    const lines = mt.map((t, i) => {
      const proj = projects.find(p => p.id === t.project_id)
      let line = `${i + 1}. ${t.title}`
      if (proj) line += ` — ${proj.name}`
      if (t.notes) line += `\n   📌 ${t.notes}`
      return line
    })
    const message = buildTaskMessage(member.name, lines)
    return {
      member: member.name,
      phone: member.phone,
      whatsappLink: buildWhatsAppLink(member.phone, message),
      taskCount: mt.length,
      success: true,
    }
  })
}

export function markTasksSent() {
  const tasks = store.tasks.list().filter(t => t.send_tonight && t.status !== 'done')
  for (const t of tasks) {
    store.tasks.update(t.id, { send_tonight: false })
  }
  return tasks.length
}
