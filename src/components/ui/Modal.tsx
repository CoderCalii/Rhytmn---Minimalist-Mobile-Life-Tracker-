import type { ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label="Close" />
      {children}
    </div>
  )
}
