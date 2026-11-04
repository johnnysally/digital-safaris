import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing } from '../../theme';
import Screen from '../../components/layout/Screen';
import Button from '../../components/ui/Button';

export interface ComingSoonProps {
  title?: string;
  description?: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function ComingSoon({
  title = 'Coming soon',
  description = 'This page is under construction. Check back shortly.',
  backLabel = 'Back',
  onBack,
}: ComingSoonProps) {
  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct" size={28} color={colors.secondary[600]} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{description}</Text>
        {onBack ? (
          <Button
            title={backLabel}
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={onBack}
            style={{ marginTop: spacing.lg }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});