import { useMemo } from 'react'
import { endOfDay, startOfDay } from 'date-fns'
import type { TaskRow } from './useTasks'

export interface TaskStats {
  activeCount: number
  completedToday: number
  archivedCount: number
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

/**
 * Compute lightweight stats for the tasks list using completed_at and archived_at:
 * - activeCount: tasks where archived_at IS NULL
 * - completedToday: tasks completed today (by completed_at) and not archived
 * - archivedCount: tasks where archived_at IS NOT NULL
 *
 * Note: if you pass only active tasks into this hook, archivedCount will be 0.
 */
export function useTaskStats(tasks: TaskRow[]): TaskStats {
  return useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    let activeCount = 0
    let completedToday = 0
    let archivedCount = 0

    tasks.forEach((task) => {
      const isArchived = task.archived_at != null
      if (isArchived) {
        archivedCount += 1
        return
      }

      activeCount += 1

      if (!task.completed || !task.completed_at) return
      const completedAt = parseDate(task.completed_at)
      if (!completedAt) return
      if (completedAt < todayStart || completedAt > todayEnd) return
      completedToday += 1
    })

    return { activeCount, completedToday, archivedCount }
  }, [tasks])
}
