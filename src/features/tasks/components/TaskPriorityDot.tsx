export type TaskPriority = 'high' | 'medium' | 'low'

interface TaskPriorityDotProps {
  priority?: TaskPriority | null
}

const priorityStyles: Record<TaskPriority, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-sky-500'
}

export function TaskPriorityDot({ priority }: TaskPriorityDotProps) {
  const safePriority: TaskPriority = priority ?? 'medium'
  return <span className={`h-2.5 w-2.5 rounded-full ${priorityStyles[safePriority]}`} />
}
