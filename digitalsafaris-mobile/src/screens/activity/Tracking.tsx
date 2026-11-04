import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { trackingApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import { formatDate, formatDateTime, formatRelative } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import type { TrackBookingResponse, TrackTripResponse, TrackDeliveryResponse } from '../../types';

type Kind = 'booking' | 'trip' | 'delivery';

export default function Tracking() {
  const [kind, setKind] = useState<Kind>('booking');
  const [reference, setReference] = useState('');
  const [booking, setBooking] = useState<TrackBookingResponse | null>(null);
  const [trip, setTrip] = useState<TrackTripResponse | null>(null);
  const [delivery, setDelivery] = useState<TrackDeliveryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = () => { setBooking(null); setTrip(null); setDelivery(null); };

  const load = async () => {
    const ref = reference.trim();
    if (!ref) { setError('Enter a reference.'); return; }
    setLoading(true);
    setError(null);
    clear();
    try {
      if (kind === 'booking') setBooking(await trackingApi.booking(ref));
      else if (kind === 'trip') setTrip(await trackingApi.trip(ref));
      else setDelivery(await trackingApi.delivery(ref));
    } catch {
      setError('Could not find that reference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={styles.title}>Tracking</Text>
          <Text style={styles.subtitle}>Enter a reference to follow a booking, trip, or delivery live.</Text>
        </View>

        <View style={styles.filterCard}>
          <Select
            value={kind}
            onChange={(v) => setKind(v as Kind)}
            options={[
              { label: 'Booking', value: 'booking' },
              { label: 'Trip', value: 'trip' },
              { label: 'Delivery', value: 'delivery' },
            ]}
          />
          <Input
            placeholder="e.g. BKG-XXXX or ORD-XXXX"
            leftIcon={<Ionicons name="search" size={16} color={colors.text.muted} />}
            value={reference}
            onChangeText={setReference}
            autoCapitalize="characters"
          />
          <Button title="Track" onPress={load} loading={loading} fullWidth />
        </View>

        {error ? (
          <View style={styles.errBox}>
            <Text style={{ color: colors.danger, fontSize: font.sm }}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : null}

        {!loading && booking ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.reference}>{booking.reference}</Text>
              <Badge variant="info">{capitalize(booking.status.replace(/_/g, ' '))}</Badge>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <InfoRow label="Check-in" value={formatDateTime(booking.checkIn)} />
              <InfoRow label="Check-out" value={formatDateTime(booking.checkOut)} />
              {booking.property ? <InfoRow label="Property" value={booking.property.name} /> : null}
              {booking.qrCode ? <InfoRow label="Check-in code" value={booking.qrCode} mono /> : null}
            </View>
          </View>
        ) : null}

        {!loading && trip ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.reference}>{trip.trip.reference}</Text>
              <Badge variant="info">{capitalize(trip.trip.status.replace(/_/g, ' '))}</Badge>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              <InfoRow label="Pickup" value={trip.trip.pickup?.address ?? '—'} />
              <InfoRow label="Dropoff" value={trip.trip.dropoff?.address ?? '—'} />
              {trip.trip.driver ? <InfoRow label="Driver" value={`${trip.trip.driver.firstName ?? ''} ${trip.trip.driver.lastName ?? ''}`} /> : null}
              {trip.location ? (
                <InfoRow
                  label="Live location"
                  value={`${trip.location.latitude.toFixed(4)}, ${trip.location.longitude.toFixed(4)}\nUpdated ${formatRelative(trip.location.lastPingAt)}`}
                  mono
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {!loading && delivery ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.reference}>{delivery.order.reference}</Text>
              <Badge variant="info">{capitalize(delivery.order.status.replace(/_/g, ' '))}</Badge>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {delivery.order.restaurant ? <InfoRow label="Restaurant" value={delivery.order.restaurant.name} /> : null}
              {delivery.delivery?.driver ? <InfoRow label="Driver" value={`${delivery.delivery.driver.firstName ?? ''} ${delivery.delivery.driver.lastName ?? ''}`} /> : null}
              {delivery.location ? (
                <InfoRow
                  label="Last ping"
                  value={`${delivery.location.latitude.toFixed(4)}, ${delivery.location.longitude.toFixed(4)}\n${formatRelative(delivery.location.lastPingAt)}`}
                  mono
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {!loading && !booking && !trip && !delivery && !error ? (
          <EmptyState
            icon={<Ionicons name="search-outline" size={24} color={colors.text.muted} />}
            title="Nothing to track yet"
            description="Enter a reference to follow it live."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2, fontFamily: mono ? 'monospace' : undefined }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted, lineHeight: 20 },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary, fontFamily: 'monospace' },
});