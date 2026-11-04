import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '../../api';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { DEFAULT_PAGE_SIZE, CUISINE_OPTIONS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Avatar from '../../components/ui/Avatar';
import type { Restaurant, Property, Location } from '../../types';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'restaurants', label: 'Restaurants' },
  { key: 'accommodations', label: 'Accommodations' },
  { key: 'properties', label: 'Properties' },
];

export default function Search({ navigation, route }: any) {
  const initialQ = route?.params?.q ?? '';
  const initialTown = route?.params?.town ?? '';

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState(initialQ);
  const [town, setTown] = useState(initialTown);
  const [cuisine, setCuisine] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [accommodations, setAccommodations] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    searchApi.locations({ limit: 100 }).then(setLocations).catch(() => {});
  }, []);

  const fetchData = async (override?: { q: string; town: string; cuisine: string }, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const params = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        q: (override?.q ?? q) || undefined,
        town: (override?.town ?? town) || undefined,
        cuisine: (override?.cuisine ?? cuisine) || undefined,
      };

      const tasks: Promise<void>[] = [];

      if (tab === 'all' || tab === 'restaurants') {
        tasks.push(searchApi.restaurants(params).then((res) => setRestaurants(res.data ?? [])));
      } else {
        setRestaurants([]);
      }

      if (tab === 'all' || tab === 'accommodations') {
        tasks.push(searchApi.accommodations(params).then((res) => setAccommodations(res.data ?? [])));
      } else {
        setAccommodations([]);
      }

      if (tab === 'all' || tab === 'properties') {
        tasks.push(searchApi.properties(params).then((res) => setProperties(res.data ?? [])));
      } else {
        setProperties([]);
      }

      await Promise.all(tasks);
    } catch {
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
    fetchData(undefined, true);
  };

  const locationOptions = useMemo(
    () =>
      locations.map((l) => ({
        label: l.county ? `${l.name} · ${l.county}` : l.name,
        value: l.name,
      })),
    [locations]
  );

  const total = restaurants.length + accommodations.length + properties.length;

  const openProperty = (p: Property) =>
    navigation.navigate('AccommodationDetail', { idOrSlug: p.slug || p._id });

  const openRestaurant = (r: Restaurant) =>
    navigation.navigate('RestaurantDetail', { idOrSlug: r.slug || r._id });

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
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover stays, restaurants, and properties across Kenya.</Text>
        </View>

        <View style={styles.filterCard}>
          <Input
            placeholder="Search destinations, experiences..."
            leftIcon={<Ionicons name="search" size={16} color={colors.text.muted} />}
            value={q}
            onChangeText={setQ}
          />
          <Select
            placeholder="Any town"
            value={town}
            onChange={setTown}
            options={locationOptions}
          />
          {tab === 'all' || tab === 'restaurants' ? (
            <Select
              placeholder="Any cuisine"
              value={cuisine}
              onChange={setCuisine}
              options={[...CUISINE_OPTIONS]}
            />
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => fetchData()}
              style={[styles.btn, { backgroundColor: colors.secondary[500], flex: 1 }]}
            >
              <Text style={styles.btnText}>Search</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setQ('');
                setTown('');
                setCuisine('');
                fetchData({ q: '', town: '', cuisine: '' });
              }}
              style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border }]}
            >
              <Text style={[styles.btnText, { color: colors.text.primary }]}>Reset</Text>
            </Pressable>
          </View>
        </View>

        <Tabs tabs={TABS} activeKey={tab} onChange={setTab} />

        {loading && (
          <View style={{ paddingVertical: spacing['3xl'], alignItems: 'center' }}>
            <Spinner size="lg" />
          </View>
        )}

        {!loading && total === 0 && (
          <EmptyState
            icon={<Ionicons name="search" size={24} color={colors.text.muted} />}
            title="No results"
            description="Try a different search term or town."
          />
        )}

        {!loading && restaurants.length > 0 && (
          <Section title="Restaurants">
            {restaurants.map((r) => (
              <Pressable key={r._id} onPress={() => openRestaurant(r)} style={styles.card}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Avatar src={r.logo} fallback={r.name} size="sm" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{r.name}</Text>
                      <Text style={styles.cardSub} numberOfLines={1}>{r.town}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="star" size={13} color={colors.secondary[500]} />
                    <Text style={styles.cardSub}>
                      {r.rating.toFixed(1)}
                      <Text style={{ color: colors.text.muted }}> ({r.totalRatings})</Text>
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openRestaurant(r)}
                    style={[styles.btn, { backgroundColor: colors.secondary[500], marginTop: spacing.sm }]}
                  >
                    <Text style={styles.btnText}>View menu</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </Section>
        )}

        {!loading && accommodations.length > 0 && (
          <Section title="Accommodations">
            {accommodations.map((a) => (
              <Pressable key={a._id} onPress={() => openProperty(a)} style={styles.card}>
                <View style={styles.cardImageWrap}>
                  {a.coverImage ? (
                    <Image source={{ uri: a.coverImage }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="bed-outline" size={32} color={colors.text.muted} />
                    </View>
                  )}
                  <View style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Badge variant="secondary">{a.type}</Badge>
                  </View>
                </View>
                <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{a.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location" size={12} color={colors.text.muted} />
                    <Text style={styles.cardSub} numberOfLines={1}>{a.town}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="star" size={13} color={colors.secondary[500]} />
                      <Text style={styles.cardSub}>
                        {a.rating.toFixed(1)}
                        <Text style={{ color: colors.text.muted }}> ({a.totalRatings})</Text>
                      </Text>
                    </View>
                    {a.minPrice != null ? (
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text.primary }}>
                        {formatCurrency(a.minPrice, a.currency || 'KES')}
                      </Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => openProperty(a)}
                    style={[styles.btn, { backgroundColor: colors.secondary[500], marginTop: spacing.sm }]}
                  >
                    <Text style={styles.btnText}>View details</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </Section>
        )}

        {!loading && properties.length > 0 && (
          <Section title="Properties">
            {properties.map((p) => (
              <Pressable key={p._id} onPress={() => openProperty(p)} style={styles.card}>
                <View style={styles.cardImageWrap}>
                  {p.coverImage || p.images?.[0] ? (
                    <Image source={{ uri: p.coverImage || p.images[0] }} style={styles.cardImage} />
                  ) : (
                    <View style={[styles.cardImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="bed-outline" size={32} color={colors.text.muted} />
                    </View>
                  )}
                </View>
                <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location" size={12} color={colors.text.muted} />
                    <Text style={styles.cardSub} numberOfLines={1}>{p.town}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="star" size={13} color={colors.secondary[500]} />
                    <Text style={styles.cardSub}>
                      {p.rating.toFixed(1)}
                      <Text style={{ color: colors.text.muted }}> ({p.totalRatings})</Text>
                    </Text>
                    <Badge variant="neutral">{p.type}</Badge>
                  </View>
                </View>
              </Pressable>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: spacing.md }}>{children}</View>
    </View>
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
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.card },
  cardImageWrap: { height: 160, position: 'relative' },
  cardImage: { width: '100%', height: 160 },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  cardSub: { fontSize: font.xs, color: colors.text.muted },
});