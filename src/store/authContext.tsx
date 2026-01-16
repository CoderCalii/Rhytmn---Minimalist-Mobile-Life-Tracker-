import type { ReactNode } from 'react'
import type { AuthContext } from '../types/auth'
import { AuthCtx } from './authContext'

export const AuthProvider = ({ value, children }: { value: AuthContext; children: ReactNode }) => (
  <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
)

