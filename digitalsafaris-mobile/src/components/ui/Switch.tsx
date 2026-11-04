import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, font } from '../../theme';

export interface SwitchProps {
  value?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function Switch({
  value,
  checked,
  onChange,
  onValueChange,
  disabled = false,
  label,
  description,
}: SwitchProps) {
  const isOn = value ?? checked ?? false;
  const handle = () => {
    if (disabled) return;
    onChange?.(!isOn);
    onValueChange?.(!isOn);
  };

  return (
    <View style={styles.row}>
      {(label || description) && (
        <View style={{ flex: 1 }}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {description ? <Text style={styles.desc}>{description}</Text> : null}
        </View>
      )}
      <Pressable
        onPress={handle}
        disabled={disabled}
        style={[
          styles.track,
          { backgroundColor: isOn ? colors.secondary[500] : colors.primary[200] },
          disabled && { opacity: 0.5 },
        ]}
      >
        <View
          style={[
            styles.thumb,
            { transform: [{ translateX: isOn ? 20 : 2 }] },
          ]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  desc: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
});