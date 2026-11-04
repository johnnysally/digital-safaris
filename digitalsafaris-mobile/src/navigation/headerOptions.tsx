import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, font } from '../theme';

export const defaultHeaderOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTintColor: colors.text.primary,
  headerTitleStyle: {
    fontSize: font.md,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  headerBackTitle: 'Back',
  headerShadowVisible: false,
};

export function NotificationBell() {
  const nav = useNavigation<any>();
  return (
    <Pressable
      onPress={() => nav.navigate('ProfileTab', { screen: 'Notifications' })}
      style={{ marginRight: 16 }}
      hitSlop={10}
    >
      <Ionicons
        name="notifications-outline"
        size={22}
        color={colors.text.secondary}
      />
    </Pressable>
  );
}