import type { ReactNode } from 'react'
import { createContext } from 'react'
import type { AuthContext } from '../types/auth'

export const AuthCtx = createContext<AuthContext | null>(null)

export const AuthProvider = ({ value, children }: { value: AuthContext; children: ReactNode }) => (
  <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
)

