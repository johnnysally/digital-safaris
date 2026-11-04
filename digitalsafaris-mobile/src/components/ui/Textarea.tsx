import React, { forwardRef } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, font } from '../../theme';

export interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  rows?: number;
}

const Textarea = forwardRef<TextInput, TextareaProps>(
  ({ label, error, helper, rows = 4, style, ...rest }, ref) => (
    <View style={{ gap: 4 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        ref={ref}
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.text.muted}
        {...rest}
        style={[
          styles.input,
          { minHeight: 22 * rows },
          error ? { borderColor: colors.danger } : null,
          style,
        ]}
      />
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  )
);

Textarea.displayName = 'Textarea';

export default Textarea;

const styles = StyleSheet.create({
  label: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: font.sm,
    color: colors.text.primary,
  },
  error: { fontSize: font.xs, color: colors.danger, fontWeight: '500' },
  helper: { fontSize: font.xs, color: colors.text.muted },
});