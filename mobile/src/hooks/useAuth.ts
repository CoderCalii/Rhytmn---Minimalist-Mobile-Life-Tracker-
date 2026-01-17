import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // If Supabase is not configured, skip auth and set loading to false
    if (!isSupabaseConfigured) {
      setTimeout(() => {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }, 0);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('[useAuth] Failed to get session:', err);
      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
