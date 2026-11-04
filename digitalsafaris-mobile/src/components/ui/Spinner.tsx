import React from 'react';
import { ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

type Size = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: Size;
  color?: string;
}

const MAP: Record<Size, 'small' | 'large'> = {
  sm: 'small',
  md: 'small',
  lg: 'large',
};

export default function Spinner({ size = 'md', color = colors.secondary[500] }: SpinnerProps) {
  return <ActivityIndicator size={MAP[size]} color={color} />;
}