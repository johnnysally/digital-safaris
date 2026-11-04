import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api';
import { colors, font, spacing, radius, shadows } from '../../theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const schema = yup.object({
  firstName: yup.string().trim().required('First name is required'),
  lastName: yup.string().trim().required('Last name is required'),
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  phone: yup
    .string()
    .trim()
    .matches(/^(\+?254|0)?[17]\d{8}$/, 'Enter a valid Kenyan number')
    .required('Phone is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  town: yup.string(),
});

type FormValues = yup.InferType<typeof schema>;

export default function Register({ navigation }: any) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        town: '',
      },
    });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await authApi.register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        town: values.town?.trim() || undefined,
      });
      navigation.navigate('VerifyEmail', {
        email: values.email.trim().toLowerCase(),
      });
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || 'Please check your details.'
      );
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSubtitle}>
              Join DigitalSafaris and start exploring.
            </Text>

            {submitError ? (
              <Alert
                variant="danger"
                title="Account creation failed"
                style={{ marginBottom: 12 }}
              >
                {submitError}
              </Alert>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="First name"
                      placeholder="Amina"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.firstName?.message}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Last name"
                      placeholder="Wanjiku"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.lastName?.message}
                    />
                  )}
                />
              </View>
            </View>

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
                  leftIcon={
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={colors.text.muted}
                    />
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone"
                  placeholder="254712345678"
                  keyboardType="phone-pad"
                  leftIcon={
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={colors.text.muted}
                    />
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  helper="Use 254712345678 or 0712345678"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  leftIcon={
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={colors.text.muted}
                    />
                  }
                  rightIcon={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.text.muted}
                      />
                    </Pressable>
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  helper="At least 6 characters"
                />
              )}
            />

            <Controller
              control={control}
              name="town"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Town (optional)"
                  placeholder="e.g. Nairobi"
                  leftIcon={
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.text.muted}
                    />
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.town?.message}
                />
              )}
            />

            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              rightIcon={
                <Ionicons name="arrow-forward" size={16} color={colors.white} />
              }
              style={{ marginTop: 8 }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Sign in</Text>
              </Pressable>
            </View>
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
    ...shadows.card,
  },
  cardTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: font.sm,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  link: {
    color: colors.secondary[600],
    fontSize: font.sm,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: font.sm, color: colors.text.muted },
});