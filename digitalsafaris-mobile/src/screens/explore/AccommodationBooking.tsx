import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, bookingApi, paymentApi } from '../../api';
import { bookingApi as bookingApiTyped } from '../../api';
import type { QuoteResponse } from '../../api/bookingApi';
import { usePaymentPoll } from '../../hooks';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Spinner from '../../components/ui/Spinner';
import type { PropertyDetails } from '../../types';

type PaymentMethod = 'wallet' | 'mpesa' | 'stripe';

const PAYMENT_METHODS = [
  { label: 'DS Wallet', value: 'wallet' },
  { label: 'M-Pesa', value: 'mpesa' },
  { label: 'Card (Stripe)', value: 'stripe' },
];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nightsBetween(a: string, b: string): number {
  if (!a || !b) return 0;
  const start = new Date(a);
  const end = new Date(b);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(diff));
}

export default function AccommodationBooking({ navigation, route }: any) {
  const { idOrSlug, roomId } = route?.params ?? {};

  const [data, setData] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [roomsBooked, setRoomsBooked] = useState('1');
  const [specialRequests, setSpecialRequests] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [phone, setPhone] = useState('');

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  const { poll } = usePaymentPoll();

  useEffect(() => {
    if (!idOrSlug) {
      setLoadError('Missing property reference.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchApi
      .propertyDetails(idOrSlug)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const d = new Date();
        d.setDate(d.getDate() + 2);
        setCheckIn(toISODate(t));
        setCheckOut(toISODate(d));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(extractError(err, 'Could not load this property.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [idOrSlug]);

  const room = useMemo(() => {
    if (!data) return null;
    return data.property.rooms.find((r) => r._id === roomId) ?? null;
  }, [data, roomId]);

  const property = data?.property ?? null;
  const nights = nightsBetween(checkIn, checkOut);

  const cover = room?.images?.[0] || property?.coverImage || property?.images?.[0] || null;

  const handleQuote = async () => {
    if (!room) return;
    setQuoteError(null); setPayError(null); setPayMessage(null);
    if (nights <= 0) { setQuoteError('Check-out must be after check-in.'); return; }
    if (paymentMethod === 'mpesa' && !phone.trim()) {
      setQuoteError('Enter your M-Pesa phone number to continue.'); return;
    }
    setQuoting(true);
    try {
      const q = await bookingApi.quote({
        roomId: room._id,
        checkIn,
        checkOut,
        roomsBooked: Number(roomsBooked) || 1,
        guests: { adults: Number(adults) || 1, children: Number(children) || 0 },
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(extractError(err, 'Could not get a quote'));
    } finally {
      setQuoting(false);
    }
  };

  const handlePayAndBook = async () => {
    if (!quote) return;
    setPayError(null); setPayMessage(null);

    if (paymentMethod === 'mpesa' && !phone.trim()) {
      setPayError('Enter your M-Pesa phone number.'); return;
    }
    if (paymentMethod === 'stripe') {
      setPayError('Card payments are being set up. Please choose M-Pesa or DS Wallet for now.'); return;
    }

    setPaying(true);
    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.total,
        currency: quote.currency,
        purpose: 'booking',
        quoteId: quote.quoteId,
        phone: paymentMethod === 'mpesa' ? phone : undefined,
      });

      if (paymentMethod === 'wallet') {
        if (payment.status !== 'success') {
          setPayError('Wallet payment failed. Check your balance.');
          return;
        }
      } else if (paymentMethod === 'mpesa') {
        setPayMessage('Check your phone and enter your M-Pesa PIN…');
        const result = await poll(payment.reference);
        if (!result.paid) {
          setPayError(result.message ?? 'Payment was not completed.');
          return;
        }
      }

      const booking = await bookingApi.create({
        quoteId: quote.quoteId,
        paymentReference: payment.reference,
        specialRequests: specialRequests.trim() || undefined,
      });

      setQuote(null);
      setPayMessage(null);
      navigation.replace('Booking', { created: booking.reference });
    } catch (err) {
      setPayError(extractError(err, 'Payment failed'));
    } finally {
      setPaying(false);
    }
  };

  const resetQuote = () => {
    setQuote(null); setPayError(null); setPayMessage(null);
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

  if (loadError || !data || !property) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="danger" title="Booking unavailable">
            {loadError ?? 'Property not found.'}
          </Alert>
          <Button
            title="Back to stays"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="warning" title="Room not available">
            The selected room could not be found.
          </Alert>
          <Button
            title="Back to property"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.backText}>Back to property</Text>
          </Pressable>

          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Text style={styles.title}>
              {quote ? 'Pay to confirm' : 'Complete your booking'}
            </Text>
            <Text style={styles.subtitle}>
              {quote
                ? 'Your quote is locked for 15 minutes. Complete payment to confirm.'
                : "Review dates, guests, and how you'd like to pay."}
            </Text>
          </View>

          {!quote ? (
            <View style={styles.card}>
              <View style={styles.roomHeader}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.roomImage} />
                ) : (
                  <View style={[styles.roomImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="bed-outline" size={28} color={colors.text.muted} />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                  <Text style={styles.metaSmall} numberOfLines={1}>{property.name} · {property.town}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people" size={12} color={colors.text.muted} />
                      <Text style={styles.metaSmall}>{room.capacity} guests</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Check-in (YYYY-MM-DD)"
                    placeholder="2026-11-15"
                    value={checkIn}
                    onChangeText={setCheckIn}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Check-out (YYYY-MM-DD)"
                    placeholder="2026-11-17"
                    value={checkOut}
                    onChangeText={setCheckOut}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Adults"
                    keyboardType="numeric"
                    value={adults}
                    onChangeText={setAdults}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Children"
                    keyboardType="numeric"
                    value={children}
                    onChangeText={setChildren}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Rooms"
                    keyboardType="numeric"
                    value={roomsBooked}
                    onChangeText={setRoomsBooked}
                  />
                </View>
              </View>

              <View style={styles.nightsBox}>
                <Text style={styles.metaSmall}>Nights</Text>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text.primary }}>
                  {nights || '—'}
                </Text>
              </View>

              <Select
                label="How would you like to pay?"
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                options={PAYMENT_METHODS}
              />

              {paymentMethod === 'mpesa' ? (
                <View>
                  <Input
                    label="M-Pesa phone number"
                    placeholder="254712345678"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <Text style={[styles.metaSmall, { marginTop: 4 }]}>
                    Enter the Safaricom number registered with M-Pesa.
                  </Text>
                </View>
              ) : null}

              {paymentMethod === 'stripe' ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.metaSmall}>
                    Card payments open a secure Stripe window when you continue.
                    If you don&apos;t see it, use M-Pesa or DS Wallet.
                  </Text>
                </View>
              ) : null}

              <Input
                label="Special requests (optional)"
                placeholder="Late check-in, dietary needs, room preference…"
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
              />

              {quoteError ? (
                <Alert variant="danger" title="Cannot continue">{quoteError}</Alert>
              ) : null}

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button title="Cancel" variant="ghost" onPress={() => navigation.goBack()} fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={quoting ? 'Checking…' : 'Continue to payment'}
                    onPress={handleQuote}
                    loading={quoting}
                    disabled={nights <= 0}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.lockedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#15803D" />
                <Text style={styles.lockedText}>
                  Price locked · expires {new Date(quote.expiresAt).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.methodBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaSmall}>Payment method</Text>
                  <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.text.primary }}>
                    {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? '—'}
                  </Text>
                  {paymentMethod === 'mpesa' && phone ? (
                    <Text style={styles.metaSmall}>To: {phone}</Text>
                  ) : null}
                </View>
                <Pressable onPress={resetQuote}>
                  <Text style={styles.changeLink}>Change</Text>
                </Pressable>
              </View>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.metaSmall}>
                    {formatCurrency(quote.pricePerNight, quote.currency)} × {quote.nights} night{quote.nights === 1 ? '' : 's'} × {quote.roomsBooked}
                  </Text>
                  <Text style={styles.metaSmall}>{formatCurrency(quote.subtotal, quote.currency)}</Text>
                </View>
                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.xs }]}>
                  <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text.primary }}>Total</Text>
                  <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.secondary[600] }}>
                    {formatCurrency(quote.total, quote.currency)}
                  </Text>
                </View>
              </View>

              {payMessage ? (
                <Alert variant="info" title="Processing">{payMessage}</Alert>
              ) : null}
              {payError ? (
                <Alert variant="danger" title="Payment failed">{payError}</Alert>
              ) : null}

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button title="Back" variant="ghost" onPress={resetQuote} fullWidth />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={paying ? 'Processing…' : `Pay ${formatCurrency(quote.total, quote.currency)}`}
                    onPress={handlePayAndBook}
                    loading={paying}
                    fullWidth
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.sideCard}>
            <Text style={styles.sideTitle}>
              {quote ? 'Order summary' : 'Stay summary'}
            </Text>
            <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons name="location" size={12} color={colors.text.muted} />
              <Text style={styles.metaSmall} numberOfLines={1}>{property.name} · {property.town}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }} />

            <View style={{ gap: spacing.xs }}>
              <Row label="Check-in" value={checkIn} />
              <Row label="Check-out" value={checkOut} />
              <Row label="Guests" value={`${adults} adult${Number(adults) === 1 ? '' : 's'}${Number(children) > 0 ? `, ${children} child${Number(children) === 1 ? '' : 'ren'}` : ''}`} />
              <Row label="Rooms" value={roomsBooked} />
            </View>

            <View style={styles.methodFooter}>
              <Ionicons name="wallet" size={14} color={colors.text.muted} />
              <Text style={styles.metaSmall}>
                You pay with {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: font.xs, color: colors.text.muted }}>{label}</Text>
      <Text style={{ fontSize: font.xs, color: colors.text.primary }}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: font.xs, color: colors.text.muted },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
    ...shadows.card,
  },
  roomHeader: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  roomImage: { width: 88, height: 80, borderRadius: radius.md },
  roomName: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  metaSmall: { fontSize: font.xs, color: colors.text.muted },
  nightsBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    paddingVertical: 10, paddingHorizontal: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  noticeBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md,
  },
  lockedText: { fontSize: font.xs, color: '#15803D', fontWeight: '600' },
  methodBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md,
  },
  changeLink: { fontSize: font.xs, fontWeight: '600', color: colors.secondary[600], textDecorationLine: 'underline' },
  summaryBox: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sideCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, gap: spacing.xs,
  },
  sideTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary, marginBottom: spacing.xs },
  methodFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(119,104,85,0.1)', borderRadius: radius.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, marginTop: spacing.md,
  },
});