import type { ReactNode } from 'react'

type AccountCardProps = {
  title: string
  balance: string
  icon?: ReactNode
  onAdd?: () => void
}

export function AccountCard({ title, balance, icon, onAdd }: AccountCardProps) {
  return (
    <div>
      <div>
        <span>{title}</span>
        {icon}
      </div>
      <strong>{balance}</strong>
      {onAdd && (
        <button type="button" onClick={onAdd}>
          Add
        </button>
      )}
    </div>
  )
}
