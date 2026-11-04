import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bookingApi } from '../../api';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import type { Booking as BookingType, PaginationMeta } from '../../types';

const statusVariant = (s: string) => {
  if (['completed', 'checked_out', 'confirmed'].includes(s)) return 'success' as const;
  if (s === 'pending') return 'warning' as const;
  if (s === 'checked_in') return 'info' as const;
  if (['cancelled', 'no_show', 'refunded'].includes(s)) return 'danger' as const;
  return 'neutral' as const;
};

const paymentVariant = (s?: string) => {
  if (s === 'paid') return 'success' as const;
  if (s === 'pending') return 'warning' as const;
  if (s === 'refunded') return 'info' as const;
  if (s === 'failed') return 'danger' as const;
  return 'neutral' as const;
};

function getPopulatedName(value: any, fallback?: string): string {
  if (value && typeof value === 'object' && 'name' in value) {
    return (value as { name?: string }).name || fallback || '—';
  }
  return fallback || '—';
}

function getRoomUnitNumber(unit: any): string | null {
  if (unit && typeof unit === 'object' && 'number' in unit) {
    return (unit as { number?: string }).number || null;
  }
  return null;
}

function guestsLabel(guests?: { adults?: number; children?: number }) {
  const adults = guests?.adults ?? 0;
  const children = guests?.children ?? 0;
  const a = `${adults} adult${adults === 1 ? '' : 's'}`;
  const c = children > 0 ? `, ${children} child${children === 1 ? '' : 'ren'}` : '';
  return a + c;
}

export default function Booking({ navigation, route }: any) {
  const justCreated = route?.params?.created as string | undefined;

  const [rows, setRows] = useState<BookingType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await bookingApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
      });
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await bookingApi.details(id);
      setDetails(data);
    } catch {
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await bookingApi.cancel(details._id, cancelReason.trim() || undefined);
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setCancelOpen(false);
      setCancelReason('');
    } catch {
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!details) return;
    setCheckInLoading(true);
    try {
      const updated = await bookingApi.checkIn(details._id);
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch {
    } finally {
      setCheckInLoading(false);
    }
  };

  const goToReview = (bookingId: string) => {
    setDetailsId(null);
    navigation.navigate('NewReview', { bookingId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Manage your accommodation bookings.</Text>
        </View>

        {justCreated ? (
          <Alert variant="success" title="Booking confirmed" style={{ marginBottom: spacing.md }}>
            Reference <Text style={{ fontWeight: '700' }}>{justCreated}</Text> — a confirmation email is on its way.
          </Alert>
        ) : null}

        <View style={styles.filterCard}>
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Checked in', value: 'checked_in' },
              { label: 'Checked out', value: 'checked_out' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'No show', value: 'no_show' },
            ]}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={24} color={colors.text.muted} />}
            title="No bookings"
            description="Your upcoming stays will appear here."
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {rows.map((r) => {
              const propName = getPopulatedName(r.property, r.propertyName);
              const roomName =
                typeof r.room === 'object' && r.room ? r.room.name : r.roomName || '';
              return (
                <Pressable key={r._id} onPress={() => openDetails(r._id)} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.reference}>{r.reference}</Text>
                    <Badge variant={statusVariant(r.status)}>
                      {capitalize(r.status.replace(/_/g, ' '))}
                    </Badge>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {propName}
                    {roomName ? ` · ${roomName}` : ''}
                  </Text>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={12} color={colors.text.muted} />
                    <Text style={styles.metaText}>
                      {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
                    </Text>
                  </View>

                  <View style={styles.cardFooter}>
                    <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {r.paymentStatus ? (
                        <Badge variant={paymentVariant(r.paymentStatus)}>
                          {capitalize(r.paymentStatus)}
                        </Badge>
                      ) : null}
                      <Text style={styles.amount}>{formatCurrency(r.total, r.currency)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}

            {meta && meta.totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable disabled={page <= 1} onPress={() => setPage(page - 1)} style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}>
                  <Text style={styles.pageBtnText}>Prev</Text>
                </Pressable>
                <Text style={styles.pageInfo}>{page} / {meta.totalPages}</Text>
                <Pressable disabled={page >= meta.totalPages} onPress={() => setPage(page + 1)} style={[styles.pageBtn, page >= meta.totalPages && { opacity: 0.4 }]}>
                  <Text style={styles.pageBtnText}>Next</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Drawer isOpen={!!detailsId} onClose={() => setDetailsId(null)} title="Booking details">
        {detailsLoading || !details ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <Spinner />
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.reference}>{details.reference}</Text>
              <Badge variant={statusVariant(details.status)}>
                {capitalize(details.status.replace(/_/g, ' '))}
              </Badge>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.metaText}>TOTAL PAID</Text>
              <Text style={styles.totalValue}>{formatCurrency(details.total, details.currency)}</Text>
              {details.paymentStatus ? (
                <Badge variant={paymentVariant(details.paymentStatus)} style={{ marginTop: spacing.sm }}>
                  {capitalize(details.paymentStatus)}
                </Badge>
              ) : null}
            </View>

            <View style={{ gap: spacing.sm }}>
              <InfoRow
                icon="location"
                label="Property"
                value={getPopulatedName(details.property, details.propertyName)}
              />
              <InfoRow
                icon="key"
                label="Room"
                value={(() => {
                  const unit = getRoomUnitNumber(details.roomUnit);
                  if (unit) return `Room ${unit}`;
                  const name =
                    typeof details.room === 'object' && details.room
                      ? details.room.name
                      : details.roomName;
                  return name || 'Assigned at check-in';
                })()}
              />
              <InfoRow
                icon="calendar"
                label="Stay"
                value={`${formatDate(details.checkIn)} → ${formatDate(details.checkOut)}`}
              />
              <InfoRow icon="people" label="Guests" value={guestsLabel(details.guests)} />
              <InfoRow icon="time" label="Booked" value={formatDateTime(details.createdAt)} />
            </View>

            {details.status === 'cancelled' && details.cancellationReason ? (
              <View style={styles.cancellationBox}>
                <Text style={styles.metaText}>Cancellation reason</Text>
                <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>
                  {details.cancellationReason}
                </Text>
                {details.cancelledBy ? (
                  <Text style={[styles.metaText, { marginTop: 4 }]}>
                    Cancelled by {details.cancelledBy}
                    {details.cancelledAt ? ` · ${formatDateTime(details.cancelledAt)}` : ''}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              {details.status === 'confirmed' ? (
                <Button title="Check in" size="sm" loading={checkInLoading} onPress={handleCheckIn} />
              ) : null}

              {['pending', 'confirmed'].includes(details.status) ? (
                <Button title="Cancel booking" variant="danger" size="sm" onPress={() => setCancelOpen(true)} />
              ) : null}

              {details.status === 'checked_out' ? (
                <Button
                  title="Leave a review"
                  size="sm"
                  leftIcon={<Ionicons name="star" size={14} color={colors.white} />}
                  onPress={() => goToReview(details._id)}
                />
              ) : null}
            </View>
          </View>
        )}
      </Drawer>

      <Modal
        isOpen={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelReason(''); }}
        title="Cancel booking?"
        size="sm"
        footer={
          <>
            <Button
              title="Keep booking"
              variant="ghost"
              onPress={() => { setCancelOpen(false); setCancelReason(''); }}
            />
            <Button title="Cancel booking" variant="danger" onPress={handleCancel} loading={cancelLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Text style={{ fontSize: font.sm, color: colors.text.muted }}>
            Any applicable refund will be processed based on the property's cancellation policy.
          </Text>
          <Input
            label="Reason (optional)"
            placeholder="Why are you cancelling?"
            value={cancelReason}
            onChangeText={setCancelReason}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon, label, value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      <Ionicons name={icon} size={16} color={colors.text.muted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.metaText}>{label}</Text>
        <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted },
  filterCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary, fontFamily: 'monospace' },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: font.xs, color: colors.text.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  date: { fontSize: 11, color: colors.text.muted },
  amount: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  pageBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
  totalBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg },
  totalValue: { fontSize: 24, fontWeight: '700', color: colors.secondary[600], marginTop: 4 },
  cancellationBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
});