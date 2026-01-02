import type { ReactNode } from 'react'

type GoalTrackerProps = {
  title: string
  progressLabel: string
  progressPercent: number
  action?: ReactNode
}

export function GoalTracker({ title, progressLabel, progressPercent, action }: GoalTrackerProps) {
  return (
    <section>
      <div>
        <h3>{title}</h3>
        <span>{progressLabel}</span>
      </div>
      <div>
        <div style={{ width: `${progressPercent}%` }} />
      </div>
      {action}
    </section>
  )
}
