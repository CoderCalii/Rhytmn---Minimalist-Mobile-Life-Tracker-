type FocusMode = 'tasks' | 'notes'

interface TasksHeaderProps {
  focusMode: FocusMode
  onFocusChange: (mode: FocusMode) => void
}

export function TasksHeader({ focusMode, onFocusChange }: TasksHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  const tasksActive = focusMode === 'tasks'
  const notesActive = focusMode === 'notes'

  const handleToggle = (mode: FocusMode) => {
    if (mode === focusMode) return
    onFocusChange(mode)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>, mode: FocusMode) => {
    if (mode === focusMode) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onFocusChange(mode)
  }

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-[60]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black whitespace-nowrap flex items-center gap-4">
            <span
              className={`transition-opacity ${tasksActive ? 'opacity-100' : 'opacity-40 cursor-pointer hover:opacity-70'}`}
              role={tasksActive ? undefined : 'button'}
              tabIndex={tasksActive ? -1 : 0}
              onClick={tasksActive ? undefined : () => handleToggle('tasks')}
              onKeyDown={(event) => handleKeyDown(event, 'tasks')}
            >
              To-Do
            </span>
            <span
              className={`transition-opacity ${notesActive ? 'opacity-100' : 'opacity-40 cursor-pointer hover:opacity-70'}`}
              role={notesActive ? undefined : 'button'}
              tabIndex={notesActive ? -1 : 0}
              onClick={notesActive ? undefined : () => handleToggle('notes')}
              onKeyDown={(event) => handleKeyDown(event, 'notes')}
            >
              Notes
            </span>
          </h1>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
        </div>
      </div>
    </div>
  )
}
