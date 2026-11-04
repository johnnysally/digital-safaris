import React from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  StatusBar,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export interface ScreenProps {
  children?: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  background?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
}

export default function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['left', 'right', 'bottom'],
  background = colors.background,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: ScreenProps) {
  const inner = padded ? { padding: spacing.lg } : undefined;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: background }, style]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={background} />
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[inner, contentContainerStyle]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});