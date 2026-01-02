import type { ReactNode } from 'react'

type HeaderProps = {
  title: string
  subtitle?: string
  rightAction?: ReactNode
}

export function Header({ title, subtitle, rightAction }: HeaderProps) {
  return (
    <header>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {rightAction && <div>{rightAction}</div>}
    </header>
  )
}
