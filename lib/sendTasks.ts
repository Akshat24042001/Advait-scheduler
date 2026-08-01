import { getScheduledTasks, listAllMembers, listProjects, clearSendTonight } from './db'

export function buildWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/^\+/, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function buildTaskMessage(memberName: string, taskLines: string[]): string {
  const list = taskLines.join('\n')
  return `Hello ${memberName}! 🌙\n\nHere are your tasks for tomorrow at ADVAIT:\n\n${list}\n\nReview tonight so you're ready in the morning.\n\n— ADVAIT Studio`
}

export type SendResult = {
  member: string
  memberId: string
  phone: string
  whatsappLink: string
  taskCount: number
  taskIds: string[]
  message: string
  success: boolean
}

export async function buildSendPayload(): Promise<SendResult[]> {
  const [tasks, members, projects] = await Promise.all([
    getScheduledTasks(),
    listAllMembers(),
    listProjects(),
  ])

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
      memberId: member.id,
      phone: member.phone,
      whatsappLink: buildWhatsAppLink(member.phone, message),
      taskCount: mt.length,
      taskIds: mt.map(t => t.id),
      message,
      success: true,
    }
  })
}

export async function markTasksSent(): Promise<number> {
  const tasks = await getScheduledTasks()
  await clearSendTonight(tasks.map(t => t.id))
  return tasks.length
}
