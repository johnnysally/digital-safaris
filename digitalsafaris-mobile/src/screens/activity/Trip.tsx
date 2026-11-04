import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tripApi } from '../../api';
import { extractError } from '../../utils/error';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import type { Trip as TripType, PaginationMeta } from '../../types';

const statusVariant = (s: string) => {
  if (s === 'completed') return 'success' as const;
  if (['accepted', 'ongoing'].includes(s)) return 'info' as const;
  if (s === 'requested') return 'warning' as const;
  if (['cancelled', 'failed'].includes(s)) return 'danger' as const;
  return 'neutral' as const;
};

export default function Trip() {
  const [rows, setRows] = useState<TripType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<TripType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [rateLoading, setRateLoading] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await tripApi.list({ page, limit: DEFAULT_PAGE_SIZE, status: status || undefined });
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

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const openDetails = async (id: string) => {
    setDetailsId(id);
    setDetails(null);
    setDetailsLoading(true);
    try {
      const data = await tripApi.details(id);
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
      const updated = await tripApi.cancel(details._id, cancelReason.trim() || undefined);
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setCancelOpen(false);
      setCancelReason('');
    } catch {
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRate = async () => {
    if (!details) return;
    setRateLoading(true);
    try {
      const updated = await tripApi.rate(details._id, { rating, review });
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setRateOpen(false);
      setReview('');
    } catch {
    } finally {
      setRateLoading(false);
    }
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
          <Text style={styles.title}>Trips</Text>
          <Text style={styles.subtitle}>Your transport trips on Digital Safaris.</Text>
        </View>

        <View style={styles.filterCard}>
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Requested', value: 'requested' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Ongoing', value: 'ongoing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="car-outline" size={24} color={colors.text.muted} />}
            title="No trips"
            description="Your rides will appear here."
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {rows.map((r) => (
              <Pressable key={r._id} onPress={() => openDetails(r._id)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.reference}>{r.reference}</Text>
                  <Badge variant={statusVariant(r.status)}>
                    {capitalize(r.status.replace(/_/g, ' '))}
                  </Badge>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="navigate" size={12} color={colors.text.muted} />
                  <Text style={styles.metaText} numberOfLines={1}>{r.pickup?.address}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="flag" size={12} color={colors.text.muted} />
                  <Text style={styles.metaText} numberOfLines={1}>{r.dropoff?.address}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>{formatDateTime(r.createdAt)}</Text>
                  <Text style={styles.amount}>{formatCurrency(r.fare, r.currency)}</Text>
                </View>
              </Pressable>
            ))}

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

      <Drawer isOpen={!!detailsId} onClose={() => setDetailsId(null)} title="Trip details">
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

            <View style={styles.fareBox}>
              <Text style={styles.metaText}>FARE</Text>
              <Text style={styles.fareValue}>{formatCurrency(details.fare, details.currency)}</Text>
              {details.distanceKm ? (
                <Text style={[styles.metaText, { marginTop: 2 }]}>{details.distanceKm.toFixed(1)} km</Text>
              ) : null}
            </View>

            <View style={{ gap: spacing.sm }}>
              <InfoRow icon="navigate" label="Pickup" value={details.pickup?.address ?? '—'} />
              <InfoRow icon="flag" label="Dropoff" value={details.dropoff?.address ?? '—'} />
              <InfoRow
                icon="person"
                label="Driver"
                value={details.driverName || 'Not yet assigned'}
                sub={details.driverPhone}
              />
            </View>

            {details.status === 'cancelled' && details.cancellationReason ? (
              <View style={styles.cancellationBox}>
                <Text style={styles.metaText}>Cancellation reason</Text>
                <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>
                  {details.cancellationReason}
                </Text>
                {details.cancelledBy ? (
                  <Text style={[styles.metaText, { marginTop: 4 }]}>Cancelled by {details.cancelledBy}</Text>
                ) : null}
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              {['requested', 'accepted'].includes(details.status) ? (
                <Button title="Cancel trip" variant="danger" size="sm" onPress={() => setCancelOpen(true)} />
              ) : null}
              {details.status === 'completed' && !details.rating ? (
                <Button title="Rate driver" size="sm" onPress={() => setRateOpen(true)} />
              ) : null}
              {details.rating ? (
                <Badge variant="success">Rated {details.rating}/5</Badge>
              ) : null}
            </View>
          </View>
        )}
      </Drawer>

      <Modal
        isOpen={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelReason(''); }}
        title="Cancel trip?"
        size="sm"
        footer={
          <>
            <Button
              title="Keep trip"
              variant="ghost"
              onPress={() => { setCancelOpen(false); setCancelReason(''); }}
            />
            <Button title="Cancel trip" variant="danger" onPress={handleCancel} loading={cancelLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Text style={{ fontSize: font.sm, color: colors.text.muted }}>
            Your driver will be notified. Refunds are handled per our policy.
          </Text>
          <Input
            label="Reason (optional)"
            placeholder="Why are you cancelling?"
            value={cancelReason}
            onChangeText={setCancelReason}
          />
        </View>
      </Modal>

      <Modal
        isOpen={rateOpen}
        onClose={() => setRateOpen(false)}
        title="Rate your trip"
        size="sm"
        footer={
          <>
            <Button title="Cancel" variant="ghost" onPress={() => setRateOpen(false)} />
            <Button title="Submit" onPress={handleRate} loading={rateLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Pressable
                key={v}
                onPress={() => setRating(v)}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: rating >= v ? colors.secondary[500] : colors.surfaceAlt,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: font.sm, fontWeight: '700', color: rating >= v ? colors.white : colors.text.muted }}>
                  {v}
                </Text>
              </Pressable>
            ))}
          </View>
          <Input
            label="Review (optional)"
            placeholder="How was your trip?"
            value={review}
            onChangeText={setReview}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon, label, value, sub,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
      <Ionicons name={icon} size={16} color={colors.text.muted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.metaText}>{label}</Text>
        <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>{value}</Text>
        {sub ? <Text style={styles.metaText}>{sub}</Text> : null}
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
  metaText: { fontSize: font.xs, color: colors.text.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  date: { fontSize: 11, color: colors.text.muted },
  amount: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  pageBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
  fareBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg },
  fareValue: { fontSize: 22, fontWeight: '700', color: colors.secondary[600], marginTop: 4 },
  cancellationBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
});