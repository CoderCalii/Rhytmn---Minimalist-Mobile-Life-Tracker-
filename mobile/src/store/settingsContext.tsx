/* eslint-disable react-refresh/only-export-components */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

type CurrencyCode = 'USD' | 'PHP';

type SettingsContextValue = {
  currencyCode: CurrencyCode;
  setCurrencyCode: (value: CurrencyCode) => void;
  loading: boolean;
};

const STORAGE_KEY = 'settings.currencyCode';

const SettingsContext = createContext<SettingsContextValue | null>(null);

const readStoredCurrency = async (): Promise<CurrencyCode> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'PHP' ? 'PHP' : 'USD';
  } catch {
    return 'USD';
  }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      if (!user) {
        const stored = await readStoredCurrency();
        if (!isMounted) return;
        setCurrencyCode(stored);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('currency_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        const stored = await readStoredCurrency();
        if (!isMounted) return;
        setCurrencyCode(stored);
      } else {
        setCurrencyCode(data?.currency_code === 'PHP' ? 'PHP' : 'USD');
      }
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, currencyCode);
      } catch {
        // Ignore persistence failures.
      }
    };

    persist();
  }, [currencyCode]);

  useEffect(() => {
    if (!user || loading) return;
    supabase
      .from('user_settings')
      .upsert({ user_id: user.id, currency_code: currencyCode }, { onConflict: 'user_id' });
  }, [currencyCode, loading, user]);

  const value = useMemo(() => ({ currencyCode, setCurrencyCode, loading }), [currencyCode, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
};
