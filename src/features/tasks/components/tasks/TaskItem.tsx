import { useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { TaskPriorityDot, type TaskPriority } from './TaskPriorityDot'

interface TaskItemData {
  id: string
  title: string
  completed: boolean
  due_date?: string | null
  priority?: TaskPriority | null
}

interface TaskItemProps {
  task: TaskItemData
  timestampLabel: string
  dueDateLabel: string
  isSelected: boolean
  isSelectMode: boolean
  onToggleComplete: () => void
  onToggleSelect: () => void
  onLongPress: () => void
}

export function TaskItem({
  task,
  timestampLabel,
  dueDateLabel,
  isSelected,
  isSelectMode,
  onToggleComplete,
  onToggleSelect,
  onLongPress
}: TaskItemProps) {
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)

  const clearLongPress = useCallback(() => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current)
      longPressTimeoutRef.current = null
    }
  }, [])

  const handlePointerDown = () => {
    clearLongPress()
    longPressTriggeredRef.current = false
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      onLongPress()
    }, 450)
  }

  useEffect(() => {
    clearLongPress()
    return () => {
      clearLongPress()
    }
  }, [clearLongPress, isSelectMode, isSelected])

  const handleClick = () => {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }

    if (isSelectMode) {
      onToggleSelect()
      return
    }

    onToggleComplete()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter') handleClick()
        if (event.key === ' ') {
          event.preventDefault()
          handleClick()
        }
      }}
      className={`flex items-start p-5 rounded-2xl border shadow-sm transition-all cursor-pointer active:scale-[0.99] ${
        isSelected ? 'bg-gray-50 border-gray-200 ring-1 ring-black/5' : 'bg-white border-gray-100'
      }`}
    >
      <div className={`mt-1 mr-4 ${task.completed ? 'text-green-500' : 'text-gray-300'}`}>
        {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <TaskPriorityDot priority={task.priority} />
          <span className={`text-lg font-medium ${task.completed ? 'text-gray-300 line-through' : 'text-gray-700'}`}>
            {task.title}
          </span>
        </div>
        {(dueDateLabel || timestampLabel) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {dueDateLabel && <span>Due {dueDateLabel}</span>}
            {timestampLabel && <span>{timestampLabel}</span>}
          </div>
        )}
      </div>
      {isSelectMode && (
        <div className={`ml-3 mt-2 h-5 w-5 rounded-full border ${isSelected ? 'bg-black border-black' : 'border-gray-300'}`} />
      )}
    </div>
  )
}
