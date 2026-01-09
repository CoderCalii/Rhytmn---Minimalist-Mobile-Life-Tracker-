import { FileText, Plus, Tag, X } from 'lucide-react'

interface TaskNoteComposerProps {
  isAdding: boolean
  title: string
  body: string
  category: string
  categories: string[]
  isSaving: boolean
  disabled?: boolean
  onStart: () => void
  onCancel: () => void
  onSave: () => void
  onTitleChange: (value: string) => void
  onBodyChange: (value: string) => void
  onCategoryChange: (value: string) => void
}

export function TaskNoteComposer({
  isAdding,
  title,
  body,
  category,
  categories,
  isSaving,
  disabled,
  onStart,
  onCancel,
  onSave,
  onTitleChange,
  onBodyChange,
  onCategoryChange
}: TaskNoteComposerProps) {
  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="w-full flex items-center p-4 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl border border-dashed border-gray-100 transition-all active:scale-[0.99]"
      >
        <Plus size={18} className="mr-3" />
        <span className="text-xs font-bold uppercase tracking-widest">Add a quick note</span>
      </button>
    )
  }

  return (
    <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <FileText size={14} />
          Quick Note
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
          aria-label="Close note composer"
        >
          <X size={14} />
        </button>
      </div>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        disabled={disabled}
        className="w-full text-lg font-semibold border-none outline-none mb-4 placeholder:text-gray-200"
      />

      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
        <Tag size={14} className="text-gray-300 shrink-0" />
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange(item)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
              category === item ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'
            }`}
            disabled={disabled}
          >
            {item}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Write a note..."
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        disabled={disabled}
        className="w-full min-h-[120px] text-sm font-medium border-none outline-none resize-none bg-transparent leading-relaxed placeholder:text-gray-200"
      />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || isSaving || !body.trim()}
          className="text-[10px] font-bold uppercase tracking-widest text-white bg-black px-4 py-2 rounded-full disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
