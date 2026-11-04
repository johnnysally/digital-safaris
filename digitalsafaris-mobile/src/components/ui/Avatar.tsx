import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { colors, font } from '../../theme';

type Size = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: Size;
}

const SIZES: Record<Size, { d: number; fs: number }> = {
  sm: { d: 32, fs: font.xs },
  md: { d: 40, fs: font.sm },
  lg: { d: 56, fs: font.md },
};

const initials = (name?: string) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
};

export default function Avatar({ src, fallback, size = 'md' }: AvatarProps) {
  const s = SIZES[size];
  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: s.d, height: s.d, borderRadius: s.d / 2 }}
      />
    );
  }
  return (
    <View style={[styles.fallback, { width: s.d, height: s.d, borderRadius: s.d / 2 }]}>
      <Text style={[styles.text, { fontSize: s.fs }]}>{initials(fallback)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.primary[800], fontWeight: '600' },
});