import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, radius, spacing, font, shadows } from '../../theme';

export interface CardProps {
  title?: string;
  actions?: React.ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export default function Card({
  title,
  actions,
  padded = true,
  style,
  children,
}: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {(title || actions) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {actions ? <View style={styles.row}>{actions}</View> : null}
        </View>
      )}
      <View style={padded ? { padding: spacing.lg } : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});