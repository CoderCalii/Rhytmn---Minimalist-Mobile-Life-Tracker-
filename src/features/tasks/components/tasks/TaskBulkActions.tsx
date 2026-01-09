import { CheckCircle2, Archive, X } from 'lucide-react'

interface TaskBulkActionsProps {
  selectedCount: number
  onComplete: () => void
  onArchive: () => void
  onExit: () => void
}

export function TaskBulkActions({ selectedCount, onComplete, onArchive, onExit }: TaskBulkActionsProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-100">
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{selectedCount} selected</span>
      <div className="flex items-center gap-2">
        <button
          onClick={onComplete}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 py-2 rounded-full bg-white border border-gray-100"
        >
          <CheckCircle2 size={12} /> Complete
        </button>
        <button
          onClick={onArchive}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 py-2 rounded-full bg-white border border-gray-100"
        >
          <Archive size={12} /> Archive
        </button>
        <button
          onClick={onExit}
          className="p-2 rounded-full bg-white border border-gray-100 text-gray-500"
          aria-label="Exit select mode"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
