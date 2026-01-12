import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { assertValidStoredData } from '../utils/storageGuards';

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T
) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!stored) {
          if (isMounted) setReady(true);
          return;
        }
        const parsed = JSON.parse(stored) as unknown;
        const safeValue = validator ? assertValidStoredData(parsed, validator) : (parsed as T);
        if (isMounted) {
          setValue(safeValue);
          setReady(true);
        }
      } catch {
        if (isMounted) setReady(true);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [key, validator]);

  useEffect(() => {
    if (!ready) return;
    const persist = async () => {
      const safeValue = validator ? assertValidStoredData(value, validator) : value;
      try {
        await AsyncStorage.setItem(key, JSON.stringify(safeValue));
      } catch {
        // Ignore persistence failures.
      }
    };

    persist();
  }, [key, ready, validator, value]);

  return [value, setValue] as const;
}
