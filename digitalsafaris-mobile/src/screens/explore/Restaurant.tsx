import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '../../api';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { DEFAULT_PAGE_SIZE, CUISINE_OPTIONS } from '../../utils/constants';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import type { Restaurant, Location, PaginationMeta } from '../../types';

export default function RestaurantScreen({ navigation }: any) {
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [town, setTown] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    searchApi.locations({ limit: 100 }).then(setLocations).catch(() => {});
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await searchApi.restaurants({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: q || undefined,
        town: town || undefined,
        cuisine: cuisine || undefined,
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
  }, [page, town, cuisine]);

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

  const openDetail = (r: Restaurant) => {
    navigation.navigate('RestaurantDetail', {
      idOrSlug: r.slug || r._id,
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
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={styles.title}>Restaurants</Text>
          <Text style={styles.subtitle}>Discover menus and order from local kitchens.</Text>
        </View>

        <View style={styles.filterCard}>
          <Input
            placeholder="Search restaurants..."
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
            placeholder="Any cuisine"
            value={cuisine}
            onChange={(v) => { setCuisine(v); setPage(1); }}
            options={[...CUISINE_OPTIONS]}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => { setPage(1); fetchData(); }}
              style={[styles.btn, { backgroundColor: colors.primary[800], flex: 1 }]}
            >
              <Text style={styles.btnText}>Search</Text>
            </Pressable>
            <Pressable
              onPress={() => { setQ(''); setTown(''); setCuisine(''); setPage(1); setTimeout(fetchData, 0); }}
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
            icon={<Ionicons name="restaurant-outline" size={24} color={colors.text.muted} />}
            title="No restaurants found"
            description="Try a different town or cuisine."
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {rows.map((r) => (
              <Pressable
                key={r._id}
                onPress={() => openDetail(r)}
                style={styles.card}
              >
                <View style={styles.cardImageWrap}>
                  {r.coverImage ? (
                    <Image source={{ uri: r.coverImage }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="restaurant-outline" size={32} color={colors.text.muted} />
                    </View>
                  )}
                </View>
                <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{r.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location" size={12} color={colors.text.muted} />
                    <Text style={styles.metaText} numberOfLines={1}>{r.town}</Text>
                  </View>
                  {r.cuisineTypes && r.cuisineTypes.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: spacing.xs }}>
                      {r.cuisineTypes.slice(0, 3).map((c) => (
                        <Badge key={c} variant="neutral">{c}</Badge>
                      ))}
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <View style={styles.metaRow}>
                      <Ionicons name="star" size={13} color={colors.secondary[500]} />
                      <Text style={styles.metaText}>
                        {r.rating.toFixed(1)}
                        <Text style={{ color: colors.text.muted }}> ({r.totalRatings})</Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => openDetail(r)}
                      style={[styles.btn, { backgroundColor: colors.secondary[500], paddingHorizontal: spacing.lg }]}
                    >
                      <Text style={styles.btnText}>View menu</Text>
                    </Pressable>
                  </View>
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
  cardImageWrap: { height: 160 },
  cardImage: { width: '100%', height: 160 },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: font.xs, color: colors.text.secondary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg },
  pageBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  pageBtnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  pageInfo: { fontSize: font.xs, color: colors.text.muted },
});