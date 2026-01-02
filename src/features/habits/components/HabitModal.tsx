import type { ReactNode } from 'react'

type HabitModalProps = {
  open: boolean
  children: ReactNode
}

export function HabitModal({ open, children }: HabitModalProps) {
  if (!open) return null
  return <div>{children}</div>
}
