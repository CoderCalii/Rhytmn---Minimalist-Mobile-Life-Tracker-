import { useMemo } from 'react'
import { format, startOfDay } from 'date-fns'
import { isTaskArchived } from './useTasks'
import type { TaskRow } from './useTasks'

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const resolveTaskDate = (task: TaskRow) => (
  parseDate(task.updated_at ?? task.created_at ?? null)
)

export function useArchivedTasks(tasks: TaskRow[]) {
  return useMemo(() => {
    const grouped = new Map<string, TaskRow[]>()
    const unknownDateTasks: TaskRow[] = []

    tasks.forEach((task) => {
      if (!isTaskArchived(task)) return
      const effectiveDate = resolveTaskDate(task)
      if (!effectiveDate) {
        unknownDateTasks.push(task)
        return
      }
      const dateKey = format(startOfDay(effectiveDate), 'yyyy-MM-dd')
      const bucket = grouped.get(dateKey) ?? []
      bucket.push(task)
      grouped.set(dateKey, bucket)
    })

    const sortByEffectiveDate = (list: TaskRow[]) => (
      [...list].sort((first, second) => {
        const firstTime = resolveTaskDate(first)?.getTime() ?? 0
        const secondTime = resolveTaskDate(second)?.getTime() ?? 0
        return secondTime - firstTime
      })
    )

    const groups = Array.from(grouped.entries()).map(([dateKey, list]) => ({
      dateKey,
      label: dateKey,
      isUnknown: false,
      tasks: sortByEffectiveDate(list)
    }))

    groups.sort((first, second) => second.dateKey.localeCompare(first.dateKey))

    if (unknownDateTasks.length > 0) {
      groups.push({
        dateKey: 'unknown',
        label: 'Unknown date',
        isUnknown: true,
        tasks: sortByEffectiveDate(unknownDateTasks)
      })
    }

    return groups
  }, [tasks])
}
