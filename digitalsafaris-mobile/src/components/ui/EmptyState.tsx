import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, spacing } from '../../theme';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {action ? <View style={{ marginTop: spacing.lg }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  icon: { marginBottom: spacing.md, opacity: 0.6 },
  title: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  desc: {
    marginTop: 4,
    fontSize: font.xs,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
});