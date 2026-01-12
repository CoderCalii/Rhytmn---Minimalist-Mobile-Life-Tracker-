import type { TodoContent } from '../types';

export const getTodoCompleted = (content: TodoContent) => {
  if (typeof content.completed === 'boolean') return content.completed;
  if (typeof content.done === 'boolean') return content.done;
  return false;
};
