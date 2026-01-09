import { Search } from 'lucide-react'

interface TaskSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function TaskSearchBar({ value, onChange }: TaskSearchBarProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
      <Search size={18} className="text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks and notes"
        className="bg-transparent text-xs font-semibold tracking-wide text-gray-600 placeholder:text-gray-400 outline-none w-36 sm:w-44"
      />
    </div>
  )
}
