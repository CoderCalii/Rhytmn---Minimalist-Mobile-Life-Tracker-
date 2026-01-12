import { cloneElement, isValidElement, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { formatCurrency } from '../../../utils/formatters';
import type { ActivityTransaction } from '../types';
import { triggerHaptic } from '../utils/financeUi';
import TransactionIcon from './TransactionIcon';

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: (_, gestureState) => {
        startRef.current = { x: gestureState.x0, y: gestureState.y0 };
        triggeredRef.current = false;
        setAction(null);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const clamped = Math.max(Math.min(dx, 90), -90);
        setOffset(clamped);
        if (!triggeredRef.current && Math.abs(dx) > 60) {
          triggeredRef.current = true;
          triggerHaptic();
          setAction(dx > 0 ? 'categorize' : 'delete');
        }
      },
      onPanResponderRelease: () => {
        if (action === 'delete') onDelete(transaction);
        if (action === 'categorize') onCategorize(transaction);
        reset();
      },
      onPanResponderTerminate: reset
    })
  ).current;

  const backgroundTone =
    action === 'delete'
      ? 'bg-rose-500/90 justify-end'
      : action === 'categorize'
        ? 'bg-emerald-500/90 justify-start'
        : 'bg-transparent';

  const fallbackIcon = transaction.iconName ?? 'wallet';
  const iconTone = transaction.type === 'income' ? '#059669' : '#64748b';
  const resolvedIcon = isValidElement(transaction.icon)
    ? cloneElement(
        transaction.icon as React.ReactElement<{ color?: string; size?: number }>,
        {
          color: transaction.icon.props?.color ?? iconTone,
          size: transaction.icon.props?.size ?? 16
        }
      )
    : null;

  return (
    <View className="relative">
      <View className={`absolute inset-0 flex-row items-center rounded-2xl px-4 ${backgroundTone}`}>
        <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
          {action === 'delete' ? 'Delete' : action === 'categorize' ? 'Categorize' : ''}
        </Text>
      </View>
      <View
        className={`flex-row items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm border border-slate-100 ${
          isNew ? 'mt-2' : ''
        }`}
        style={{ transform: [{ translateX: offset }] }}
        {...panResponder.panHandlers}
      >
        <View className="flex-row items-center">
          <View
            className={`w-14 h-14 rounded-3xl items-center justify-center ${
              transaction.type === 'income' ? 'bg-emerald-50' : 'bg-slate-50'
            }`}
          >
            {resolvedIcon ? (
              resolvedIcon
            ) : (
              <TransactionIcon
                name={fallbackIcon}
                size={16}
                color={iconTone}
              />
            )}
          </View>
          <View className="ml-4">
            <Text className="font-bold text-sm text-slate-900 tracking-tight">{transaction.title}</Text>
            <Text className="text-[11px] text-slate-500 font-semibold uppercase tracking-tighter">
              {transaction.category}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-500' : 'text-slate-900'}`}>
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount, currencyCode)}
          </Text>
          {timeLabel ? (
            <Text className="text-[10px] text-slate-400 font-semibold uppercase tracking-tighter mt-0.5">
              {timeLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default SwipeableActivityRow;
