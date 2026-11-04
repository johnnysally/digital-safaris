import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { orderApi } from '../../api';
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
import type { Order as OrderType, PaginationMeta } from '../../types';

const statusVariant = (s: string) => {
  if (['delivered', 'completed', 'accepted'].includes(s)) return 'success' as const;
  if (['pending', 'preparing'].includes(s)) return 'warning' as const;
  if (['ready', 'out_for_delivery'].includes(s)) return 'info' as const;
  if (['cancelled', 'rejected'].includes(s)) return 'danger' as const;
  return 'neutral' as const;
};

export default function Order() {
  const [rows, setRows] = useState<OrderType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<OrderType | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await orderApi.list({
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
      const data = await orderApi.details(id);
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
      const updated = await orderApi.cancel(details._id, cancelReason.trim() || undefined);
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setCancelOpen(false);
      setCancelReason('');
    } catch {
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!details) return;
    setReorderLoading(true);
    try {
      await orderApi.reorder(details._id);
      setDetailsId(null);
      fetchData();
    } catch {
    } finally {
      setReorderLoading(false);
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
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Track and manage your food orders.</Text>
        </View>

        <View style={styles.filterCard}>
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Pending', value: 'pending' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Preparing', value: 'preparing' },
              { label: 'Ready', value: 'ready' },
              { label: 'Out for delivery', value: 'out_for_delivery' },
              { label: 'Delivered', value: 'delivered' },
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
            icon={<Ionicons name="bag-handle-outline" size={24} color={colors.text.muted} />}
            title="No orders"
            description="Your food orders will appear here."
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
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {r.restaurantName || '—'}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="restaurant" size={12} color={colors.text.muted} />
                  <Text style={styles.metaText}>
                    {r.items?.length ?? 0} item{(r.items?.length ?? 0) === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>{formatDateTime(r.createdAt)}</Text>
                  <Text style={styles.amount}>{formatCurrency(r.total, r.currency)}</Text>
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

      <Drawer isOpen={!!detailsId} onClose={() => setDetailsId(null)} title="Order details">
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

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="restaurant" size={14} color={colors.text.muted} />
              <Text style={{ fontSize: font.sm, color: colors.text.secondary }}>
                {details.restaurantName || '—'}
              </Text>
            </View>

            <View style={styles.itemsBox}>
              <Text style={styles.itemsLabel}>ITEMS</Text>
              {details.items?.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                  <Text style={{ fontSize: font.sm, color: colors.text.primary, flex: 1 }}>
                    {item.quantity}× {item.name}
                  </Text>
                  <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.text.primary }}>
                    {formatCurrency(item.subtotal, details.currency)}
                  </Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.metaText}>Subtotal</Text>
                <Text style={styles.metaText}>{formatCurrency(details.subtotal, details.currency)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.metaText}>Delivery</Text>
                <Text style={styles.metaText}>{formatCurrency(details.deliveryFee, details.currency)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text.primary }}>Total</Text>
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.secondary[600] }}>
                  {formatCurrency(details.total, details.currency)}
                </Text>
              </View>
            </View>

            {details.deliveryAddress ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                <Ionicons name="location" size={16} color={colors.text.muted} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaText}>Delivery address</Text>
                  <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>
                    {[details.deliveryAddress.address, details.deliveryAddress.town].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </View>
            ) : null}

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
              {['pending', 'accepted'].includes(details.status) ? (
                <Button title="Cancel order" variant="danger" size="sm" onPress={() => setCancelOpen(true)} />
              ) : null}
              {['delivered', 'completed', 'cancelled'].includes(details.status) ? (
                <Button title="Reorder" variant="ghost" size="sm" loading={reorderLoading} onPress={handleReorder} />
              ) : null}
            </View>
          </View>
        )}
      </Drawer>

      <Modal
        isOpen={cancelOpen}
        onClose={() => { setCancelOpen(false); setCancelReason(''); }}
        title="Cancel order?"
        size="sm"
        footer={
          <>
            <Button
              title="Keep order"
              variant="ghost"
              onPress={() => { setCancelOpen(false); setCancelReason(''); }}
            />
            <Button title="Cancel order" variant="danger" onPress={handleCancel} loading={cancelLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Text style={{ fontSize: font.sm, color: colors.text.muted }}>
            The restaurant may already be preparing your food. Refunds depend on their policy.
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
  itemsBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg },
  itemsLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1 },
  cancellationBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md },
});