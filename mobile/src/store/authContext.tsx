import type { ReactNode } from 'react';
import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ value, children }: { value: AuthContextValue; children: ReactNode }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);
