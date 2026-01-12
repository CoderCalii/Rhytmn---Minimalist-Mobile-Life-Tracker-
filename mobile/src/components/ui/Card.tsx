import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';

type CardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  blurIntensity?: number;
  blurTint?: 'light' | 'dark' | 'default';
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  elevation?: number;
};

export function Card({
  children,
  className,
  blurIntensity = 0,
  blurTint = 'light',
  shadowColor = '#0f172a',
  shadowOpacity = 0.2,
  shadowRadius = 18,
  shadowOffsetX = 0,
  shadowOffsetY = 12,
  elevation = 8,
  style,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      className={`overflow-hidden ${className ?? ''}`.trim()}
      style={[
        {
          shadowColor,
          shadowOpacity,
          shadowRadius,
          shadowOffset: { width: shadowOffsetX, height: shadowOffsetY },
          elevation
        },
        style
      ]}
    >
      {blurIntensity > 0 ? (
        <BlurView intensity={blurIntensity} tint={blurTint} className="absolute inset-0" pointerEvents="none" />
      ) : null}
      {children}
    </View>
  );
}
