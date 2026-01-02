import type { HTMLAttributes, ReactNode } from 'react'

type NavigationProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function Navigation({ children, ...props }: NavigationProps) {
  return <nav {...props}>{children}</nav>
}
