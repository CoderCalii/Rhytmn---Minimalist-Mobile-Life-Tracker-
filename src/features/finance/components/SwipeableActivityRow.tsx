import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import type { ActivityTransaction } from '../types';
import { triggerHaptic } from '../utils/financeUi';

type SwipeableActivityRowProps = {
  transaction: ActivityTransaction;
  currencyCode: 'USD' | 'PHP';
  onDelete: (transaction: ActivityTransaction) => void;
  onCategorize: (transaction: ActivityTransaction) => void;
  timeLabel?: string | null;
  isNew?: boolean;
};

const SwipeableActivityRow = ({
  transaction,
  currencyCode,
  onDelete,
  onCategorize,
  timeLabel,
  isNew = false
}: SwipeableActivityRowProps) => {
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState<'delete' | 'categorize' | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const reset = () => {
    setOffset(0);
    setAction(null);
    startRef.current = null;
    triggeredRef.current = false;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    startRef.current = { x: event.clientX, y: event.clientY };
    triggeredRef.current = false;
    setAction(null);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dx = event.clientX - startRef.current.x;
    const dy = event.clientY - startRef.current.y;
    if (Math.abs(dx) < Math.abs(dy)) return;
    const clamped = Math.max(Math.min(dx, 90), -90);
    setOffset(clamped);
    if (!triggeredRef.current && Math.abs(dx) > 60) {
      triggeredRef.current = true;
      triggerHaptic();
      setAction(dx > 0 ? 'categorize' : 'delete');
    }
  };

  const handlePointerUp = () => {
    if (action === 'delete') onDelete(transaction);
    if (action === 'categorize') onCategorize(transaction);
    reset();
  };

  const handlePointerCancel = () => {
    reset();
  };

  const backgroundTone =
    action === 'delete'
      ? 'bg-rose-500/90 justify-end'
      : action === 'categorize'
        ? 'bg-emerald-500/90 justify-start'
        : 'bg-transparent';

  return (
    <div className="relative">
      <div
        className={`absolute inset-0 flex items-center rounded-2xl px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white ${backgroundTone}`}
      >
        {action === 'delete' ? 'Delete' : action === 'categorize' ? 'Categorize' : ''}
      </div>
      <div
        className={`group flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100/80 transition-all touch-pan-y ${
          isNew ? 'animate-in slide-in-from-top-2 duration-200' : ''
        }`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-14 h-14 rounded-3xl flex items-center justify-center transition-all ${
              transaction.type === 'income'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'
            }`}
          >
            {transaction.icon}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 tracking-tight">{transaction.title}</h4>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-tighter">
              {transaction.category}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount, currencyCode)}
          </p>
          {timeLabel && (
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-0.5">
              {timeLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeableActivityRow;
