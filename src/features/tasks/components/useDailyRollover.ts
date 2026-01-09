import { useEffect, useState } from 'react'
import { addDays, endOfDay, format, startOfDay } from 'date-fns'
import { supabase } from '../../../lib/supabase'
import type { TaskRow } from './useTasks'

interface UseDailyRolloverArgs {
  userId: string | null
  tasks: TaskRow[]
  notesReady: boolean
}

const parseTags = (value?: string | string[] | null) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean)
  }
  if (typeof value !== 'string') return []
  return value.split(',').map((tag) => tag.trim()).filter(Boolean)
}

const isTaskArchived = (task: TaskRow) => (
  parseTags(task.tags ?? null).includes('archived')
)

const buildArchivedTags = (task: TaskRow) => {
  const tags = new Set(parseTags(task.tags ?? null))
  tags.add('archived')
  if (!task.completed) {
    tags.add('incomplete')
  }
  return Array.from(tags).join(', ')
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const resolveTaskDate = (task: TaskRow) => (
  parseDate(task.updated_at ?? task.created_at ?? null)
)

const toLocalDateKey = (date: Date) => format(date, 'yyyy-MM-dd')

const resolveTaskDateKey = (task: TaskRow) => {
  const resolved = resolveTaskDate(task)
  return resolved ? toLocalDateKey(resolved) : null
}

const findTaskBacklogKey = (taskList: TaskRow[], todayKey: string) => {
  let latestKey: string | null = null
  let hasUndatedTasks = false
  taskList.forEach((task) => {
    if (isTaskArchived(task)) return
    const taskDateKey = resolveTaskDateKey(task)
    if (!taskDateKey) {
      hasUndatedTasks = true
      return
    }
    if (taskDateKey >= todayKey) return
    if (!latestKey || taskDateKey > latestKey) {
      latestKey = taskDateKey
    }
  })
  return { latestKey, hasUndatedTasks }
}

const buildDailyLogContent = (taskList: TaskRow[]) => {
  const completed = taskList.filter((task) => task.completed)
  const incomplete = taskList.filter((task) => !task.completed)
  const sections: string[] = ['## Tasks']

  if (completed.length > 0) {
    sections.push('', '**Completed**', ...completed.map((task) => `- ${task.title}`))
  }

  if (incomplete.length > 0) {
    sections.push('', '**Incomplete**', ...incomplete.map((task) => `- ${task.title}`))
  }

  if (completed.length === 0 && incomplete.length === 0) {
    sections.push('', 'No tasks logged.')
  }

  return sections.join('\n')
}

const findExistingDailyLog = async (userId: string, dayStartIso: string, dayEndIso: string) => {
  const { data, error } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('category', 'Daily')
    .gte('created_at', dayStartIso)
    .lte('created_at', dayEndIso)
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}

const ensureDailyLog = async ({
  userId,
  dayStartIso,
  dayEndIso,
  title,
  content,
  createdAt
}: {
  userId: string
  dayStartIso: string
  dayEndIso: string
  title: string
  content: string
  createdAt: string
}) => {
  const existing = await findExistingDailyLog(userId, dayStartIso, dayEndIso)
  if (existing) return existing

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content,
      category: 'Daily',
      icon: 'D',
      is_pinned: false,
      created_at: createdAt
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}

const findNotesBacklogKey = async (userId: string, todayKey: string) => {
  const todayStart = parseDate(`${todayKey}T00:00:00`) ?? new Date()
  const { data, error } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', userId)
    .lt('created_at', startOfDay(todayStart).toISOString())
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  const latestNoteDate = parseDate(data?.[0]?.created_at ?? null)
  return latestNoteDate ? toLocalDateKey(latestNoteDate) : null
}

export function useDailyRollover({ userId, tasks, notesReady }: UseDailyRolloverArgs) {
  const [todayKey, setTodayKey] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [isRollingOver, setIsRollingOver] = useState(false)
  const [rolloverCount, setRolloverCount] = useState(0)

  useEffect(() => {
    if (!userId) return
    const now = new Date()
    const nextMidnight = startOfDay(addDays(now, 1))
    const timeout = nextMidnight.getTime() - now.getTime()
    const timer = window.setTimeout(() => {
      setTodayKey(format(new Date(), 'yyyy-MM-dd'))
    }, timeout)

    return () => clearTimeout(timer)
  }, [todayKey, userId])

  useEffect(() => {
    if (!userId || !notesReady || isRollingOver) return
    const storageKey = `tasks:lastRollover:${userId}`

    const runRollover = async () => {
      setIsRollingOver(true)
      try {
        let stored = localStorage.getItem(storageKey)
        if (!stored) {
          const { latestKey, hasUndatedTasks } = findTaskBacklogKey(tasks, todayKey)
          let backlogKey: string | null = latestKey

          if (!backlogKey && hasUndatedTasks) {
            backlogKey = toLocalDateKey(addDays(new Date(`${todayKey}T00:00:00`), -1))
          }
          if (!backlogKey) {
            backlogKey = await findNotesBacklogKey(userId, todayKey)
          }
          if (!backlogKey) {
            
            localStorage.setItem(storageKey, todayKey)
            return
          }
          stored = backlogKey
        }

        if (stored === todayKey) {
          if (localStorage.getItem(storageKey) !== todayKey) {
            localStorage.setItem(storageKey, todayKey)
          }
          return
        }

        // Phase A: prepare rollover payload using local date keys for comparisons.
        const rolloverDateKey = stored
        const tasksToArchive = tasks.filter((task) => {
          if (isTaskArchived(task)) return false
          const taskDateKey = resolveTaskDateKey(task)
          if (!taskDateKey) return true
          return taskDateKey <= rolloverDateKey
        })
        const rolloverDate = parseDate(`${rolloverDateKey}T00:00:00`) ?? new Date()
        const logTitle = `Daily Log - ${format(rolloverDate, 'MMM d, yyyy')}`
        const logContent = buildDailyLogContent(tasksToArchive)
        const dayStartIso = startOfDay(rolloverDate).toISOString()
        const dayEndIso = endOfDay(rolloverDate).toISOString()

        // Phase B: commit with idempotent log creation and task archiving.
        // The Daily Log anchors notes rollover for the day.
        await ensureDailyLog({
          userId,
          dayStartIso,
          dayEndIso,
          title: logTitle,
          content: logContent,
          createdAt: dayEndIso
        })

        if (tasksToArchive.length > 0) {
          // Attribute archival to the day being closed, not the execution time.
          const archivedAt = dayEndIso
          const updates = await Promise.all(tasksToArchive.map(async (task) => {
            const nextTags = buildArchivedTags(task)
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ tags: nextTags, updated_at: archivedAt })
              .eq('id', task.id)
              .eq('user_id', userId)
            return { id: task.id, error: updateError }
          }))

          const failed = updates.find((update) => update.error)
          if (failed) {
            throw failed.error
          }
        }

        localStorage.setItem(storageKey, todayKey)
        setRolloverCount((prev) => prev + 1)
      } catch (error) {
        console.error('Daily rollover failed', error)
      } finally {
        setIsRollingOver(false)
      }
    }

    runRollover()
  }, [isRollingOver, notesReady, tasks, todayKey, userId])

  return { isRollingOver, todayKey, rolloverCount }
}
