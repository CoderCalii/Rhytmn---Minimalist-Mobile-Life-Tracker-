import { useRef } from 'react';
import type { MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { DashboardCardId } from '../types';
import { triggerHaptic } from '../utils/financeUi';

type DashboardCardShellProps = {
  id: DashboardCardId;
  children: ReactNode;
  onLongPress?: (id: DashboardCardId) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDragStart?: (id: DashboardCardId) => void;
  onDrop?: (id: DashboardCardId) => void;
  onDragEnd?: () => void;
};

const DashboardCardShell = ({
  id,
  children,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onDragStart,
  onDrop,
  onDragEnd
}: DashboardCardShellProps) => {
  const startPointRef = useRef<{ x: number; y: number; swiped: boolean } | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  const clearLongPress = () => {
    if (longPressTimeoutRef.current) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClickRef.current = false;
    startPointRef.current = { x: event.clientX, y: event.clientY, swiped: false };
    if (onLongPress) {
      clearLongPress();
      longPressTimeoutRef.current = window.setTimeout(() => {
        suppressClickRef.current = true;
        triggerHaptic();
        onLongPress(id);
      }, 420);
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!startPointRef.current) return;
    const dx = event.clientX - startPointRef.current.x;
    const dy = event.clientY - startPointRef.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      clearLongPress();
    }
    if (startPointRef.current.swiped) return;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      startPointRef.current.swiped = true;
      suppressClickRef.current = true;
      triggerHaptic();
      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }
  };

  const handlePointerUp = () => {
    clearLongPress();
    startPointRef.current = null;
  };

  const handlePointerCancel = () => {
    clearLongPress();
    startPointRef.current = null;
  };

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  return (
    <section
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
        onDragStart?.(id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.(id);
      }}
      onDragEnd={onDragEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      className="touch-pan-y"
    >
      {children}
    </section>
  );
};

export default DashboardCardShell;
