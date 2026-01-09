interface NoteFiltersProps {
  filters: string[]
  activeFilter: string
  onChange: (value: string) => void
}

export function NoteFilters({ filters, activeFilter, onChange }: NoteFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => onChange(filter)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
            activeFilter === filter ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  )
}
