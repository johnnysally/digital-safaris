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
});

type FormValues = yup.InferType<typeof schema>;

export default function ForgotPassword({ navigation }: any) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: { email: '' },
    });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await authApi.forgotPassword({ email: values.email.trim().toLowerCase() });
      setSent(true);
    } catch {
      setError('Could not send reset code. Please try again.');
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
            <View style={styles.iconWrap}>
              <Ionicons name="key-outline" size={28} color={colors.secondary[600]} />
            </View>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              {sent
                ? 'We sent a 6-digit code to your email.'
                : "We'll send a code to your email."}
            </Text>

            {error ? (
              <Alert variant="danger" title="Could not send code" style={{ marginBottom: 12 }}>
                {error}
              </Alert>
            ) : null}

            {!sent ? (
              <>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      leftIcon={<Ionicons name="mail-outline" size={16} color={colors.text.muted} />}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                    />
                  )}
                />
                <Button
                  title="Send reset code"
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  fullWidth
                />
              </>
            ) : (
              <Button
                title="Enter reset code"
                onPress={() =>
                  navigation.navigate('ResetPassword', {
                    email: getValues('email').trim().toLowerCase(),
                  })
                }
                fullWidth
              />
            )}
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
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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