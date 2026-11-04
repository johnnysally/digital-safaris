import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi, tripApi, paymentApi } from '../../api';
import { usePaymentPoll } from '../../hooks';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import type { TripQuoteResponse } from '../../types';

type ServiceType = 'bike' | 'car' | 'van';
type PaymentMethod = 'wallet' | 'mpesa' | 'stripe';

const SERVICES: { label: string; value: ServiceType; detail: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Car', value: 'car', detail: 'Comfortable rides', icon: 'car-sport' },
  { label: 'Bike', value: 'bike', detail: 'Quick solo trips', icon: 'bicycle' },
  { label: 'Van', value: 'van', detail: 'Groups and extra bags', icon: 'bus' },
];

const PAYMENT_METHODS = [
  { label: 'DS Wallet', value: 'wallet' },
  { label: 'M-Pesa', value: 'mpesa' },
  { label: 'Card (Stripe)', value: 'stripe' },
];

export default function Transport({ navigation }: any) {
  const [heroImage, setHeroImage] = useState<string | null>(null);

  const [pickup, setPickup] = useState({
    address: '', town: '', latitude: -1.286389, longitude: 36.817223,
  });
  const [dropoff, setDropoff] = useState({
    address: '', town: '', latitude: -1.292066, longitude: 36.821946,
  });
  const [scheduledAt, setScheduledAt] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [luggage, setLuggage] = useState('0');
  const [serviceType, setServiceType] = useState<ServiceType>('car');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [coordsOpen, setCoordsOpen] = useState(false);

  const [quote, setQuote] = useState<TripQuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payMessage, setPayMessage] = useState<string | null>(null);

  const { poll } = usePaymentPoll();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      searchApi.properties({ page: 1, limit: 12 }),
      searchApi.restaurants({ page: 1, limit: 12 }),
    ]).then(([propRes, restRes]) => {
      if (!active) return;
      const img =
        (propRes.status === 'fulfilled' &&
          (propRes.value.data.find((p) => p.coverImage || p.images?.[0])?.coverImage ||
            propRes.value.data.find((p) => p.images?.[0])?.images?.[0])) ||
        (restRes.status === 'fulfilled' &&
          restRes.value.data.find((r) => r.coverImage)?.coverImage);
      if (img) setHeroImage(img);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setQuote(null);
    setPayError(null);
    setPayMessage(null);
  }, [
    pickup.address, pickup.town, pickup.latitude, pickup.longitude,
    dropoff.address, dropoff.town, dropoff.latitude, dropoff.longitude,
    serviceType,
  ]);

  const requestQuote = async () => {
    setQuoteError(null);
    setPayError(null);
    setPayMessage(null);
    setQuote(null);

    if (!pickup.address || !dropoff.address) {
      setQuoteError('Enter both pickup and dropoff addresses.');
      return;
    }
    if (!pickup.town || !dropoff.town) {
      setQuoteError('Enter both pickup and dropoff towns.');
      return;
    }

    setQuoting(true);
    try {
      const q = await tripApi.quote({
        pickup: {
          address: pickup.address,
          town: pickup.town,
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
        dropoff: {
          address: dropoff.address,
          town: dropoff.town,
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
        },
        serviceType,
      });
      setQuote(q);
    } catch (err) {
      setQuoteError(extractError(err, 'Could not get quote.'));
    } finally {
      setQuoting(false);
    }
  };

  const handlePay = async () => {
    if (!quote) return;

    if (!scheduledAt) {
      setPayError('Choose when you want to travel.');
      return;
    }
    if (paymentMethod === 'mpesa' && !phone.trim()) {
      setPayError('Enter your M-Pesa phone number.');
      return;
    }
    if (paymentMethod === 'stripe') {
      setPayError('Card payments are being set up. Please choose DS Wallet or M-Pesa for now.');
      return;
    }

    setPaying(true);
    setPayError(null);
    setPayMessage(null);

    try {
      const payment = await paymentApi.initiate({
        method: paymentMethod,
        amount: quote.fare,
        currency: quote.currency,
        purpose: 'transport',
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

      await tripApi.create({
        quoteId: quote.quoteId,
        paymentReference: payment.reference,
        scheduledAt,
        passengers: Number(passengers) || 1,
        luggage: Number(luggage) || 0,
        notes: notes.trim() || undefined,
      });

      setQuote(null);
      setNotes('');
      setPayMessage(null);
      navigation.replace('Trip');
    } catch (err) {
      setPayError(extractError(err, 'Could not request trip'));
    } finally {
      setPaying(false);
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
          <View style={styles.hero}>
            {heroImage ? (
              <Image source={{ uri: heroImage }} style={styles.heroImage} />
            ) : (
              <View style={[styles.heroImage, { backgroundColor: colors.primary[800] }]} />
            )}
            <View style={styles.heroOverlay} />
            <View style={{ padding: spacing.lg, gap: spacing.sm }}>
              <View style={styles.heroBadge}>
                <Ionicons name="navigate" size={12} color={colors.secondary[300]} />
                <Text style={styles.heroBadgeText}>YOUR JOURNEY, YOUR WAY</Text>
              </View>
              <Text style={styles.heroTitle}>Plan your ride</Text>
              <Text style={styles.heroSub}>
                Choose your route and ride. Get an upfront estimate before you request a driver.
              </Text>
            </View>
          </View>

          {quoteError ? (
            <Alert variant="danger" title="Check your trip details">{quoteError}</Alert>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>YOUR ROUTE</Text>

            <View style={styles.pointCard}>
              <View style={styles.pointHeader}>
                <View style={[styles.pointIcon, { backgroundColor: '#f7ead8' }]}>
                  <Ionicons name="navigate" size={16} color="#9b6529" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointLabel}>Pickup location</Text>
                  <Text style={styles.pointSub}>Your starting point</Text>
                </View>
              </View>
              <View style={{ gap: spacing.sm }}>
                <Input
                  label="Street address or landmark"
                  placeholder="e.g. JKIA Terminal 1A"
                  value={pickup.address}
                  onChangeText={(t) => setPickup({ ...pickup, address: t })}
                />
                <Input
                  label="Town or city"
                  placeholder="Nairobi"
                  value={pickup.town}
                  onChangeText={(t) => setPickup({ ...pickup, town: t })}
                />
              </View>
            </View>

            <View style={styles.pointCard}>
              <View style={styles.pointHeader}>
                <View style={[styles.pointIcon, { backgroundColor: '#e9f1e7' }]}>
                  <Ionicons name="location" size={16} color="#55764d" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pointLabel}>Drop-off location</Text>
                  <Text style={styles.pointSub}>Your destination</Text>
                </View>
              </View>
              <View style={{ gap: spacing.sm }}>
                <Input
                  label="Street address or landmark"
                  placeholder="e.g. Westlands, Nairobi"
                  value={dropoff.address}
                  onChangeText={(t) => setDropoff({ ...dropoff, address: t })}
                />
                <Input
                  label="Town or city"
                  placeholder="Nairobi"
                  value={dropoff.town}
                  onChangeText={(t) => setDropoff({ ...dropoff, town: t })}
                />
              </View>
            </View>

            <Pressable onPress={() => setCoordsOpen((v) => !v)} style={styles.coordsToggle}>
              <Text style={styles.coordsToggleText}>Add precise map coordinates</Text>
              <Ionicons name={coordsOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.muted} />
            </Pressable>

            {coordsOpen ? (
              <View style={{ gap: spacing.md }}>
                <Text style={styles.metaSmall}>Pickup coordinates</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Latitude"
                      keyboardType="numeric"
                      value={String(pickup.latitude)}
                      onChangeText={(t) => setPickup({ ...pickup, latitude: Number(t) || 0 })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Longitude"
                      keyboardType="numeric"
                      value={String(pickup.longitude)}
                      onChangeText={(t) => setPickup({ ...pickup, longitude: Number(t) || 0 })}
                    />
                  </View>
                </View>
                <Text style={styles.metaSmall}>Drop-off coordinates</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Latitude"
                      keyboardType="numeric"
                      value={String(dropoff.latitude)}
                      onChangeText={(t) => setDropoff({ ...dropoff, latitude: Number(t) || 0 })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Longitude"
                      keyboardType="numeric"
                      value={String(dropoff.longitude)}
                      onChangeText={(t) => setDropoff({ ...dropoff, longitude: Number(t) || 0 })}
                    />
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>CHOOSE YOUR RIDE</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              {SERVICES.map((s) => {
                const selected = serviceType === s.value;
                return (
                  <Pressable
                    key={s.value}
                    onPress={() => setServiceType(s.value)}
                    style={[styles.serviceCard, selected && styles.serviceCardActive]}
                  >
                    <View style={[styles.serviceIcon, selected && { backgroundColor: colors.secondary[500] }]}>
                      <Ionicons name={s.icon} size={20} color={selected ? colors.white : colors.secondary[600]} />
                    </View>
                    <Text style={[styles.serviceLabel, selected && { color: colors.secondary[600] }]}>{s.label}</Text>
                    <Text style={styles.serviceDetail} numberOfLines={2}>{s.detail}</Text>
                    {selected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={12} color={colors.white} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SCHEDULE & PASSENGERS</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <Input
                label="Travel date and time (YYYY-MM-DDTHH:MM)"
                placeholder="2026-11-15T09:30"
                value={scheduledAt}
                onChangeText={setScheduledAt}
              />
              <Select
                label="Payment method"
                value={paymentMethod}
                onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                options={PAYMENT_METHODS}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Passengers"
                    keyboardType="numeric"
                    value={passengers}
                    onChangeText={setPassengers}
                    leftIcon={<Ionicons name="people" size={16} color={colors.text.muted} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Luggage"
                    keyboardType="numeric"
                    value={luggage}
                    onChangeText={setLuggage}
                    leftIcon={<Ionicons name="briefcase" size={16} color={colors.text.muted} />}
                  />
                </View>
              </View>

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
                    Card payments are being set up. Please choose DS Wallet or M-Pesa for now.
                  </Text>
                </View>
              ) : null}

              <Input
                label="Note for your driver (optional)"
                placeholder="Anything your driver should know?"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="shield-checkmark" size={16} color="#6f8c5c" />
            <Text style={styles.metaSmall}>You'll review the fare before confirming.</Text>
          </View>

          <Button
            title={quote ? 'Refresh fare estimate' : 'Get fare estimate'}
            variant="secondary"
            onPress={requestQuote}
            loading={quoting}
            fullWidth
            rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.white} />}
          />

          {quote ? (
            <View style={styles.quoteCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.quoteLabel}>FARE ESTIMATE READY</Text>
              </View>
              <Text style={styles.quoteAmount}>{formatCurrency(quote.fare, quote.currency)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Ionicons name="location" size={12} color={colors.text.muted} />
                <Text style={styles.metaSmall}>{quote.distanceKm.toFixed(1)} km</Text>
              </View>

              <View style={styles.lockedBanner}>
                <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                <Text style={styles.lockedText}>
                  Price locked · expires {new Date(quote.expiresAt).toLocaleTimeString()}
                </Text>
              </View>

              <View style={styles.quoteRow}>
                <Text style={styles.metaSmall}>Ride type</Text>
                <Text style={styles.quoteRowValue}>{serviceType}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.metaSmall}>Payment</Text>
                <Text style={styles.quoteRowValue}>
                  {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label}
                </Text>
              </View>

              {payMessage ? (
                <Alert variant="info" title="Processing">{payMessage}</Alert>
              ) : null}
              {payError ? (
                <Alert variant="danger" title="Payment failed">{payError}</Alert>
              ) : null}

              <Button
                title={paying ? 'Processing…' : `Pay ${formatCurrency(quote.fare, quote.currency)}`}
                onPress={handlePay}
                loading={paying}
                fullWidth
                leftIcon={<Ionicons name="car" size={16} color={colors.white} />}
                style={{ marginTop: spacing.md }}
              />
              <Text style={[styles.metaSmall, { textAlign: 'center', marginTop: spacing.sm }]}>
                A driver will be assigned right after payment.
              </Text>
            </View>
          ) : null}

          <View style={styles.sideCard}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <View style={[styles.pointIcon, { backgroundColor: '#e9f1e7' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#55764d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.text.primary }}>A smoother trip</Text>
                <Text style={styles.metaSmall}>
                  Your trip details and preferred payment are shared with the driver who accepts your request.
                </Text>
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
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  hero: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.primary[800] },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(36,23,14,0.7)' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '700', color: colors.secondary[300], letterSpacing: 0.8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: colors.white, letterSpacing: -0.4, marginTop: spacing.sm },
  heroSub: { fontSize: font.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, gap: spacing.md, ...shadows.card,
  },
  sectionTitle: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.2 },
  pointCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm,
  },
  pointHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  pointIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pointLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  pointSub: { fontSize: 10, color: colors.text.muted, marginTop: 1 },
  coordsToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  coordsToggleText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  metaSmall: { fontSize: font.xs, color: colors.text.muted },
  serviceCard: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    position: 'relative',
  },
  serviceCardActive: { borderColor: colors.secondary[500], backgroundColor: colors.secondary[50] },
  serviceIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  serviceLabel: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  serviceDetail: { fontSize: 9, color: colors.text.muted, textAlign: 'center' },
  checkBadge: {
    position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.secondary[500], alignItems: 'center', justifyContent: 'center',
  },
  noticeBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
  quoteCard: {
    backgroundColor: colors.secondary[50], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.secondary[200],
    padding: spacing.lg, gap: spacing.xs, ...shadows.card,
  },
  quoteLabel: { fontSize: 10, fontWeight: '700', color: colors.secondary[700], letterSpacing: 1 },
  quoteAmount: { fontSize: 28, fontWeight: '700', color: colors.primary[800], letterSpacing: -0.4, marginTop: spacing.sm },
  lockedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)', paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.md, marginTop: spacing.sm,
  },
  lockedText: { fontSize: 10, color: '#15803D', fontWeight: '600' },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  quoteRowValue: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary, textTransform: 'capitalize' },
  sideCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md,
  },
});