import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text } from 'react-native';

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
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      const prefersReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
      if (!isActive) return;
      if (prefersReducedMotion) {
        previousValueRef.current = value;
        setDisplayValue(value);
        return;
      }

      const startValue = previousValueRef.current;
      const delta = value - startValue;
      if (delta === 0) {
        setDisplayValue(value);
        return;
      }

      const duration = clampDuration(durationMs);
      const start = Date.now();

      const step = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        setDisplayValue(startValue + delta * progress);
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          previousValueRef.current = value;
        }
      };

      rafRef.current = requestAnimationFrame(step);
    };

    run();

    return () => {
      isActive = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, durationMs]);

  return <Text className={className}>{format(displayValue)}</Text>;
};

export default AnimatedNumber;
