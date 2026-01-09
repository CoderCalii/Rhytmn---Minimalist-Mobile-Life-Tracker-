import type { ReactNode } from 'react'
import { Clock, Pin } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface NoteCardProps {
  title: string
  icon: ReactNode
  timestamp: string
  content: string
  isPinned: boolean
  onSelect: () => void
}

export function NoteCard({ title, icon, timestamp, content, isPinned, onSelect }: NoteCardProps) {
  return (
    <div 
      onClick={onSelect}
      className="p-5 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-gray-100 transition-colors cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-bold text-gray-800">{title}</h3>
          {isPinned && <Pin size={12} className="text-gray-400" />}
        </div>
        {timestamp && (
          <span className="text-[10px] text-gray-400 font-medium flex items-center">
            <Clock size={10} className="mr-1" /> {timestamp}
          </span>
        )}
      </div>
      {content && (
        <div className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
