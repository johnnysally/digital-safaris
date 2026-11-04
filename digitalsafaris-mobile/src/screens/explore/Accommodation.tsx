import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '../../api';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { DEFAULT_PAGE_SIZE, ACCOMMODATION_TYPES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Property, Location, PaginationMeta } from '../../types';

function coverFor(p: Property): string | null {
  return p.coverImage || p.images?.[0] || p.partner?.logo || null;
}

function priceLabel(p: Property): string | null {
  if (p.minPrice == null) return null;
  return formatCurrency(p.minPrice, p.currency || 'KES');
}

export default function Accommodation({ navigation }: any) {
  const [rows, setRows] = useState<Property[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [town, setTown] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    searchApi.locations({ limit: 100 }).then(setLocations).catch(() => {});
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await searchApi.accommodations({
        page,
        limit: DEFAULT_PAGE_SIZE,
        q: q || undefined,
        town: town || undefined,
        type: type || undefined,
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
  }, [page, town, type]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.county ? `${l.name} · ${l.county}` : l.name,
        value: l.name,
      })),
    [locations]
  );

  const openDetail = (p: Property) => {
    navigation.navigate('AccommodationDetail', {
      idOrSlug: p.slug || p._id,
    });
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={styles.title}>Accommodation</Text>
          <Text style={styles.subtitle}>Browse verified stays across Kenya.</Text>
        </View>

        <View style={styles.filterCard}>
          <Input
            placeholder="Search by name or description..."
            leftIcon={<Ionicons name="search" size={16} color={colors.text.muted} />}
            value={q}
            onChangeText={setQ}
          />
          <Select
            placeholder="Any town"
            value={town}
            onChange={(v) => { setTown(v); setPage(1); }}
            options={locationOptions}
          />
          <Select
            placeholder="Any type"
            value={type}
            onChange={(v) => { setType(v); setPage(1); }}
            options={[...ACCOMMODATION_TYPES]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => { setPage(1); fetchData(); }}
              style={[styles.btn, { backgroundColor: colors.primary[800], flex: 1 }]}
            >
              <Text style={styles.btnText}>Search</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setQ('');
                setTown('');
                setType('');
                setPage(1);
                setTimeout(fetchData, 0);
              }}
              style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.text.primary }]}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="bed-outline" size={24} color={colors.text.muted} />}
            title="No stays found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {rows.map((p) => {
              const cover = coverFor(p);
              const price = priceLabel(p);
              const roomLabel =
                p.roomTypes > 0
                  ? `${p.roomTypes} room type${p.roomTypes === 1 ? '' : 's'}`
                  : null;

              return (
                <Pressable key={p._id} onPress={() => openDetail(p)} style={styles.card}>
                  <View style={styles.cardImageWrap}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="bed-outline" size={32} color={colors.text.muted} />
                      </View>
                    )}

                    {p.isFeatured ? (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>FEATURED</Text>
                      </View>
                    ) : null}

                    <View style={styles.typeBadge}>
                      <Text style={styles.typeText}>{p.type}</Text>
                    </View>
                  </View>

                  <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>

                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={12} color={colors.text.muted} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {p.town}
                        {p.address ? ` · ${p.address}` : ''}
                      </Text>
                    </View>

                    {p.partner?.name ? (
                      <Text style={[styles.metaText, { marginTop: 2 }]} numberOfLines={1}>
                        by {p.partner.name}
                      </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                      <View style={styles.metaRow}>
                        <Ionicons name="star" size={13} color={colors.secondary[500]} />
                        <Text style={styles.metaText}>
                          {p.rating.toFixed(1)}
                          <Text style={{ color: colors.text.muted }}>
                            {p.totalRatings > 0 ? ` (${p.totalRatings})` : ' (new)'}
                          </Text>
                        </Text>
                      </View>
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>
                          {roomLabel ?? 'No rooms yet'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.md }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        {price ? (
                          <>
                            <Text style={{ fontSize: 10, color: colors.text.muted }}>From</Text>
                            <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.text.primary }} numberOfLines={1}>
                              {price}
                              <Text style={{ fontWeight: '400', fontSize: 10, color: colors.text.muted }}> / night</Text>
                            </Text>
                          </>
                        ) : (
                          <Text style={{ fontSize: 11, color: colors.text.muted }}>Contact for price</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => openDetail(p)}
                        style={[styles.btn, { backgroundColor: colors.secondary[500], paddingHorizontal: spacing.lg }]}
                      >
                        <Text style={styles.btnText}>View details</Text>
                      </Pressable>
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  btn: { paddingVertical: 11, paddingHorizontal: spacing.md, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: font.sm, fontWeight: '600', color: colors.white },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.card },
  cardImageWrap: { height: 180, position: 'relative' },
  cardImage: { width: '100%', height: 180 },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  featuredText: { fontSize: 9, fontWeight: '700', color: colors.white, letterSpacing: 0.8 },
  typeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(34,132,81,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  typeText: { fontSize: 9, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: font.xs, color: colors.text.muted },
  chip: { backgroundColor: 'rgba(119,104,85,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  chipText: { fontSize: 10, fontWeight: '600', color: colors.text.muted },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  pageBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
});