import type { ReactNode } from 'react'
import { createContext, useContext } from 'react'
import type { AuthContext } from '../types/auth'

const AuthCtx = createContext<AuthContext | null>(null)

export const AuthProvider = ({ value, children }: { value: AuthContext; children: ReactNode }) => (
  <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
)

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('Auth missing')
  return ctx
}
