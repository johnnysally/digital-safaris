import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, radius, font } from '../../theme';

export interface CheckboxProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  error,
  disabled = false,
}: CheckboxProps) {
  return (
    <View style={{ gap: 4 }}>
      <Pressable
        onPress={() => !disabled && onChange(!checked)}
        style={styles.row}
        disabled={disabled}
      >
        <View
          style={[
            styles.box,
            checked && { backgroundColor: colors.secondary[500], borderColor: colors.secondary[500] },
            disabled && { opacity: 0.5 },
          ]}
        >
          {checked ? <Text style={styles.check}>✓</Text> : null}
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: -2 },
  label: { fontSize: font.sm, color: colors.text.primary },
  error: { fontSize: font.xs, color: colors.danger },
});