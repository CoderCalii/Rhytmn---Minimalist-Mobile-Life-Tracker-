import { useEffect, useRef, useState } from 'react';

type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  durationMs?: number;
  className?: string;
};

const clampDuration = (value: number) => Math.min(Math.max(value, 120), 240);

const AnimatedNumber = ({ value, format, durationMs = 220, className }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      previousValueRef.current = value;
      // Use setTimeout to avoid synchronous setState warning
      setTimeout(() => {
        setDisplayValue(value);
      }, 0);
      return;
    }

    const startValue = previousValueRef.current;
    const delta = value - startValue;
    if (delta === 0) {
      setTimeout(() => {
        setDisplayValue(value);
      }, 0);
      return;
    }

    const duration = clampDuration(durationMs);
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(startValue + delta * progress);
      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(step);
      } else {
        previousValueRef.current = value;
      }
    };

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, durationMs]);

  return <span className={className}>{format(displayValue)}</span>;
};

export default AnimatedNumber;
