export const getTodoCompleted = (content: { completed?: boolean; done?: boolean }) => {
  if (typeof content.completed === 'boolean') return content.completed;
  if (typeof content.done === 'boolean') return content.done;
  return false;
};
