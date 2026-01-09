import { useCallback, useMemo, useState } from 'react'

export function useTaskSelection() {
  const [selectMode, setSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

  const selectedIds = useMemo(() => Array.from(selectedTaskIds), [selectedTaskIds])

  const toggleSelection = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const enterSelectMode = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      if (selectMode) {
        const next = new Set(prev)
        if (next.has(taskId)) {
          next.delete(taskId)
        } else {
          next.add(taskId)
        }
        return next
      }
      return new Set([taskId])
    })

    if (!selectMode) {
      setSelectMode(true)
    }
  }, [selectMode])

  const exitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedTaskIds(new Set())
  }, [])

  return {
    selectMode,
    selectedTaskIds,
    selectedIds,
    enterSelectMode,
    toggleSelection,
    exitSelectMode
  }
}
