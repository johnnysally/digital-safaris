import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { walletApi, paymentApi } from '../../api';
import { useAuthStore } from '../../store';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import type { CustomerWallet, CustomerPayment } from '../../types';

export default function Wallet() {
  const customer = useAuthStore((s) => s.customer);

  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [transactions, setTransactions] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState('100');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const [w, t] = await Promise.all([
        walletApi.get(),
        paymentApi.list({ page: 1, limit: 20 }),
      ]);
      setWallet(w);
      setTransactions(t.data ?? []);
    } catch {
      setError('Could not load wallet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleTopUp = async () => {
    const value = Number(amount);
    if (!value || value < 1) {
      setError('Enter at least KSh 1.');
      return;
    }
    if (!phone || phone.length < 9) {
      setError('Enter a valid M-Pesa number.');
      return;
    }
    setTopUpLoading(true);
    setError(null);
    try {
      const res = await walletApi.topUp({ amount: value, phone });
      setPendingReference(res.reference);
      setTopUpOpen(false);
    } catch {
      setError('Top-up failed. Check your number and try again.');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingReference) return;
    setConfirmLoading(true);
    try {
      await walletApi.confirmTopUp({ reference: pendingReference });
      setPendingReference(null);
      load(true);
    } catch {
      setError('Not yet received. If you entered your PIN, try again shortly.');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading && !wallet) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Manage your balance and top up via M-Pesa.</Text>
        </View>

        {error ? (
          <Alert variant="danger" title="Something went wrong" style={{ marginBottom: spacing.md }}>
            {error}
          </Alert>
        ) : null}

        {pendingReference ? (
          <Alert variant="info" title="Awaiting M-Pesa confirmation">
            <View style={{ gap: spacing.sm, marginTop: 4 }}>
              <Text style={{ fontSize: font.sm, color: colors.text.secondary }}>
                Ref <Text style={{ fontWeight: '600' }}>{pendingReference}</Text>. Enter your
                PIN, then confirm below.
              </Text>
              <Button title="I've paid" size="sm" onPress={handleConfirm} loading={confirmLoading} />
            </View>
          </Alert>
        ) : null}

        <View style={styles.balanceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 }}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={22} color={colors.secondary[600]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(wallet?.balance ?? 0, wallet?.currency || 'KES')}
              </Text>
            </View>
          </View>
          <Button
            title="Top up"
            size="sm"
            leftIcon={<Ionicons name="add" size={16} color={colors.white} />}
            onPress={() => setTopUpOpen(true)}
          />
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>

          {transactions.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={24} color={colors.text.muted} />}
              title="No transactions yet"
              description="Top up your wallet to see activity here."
            />
          ) : (
            <View style={styles.list}>
              {transactions.map((t, i) => {
                const isCredit = t.method === 'wallet' || t.purpose === 'topup';
                const label =
                  t.purpose === 'topup'
                    ? 'M-Pesa top up'
                    : t.purpose === 'booking'
                    ? 'Accommodation booking'
                    : t.purpose === 'food_order'
                    ? 'Food order'
                    : t.purpose === 'transport'
                    ? 'Transport trip'
                    : 'Payment';

                return (
                  <View
                    key={t._id}
                    style={[styles.row, i < transactions.length - 1 && styles.rowDivider]}
                  >
                    <View
                      style={[
                        styles.txIcon,
                        {
                          backgroundColor: isCredit
                            ? 'rgba(34,197,94,0.1)'
                            : 'rgba(239,68,68,0.1)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isCredit ? 'arrow-down' : 'arrow-up'}
                        size={16}
                        color={isCredit ? colors.success : colors.danger}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{label}</Text>
                      <Text style={styles.rowSub}>{formatDateTime(t.createdAt)}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Badge
                        variant={
                          t.status === 'success'
                            ? 'success'
                            : t.status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {t.status}
                      </Badge>
                      <Text style={styles.rowAmount}>
                        {isCredit ? '+' : '−'}
                        {formatCurrency(t.amount, t.currency)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Top up wallet"
        size="sm"
        footer={
          <>
            <Button title="Cancel" variant="ghost" onPress={() => setTopUpOpen(false)} />
            <Button title="Send STK" onPress={handleTopUp} loading={topUpLoading} />
          </>
        }
      >
        <View style={{ gap: spacing.md }}>
          <Input
            label="Amount (KES)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            placeholder="100"
          />
          <Input
            label="M-Pesa phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="254712345678"
            helper="Format 254712345678 or 0712345678"
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
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.text.muted,
  },
  balanceValue: {
    fontSize: font['2xl'],
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 1.2,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: font.sm, fontWeight: '600', color: colors.text.primary },
  rowSub: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
  rowAmount: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
});