/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTasksInternal, type TaskRow } from '../features/tasks/components/useTasks';

type TasksContextValue = ReturnType<typeof useTasksInternal>;

const TasksContext = createContext<TasksContextValue | null>(null);

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const userId = user ? user.id : null;
  const value = useTasksInternal(userId);

  // Merge auth loading into tasks loading so consumers can treat it as one
  const merged: TasksContextValue = {
    ...value,
    loading: authLoading || value.loading
  };

  return <TasksContext.Provider value={merged}>{children}</TasksContext.Provider>;
};

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return ctx;
}

export type { TaskRow };


