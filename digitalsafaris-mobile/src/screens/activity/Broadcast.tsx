import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { broadcastApi, searchApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Drawer from '../../components/ui/Drawer';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import type { BroadcastRequest, Location, PaginationMeta } from '../../types';

const statusVariant = (s: string) => {
  if (s === 'accepted') return 'success' as const;
  if (s === 'broadcasting') return 'info' as const;
  if (s === 'cancelled') return 'danger' as const;
  return 'neutral' as const;
};

export default function Broadcast() {
  const [rows, setRows] = useState<BroadcastRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<BroadcastRequest | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [form, setForm] = useState({
    foodType: '', preparation: '', timeNeeded: '', budget: '500',
    address: '', town: '', locationId: '', notes: '',
  });

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    searchApi.locations({ limit: 100 }).then(setLocations).catch(() => {});
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await broadcastApi.list({ page, limit: DEFAULT_PAGE_SIZE, status: status || undefined });
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
      const data = await broadcastApi.details(id);
      setDetails(data);
    } catch {
      setDetailsId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const submit = async () => {
    setCreateLoading(true);
    try {
      await broadcastApi.create({
        foodType: form.foodType.trim(),
        preparation: form.preparation.trim(),
        timeNeeded: form.timeNeeded,
        budget: Number(form.budget),
        deliveryAddress: {
          address: form.address.trim(),
          town: form.town.trim(),
          latitude: -1.286389,
          longitude: 36.817223,
        },
        locationId: form.locationId,
        notes: form.notes.trim() || undefined,
      });
      setCreateOpen(false);
      setForm({ foodType: '', preparation: '', timeNeeded: '', budget: '500', address: '', town: '', locationId: '', notes: '' });
      fetchData();
    } catch {
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!details) return;
    setCancelLoading(true);
    try {
      const updated = await broadcastApi.cancel(details._id);
      setDetails(updated);
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setCancelOpen(false);
    } catch {
    } finally {
      setCancelLoading(false);
    }
  };

  const locationOptions = locations.map((l) => ({
    label: l.county ? `${l.name} · ${l.county}` : l.name,
    value: l._id,
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary[500]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Broadcasts</Text>
            <Text style={styles.subtitle}>Post a food request and let restaurants respond.</Text>
          </View>
          <Pressable onPress={() => setCreateOpen(true)} style={styles.newBtn}>
            <Ionicons name="add" size={16} color={colors.white} />
            <Text style={styles.newBtnText}>New</Text>
          </Pressable>
        </View>

        <View style={styles.filterCard}>
          <Select
            placeholder="All statuses"
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { label: 'Broadcasting', value: 'broadcasting' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Expired', value: 'expired' },
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
            icon={<Ionicons name="radio-outline" size={24} color={colors.text.muted} />}
            title="No broadcasts"
            description="Request food from nearby restaurants."
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {rows.map((r) => (
              <Pressable key={r._id} onPress={() => openDetails(r._id)} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.reference}>{r.reference}</Text>
                  <Badge variant={statusVariant(r.status)}>{capitalize(r.status)}</Badge>
                </View>
                <Text style={styles.cardTitle} numberOfLines={1}>{r.foodType}</Text>
                <Text style={styles.metaText} numberOfLines={1}>{r.preparation}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.date}>{formatDate(r.timeNeeded)}</Text>
                  <Text style={styles.amount}>{formatCurrency(r.budget, r.currency)}</Text>
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

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New broadcast request"
        footer={
          <>
            <Button title="Cancel" variant="ghost" onPress={() => setCreateOpen(false)} />
            <Button title="Send request" onPress={submit} loading={createLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Input
            label="What do you want?"
            placeholder="e.g. Nyama Choma with Ugali"
            value={form.foodType}
            onChangeText={(t) => setForm({ ...form, foodType: t })}
          />
          <Textarea
            label="How to prepare it"
            rows={2}
            placeholder="e.g. well-done, no chili, extra kachumbari"
            value={form.preparation}
            onChangeText={(t) => setForm({ ...form, preparation: t })}
          />
          <Input
            label="When do you need it? (YYYY-MM-DDTHH:MM)"
            placeholder="2026-11-15T19:30"
            value={form.timeNeeded}
            onChangeText={(t) => setForm({ ...form, timeNeeded: t })}
          />
          <Input
            label="Budget (KES)"
            keyboardType="numeric"
            value={form.budget}
            onChangeText={(t) => setForm({ ...form, budget: t })}
          />
          <Select
            label="Location"
            placeholder="Choose a town"
            value={form.locationId}
            onChange={(id) => {
              const loc = locations.find((l) => l._id === id);
              setForm({ ...form, locationId: id, town: loc?.name || '' });
            }}
            options={locationOptions}
          />
          <Input
            label="Delivery address"
            placeholder="e.g. The Savannah Lodge, Room 4"
            value={form.address}
            onChangeText={(t) => setForm({ ...form, address: t })}
          />
          <Textarea
            label="Notes (optional)"
            rows={2}
            placeholder="Anything else restaurants should know"
            value={form.notes}
            onChangeText={(t) => setForm({ ...form, notes: t })}
          />
        </View>
      </Modal>

      <Drawer isOpen={!!detailsId} onClose={() => setDetailsId(null)} title="Broadcast details">
        {detailsLoading || !details ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}><Spinner /></View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.reference}>{details.reference}</Text>
              <Badge variant={statusVariant(details.status)}>{capitalize(details.status)}</Badge>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>BUDGET</Text>
              <Text style={[styles.amount, { fontSize: 22, marginTop: 4 }]}>{formatCurrency(details.budget, details.currency)}</Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              <InfoRow label="Food" value={details.foodType} />
              <InfoRow label="Preparation" value={details.preparation} />
              <InfoRow label="Time needed" value={formatDate(details.timeNeeded)} />
              <InfoRow label="Delivery" value={`${details.deliveryAddress?.address ?? ''}, ${details.deliveryAddress?.town ?? ''}`} />
              {details.acceptedByName ? <InfoRow label="Accepted by" value={details.acceptedByName} /> : null}
            </View>

            {details.status === 'broadcasting' ? (
              <Button title="Cancel broadcast" variant="danger" size="sm" onPress={() => setCancelOpen(true)} />
            ) : null}
          </View>
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel broadcast?"
        description="Restaurants will no longer see this request."
        confirmText="Cancel"
        variant="danger"
        loading={cancelLoading}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ fontSize: font.sm, color: colors.text.primary, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted, marginTop: 2 },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  newBtnText: { fontSize: font.sm, fontWeight: '600', color: colors.white },
  filterCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reference: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary, fontFamily: 'monospace' },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  metaText: { fontSize: font.xs, color: colors.text.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  date: { fontSize: 11, color: colors.text.muted },
  amount: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  pageBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
  totalBox: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.lg },
  totalLabel: { fontSize: 10, fontWeight: '700', color: colors.text.muted, letterSpacing: 1 },
});