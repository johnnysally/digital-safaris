import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { paymentApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE, PAYMENT_METHOD_LABELS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import Tabs from '../../components/ui/Tabs';
import type { CustomerPayment } from '../../types';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

function statusVariant(status: string) {
  switch (status) {
    case 'success': return 'success' as const;
    case 'pending':
    case 'processing': return 'warning' as const;
    case 'failed':
    case 'refunded': return 'danger' as const;
    default: return 'neutral' as const;
  }
}

export default function Payment() {
  const [tab, setTab] = useState('all');
  const [rows, setRows] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await paymentApi.list({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        status: tab === 'all' ? undefined : tab,
      });
      setRows(res.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
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
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Your payment history on Digital Safaris.</Text>
        </View>

        <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="card-outline" size={24} color={colors.text.muted} />}
            title="No payments"
            description="Your payment history will appear here."
          />
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {rows.map((p) => (
              <View key={p._id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
                  <Text style={styles.reference}>{p.reference}</Text>
                  <Badge variant={statusVariant(p.status)}>{capitalize(p.status)}</Badge>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
                  <Text style={styles.meta}>
                    {PAYMENT_METHOD_LABELS[p.method] ?? p.method} · {capitalize(String(p.purpose).replace(/_/g, ' '))}
                  </Text>
                  <Text style={styles.amount}>{formatCurrency(p.amount, p.currency)}</Text>
                </View>
                <Text style={styles.date}>{formatDateTime(p.createdAt)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  reference: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary, flex: 1 },
  meta: { fontSize: font.xs, color: colors.text.muted, flex: 1 },
  amount: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  date: { fontSize: 10, color: colors.text.muted, marginTop: spacing.xs },
});