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
import { useAuthStore } from '../../store';
import { colors, font, spacing, radius, shadows } from '../../theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type FormValues = yup.InferType<typeof schema>;

export default function Login({ navigation }: any) {
  const { login } = useAuthStore();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: yupResolver(schema),
      defaultValues: { email: '', password: '' },
    });

  const onSubmit = async (values: FormValues) => {
    setAuthError(null);
    try {
      await login({ email: values.email.trim(), password: values.password });
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 403 && /not verified/i.test(message || '')) {
        navigation.navigate('VerifyEmail', { email: values.email.trim() });
        return;
      }
      if (status === 403 && /suspended/i.test(message || '')) {
        setAuthError('Account suspended. Contact support for assistance.');
        return;
      }
      setAuthError(message || 'Check your email and password.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>KENYA IS CLOSER THAN YOU THINK</Text>
            <Text style={styles.heroTitle}>
              Discover the{'\n'}
              <Text style={styles.heroAccent}>Extraordinary</Text>
            </Text>
            <Text style={styles.heroBody}>
              Find stays, experiences and journeys across Kenya. Sign in to pick up where your next adventure begins.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSubtitle}>Sign in to your DigitalSafaris account.</Text>

            {authError ? (
              <Alert variant="danger" title="Sign-in unsuccessful" style={{ marginBottom: 12 }}>
                {authError}
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
                  autoComplete="email"
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
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  leftIcon={<Ionicons name="lock-closed-outline" size={16} color={colors.text.muted} />}
                  rightIcon={
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
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
                />
              )}
            />

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end', marginTop: -4 }}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.white} />}
              style={{ marginTop: 8 }}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary[800] },
  scroll: { flexGrow: 1, padding: spacing['2xl'], justifyContent: 'center' },
  hero: { marginBottom: spacing['2xl'], gap: spacing.sm },
  heroEyebrow: {
    color: colors.secondary[300],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  heroAccent: { color: colors.secondary[300] },
  heroBody: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: font.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing['2xl'],
    gap: spacing.md,
    ...shadows.elevated,
  },
  cardTitle: {
    fontSize: font.xl,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  cardSubtitle: { fontSize: font.sm, color: colors.text.muted, marginBottom: spacing.sm },
  link: { color: colors.secondary[600], fontSize: font.sm, fontWeight: '600' },
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