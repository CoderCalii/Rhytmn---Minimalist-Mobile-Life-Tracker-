import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { supabase } from '../../../lib/supabase'

export interface TodayHabit {
  id: string
  title: string
  frequency?: string | null
}

export interface TodayHabitLog {
  habit_id: string
  completed_on: string
}

interface UseTodayHabitsResult {
  habits: TodayHabit[]
  completedHabitIds: Set<string>
  loading: boolean
  error: string | null
  toggleHabitForToday: (habitId: string) => Promise<void>
}

export function useTodayHabits(userId: string | null): UseTodayHabitsResult {
  const [habits, setHabits] = useState<TodayHabit[]>([])
  const [completedHabitIds, setCompletedHabitIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!userId) {
      // Reset state when userId becomes null
      const timer = setTimeout(() => {
        setHabits([])
        setCompletedHabitIds(new Set())
        setLoading(false)
        setError(null)
      }, 0)
      return () => clearTimeout(timer)
    }

    let isMounted = true
    const fetchTodayHabits = async () => {
      setLoading(true)
      setError(null)

      // Fetch active habits for the user
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, title, frequency, active')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (!isMounted) return
      if (habitsError) {
        setError('Failed to load habits.')
        setHabits([])
        setCompletedHabitIds(new Set())
        setLoading(false)
        return
      }

      const safeHabits: TodayHabit[] = (habitsData ?? []).map((row) => ({
        id: row.id as string,
        title: (row.title as string) ?? '',
        frequency: (row.frequency as string | null) ?? null
      }))

      // Fetch today's habit logs for this user
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('habit_id, completed_on')
        .eq('user_id', userId)
        .eq('completed_on', todayKey)

      if (!isMounted) return
      if (logsError) {
        setError('Failed to load habit progress.')
        setHabits(safeHabits)
        setCompletedHabitIds(new Set())
        setLoading(false)
        return
      }

      const completedIds = new Set<string>(
        (logsData ?? [])
          .map((log) => log.habit_id as string)
          .filter((id): id is string => Boolean(id))
      )

      setHabits(safeHabits)
      setCompletedHabitIds(completedIds)
      setLoading(false)
    }

    fetchTodayHabits()

    return () => {
      isMounted = false
    }
  }, [todayKey, userId])

  const toggleHabitForToday = useCallback(async (habitId: string) => {
    if (!userId) return

    const wasCompleted = completedHabitIds.has(habitId)
    const previous = new Set(completedHabitIds)

    // Optimistic local update
    setCompletedHabitIds((prev) => {
      const next = new Set(prev)
      if (wasCompleted) {
        next.delete(habitId)
      } else {
        next.add(habitId)
      }
      return next
    })
    setError(null)

    const { error: toggleError } = wasCompleted
      ? await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_on', todayKey)
          .eq('user_id', userId)
      : await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            user_id: userId,
            completed_on: todayKey,
            completed_at: new Date().toISOString()
          })

    if (toggleError) {
      // Revert optimistic update on error
      setCompletedHabitIds(previous)
      setError('Failed to update habit.')
    }
  }, [completedHabitIds, todayKey, userId])

  return {
    habits,
    completedHabitIds,
    loading,
    error,
    toggleHabitForToday
  }
}


