import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, font } from '../../theme';

type Size = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const WIDTH: Record<Size, number> = {
  sm: 340,
  md: 420,
  lg: 560,
};

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  footer,
  children,
}: ModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />

        <View
          style={[
            styles.panel,
            {
              width: Math.min(SCREEN_W - 32, WIDTH[size]),
              maxHeight: SCREEN_H - insets.top - insets.bottom - 48,
            },
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
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'column',
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});