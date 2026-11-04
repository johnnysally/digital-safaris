import React from 'react';
import {
  Modal, View, Text, Pressable, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, font } from '../../theme';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  side?: 'left' | 'right';
  children?: React.ReactNode;
}

const { width: SCREEN_W } = Dimensions.get('window');

export default function Drawer({
  isOpen,
  onClose,
  title,
  side = 'right',
  children,
}: DrawerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View
          style={[
            styles.panel,
            {
              width: Math.min(SCREEN_W * 0.92, 440),
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
            },
            side === 'right' ? styles.panelRight : styles.panelLeft,
          ]}
        >
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropPress: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.surface,
    flexDirection: 'column',
  },
  panelLeft: { alignSelf: 'flex-start' },
  panelRight: { alignSelf: 'flex-end' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: font.md,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  close: { fontSize: 20, color: colors.text.muted, paddingHorizontal: 4 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
});