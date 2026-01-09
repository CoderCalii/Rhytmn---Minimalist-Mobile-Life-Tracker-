import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export interface NoteRow {
  id: string
  title?: string | null
  content?: string | null
  category?: string | null
  icon?: string | null
  created_at?: string | null
  is_pinned?: boolean | null
}

export interface AddNoteInput {
  title: string
  content: string
  category?: string | null
  icon?: string | null
  isPinned?: boolean
  createdAt?: string | null
}

export function useNotes(userId: string | null) {
  const [notes, setNotes] = useState<NoteRow[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [notesError, setNotesError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setNotes([])
      setNotesLoading(false)
      setNotesError(null)
      return
    }

    let isMounted = true
    setNotesLoading(true)
    setNotesError(null)

    supabase
      .from('notes')
      .select('id, title, content, category, icon, created_at, is_pinned')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return
        if (fetchError) {
          setNotesError('Failed to load notes.')
          setNotes([])
        } else {
          setNotes((data ?? []) as NoteRow[])
        }
        setNotesLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [userId])

  const refreshNotes = useCallback(async () => {
    if (!userId) {
      setNotes([])
      setNotesLoading(false)
      setNotesError(null)
      return
    }
    setNotesLoading(true)
    setNotesError(null)
    const { data, error: fetchError } = await supabase
      .from('notes')
      .select('id, title, content, category, icon, created_at, is_pinned')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setNotesError('Failed to load notes.')
      setNotes([])
    } else {
      setNotes((data ?? []) as NoteRow[])
    }
    setNotesLoading(false)
  }, [userId])

  const addNote = useCallback(async ({
    title,
    content,
    category,
    icon,
    isPinned = false,
    createdAt
  }: AddNoteInput) => {
    if (!userId) return null
    const { data, error: insertError } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content,
        category: category ?? null,
        icon: icon ?? null,
        is_pinned: isPinned,
        created_at: createdAt ?? undefined
      })
      .select('id, title, content, category, icon, created_at, is_pinned')
      .single()

    if (!insertError && data) {
      setNotes((prev) => [data as NoteRow, ...prev])
      return data as NoteRow
    }

    setNotesError('Failed to save note.')
    return null
  }, [userId])

  return {
    notes,
    notesLoading,
    notesError,
    refreshNotes,
    addNote
  }
}
