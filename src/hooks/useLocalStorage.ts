import { useEffect, useState } from 'react'
import { assertValidStoredData } from '../utils/storageGuards'

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T
) {
  // Only store validated domain data in localStorage.
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    const stored = window.localStorage.getItem(key)
    if (!stored) return initialValue
    const parsed = JSON.parse(stored) as unknown
    return validator ? assertValidStoredData(parsed, validator) : (parsed as T)
  })

  useEffect(() => {
    const safeValue = validator ? assertValidStoredData(value, validator) : value
    window.localStorage.setItem(key, JSON.stringify(safeValue))
  }, [key, value, validator])

  return [value, setValue] as const
}
