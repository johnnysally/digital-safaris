import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, font, radius, spacing } from '../../theme';

type Variant = 'success' | 'warning' | 'danger' | 'info';

export interface AlertProps {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const COLORS: Record<Variant, { border: string; bg: string; fg: string }> = {
  success: { border: 'rgba(34,197,94,0.35)', bg: 'rgba(34,197,94,0.08)', fg: '#15803D' },
  warning: { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)', fg: '#B45309' },
  danger: { border: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.08)', fg: '#B91C1C' },
  info: { border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.08)', fg: '#1D4ED8' },
};

export default function Alert({ variant = 'info', title, children, style }: AlertProps) {
  const c = COLORS[variant];
  return (
    <View style={[styles.wrap, { borderColor: c.border, backgroundColor: c.bg }, style]}>
      <View style={{ flex: 1 }}>
        {title ? <Text style={[styles.title, { color: c.fg }]}>{title}</Text> : null}
        {children ? (
          <View style={title ? { marginTop: 4 } : undefined}>
            {typeof children === 'string' ? (
              <Text style={[styles.body, { color: c.fg }]}>{children}</Text>
            ) : (
              children
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  title: { fontSize: font.sm, fontWeight: '700' },
  body: { fontSize: font.sm, lineHeight: 20 },
});