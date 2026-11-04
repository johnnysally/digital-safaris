import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  otp: yup.string().matches(/^\d{6}$/, 'Enter the 6-digit code').required('Code is required'),
  newPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your password'),
});

type FormValues = yup.InferType<typeof schema>;

export default function ResetPassword({ navigation, route }: any) {
  const initialEmail = route?.params?.email ?? '';
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: { email: initialEmail, otp: '', newPassword: '', confirmPassword: '' },
    });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await authApi.resetPassword({
        email: values.email.trim().toLowerCase(),
        otp: values.otp,
        newPassword: values.newPassword,
      });
      navigation.navigate('Login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Check the code and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>Choose a new password</Text>
            <Text style={styles.subtitle}>
              Enter the code we sent you and pick a new password.
            </Text>

            {error ? (
              <Alert variant="danger" title="Reset failed" style={{ marginBottom: 12 }}>
                {error}
              </Alert>
            ) : null}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Ionicons name="mail-outline" size={16} color={colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="otp"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="6-digit code"
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  leftIcon={<Ionicons name="key-outline" size={16} color={colors.text.muted} />}
                  value={value}
                  onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                  onBlur={onBlur}
                  error={errors.otp?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New password"
                  placeholder="••••••••"
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={16} color={colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.newPassword?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm password"
                  placeholder="••••••••"
                  secureTextEntry
                  leftIcon={<Ionicons name="lock-closed-outline" size={16} color={colors.text.muted} />}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              title="Reset password"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: font.sm,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});