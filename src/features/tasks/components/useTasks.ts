import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import type { TaskPriority } from './tasks/TaskPriorityDot'

export interface TaskRow {
  id: string
  title: string
  completed: boolean
  created_at?: string | null
  updated_at?: string | null
  due_date?: string | null
  priority?: TaskPriority | null
  tags?: string | string[] | null
}

export const parseTags = (value?: string | string[] | null) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean)
  }
  if (typeof value !== 'string') return []
  return value.split(',').map((tag) => tag.trim()).filter(Boolean)
}

const addTag = (value: string | string[] | null | undefined, tag: string) => {
  const tags = new Set(parseTags(value))
  tags.add(tag)
  return Array.from(tags).join(', ')
}

const buildArchivedTags = (task: TaskRow) => {
  let nextTags = addTag(task.tags ?? null, 'archived')
  if (!task.completed) {
    nextTags = addTag(nextTags, 'incomplete')
  }
  return nextTags
}

export const isTaskArchived = (task: TaskRow) => (
  parseTags(task.tags ?? null).includes('archived')
)

export interface AddTaskInput {
  title: string
  dueDate?: string | null
  priority: TaskPriority
}

export function useTasks(userId: string | null) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(() => Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let isMounted = true
    setLoading(true)
    setError(null)

    supabase
      .from('tasks')
      .select('id, title, completed, created_at, updated_at, due_date, priority, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return
        if (fetchError) {
          setError('Failed to load tasks.')
          setTasks([])
        } else {
          setTasks((data ?? []) as TaskRow[])
        }
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  const refreshTasks = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, completed, created_at, updated_at, due_date, priority, tags')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Failed to load tasks.')
      setTasks([])
    } else {
      setTasks((data ?? []) as TaskRow[])
    }
    setLoading(false)
  }, [userId])

  const addTask = useCallback(async ({ title, dueDate, priority }: AddTaskInput) => {
    if (!userId) return null
    const updatedAt = new Date().toISOString()
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        completed: false,
        tags: null,
        due_date: dueDate || null,
        priority,
        updated_at: updatedAt
      })
      .select('id, title, completed, created_at, updated_at, due_date, priority, tags')
      .single()

    if (!insertError && data) {
      setTasks((prev) => [data as TaskRow, ...prev])
      return data as TaskRow
    }

    setError('Failed to add task.')
    return null
  }, [userId])

  const toggleTask = useCallback(async (task: TaskRow) => {
    if (!userId) return false
    const nextCompleted = !task.completed
    const updatedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: nextCompleted, updated_at: updatedAt })
      .eq('id', task.id)
      .eq('user_id', userId)

    if (!updateError) {
      setTasks((prev) => prev.map((item) => (
        item.id === task.id ? { ...item, completed: nextCompleted, updated_at: updatedAt } : item
      )))
      return true
    }

    setError('Failed to update task.')
    return false
  }, [userId])

  const bulkComplete = useCallback(async (ids: string[]) => {
    if (!userId || ids.length === 0) return false
    const updatedAt = new Date().toISOString()
    const { error: bulkError } = await supabase
      .from('tasks')
      .update({ completed: true, updated_at: updatedAt })
      .in('id', ids)
      .eq('user_id', userId)

    if (bulkError) {
      setError('Failed to complete selected tasks.')
      return false
    }

    const selectedSet = new Set(ids)
    setTasks((prev) => prev.map((task) => (
      selectedSet.has(task.id) ? { ...task, completed: true, updated_at: updatedAt } : task
    )))
    return true
  }, [userId])

  const bulkArchive = useCallback(async (ids: string[]) => {
    if (!userId || ids.length === 0) return false
    const updatedAt = new Date().toISOString()
    const selectedSet = new Set(ids)
    const tasksToArchive = tasks.filter((task) => selectedSet.has(task.id))
    if (tasksToArchive.length === 0) return true

    const updates = await Promise.all(tasksToArchive.map(async (task) => {
      const nextTags = buildArchivedTags(task)
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ tags: nextTags, updated_at: updatedAt })
        .eq('id', task.id)
        .eq('user_id', userId)
      return { id: task.id, tags: nextTags, error: updateError }
    }))

    const failed = updates.find((update) => update.error)
    if (failed) {
      setError('Failed to archive selected tasks.')
      return false
    }

    const tagsById = new Map(updates.map((update) => [update.id, update.tags]))
    setTasks((prev) => prev.map((task) => (
      selectedSet.has(task.id)
        ? { ...task, tags: tagsById.get(task.id) ?? task.tags, updated_at: updatedAt }
        : task
    )))
    return true
  }, [tasks, userId])

  const resolvedTasks = userId ? tasks : []
  const resolvedLoading = userId ? loading : false
  const resolvedError = userId ? error : null

  return {
    tasks: resolvedTasks,
    loading: resolvedLoading,
    error: resolvedError,
    refreshTasks,
    addTask,
    toggleTask,
    bulkComplete,
    bulkArchive
  }
}
