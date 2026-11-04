import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radius, font } from '../../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, helper, leftIcon, rightIcon, style, containerStyle, ...rest }, ref) => (
    <View style={[{ gap: 4 }, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.wrap}>
        {leftIcon ? <View style={styles.left}>{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.text.muted}
          {...rest}
          style={[
            styles.input,
            error ? styles.inputError : null,
            leftIcon ? { paddingLeft: 36 } : null,
            rightIcon ? { paddingRight: 36 } : null,
            style,
          ]}
        />
        {rightIcon ? <View style={styles.right}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
    </View>
  )
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  label: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  wrap: { position: 'relative', justifyContent: 'center' },
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
  inputError: { borderColor: colors.danger },
  left: { position: 'absolute', left: 12, zIndex: 1 },
  right: { position: 'absolute', right: 12, zIndex: 1 },
  error: { fontSize: font.xs, color: colors.danger, fontWeight: '500' },
  helper: { fontSize: font.xs, color: colors.text.muted },
});