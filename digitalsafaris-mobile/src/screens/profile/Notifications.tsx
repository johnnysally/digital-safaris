import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatRelative } from '../../utils/formatDate';
import { capitalize } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Tabs from '../../components/ui/Tabs';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Notification } from '../../types';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'order', label: 'Orders' },
  { key: 'booking', label: 'Bookings' },
  { key: 'payment', label: 'Payments' },
];

export default function Notifications() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
      };
      if (tab === 'unread') params.isRead = false;
      if (['order', 'booking', 'payment'].includes(tab)) params.type = tab;

      const res = await notificationApi.list(params);
      setItems(res.data ?? []);
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

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch {
      // silent
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await notificationApi.remove(id);
      setItems((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // silent
    }
  };

  const unreadCount = useMemo(() => items.filter((n) => !n.isRead).length, [items]);

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
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </Text>
          </View>
          {unreadCount > 0 ? (
            <Pressable onPress={handleMarkAll} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" size={14} color={colors.text.secondary} />
              <Text style={styles.markAllText}>Mark all</Text>
            </Pressable>
          ) : null}
        </View>

        <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="notifications-outline" size={24} color={colors.text.muted} />}
            title="No notifications"
            description="You will see activity here as it happens."
          />
        ) : (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {items.map((n) => (
              <View
                key={n._id}
                style={[
                  styles.card,
                  !n.isRead && { backgroundColor: colors.secondary[50] + '66' },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="notifications" size={16} color={colors.secondary[600]} />
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.cardTime}>{formatRelative(n.createdAt)}</Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={3}>{n.body}</Text>

                  <View style={styles.cardFooter}>
                    <Badge variant="neutral">{capitalize(n.type)}</Badge>
                    {!n.isRead ? (
                      <Pressable onPress={() => handleMarkRead(n._id)}>
                        <Text style={styles.actionLink}>Mark read</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={() => handleRemove(n._id)}
                      style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 3 }}
                    >
                      <Ionicons name="trash-outline" size={12} color={colors.text.muted} />
                      <Text style={styles.deleteLink}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markAllText: { fontSize: 11, fontWeight: '600', color: colors.text.secondary },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { flex: 1, fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  cardTime: { fontSize: 10, color: colors.text.muted },
  cardBody: { fontSize: font.sm, color: colors.text.secondary, marginTop: 2, lineHeight: 18 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionLink: { fontSize: 11, fontWeight: '600', color: colors.secondary[600] },
  deleteLink: { fontSize: 11, color: colors.text.muted },
});