import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';

type State = 'verifying' | 'success' | 'error' | 'pending';

export default function VerifyEmail({ navigation, route }: any) {
  const token = route?.params?.token;
  const initialEmail = route?.params?.email ?? '';

  const [state, setState] = useState<State>(token ? 'verifying' : 'pending');
  const [message, setMessage] = useState(
    token ? 'Verifying your email…' : 'Check your inbox to verify your account.'
  );
  const [email, setEmail] = useState(initialEmail);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    publicApi
      .verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setState('success');
        setMessage('Email verified. Welcome aboard!');
      })
      .catch((err: any) => {
        if (cancelled) return;
        setState('error');
        setMessage(err?.response?.data?.message || 'Verification failed or link expired.');
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleResend = async () => {
    setResendError(null);
    setResending(true);
    try {
      await publicApi.resendVerification(email.trim().toLowerCase());
      setMessage('A fresh verification link is on its way.');
    } catch {
      setResendError('Could not send. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {state === 'verifying' && (
            <>
              <Spinner size="lg" />
              <Text style={styles.title}>Verifying your email</Text>
              <Text style={styles.subtitle}>{message}</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <View style={[styles.iconWrap, { backgroundColor: '#EDF2DF' }]}>
                <Ionicons name="checkmark-circle" size={32} color="#657A3A" />
              </View>
              <Text style={styles.title}>Email verified</Text>
              <Text style={styles.subtitle}>{message}</Text>
              <Button
                title="Continue to login"
                onPress={() => navigation.navigate('Login')}
                fullWidth
              />
            </>
          )}

          {state === 'error' && (
            <>
              <View style={[styles.iconWrap, { backgroundColor: '#F8E6DB' }]}>
                <Ionicons name="close-circle" size={32} color="#B34F34" />
              </View>
              <Text style={styles.title}>Verification failed</Text>
              <Text style={styles.subtitle}>{message}</Text>

              {resendError ? (
                <Alert variant="danger" title="Resend failed">{resendError}</Alert>
              ) : null}

              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Button
                title="Resend verification"
                onPress={handleResend}
                loading={resending}
                disabled={!email}
                fullWidth
              />
              <Button
                title="Back to login"
                variant="ghost"
                onPress={() => navigation.navigate('Login')}
                fullWidth
              />
            </>
          )}

          {state === 'pending' && (
            <>
              <View style={[styles.iconWrap, { backgroundColor: '#F4E3C7' }]}>
                <Ionicons name="mail-outline" size={32} color="#A96020" />
              </View>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                We sent a verification link to your inbox. Tap it to activate your account.
              </Text>

              {resendError ? (
                <Alert variant="danger" title="Resend failed">{resendError}</Alert>
              ) : null}

              <Input
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
              <Button
                title="Resend verification link"
                onPress={handleResend}
                loading={resending}
                disabled={!email}
                fullWidth
              />
              <Button
                title="Back to login"
                variant="ghost"
                onPress={() => navigation.navigate('Login')}
                fullWidth
              />
            </>
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
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