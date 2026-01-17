import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { addDays, endOfDay, format, startOfDay } from 'date-fns'
import { supabase } from '../../../lib/supabase'
import type { TaskRow } from './useTasks'

interface UseDailyRolloverArgs {
  userId: string | null
  tasks: TaskRow[]
  notesReady: boolean
  tasksReady: boolean
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
  return Array.from(tags)
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const resolveTaskDate = (task: TaskRow) => (
  parseDate(task.due_date ?? null) ?? parseDate(task.updated_at ?? task.created_at ?? null)
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

const findExistingDailyLog = async (
  userId: string,
  title: string,
  dayStartIso: string,
  dayEndIso: string
) => {
  const { data, error } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('title', title)
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
  const existing = await findExistingDailyLog(userId, title, dayStartIso, dayEndIso)
  if (existing) return existing

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content,
      category: 'Personal',
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

export function useDailyRollover({ userId, tasks, notesReady, tasksReady }: UseDailyRolloverArgs) {
  const [todayKey, setTodayKey] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [isRollingOver, setIsRollingOver] = useState(false)
  const [rolloverCount, setRolloverCount] = useState(0)
  const appState = useRef(AppState.currentState)
  const lastProcessedTodayKey = useRef<string | null>(null)

  // Update todayKey at midnight
  useEffect(() => {
    if (!userId) return
    const now = new Date()
    const nextMidnight = startOfDay(addDays(now, 1))
    const timeout = nextMidnight.getTime() - now.getTime()
    const timer = setTimeout(() => {
      const newTodayKey = format(new Date(), 'yyyy-MM-dd')
      // Reset lastProcessedTodayKey when day changes to allow rollover to run
      if (newTodayKey !== todayKey) {
        lastProcessedTodayKey.current = null
        setTodayKey(newTodayKey)
        console.log('[useDailyRollover] Day changed at midnight, updated todayKey:', newTodayKey)
      }
    }, timeout)

    return () => clearTimeout(timer)
  }, [todayKey, userId])

  // Catch-up rollover on app resume
  useEffect(() => {
    if (!userId) return

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, recompute todayKey to catch up if day changed
        const newTodayKey = format(new Date(), 'yyyy-MM-dd')
        if (newTodayKey !== todayKey) {
          // Reset lastProcessedTodayKey when day changes to allow rollover to run
          lastProcessedTodayKey.current = null
          setTodayKey(newTodayKey)
          console.log('[useDailyRollover] App resumed, day changed, updated todayKey:', newTodayKey)
        }
      }
      appState.current = nextAppState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [userId, todayKey])

  useEffect(() => {
    // Gate: only run when all prerequisites are met
    if (!userId || !notesReady || !tasksReady || isRollingOver) {
      if (!tasksReady) {
        console.log('[useDailyRollover] Skipping rollover: tasks not ready')
      }
      return
    }

    // Prevent redundant runs for the same todayKey
    if (lastProcessedTodayKey.current === todayKey) {
      console.log('[useDailyRollover] Already processed todayKey, skipping redundant run', { todayKey })
      return
    }

    const storageKey = `tasks:lastRollover:${userId}`

    const runRollover = async () => {
      setIsRollingOver(true)
      let archiveSucceeded = false
      try {
        let stored = await AsyncStorage.getItem(storageKey)
        console.log('[useDailyRollover] Starting rollover check', {
          stored,
          todayKey,
          tasksLength: tasks.length,
          tasksReady,
          notesReady
        })

        const { latestKey, hasUndatedTasks } = findTaskBacklogKey(tasks, todayKey)
        let backlogKey: string | null = latestKey

        if (!backlogKey && hasUndatedTasks) {
          backlogKey = toLocalDateKey(addDays(new Date(`${todayKey}T00:00:00`), -1))
        }
        if (!backlogKey) {
          backlogKey = await findNotesBacklogKey(userId, todayKey)
        }
        if (!stored) {
          if (!backlogKey) {
            // No backlog found, initialize to today
            console.log('[useDailyRollover] No stored value and no backlog, initializing to todayKey')
            await AsyncStorage.setItem(storageKey, todayKey)
            lastProcessedTodayKey.current = todayKey
            return
          }
          stored = backlogKey
        }

        if (stored === todayKey) {
          console.log('[useDailyRollover] Already rolled over for today, skipping')
          lastProcessedTodayKey.current = todayKey
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

        console.log('[useDailyRollover] Rollover analysis', {
          rolloverDateKey,
          tasksToArchiveLength: tasksToArchive.length,
          tasksLength: tasks.length
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

        // Archive tasks if any need archiving
        if (tasksToArchive.length > 0) {
          // Attribute archival to the day being closed, not the execution time.
          const archivedAt = dayEndIso
          const updates = await Promise.all(tasksToArchive.map(async (task) => {
            const nextTags = buildArchivedTags(task)
            // Build update payload: set archived_at timestamp and update tags
            const updatePayload: {
              archived_at: string;
              updated_at: string;
              tags?: string | string[] | null;
            } = {
              archived_at: archivedAt,
              updated_at: archivedAt,
              tags: nextTags
            };
            
            // Log the payload for debugging
            console.log('[useDailyRollover] Archiving task', {
              taskId: task.id,
              payload: updatePayload
            });
            
            const { error: updateError } = await supabase
              .from('tasks')
              .update(updatePayload)
              .eq('id', task.id)
              .eq('user_id', userId)
            
            if (updateError) {
              console.error('[useDailyRollover] Supabase update error', {
                taskId: task.id,
                error: updateError,
                payload: updatePayload
              });
            }
            
            return { id: task.id, error: updateError }
          }))

          const failed = updates.filter((update) => update.error)
          if (failed.length > 0) {
            const failedIds = failed.map((f) => f.id)
            const errorDetails = failed.map((f) => ({
              id: f.id,
              message: f.error?.message,
              code: f.error?.code,
              details: f.error?.details
            }))
            console.warn('[useDailyRollover] Failed to archive tasks', {
              failedIds,
              errors: errorDetails,
              note: 'Rollover will not be committed due to archive failures'
            })
            throw new Error(`Failed to archive ${failed.length} task(s): ${failedIds.join(', ')}`)
          }

          console.log('[useDailyRollover] Successfully archived tasks', {
            count: tasksToArchive.length,
            taskIds: tasksToArchive.map((t) => t.id)
          })
        } else {
          console.log('[useDailyRollover] No tasks to archive for', rolloverDateKey)
        }

        // Only commit AsyncStorage after successful archiving (or when no archiving needed and tasks are ready)
        archiveSucceeded = true
        await AsyncStorage.setItem(storageKey, todayKey)
        lastProcessedTodayKey.current = todayKey
        console.log('[useDailyRollover] Rollover completed successfully', {
          rolloverDateKey,
          archivedCount: tasksToArchive.length,
          newStored: todayKey
        })
        setRolloverCount((prev) => prev + 1)
      } catch (error) {
        console.error('[useDailyRollover] Daily rollover failed', {
          error,
          archiveSucceeded,
          willNotCommit: !archiveSucceeded
        })
        // DO NOT set AsyncStorage to todayKey if archiving failed
        if (archiveSucceeded) {
          console.warn('[useDailyRollover] Archive succeeded but error occurred, AsyncStorage may be inconsistent')
        }
      } finally {
        setIsRollingOver(false)
      }
    }

    runRollover()
  }, [isRollingOver, notesReady, tasksReady, tasks, todayKey, userId])

  return { isRollingOver, todayKey, rolloverCount }
}
