import { Calendar, Circle, Plus } from 'lucide-react'
import type { RefObject } from 'react'
import type { TaskPriority } from './TaskPriorityDot'

interface TaskCreatorProps {
  isAdding: boolean
  value: string
  dueDate: string
  priority: TaskPriority
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (value: string) => void
  onDueDateChange: (value: string) => void
  onPriorityChange: (value: TaskPriority) => void
  onStart: () => void
  onCancel: () => void
  onSubmit: () => void
  disabled?: boolean
  placeholder: string
}

const priorities: { label: string; value: TaskPriority }[] = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

export function TaskCreator({
  isAdding,
  value,
  dueDate,
  priority,
  inputRef,
  onChange,
  onDueDateChange,
  onPriorityChange,
  onStart,
  onCancel,
  onSubmit,
  disabled,
  placeholder
}: TaskCreatorProps) {
  if (!isAdding) {
    return (
      <button 
        onClick={onStart}
        className="w-full flex items-center p-5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 transition-all active:scale-[0.99]"
        disabled={disabled}
      >
        <Plus size={20} className="mr-3" />
        <span className="font-bold">Add something new to do here</span>
      </button>
    )
  }

  return (
    <div
      className="p-5 bg-white rounded-2xl border-2 border-black/10 shadow-sm animate-in fade-in zoom-in-95 duration-200"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node) && !value.trim()) {
          onCancel()
        }
      }}
    >
      <div className="flex items-center">
        <div className="mr-4 text-gray-300"><Circle size={24} /></div>
        <input
          ref={inputRef}
          className="flex-1 text-lg font-medium outline-none border-none p-0 focus:ring-0 bg-transparent"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit()
            if (event.key === 'Escape') onCancel()
          }}
          disabled={disabled}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
          <Calendar size={14} />
          <input
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            className="bg-transparent text-xs font-semibold text-gray-600 outline-none"
            disabled={disabled}
          />
        </label>
        <div className="flex items-center gap-2">
          {priorities.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriorityChange(option.value)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                priority === option.value ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'
              }`}
              disabled={disabled}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
