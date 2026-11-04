import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, font, spacing, shadows } from '../../theme';

export interface DropdownItem {
  key: string;
  label: string;
  onPress?: () => void;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setOpen((v) => !v)}>{trigger}</Pressable>
      {open ? (
        <View
          style={[
            styles.menu,
            align === 'right' ? { right: 0 } : { left: 0 },
          ]}
        >
          {items.map((item) => (
            <Pressable
              key={item.key}
              disabled={item.disabled}
              onPress={() => {
                if (item.disabled) return;
                setOpen(false);
                (item.onPress ?? item.onClick)?.();
              }}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' },
                item.disabled && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.itemText, item.danger && { color: colors.danger }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    minWidth: 180,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 4,
    zIndex: 100,
    ...shadows.card,
  },
  item: { paddingVertical: 10, paddingHorizontal: spacing.md },
  itemText: { fontSize: font.sm, color: colors.text.primary },
});