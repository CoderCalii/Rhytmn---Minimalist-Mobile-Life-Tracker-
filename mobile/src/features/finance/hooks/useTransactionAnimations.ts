import { useEffect, useRef, useState } from 'react';
import type { ActivityTransaction } from '../types';

const useTransactionAnimations = (transactions: ActivityTransaction[]) => {
  const [animatedTransactionIds, setAnimatedTransactionIds] = useState<string[]>([]);
  const previousTransactionIdsRef = useRef<string[]>([]);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const previous = previousTransactionIdsRef.current;
    const next = transactions.map((transaction) => transaction.id);
    const newIds = next.filter((id) => !previous.includes(id));
    previousTransactionIdsRef.current = next;
    if (newIds.length > 0) {
      const addTimeout = setTimeout(() => {
        setAnimatedTransactionIds((current) => Array.from(new Set([...current, ...newIds])));
      }, 0);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = setTimeout(() => {
        setAnimatedTransactionIds((current) => current.filter((id) => !newIds.includes(id)));
      }, 420);
      return () => {
        clearTimeout(addTimeout);
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }
  }, [transactions]);

  return { animatedTransactionIds };
};

export default useTransactionAnimations;
