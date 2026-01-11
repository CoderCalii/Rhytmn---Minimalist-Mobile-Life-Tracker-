import { useEffect, useRef, useState } from 'react';
import type { ActivityTransaction } from '../types';

const useTransactionAnimations = (transactions: ActivityTransaction[]) => {
  const [animatedTransactionIds, setAnimatedTransactionIds] = useState<string[]>([]);
  const previousTransactionIdsRef = useRef<string[]>([]);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const previous = previousTransactionIdsRef.current;
    const next = transactions.map((transaction) => transaction.id);
    const newIds = next.filter((id) => !previous.includes(id));
    if (newIds.length > 0) {
      setAnimatedTransactionIds((current) => Array.from(new Set([...current, ...newIds])));
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatedTransactionIds((current) => current.filter((id) => !newIds.includes(id)));
      }, 420);
    }
    previousTransactionIdsRef.current = next;
  }, [transactions]);

  return { animatedTransactionIds };
};

export default useTransactionAnimations;
