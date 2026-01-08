import { useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { differenceInHours, format, formatDistanceToNowStrict } from 'date-fns'
import { INITIAL_PAGES } from '../../mockData'
import type { Page } from '../../types'
import { sanitizeText } from '../../utils/sanitize'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { NoteCard } from './components/NoteCard'
import { NoteFilters } from './components/NoteFilters'
import { TaskBulkActions } from './components/TaskBulkActions'
import { TaskCreator } from './components/TaskCreator'
import { TaskItem } from './components/TaskItem'
import { TasksHeader } from './components/TasksHeader'
import { TaskSearchBar } from './components/TaskSearchBar'
import type { TaskPriority } from './components/TaskPriorityDot'

type NoteFilter = 'All' | 'Ideas' | 'Personal'

interface TaskRow {
  id: string
  title: string
  completed: boolean
  created_at?: string | null
  updated_at?: string | null
  due_date?: string | null
  priority?: TaskPriority | null
  tags?: string | null
}

interface TasksViewProps {
  pages: Page[]
  isAddingInline: boolean
  inlineValue: string
  inlineInputRef: RefObject<HTMLInputElement | null>
  onInlineChange: (value: string) => void
  onStartInline: () => void
  onCancelInline: () => void
  onInlineAdded?: (title: string) => void
  onSelectPage: (pageId: string) => void
}

const NOTE_FILTERS: NoteFilter[] = ['All', 'Ideas', 'Personal']

const formatTimestamp = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const hoursDiff = Math.abs(differenceInHours(new Date(), date))
  if (hoursDiff < 24) {
    return formatDistanceToNowStrict(date, { addSuffix: true })
  }
  return format(date, 'MMM d')
}

const formatShortDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'MMM d')
}

const parseTags = (value?: string | string[] | null) => {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean)
  }
  if (typeof value !== 'string') return []
  return value.split(',').map((tag) => tag.trim()).filter(Boolean)
}

const hasTag = (value: string | string[] | null | undefined, tag: string) => (
  parseTags(value).includes(tag)
)

const addTag = (value: string | string[] | null | undefined, tag: string) => {
  const tags = new Set(parseTags(value))
  tags.add(tag)
  return Array.from(tags).join(', ')
}

const TasksView = ({
  pages = INITIAL_PAGES,
  isAddingInline,
  inlineValue,
  inlineInputRef,
  onInlineChange,
  onStartInline,
  onCancelInline,
  onInlineAdded,
  onSelectPage
}: TasksViewProps) => {
  const { user, loading: authLoading } = useAuth()
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('All')
  const [selectMode, setSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [inlineDueDate, setInlineDueDate] = useState('')
  const [inlinePriority, setInlinePriority] = useState<TaskPriority>('medium')

  const userId = user ? ((user as { uid?: string }).uid ?? user.id) : null
  const normalizedSearch = searchQuery.trim().toLowerCase()

  useEffect(() => {
    if (!userId) {
      setTasks([])
      setLoading(false)
      setError(null)
      setSelectMode(false)
      setSelectedTaskIds(new Set())
      return
    }

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

  const matchesSearch = (value: string) => (
    normalizedSearch.length === 0 || value.toLowerCase().includes(normalizedSearch)
  )

  const activeTasks = tasks.filter((task) => !hasTag(task.tags ?? null, 'archived'))
  const visibleTasks = activeTasks.filter((task) => matchesSearch(task.title))
  const remainingCount = activeTasks.filter((task) => !task.completed).length

  const allNotes = pages.filter((page) => {
    const category = page.category?.toLowerCase()
    return category === 'note' || page.blocks.some((block) => block.type === 'text')
  })

  const filteredNotes = allNotes.filter((note) => {
    if (!matchesSearch(note.title)) return false
    if (noteFilter === 'All') return true
    const category = note.category?.toLowerCase() ?? ''
    if (noteFilter === 'Ideas') return category.includes('idea')
    return category.includes('personal')
  })

  const sortedNotes = [...filteredNotes].sort((first, second) => {
    const firstPinned = (first as { isPinned?: boolean }).isPinned === true
    const secondPinned = (second as { isPinned?: boolean }).isPinned === true
    if (firstPinned !== secondPinned) return secondPinned ? 1 : -1
    const firstDate = new Date(first.updatedAt ?? '')
    const secondDate = new Date(second.updatedAt ?? '')
    const firstTime = Number.isNaN(firstDate.getTime()) ? 0 : firstDate.getTime()
    const secondTime = Number.isNaN(secondDate.getTime()) ? 0 : secondDate.getTime()
    return secondTime - firstTime
  })

  const resetInlineMeta = () => {
    setInlineDueDate('')
    setInlinePriority('medium')
  }

  const handleStartInline = () => {
    if (selectMode) exitSelectMode()
    resetInlineMeta()
    onStartInline()
  }

  const handleAddInline = async () => {
    if (!userId) return
    const trimmed = sanitizeText(inlineValue).trim()
    if (!trimmed) {
      resetInlineMeta()
      onCancelInline()
      return
    }

    const updatedAt = new Date().toISOString()
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: trimmed,
        completed: false,
        tags: null,
        due_date: inlineDueDate || null,
        priority: inlinePriority,
        updated_at: updatedAt
      })
      .select('id, title, completed, created_at, updated_at, due_date, priority, tags')
      .single()

    if (!insertError && data) {
      setTasks((prev) => [data as TaskRow, ...prev])
      onInlineChange('')
      resetInlineMeta()
      onInlineAdded?.(trimmed)
    } else if (insertError) {
      setError('Failed to add task.')
    }
  }

  const handleToggleTask = async (task: TaskRow) => {
    if (!userId) return
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
    } else {
      setError('Failed to update task.')
    }
  }

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  const enterSelectMode = (taskId: string) => {
    if (selectMode) {
      handleSelectTask(taskId)
      return
    }
    setSelectMode(true)
    setSelectedTaskIds(new Set([taskId]))
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedTaskIds(new Set())
  }

  const selectedIds = Array.from(selectedTaskIds)

  const handleBulkComplete = async () => {
    if (!userId || selectedIds.length === 0) return
    const updatedAt = new Date().toISOString()
    const { error: bulkError } = await supabase
      .from('tasks')
      .update({ completed: true, updated_at: updatedAt })
      .in('id', selectedIds)
      .eq('user_id', userId)

    if (bulkError) {
      setError('Failed to complete selected tasks.')
      return
    }

    setTasks((prev) => prev.map((task) => (
      selectedTaskIds.has(task.id) ? { ...task, completed: true, updated_at: updatedAt } : task
    )))
    exitSelectMode()
  }

  const handleBulkArchive = async () => {
    if (!userId || selectedIds.length === 0) return
    const updatedAt = new Date().toISOString()
    const selectedSet = new Set(selectedIds)
    const tasksToArchive = tasks.filter((task) => selectedSet.has(task.id))
    const updates = await Promise.all(tasksToArchive.map(async (task) => {
      const nextTags = addTag(task.tags ?? null, 'archived')
      const { error } = await supabase
        .from('tasks')
        .update({ tags: nextTags, updated_at: updatedAt })
        .eq('id', task.id)
        .eq('user_id', userId)
      return { id: task.id, tags: nextTags, error }
    }))

    const failed = updates.find((update) => update.error)
    if (failed) {
      setError('Failed to archive selected tasks.')
      return
    }

    const tagsById = new Map(updates.map((update) => [update.id, update.tags]))
    setTasks((prev) => prev.map((task) => (
      selectedTaskIds.has(task.id)
        ? { ...task, tags: tagsById.get(task.id) ?? task.tags, updated_at: updatedAt }
        : task
    )))
    exitSelectMode()
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <TasksHeader />

      <div className="px-6">
        <div className="space-y-3 mb-10">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Current List</h2>
            <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
              {remainingCount} items
            </span>
          </div>

          {selectMode && (
            <TaskBulkActions
              selectedCount={selectedTaskIds.size}
              onComplete={handleBulkComplete}
              onArchive={handleBulkArchive}
              onExit={exitSelectMode}
            />
          )}

          {authLoading || loading ? (
            <div className="p-5 text-sm text-gray-400">Loading tasks...</div>
          ) : !user ? (
            <div className="p-5 text-sm text-gray-400">Sign in to view your tasks.</div>
          ) : error ? (
            <div className="p-5 text-sm text-rose-500">{error}</div>
          ) : visibleTasks.length === 0 ? (
            <div className="p-5 text-sm text-gray-400">
              {normalizedSearch ? 'No tasks match your search.' : 'No tasks yet.'}
            </div>
          ) : (
            visibleTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                timestampLabel={formatTimestamp(task.updated_at ?? task.created_at)}
                dueDateLabel={formatShortDate(task.due_date)}
                isSelected={selectedTaskIds.has(task.id)}
                isSelectMode={selectMode}
                onToggleComplete={() => handleToggleTask(task)}
                onToggleSelect={() => handleSelectTask(task.id)}
                onLongPress={() => enterSelectMode(task.id)}
              />
            ))
          )}
        
          <div className="mt-2">
            <TaskCreator
              isAdding={isAddingInline}
              value={inlineValue}
              dueDate={inlineDueDate}
              priority={inlinePriority}
              inputRef={inlineInputRef}
              onChange={onInlineChange}
              onDueDateChange={setInlineDueDate}
              onPriorityChange={setInlinePriority}
              onStart={handleStartInline}
              onCancel={() => {
                resetInlineMeta()
                onCancelInline()
              }}
              onSubmit={handleAddInline}
              disabled={!user}
              placeholder={user ? 'What needs to be done?' : 'Sign in to add tasks'}
            />
          </div>
        </div>

        <div className="mt-12">
          <div className="flex items-center justify-between px-1 mb-4 flex-wrap gap-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Past Notes & Brainstorms</h2>
            <NoteFilters filters={NOTE_FILTERS} activeFilter={noteFilter} onChange={(value) => setNoteFilter(value as NoteFilter)} />
          </div>
          <div className="mb-4">
            <TaskSearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        
          <div className="grid grid-cols-1 gap-3">
            {sortedNotes.length === 0 ? (
              <div className="p-5 text-sm text-gray-400">
                {normalizedSearch ? 'No notes match your search.' : 'No notes yet.'}
              </div>
            ) : (
              sortedNotes.map((note) => {
                const isPinned = (note as { isPinned?: boolean }).isPinned === true
                const markdownContent = note.blocks
                  .filter((block) => block.type === 'text')
                  .map((block) => block.content)
                  .join('\n\n')

                return (
                  <NoteCard
                    key={note.id}
                    title={note.title}
                    icon={note.icon}
                    timestamp={formatTimestamp(note.updatedAt)}
                    content={markdownContent}
                    isPinned={isPinned}
                    onSelect={() => onSelectPage(note.id)}
                  />
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksView
