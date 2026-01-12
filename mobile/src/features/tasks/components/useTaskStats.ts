import { useMemo } from 'react'
import { endOfDay, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns'
import { isTaskArchived } from './useTasks'
import type { TaskRow } from './useTasks'

interface TaskStatsEntry {
  done: number
  total: number
}

const parseLocalDateKey = (value?: string | null) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const countInRange = (
  tasks: TaskRow[],
  start: Date,
  end: Date,
  fallbackDate: Date | null
): TaskStatsEntry => {
  let done = 0
  let total = 0

  tasks.forEach((task) => {
    if (isTaskArchived(task)) return
    const effectiveDate = parseDate(task.updated_at ?? task.created_at ?? null) ?? fallbackDate
    if (!effectiveDate) return
    if (effectiveDate < start || effectiveDate > end) return
    total += 1
    if (task.completed) {
      done += 1
    }
  })

  return { done, total }
}

export function useTaskStats(tasks: TaskRow[], fallbackDateKey?: string | null) {
  return useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))
    const weekStart = startOfWeek(now)
    const monthStart = startOfMonth(now)
    const fallbackDate = parseLocalDateKey(fallbackDateKey)

    return {
      today: countInRange(tasks, todayStart, todayEnd, fallbackDate),
      yesterday: countInRange(tasks, yesterdayStart, yesterdayEnd, fallbackDate),
      week: countInRange(tasks, weekStart, todayEnd, fallbackDate),
      month: countInRange(tasks, monthStart, todayEnd, fallbackDate)
    }
  }, [fallbackDateKey, tasks])
}
