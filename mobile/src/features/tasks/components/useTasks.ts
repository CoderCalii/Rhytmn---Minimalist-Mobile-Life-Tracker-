import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export interface TaskRow {
  id: string
  title: string
  completed: boolean
  completed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  due_date?: string | null
  archived_at?: string | null
  tags?: string | string[] | null
}

export function useTasksInternal(userId: string | null) {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [archivedTasks, setArchivedTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(() => Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      // Reset state when userId becomes null - using setTimeout to avoid synchronous setState
      const timer = setTimeout(() => {
        setTasks([])
        setArchivedTasks([])
        setLoading(false)
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }

    let isMounted = true
    // Use setTimeout to avoid synchronous setState warning
    setTimeout(() => {
      setLoading(true)
      setError(null)
    }, 0)
    const fetchTasks = async () => {
      if (!isMounted) return
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('id, title, completed, completed_at, created_at, updated_at, due_date, archived_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!isMounted) return
      if (fetchError) {
        setError('Failed to load tasks.')
        setTasks([])
        setArchivedTasks([])
      } else {
        const allTasks = (data ?? []) as TaskRow[]
        // Split into active and archived
        const active = allTasks.filter((task) => !task.archived_at)
        const archived = allTasks.filter((task) => task.archived_at != null)
        setTasks(active)
        setArchivedTasks(archived)
      }
      setLoading(false)
    }

    fetchTasks()

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
      .select('id, title, completed, completed_at, created_at, updated_at, due_date, archived_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Failed to load tasks.')
      setTasks([])
      setArchivedTasks([])
    } else {
      const allTasks = (data ?? []) as TaskRow[]
      const active = allTasks.filter((task) => !task.archived_at)
      const archived = allTasks.filter((task) => task.archived_at != null)
      setTasks(active)
      setArchivedTasks(archived)
    }
    setLoading(false)
  }, [userId])

  // Create a new active task (completed=false, completed_at=null, archived_at=null)
  const createTask = useCallback(async (title: string, dueDate?: string | null) => {
    if (!userId) return null
    const updatedAt = new Date().toISOString()
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        completed: false,
        due_date: dueDate || null,
        completed_at: null,
        archived_at: null,
        updated_at: updatedAt
      })
      .select('id, title, completed, completed_at, created_at, updated_at, due_date, archived_at')
      .single()

    if (!insertError && data) {
      setTasks((prev) => [data as TaskRow, ...prev])
      return data as TaskRow
    }

    setError('Failed to add task.')
    return null
  }, [userId])

  // Toggle completion, keeping completed/completed_at in sync. Only for non-archived tasks.
  const completeTask = useCallback(async (taskId: string) => {
    if (!userId) return false
    const target = tasks.find((task) => task.id === taskId)
    if (!target) return false

    const nextCompleted = !target.completed
    const updatedAt = new Date().toISOString()
    const nextCompletedAt = nextCompleted ? updatedAt : null
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: nextCompleted, completed_at: nextCompletedAt, updated_at: updatedAt })
      .eq('id', taskId)
      .eq('user_id', userId)
      .is('archived_at', null)

    if (!updateError) {
      setTasks((prev) => prev.map((item) => (
        item.id === taskId
          ? { ...item, completed: nextCompleted, completed_at: nextCompletedAt, updated_at: updatedAt }
          : item
      )))
      return true
    }

    setError('Failed to update task.')
    return false
  }, [tasks, userId])

  const bulkComplete = useCallback(async (ids: string[]) => {
    if (!userId || ids.length === 0) return false
    const updatedAt = new Date().toISOString()
    const completedAt = updatedAt
    const { error: bulkError } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: completedAt, updated_at: updatedAt })
      .in('id', ids)
      .eq('user_id', userId)
      .is('archived_at', null)

    if (bulkError) {
      setError('Failed to complete selected tasks.')
      return false
    }

    const selectedSet = new Set(ids)
    setTasks((prev) => prev.map((task) => (
      selectedSet.has(task.id)
        ? { ...task, completed: true, completed_at: completedAt, updated_at: updatedAt }
        : task
    )))
    return true
  }, [userId])

  // Archive a single task (set archived_at, move from active to archived)
  const archiveTask = useCallback(async (taskId: string) => {
    if (!userId) return false
    const taskToArchive = tasks.find((task) => task.id === taskId)
    if (!taskToArchive) return false

    const archivedAt = new Date().toISOString()
    const archivedTask: TaskRow = { ...taskToArchive, archived_at: archivedAt, updated_at: archivedAt }

    // Optimistic update: move from tasks to archivedTasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))
    setArchivedTasks((prev) => [archivedTask, ...prev])

    // Background sync to Supabase
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ archived_at: archivedAt, updated_at: archivedAt })
      .eq('id', taskId)
      .eq('user_id', userId)
      .is('archived_at', null)

    if (updateError) {
      // Revert on error
      setTasks((prev) => [...prev, taskToArchive])
      setArchivedTasks((prev) => prev.filter((task) => task.id !== taskId))
      setError('Failed to archive task.')
      return false
    }

    return true
  }, [tasks, userId])

  const bulkArchive = useCallback(async (ids: string[]) => {
    if (!userId || ids.length === 0) return false
    const tasksToArchive = tasks.filter((task) => ids.includes(task.id))
    if (tasksToArchive.length === 0) return true

    const archivedAt = new Date().toISOString()
    const archivedTasksList: TaskRow[] = tasksToArchive.map((task) => ({
      ...task,
      archived_at: archivedAt,
      updated_at: archivedAt
    }))

    // Optimistic update: move from tasks to archivedTasks
    const selectedSet = new Set(ids)
    setTasks((prev) => prev.filter((task) => !selectedSet.has(task.id)))
    setArchivedTasks((prev) => [...archivedTasksList, ...prev])

    // Background sync to Supabase
    const { error: bulkError } = await supabase
      .from('tasks')
      .update({ archived_at: archivedAt, updated_at: archivedAt })
      .in('id', ids)
      .eq('user_id', userId)
      .is('archived_at', null)

    if (bulkError) {
      // Revert on error
      setTasks((prev) => [...prev, ...tasksToArchive])
      setArchivedTasks((prev) => prev.filter((task) => !selectedSet.has(task.id)))
      setError('Failed to archive selected tasks.')
      return false
    }

    return true
  }, [tasks, userId])

  // Restore a task from archive (clear archived_at, move from archived to active)
  const restoreTask = useCallback(async (taskId: string) => {
    if (!userId) return false
    const taskToRestore = archivedTasks.find((task) => task.id === taskId)
    if (!taskToRestore) return false

    const restoredTask: TaskRow = { ...taskToRestore, archived_at: null, updated_at: new Date().toISOString() }

    // Optimistic update: move from archivedTasks to tasks
    setArchivedTasks((prev) => prev.filter((task) => task.id !== taskId))
    setTasks((prev) => [restoredTask, ...prev])

    // Background sync to Supabase
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ archived_at: null, updated_at: restoredTask.updated_at })
      .eq('id', taskId)
      .eq('user_id', userId)
      .not('archived_at', 'is', null)

    if (updateError) {
      // Revert on error
      setArchivedTasks((prev) => [taskToRestore, ...prev])
      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      setError('Failed to restore task.')
      return false
    }

    return true
  }, [archivedTasks, userId])

  const resolvedTasks = userId ? tasks : []
  const resolvedArchivedTasks = userId ? archivedTasks : []
  const resolvedLoading = userId ? loading : false
  const resolvedError = userId ? error : null

  return {
    tasks: resolvedTasks,
    archivedTasks: resolvedArchivedTasks,
    loading: resolvedLoading,
    error: resolvedError,
    refreshTasks,
    createTask,
    completeTask,
    archiveTask,
    restoreTask,
    bulkComplete,
    bulkArchive
  }
}
