import type { HTMLAttributes, ReactNode } from 'react'

type DeviceShellProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function DeviceShell({ children, ...props }: DeviceShellProps) {
  return <div {...props}>{children}</div>
}
