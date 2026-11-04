import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { reviewApi } from '../../api';
import { colors, font, spacing, radius } from '../../theme';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import { capitalize, truncate } from '../../utils/helpers';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import type { Review, PaginationMeta } from '../../types';

export default function Reviews() {
  const [rows, setRows] = useState<Review[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await reviewApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        targetType: targetType || undefined,
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
  }, [page, targetType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await reviewApi.remove(deleteId);
      setRows((prev) => prev.filter((r) => r._id !== deleteId));
    } catch {
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
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
          <Text style={styles.title}>Reviews</Text>
          <Text style={styles.subtitle}>
            Your reviews of restaurants, transport, and stays.
          </Text>
        </View>

        <View style={styles.filterCard}>
          <Select
            placeholder="All types"
            value={targetType}
            onChange={(v) => { setTargetType(v); setPage(1); }}
            options={[
              { label: 'Restaurants', value: 'restaurant' },
              { label: 'Transport', value: 'transport' },
              { label: 'Accommodation', value: 'accommodation' },
            ]}
          />
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="star-outline" size={24} color={colors.text.muted} />}
            title="No reviews yet"
            description="Reviews you write will appear here."
          />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {rows.map((r) => (
              <View key={r._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Badge variant="neutral">{capitalize(r.targetType)}</Badge>
                  <Badge variant={r.status === 'published' ? 'success' : 'neutral'}>
                    {capitalize(r.status)}
                  </Badge>
                </View>

                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < r.rating ? 'star' : 'star-outline'}
                      size={14}
                      color={i < r.rating ? colors.secondary[500] : colors.text.muted}
                    />
                  ))}
                  <Text style={styles.date}>{formatDate(r.createdAt)}</Text>
                </View>

                {r.title ? (
                  <Text style={styles.reviewTitle} numberOfLines={1}>{r.title}</Text>
                ) : null}
                <Text style={styles.comment} numberOfLines={3}>
                  {truncate(r.comment, 200) || 'No comment'}
                </Text>

                <Pressable
                  onPress={() => setDeleteId(r._id)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            ))}

            {meta && meta.totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  disabled={page <= 1}
                  onPress={() => setPage(page - 1)}
                  style={[styles.pageBtn, page <= 1 && { opacity: 0.4 }]}
                >
                  <Text style={styles.pageBtnText}>Prev</Text>
                </Pressable>
                <Text style={styles.pageInfo}>{page} / {meta.totalPages}</Text>
                <Pressable
                  disabled={page >= meta.totalPages}
                  onPress={() => setPage(page + 1)}
                  style={[styles.pageBtn, page >= meta.totalPages && { opacity: 0.4 }]}
                >
                  <Text style={styles.pageBtnText}>Next</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete review?"
        description="This cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  subtitle: { fontSize: font.sm, color: colors.text.muted },
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
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', gap: spacing.sm },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  date: { marginLeft: 'auto', fontSize: 11, color: colors.text.muted },
  reviewTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  comment: { fontSize: font.sm, color: colors.text.secondary, lineHeight: 19 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  deleteText: { fontSize: 11, fontWeight: '600', color: colors.danger },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  pageBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
});