import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { colors, radius, font, spacing } from '../../theme';

export interface Option {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  error,
  helper,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={[
          styles.field,
          error && { borderColor: colors.danger },
          disabled && { opacity: 0.5 },
        ]}
      >
        <Text style={current ? styles.valueText : styles.placeholder}>
          {current?.label ?? placeholder}
        </Text>
        <Text style={{ color: colors.text.muted }}>▾</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : helper ? <Text style={styles.helper}>{helper}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  style={styles.option}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === value ? <Text style={{ color: colors.secondary[600] }}>✓</Text> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  valueText: { fontSize: font.sm, color: colors.text.primary },
  placeholder: { fontSize: font.sm, color: colors.text.muted },
  error: { fontSize: font.xs, color: colors.danger },
  helper: { fontSize: font.xs, color: colors.text.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: 400,
    padding: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: { fontSize: font.sm, color: colors.text.primary },
});