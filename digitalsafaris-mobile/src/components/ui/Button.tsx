import React from 'react';
import {
  Pressable,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, font } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const BG: Record<Variant, string> = {
  primary: colors.secondary[500],
  secondary: colors.primary[800],
  ghost: 'transparent',
  danger: colors.danger,
};

const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.white,
  ghost: colors.text.primary,
  danger: colors.white,
};

const PAD: Record<Size, { py: number; px: number; fs: number }> = {
  sm: { py: 8, px: 12, fs: font.xs },
  md: { py: 11, px: 16, fs: font.sm },
  lg: { py: 14, px: 22, fs: font.md },
};

export default function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const p = PAD[size];
  const isDisabled = disabled || loading;
  const label = title ?? (typeof children === 'string' ? children : null);

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: BG[variant],
          paddingVertical: p.py,
          paddingHorizontal: p.px,
          opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.border,
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={{ marginRight: 8 }}>{leftIcon}</View> : null}
          {label ? (
            <Text
              style={[
                { color: FG[variant], fontSize: p.fs, fontWeight: '600' },
                textStyle,
              ]}
            >
              {label}
            </Text>
          ) : (
            children
          )}
          {rightIcon ? <View style={{ marginLeft: 8 }}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});