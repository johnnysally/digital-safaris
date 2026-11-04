import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, font, radius } from '../../theme';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'secondary';

export interface BadgeProps {
  variant?: Variant;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const BG: Record<Variant, string> = {
  success: 'rgba(34,197,94,0.12)',
  warning: 'rgba(245,158,11,0.12)',
  danger: 'rgba(239,68,68,0.12)',
  info: 'rgba(59,130,246,0.12)',
  neutral: 'rgba(119,104,85,0.12)',
  secondary: 'rgba(189,120,31,0.12)',
};

const FG: Record<Variant, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
  neutral: colors.text.muted,
  secondary: colors.secondary[600],
};

export default function Badge({ variant = 'neutral', dot, style, children }: BadgeProps) {
  return (
    <View style={[styles.wrap, { backgroundColor: BG[variant] }, style]}>
      {dot ? <View style={[styles.dot, { backgroundColor: FG[variant] }]} /> : null}
      <Text style={[styles.text, { color: FG[variant] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: font.xs, fontWeight: '600' },
});