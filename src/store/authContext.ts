import { createContext } from 'react'
import type { AuthContext } from '../types/auth'

export const AuthCtx = createContext<AuthContext | null>(null)



