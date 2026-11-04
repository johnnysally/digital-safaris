import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing, radius } from '../../theme';
import Screen from '../../components/layout/Screen';
import Button from '../../components/ui/Button';

export default function NotFound({ navigation }: any) {
  return (
    <Screen padded={false}>
      <View style={styles.wrap}>
        <View style={styles.iconWrap}>
          <Ionicons name="compass" size={28} color={colors.secondary[600]} />
        </View>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        {navigation ? (
          <Button
            title="Back to home"
            leftIcon={<Ionicons name="home" size={16} color={colors.white} />}
            onPress={() => navigation.navigate('HomeTab')}
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
  code: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.secondary[500],
    letterSpacing: -1,
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.text.muted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});