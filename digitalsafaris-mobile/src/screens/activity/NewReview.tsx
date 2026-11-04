import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi, reviewApi } from '../../api';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius, shadows } from '../../theme';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import type { Booking } from '../../types';

function StarInput({
  value,
  onChange,
  size = 'lg',
}: {
  value: number;
  onChange: (n: number) => void;
  size?: 'sm' | 'lg';
}) {
  const dim = size === 'lg' ? 26 : 20;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityLabel={`Rate ${n} out of 5`}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={dim}
            color={n <= value ? colors.secondary[500] : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function NewReview({ navigation, route }: any) {
  const bookingId = route?.params?.bookingId;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [cleanliness, setCleanliness] = useState(0);
  const [comfort, setComfort] = useState(0);
  const [service, setService] = useState(0);
  const [value, setValue] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking specified.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    bookingApi
      .details(bookingId)
      .then((data) => {
        if (!cancelled) setBooking(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load booking.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!booking) return;
    if (rating < 1) {
      setSubmitError('Please select a star rating.');
      return;
    }
    if (comment.trim().length < 10) {
      setSubmitError('Please write at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const partnerId =
        typeof booking.partner === 'object'
          ? (booking.partner as any)?._id
          : booking.partner;
      const propertyId =
        typeof booking.property === 'object'
          ? (booking.property as any)?._id
          : booking.property;

      await reviewApi.create({
        targetType: 'accommodation',
        targetId: partnerId,
        booking: booking._id,
        property: propertyId,
        rating,
        title: title.trim() || null,
        comment: comment.trim(),
        cleanliness: cleanliness || null,
        comfort: comfort || null,
        service: service || null,
        value: value || null,
      });

      navigation.replace('Booking');
    } catch (err) {
      setSubmitError(extractError(err, 'Could not submit your review.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !booking) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="danger" title="Cannot open review">
            {error ?? 'Booking not found.'}
          </Alert>
          <Button
            title="Back to bookings"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (booking.status !== 'checked_out') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="warning" title="Review not available">
            You can only review stays after checkout.
          </Alert>
          <Button
            title="Back to bookings"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const propertyName =
    typeof booking.property === 'object' && booking.property
      ? (booking.property as any).name
      : booking.propertyName || 'your stay';

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
          <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.text.muted} />
            <Text style={styles.backText}>Back to bookings</Text>
          </Pressable>

          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Text style={styles.title}>How was your stay?</Text>
            <Text style={styles.subtitle}>
              Reviewing <Text style={{ fontWeight: '700' }}>{propertyName}</Text> · {booking.reference}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={{ gap: spacing.xs }}>
              <Text style={styles.label}>Overall rating</Text>
              <StarInput value={rating} onChange={setRating} />
            </View>

            <Input
              label="Title (optional)"
              placeholder="Amazing view and friendly staff"
              maxLength={120}
              value={title}
              onChangeText={setTitle}
            />

            <View style={{ gap: spacing.xs }}>
              <Text style={styles.label}>Your review</Text>
              <Input
                placeholder="Tell other travelers about your stay…"
                value={comment}
                onChangeText={setComment}
                multiline
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            </View>

            <View style={styles.dimensionBox}>
              <Text style={styles.dimensionTitle}>Rate specific aspects (optional)</Text>
              {[
                { label: 'Cleanliness', value: cleanliness, set: setCleanliness },
                { label: 'Comfort', value: comfort, set: setComfort },
                { label: 'Service', value: service, set: setService },
                { label: 'Value', value: value, set: setValue },
              ].map(({ label, value: v, set }) => (
                <View key={label} style={styles.dimensionRow}>
                  <Text style={styles.metaSmall}>{label}</Text>
                  <StarInput value={v} onChange={set} size="sm" />
                </View>
              ))}
            </View>

            {submitError ? (
              <Alert variant="danger" title="Could not submit">{submitError}</Alert>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="ghost"
                  onPress={() => navigation.goBack()}
                  disabled={submitting}
                  fullWidth
                />
              </View>
              <View style={{ flex: 2 }}>
                <Button
                  title={submitting ? 'Submitting…' : 'Post review'}
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={rating < 1}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: font.xs, color: colors.text.muted },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted },
  label: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary, marginBottom: 4 },
  metaSmall: { fontSize: font.xs, color: colors.text.muted },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
    ...shadows.card,
  },
  dimensionBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: spacing.md, gap: spacing.sm,
  },
  dimensionTitle: { fontSize: font.xs, fontWeight: '700', color: colors.text.secondary },
  dimensionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
});