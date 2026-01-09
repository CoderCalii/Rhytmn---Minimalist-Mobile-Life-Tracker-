import { useEffect, useState } from 'react'
import type { FocusEvent, RefObject } from 'react'
import { differenceInHours, format, formatDistanceToNowStrict } from 'date-fns'
import { sanitizeText } from '../../../utils/sanitize'
import { useAuth } from '../../../hooks/useAuth'
import { NoteCard } from '../components/notes/NoteCard'
import { NoteFilters } from '../components/notes/NoteFilters'
import { TaskBulkActions } from '../components/tasks/TaskBulkActions'
import { TaskCreator } from '../components/tasks/TaskCreator'
import { TaskItem } from '../components/tasks/TaskItem'
import { TasksHeader } from '../components/tasks/TasksHeader'
import { TaskNoteComposer } from '../components/notes/TaskNoteComposer'
import { TaskSearchBar } from '../components/tasks/TaskSearchBar'
import type { TaskPriority } from '../components/tasks/TaskPriorityDot'
import { useNotes } from '../components/useNotes'
import type { NoteRow } from '../components/useNotes'
import { useDailyRollover } from '../components/useDailyRollover'
import { useTaskSelection } from '../components/useTaskSelection'
import { useTasks, isTaskArchived } from '../components/useTasks'
import { useTaskStats } from '../components/useTaskStats'
import { useArchivedTasks } from '../components/useArchivedTasks'

type NoteFilter = 'All' | 'Ideas' | 'Personal'
type FocusMode = 'tasks' | 'notes'

interface TasksViewProps {
  isAddingInline: boolean
  inlineValue: string
  inlineInputRef: RefObject<HTMLInputElement | null>
  onInlineChange: (value: string) => void
  onStartInline: () => void
  onCancelInline: () => void
  onInlineAdded?: (title: string) => void
}

const NOTE_FILTERS: NoteFilter[] = ['All', 'Ideas', 'Personal']
const NOTE_CATEGORIES = ['Idea', 'Meeting', 'Personal', 'Urgent']

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

const parseDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const toLocalDateKey = (value?: string | null) => {
  const parsed = parseDate(value)
  if (!parsed) return null
  return format(parsed, 'yyyy-MM-dd')
}

const TasksView = ({
  isAddingInline,
  inlineValue,
  inlineInputRef,
  onInlineChange,
  onStartInline,
  onCancelInline,
  onInlineAdded
}: TasksViewProps) => {
  const { user, loading: authLoading } = useAuth()
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteCategory, setNoteCategory] = useState('Idea')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteSaveError, setNoteSaveError] = useState<string | null>(null)
  const [notesSearchQuery, setNotesSearchQuery] = useState('')
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('All')
  const [inlineDueDate, setInlineDueDate] = useState('')
  const [inlinePriority, setInlinePriority] = useState<TaskPriority>('medium')
  const [focusMode, setFocusMode] = useState<FocusMode>('tasks')
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)

  const userId = user ? ((user as { uid?: string }).uid ?? user.id) : null
  const normalizedNotesSearch = notesSearchQuery.trim().toLowerCase()
  const tasksFocused = focusMode === 'tasks'
  const notesFocused = focusMode === 'notes'
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks,
    addTask,
    toggleTask,
    bulkComplete,
    bulkArchive
  } = useTasks(userId)
  const {
    notes,
    notesLoading,
    notesError,
    refreshNotes,
    addNote
  } = useNotes(userId)
  const {
    selectMode,
    selectedTaskIds,
    selectedIds,
    enterSelectMode,
    toggleSelection,
    exitSelectMode
  } = useTaskSelection()
  const notesReady = !notesLoading && !tasksLoading
  const { todayKey, rolloverCount } = useDailyRollover({
    userId,
    tasks,
    notesReady
  })

  useEffect(() => {
    if (rolloverCount === 0) return
    refreshTasks()
    refreshNotes()
    exitSelectMode()
  }, [exitSelectMode, refreshNotes, refreshTasks, rolloverCount])

  const activeTasks = tasks.filter((task) => !isTaskArchived(task))
  const visibleTasks = activeTasks
  const remainingCount = activeTasks.filter((task) => !task.completed).length
  const taskStats = useTaskStats(tasks, todayKey)
  const archivedGroups = useArchivedTasks(tasks)

  const noteMatchesFilter = (note: NoteRow) => {
    if (noteFilter === 'All') return true
    const category = note.category?.toLowerCase() ?? ''
    if (noteFilter === 'Ideas') return category.includes('idea')
    return category.includes('personal')
  }

  const matchesNotesSearch = (note: NoteRow) => {
    if (normalizedNotesSearch.length === 0) return true
    const title = note.title?.toLowerCase() ?? ''
    const content = note.content?.toLowerCase() ?? ''
    return title.includes(normalizedNotesSearch) || content.includes(normalizedNotesSearch)
  }

  const filteredNotes = notes.filter((note) => (
    matchesNotesSearch(note) && noteMatchesFilter(note)
  ))

  const sortNotes = (list: NoteRow[]) => (
    [...list].sort((first, second) => {
      const firstPinned = first.is_pinned === true
      const secondPinned = second.is_pinned === true
      if (firstPinned !== secondPinned) return secondPinned ? 1 : -1
      const firstTime = parseDate(first.created_at)?.getTime() ?? 0
      const secondTime = parseDate(second.created_at)?.getTime() ?? 0
      return secondTime - firstTime
    })
  )

  const todayNotes = filteredNotes.filter((note) => {
    const noteDateKey = toLocalDateKey(note.created_at)
    if (!noteDateKey) return false
    return noteDateKey === todayKey
  })

  const pastNotes = filteredNotes.filter((note) => {
    const noteDateKey = toLocalDateKey(note.created_at)
    if (!noteDateKey) return false
    return noteDateKey < todayKey
  })

  const sortedTodayNotes = sortNotes(todayNotes)
  const sortedPastNotes = sortNotes(pastNotes)

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

    const created = await addTask({
      title: trimmed,
      dueDate: inlineDueDate || null,
      priority: inlinePriority
    })

    if (created) {
      onInlineChange('')
      resetInlineMeta()
      onInlineAdded?.(trimmed)
    }
  }

  const resetNoteComposer = () => {
    setNoteTitle('')
    setNoteBody('')
    setNoteCategory('Idea')
    setNoteSaveError(null)
    setIsAddingNote(false)
  }

  const handleAddNote = async () => {
    if (!userId) return
    const safeTitle = sanitizeText(noteTitle).trim() || 'Untitled Note'
    const safeBody = sanitizeText(noteBody).trim()
    if (!safeBody) {
      setNoteSaveError('Add a note before saving.')
      return
    }
    const safeCategory = sanitizeText(noteCategory).trim() || 'Idea'

    setNoteSaving(true)
    setNoteSaveError(null)
    const created = await addNote({
      title: safeTitle,
      content: safeBody,
      category: safeCategory,
      icon: 'N',
      isPinned: false
    })
    setNoteSaving(false)

    if (created) {
      resetNoteComposer()
    } else {
      setNoteSaveError('Failed to save note.')
    }
  }

  const handleToggleTask = async (task: Parameters<typeof toggleTask>[0]) => {
    await toggleTask(task)
  }

  const handleBulkComplete = async () => {
    if (selectedIds.length === 0) return
    const updated = await bulkComplete(selectedIds)
    if (updated) {
      exitSelectMode()
    }
  }

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return
    const updated = await bulkArchive(selectedIds)
    if (updated) {
      exitSelectMode()
    }
  }

  const formatArchiveDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return value
    return format(parsed, 'MMM d, yyyy')
  }

  const formatMetric = (done: number, total: number) => {
    if (total === 0) return '\u2014'
    return `${done} / ${total}`
  }

  const handlePanelFocus = (isActive: boolean) => (event: FocusEvent<HTMLElement>) => {
    if (isActive) return
    event.stopPropagation()
    const target = event.target as HTMLElement | null
    // Prevent hidden panels from keeping focus in browsers without inert support.
    if (target && typeof target.blur === 'function') {
      target.blur()
    }
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <TasksHeader focusMode={focusMode} onFocusChange={setFocusMode} />

      <div className="px-6">
        <div
          className={`space-y-3 transition-opacity ${tasksFocused ? 'mb-10 opacity-100 pointer-events-auto visible' : 'mb-0 opacity-0 pointer-events-none invisible h-0 overflow-hidden'}`}
          aria-hidden={tasksFocused ? undefined : true}
          tabIndex={tasksFocused ? undefined : -1}
          onFocusCapture={handlePanelFocus(tasksFocused)}
        >
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

          {authLoading || tasksLoading ? (
            <div className="p-5 text-sm text-gray-400">Loading tasks...</div>
          ) : !user ? (
            <div className="p-5 text-sm text-gray-400">Sign in to view your tasks.</div>
          ) : tasksError ? (
            <div className="p-5 text-sm text-rose-500">{tasksError}</div>
          ) : visibleTasks.length === 0 ? (
            <div className="p-5 text-sm text-gray-400">No tasks yet.</div>
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
                onToggleSelect={() => toggleSelection(task.id)}
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

          <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="grid grid-cols-2 gap-y-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <span>Today</span>
              <span className="text-right text-gray-500">
                {formatMetric(taskStats.today.done, taskStats.today.total)}
              </span>
              <span>Yesterday</span>
              <span className="text-right text-gray-500">
                {formatMetric(taskStats.yesterday.done, taskStats.yesterday.total)}
              </span>
              <span>This week</span>
              <span className="text-right text-gray-500">
                {formatMetric(taskStats.week.done, taskStats.week.total)}
              </span>
              <span>This month</span>
              <span className="text-right text-gray-500">
                {formatMetric(taskStats.month.done, taskStats.month.total)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsArchiveOpen((prev) => !prev)}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
              aria-expanded={isArchiveOpen}
            >
              <span className="text-gray-500">{isArchiveOpen ? 'v' : '>'}</span>
              Archived Tasks
            </button>

            {isArchiveOpen && (
              <div className="mt-4 space-y-4">
                {archivedGroups.length === 0 ? (
                  <p className="text-xs text-gray-400">No archived tasks yet.</p>
                ) : (
                  archivedGroups.map((group) => (
                    <div key={group.dateKey} className="space-y-2">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${group.isUnknown ? 'text-gray-300' : 'text-gray-400'}`}>
                        {group.isUnknown ? group.label : formatArchiveDate(group.dateKey)}
                      </p>
                      <div className="space-y-2">
                        {group.tasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between text-sm text-gray-600">
                            <span className="font-medium text-gray-700">{task.title}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${task.completed ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {task.completed ? 'Done' : 'Open'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className={`transition-opacity ${notesFocused ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible h-0 overflow-hidden'}`}
          aria-hidden={notesFocused ? undefined : true}
          tabIndex={notesFocused ? undefined : -1}
          onFocusCapture={handlePanelFocus(notesFocused)}
        >
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Notes Today</h3>
              <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                {sortedTodayNotes.length} notes
              </span>
            </div>

            <TaskNoteComposer
              isAdding={isAddingNote}
              title={noteTitle}
              body={noteBody}
              category={noteCategory}
              categories={NOTE_CATEGORIES}
              isSaving={noteSaving}
              disabled={!user}
              onStart={() => {
                setNoteSaveError(null)
                setIsAddingNote(true)
              }}
              onCancel={resetNoteComposer}
              onSave={handleAddNote}
              onTitleChange={(value) => setNoteTitle(sanitizeText(value))}
              onBodyChange={(value) => setNoteBody(sanitizeText(value))}
              onCategoryChange={setNoteCategory}
            />

            {noteSaveError && <p className="text-xs font-semibold text-rose-500">{noteSaveError}</p>}

            {authLoading || notesLoading ? (
              <div className="p-4 text-sm text-gray-400">Loading notes...</div>
            ) : !user ? (
              <div className="p-4 text-sm text-gray-400">Sign in to view notes.</div>
            ) : notesError ? (
              <div className="p-4 text-sm text-rose-500">{notesError}</div>
            ) : sortedTodayNotes.length === 0 ? (
              <div className="p-4 text-sm text-gray-400">No notes yet.</div>
            ) : (
              sortedTodayNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  title={note.title ?? 'Untitled Note'}
                  icon={note.icon ?? 'N'}
                  timestamp={formatTimestamp(note.created_at)}
                  content={note.content ?? ''}
                  isPinned={note.is_pinned === true}
                  onSelect={() => {}}
                />
              ))
            )}
          </div>

          <div className="mt-12">
            <div className="flex items-center justify-between px-1 mb-4 flex-wrap gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Past Notes & Brainstorms</h2>
              <NoteFilters filters={NOTE_FILTERS} activeFilter={noteFilter} onChange={(value) => setNoteFilter(value as NoteFilter)} />
            </div>
            <div className="mb-4">
              <TaskSearchBar value={notesSearchQuery} onChange={setNotesSearchQuery} />
            </div>
          
            <div className="grid grid-cols-1 gap-3">
              {authLoading || notesLoading ? (
                <div className="p-5 text-sm text-gray-400">Loading notes...</div>
              ) : !user ? (
                <div className="p-5 text-sm text-gray-400">Sign in to view notes.</div>
              ) : notesError ? (
                <div className="p-5 text-sm text-rose-500">{notesError}</div>
              ) : sortedPastNotes.length === 0 ? (
                <div className="p-5 text-sm text-gray-400">
                  {normalizedNotesSearch ? 'No notes match your search.' : 'No notes yet.'}
                </div>
              ) : (
                sortedPastNotes.map((note) => {
                  return (
                    <NoteCard
                      key={note.id}
                      title={note.title ?? 'Untitled Note'}
                      icon={note.icon ?? 'N'}
                      timestamp={formatTimestamp(note.created_at)}
                      content={note.content ?? ''}
                      isPinned={note.is_pinned === true}
                      onSelect={() => {}}
                    />
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TasksView
