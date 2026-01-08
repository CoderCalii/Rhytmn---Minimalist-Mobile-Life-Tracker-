import { TaskSearchBar } from './TaskSearchBar'

export function TasksHeader() {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="px-6 pt-12 pb-6 sticky top-0 bg-white/80 backdrop-blur-md z-[60]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-black whitespace-nowrap">To-Do</h1>
          <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">{today}</p>
        </div>
      </div>
    </div>
  )
}
