import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  searchApi, bookingApi, orderApi, tripApi,
  notificationApi, walletApi,
} from '../../api';
import { useAuthStore } from '../../store';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { Spinner } from '../../components/ui';
import type {
  Booking, CustomerWallet, Location, Notification,
  Order, Property, Restaurant, Trip,
} from '../../types';

interface FeaturedListing {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: string;
  rating: number;
  totalRatings: number;
  image: string | null;
  price?: number;
  currency?: string;
  kind: 'property' | 'restaurant';
}

interface UpcomingItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  status: string;
  image: string | null;
  kind: 'booking' | 'trip' | 'order';
}

interface DashboardData {
  properties: Property[];
  restaurants: Restaurant[];
  locations: Location[];
  bookings: Booking[];
  trips: Trip[];
  orders: Order[];
  notifications: Notification[];
  unreadNotifications: number;
  wallet: CustomerWallet | null;
  totals: { properties: number; restaurants: number };
}

const EMPTY_DASHBOARD: DashboardData = {
  properties: [],
  restaurants: [],
  locations: [],
  bookings: [],
  trips: [],
  orders: [],
  notifications: [],
  unreadNotifications: 0,
  wallet: null,
  totals: { properties: 0, restaurants: 0 },
};

const numOr = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function isMongoId(s?: string | null): boolean {
  if (!s) return false;
  return /^[a-f0-9]{24}$/i.test(s);
}

function safeTown(town?: string | null): string {
  if (!town) return 'Kenya';
  if (isMongoId(town)) return 'Kenya';
  if (town.length > 40) return 'Kenya';
  return town;
}

export default function Home({ navigation }: any) {
  const customer = useAuthStore((s) => s.customer);
  const [search, setSearch] = useState('');
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedSections, setFailedSections] = useState<string[]>([]);

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);

    const requests: Array<{ name: string; run: () => Promise<unknown> }> = [
      { name: 'properties', run: () => searchApi.properties({ page: 1, limit: 12 }) },
      { name: 'restaurants', run: () => searchApi.restaurants({ page: 1, limit: 12 }) },
      { name: 'destinations', run: () => searchApi.locations({ limit: 100 }) },
      { name: 'bookings', run: () => bookingApi.list({ page: 1, limit: 20 }) },
      { name: 'trips', run: () => tripApi.list({ page: 1, limit: 20 }) },
      { name: 'orders', run: () => orderApi.list({ page: 1, limit: 10 }) },
      { name: 'notifications', run: () => notificationApi.list({ page: 1, limit: 5 }) },
      { name: 'unread', run: () => notificationApi.unreadCount() },
      { name: 'wallet', run: () => walletApi.get() },
    ];

    const results = await Promise.allSettled(requests.map((r) => r.run()));

    const errors = results.flatMap((res, i) =>
      res.status === 'rejected' ? [requests[i].name] : []
    );

    const at = <T,>(i: number): T | undefined =>
      results[i].status === 'fulfilled' ? (results[i].value as T) : undefined;

    const properties = at<Awaited<ReturnType<typeof searchApi.properties>>>(0);
    const restaurants = at<Awaited<ReturnType<typeof searchApi.restaurants>>>(1);
    const locations = at<Location[]>(2);
    const bookings = at<Awaited<ReturnType<typeof bookingApi.list>>>(3);
    const trips = at<Awaited<ReturnType<typeof tripApi.list>>>(4);
    const orders = at<Awaited<ReturnType<typeof orderApi.list>>>(5);
    const notifications = at<Awaited<ReturnType<typeof notificationApi.list>>>(6);
    const unread = at<{ count: number }>(7);
    const wallet = at<CustomerWallet>(8);

    setData({
      properties: properties?.data ?? [],
      restaurants: restaurants?.data ?? [],
      locations: locations ?? [],
      bookings: bookings?.data ?? [],
      trips: trips?.data ?? [],
      orders: orders?.data ?? [],
      notifications: notifications?.data ?? [],
      unreadNotifications: unread?.count ?? 0,
      wallet: wallet ?? null,
      totals: {
        properties: properties?.meta.total ?? 0,
        restaurants: restaurants?.meta.total ?? 0,
      },
    });
    setFailedSections(errors);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const featured = useMemo<FeaturedListing[]>(() => {
    const fromProperties = data.properties.map((p) => ({
      id: p._id,
      slug: p.slug || p._id,
      title: p.name,
      location: safeTown(p.town),
      category: p.type,
      rating: numOr(p.rating),
      totalRatings: numOr(p.totalRatings),
      image: p.coverImage || p.images?.[0] || null,
      price: p.minPrice ?? undefined,
      currency: p.currency,
      kind: 'property' as const,
    }));

    const fromRestaurants = data.restaurants.map((r) => ({
      id: r._id,
      slug: r.slug || r._id,
      title: r.name,
      location: safeTown(r.town),
      category: r.cuisineTypes?.[0] || 'Restaurant',
      rating: numOr(r.rating),
      totalRatings: numOr(r.totalRatings),
      image: r.coverImage || r.logo || null,
      kind: 'restaurant' as const,
    }));

    return [...fromProperties, ...fromRestaurants]
      .sort((a, b) => b.rating - a.rating || b.totalRatings - a.totalRatings)
      .slice(0, 8);
  }, [data.properties, data.restaurants]);

  const destinations = useMemo(
    () =>
      data.locations.filter(
        (l) => l.isOperational && ['town', 'city'].includes(l.type)
      ),
    [data.locations]
  );

  const upcoming = useMemo<UpcomingItem[]>(() => {
    const fromBookings: UpcomingItem[] = data.bookings
      .filter(
        (b) =>
          !['cancelled', 'refunded', 'checked_out'].includes(b.status) &&
          new Date(b.checkOut).getTime() >= Date.now()
      )
      .map((b) => ({
        id: b._id,
        title:
          b.propertyName ||
          (typeof b.property === 'object' ? (b.property as any)?.name : null) ||
          'Accommodation',
        detail: b.roomName || b.status.replace(/_/g, ' '),
        date: b.checkIn,
        status: b.status,
        image: b.propertyImages?.[0] ?? null,
        kind: 'booking',
      }));

    const fromTrips: UpcomingItem[] = data.trips
      .filter(
        (t) =>
          !['cancelled', 'completed', 'failed'].includes(t.status) &&
          (new Date(t.scheduledAt).getTime() >= Date.now() ||
            ['ongoing', 'in_progress'].includes(t.status))
      )
      .map((t) => ({
        id: t._id,
        title: `${t.pickup?.town || 'Pickup'} → ${t.dropoff?.town || 'Destination'}`,
        detail: t.type,
        date: t.scheduledAt,
        status: t.status,
        image: null,
        kind: 'trip',
      }));

    const fromOrders: UpcomingItem[] = data.orders
      .filter((o) => !['cancelled', 'delivered', 'completed', 'rejected'].includes(o.status))
      .map((o) => ({
        id: o._id,
        title: o.restaurantName || 'Food order',
        detail: `${o.status.replace(/_/g, ' ')} · ${o.type}`,
        date: o.createdAt,
        status: o.status,
        image: o.restaurantLogo ?? null,
        kind: 'order',
      }));

    return [...fromBookings, ...fromTrips, ...fromOrders]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [data.bookings, data.trips, data.orders]);

  const latestActivity = data.notifications.slice(0, 3);

  const serviceImage = (title: string): string | null => {
    if (title === 'Accommodation') {
      return (
        data.properties.find((p) => p.coverImage || p.images?.[0])?.coverImage ??
        data.properties.find((p) => p.images?.[0])?.images?.[0] ??
        null
      );
    }
    if (title === 'Food & Drinks') {
      return data.restaurants.find((r) => r.coverImage)?.coverImage ?? null;
    }
    return null;
  };

  const heroImage =
    data.properties.find((p) => p.coverImage || p.images?.[0])?.coverImage ??
    data.properties.find((p) => p.images?.[0])?.images?.[0] ??
    data.restaurants.find((r) => r.coverImage)?.coverImage ??
    null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const goSearch = () => {
    const q = search.trim();
    navigation.navigate('ExploreTab', {
      screen: 'Search',
      params: q ? { q } : undefined,
    });
  };

  const goProperty = (l: FeaturedListing) =>
    navigation.navigate('ExploreTab', {
      screen: 'AccommodationDetail',
      params: { idOrSlug: l.slug },
    });

  const goRestaurant = (l: FeaturedListing) =>
    navigation.navigate('ExploreTab', {
      screen: 'RestaurantDetail',
      params: { idOrSlug: l.slug },
    });

  const goUpcoming = (item: UpcomingItem) => {
    const screen = item.kind === 'booking' ? 'Booking' : item.kind === 'trip' ? 'Trip' : 'Order';
    navigation.navigate('ActivityTab', { screen });
  };

  const services = [
    { title: 'Accommodation', icon: 'bed' as const, screen: 'Accommodation', count: `${data.totals.properties} listings` },
    { title: 'Food & Drinks', icon: 'restaurant' as const, screen: 'Restaurant', count: `${data.totals.restaurants} restaurants` },
    { title: 'Transport', icon: 'car' as const, screen: 'Transport', count: 'Request a ride' },
    { title: 'Payments', icon: 'card' as const, screen: 'Wallet', count: data.wallet ? formatCurrency(data.wallet.balance, data.wallet.currency) : 'Wallet balance' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        {failedSections.length > 0 ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>
              Some data couldn't load: <Text style={{ fontWeight: '700' }}>{failedSections.join(', ')}</Text>
            </Text>
            <Pressable onPress={() => load()} hitSlop={8}>
              <Text style={styles.warnRetry}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.hero}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.primary[800] }]} />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroGreeting}>
              {greeting}
              {customer ? `, ${customer.firstName}` : ''}
            </Text>
            <Text style={styles.heroTitle}>Your Complete{'\n'}Travel Companion</Text>
            <Text style={styles.heroChips}>Accommodation · Food · Transport · Payments</Text>

            <View style={styles.searchBar}>
              <Ionicons name="location" size={18} color={colors.text.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.searchLabel}>Where to?</Text>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  onSubmitEditing={goSearch}
                  placeholder="Search a town or destination"
                  placeholderTextColor="#958C7F"
                  style={styles.searchInput}
                />
              </View>
              <Pressable onPress={goSearch} style={styles.searchBtn}>
                <Ionicons name="search" size={12} color={colors.white} />
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <SectionHeading
          title="Explore Our Services"
          detail="Services and availability from our live marketplace."
        />
        <View style={styles.servicesGrid}>
          {services.map((s) => {
            const image = serviceImage(s.title);
            return (
              <Pressable
                key={s.title}
                onPress={() =>
                  s.screen === 'Wallet'
                    ? navigation.navigate('WalletTab')
                    : navigation.navigate('ExploreTab', { screen: s.screen })
                }
                style={styles.serviceCard}
              >
                <View style={styles.serviceImageWrap}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.serviceImage} />
                  ) : (
                    <View style={styles.servicePlaceholder}>
                      <Ionicons name={s.icon} size={32} color="#A66B2B" />
                    </View>
                  )}
                  <View style={styles.serviceIconBadge}>
                    <Ionicons name={s.icon} size={14} color="#87531D" />
                  </View>
                </View>
                <View style={{ padding: spacing.md, flex: 1 }}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.serviceCount} numberOfLines={1}>
                    {loading ? 'Loading…' : s.count}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                    <Text style={styles.serviceCta}>Explore</Text>
                    <Ionicons name="chevron-forward" size={12} color="#A45F19" />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <SectionHeading
          title="Featured Stays & Dining"
          detail="Highly rated stays and restaurants from our partners."
          action="View all"
          onAction={() => navigation.navigate('ExploreTab', { screen: 'Search' })}
        />
        {featured.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              New stays and experiences are coming soon. Try exploring all destinations.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.lg }}
          >
            {featured.map((f) => (
              <Pressable
                key={`${f.kind}-${f.id}`}
                onPress={() => (f.kind === 'property' ? goProperty(f) : goRestaurant(f))}
                style={styles.featuredCard}
              >
                <View style={styles.featuredImageWrap}>
                  {f.image ? (
                    <Image source={{ uri: f.image }} style={styles.featuredImage} />
                  ) : (
                    <View style={[styles.featuredImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name={f.kind === 'property' ? 'bed' : 'restaurant'} size={24} color="#A66B2B" />
                    </View>
                  )}
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText} numberOfLines={1}>{f.category}</Text>
                  </View>
                </View>
                <View style={{ padding: spacing.md, gap: 3 }}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{f.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location" size={11} color={colors.text.muted} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {f.location || 'Kenya'}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="star" size={11} color="#E9A32C" />
                    <Text style={styles.metaText}>
                      {f.rating.toFixed(1)}
                      {f.totalRatings > 0 ? (
                        <Text style={{ color: colors.text.muted }}> ({f.totalRatings})</Text>
                      ) : null}
                    </Text>
                  </View>
                  {f.price !== undefined && f.currency ? (
                    <Text style={styles.featuredPrice}>
                      {formatCurrency(f.price, f.currency)}
                      <Text style={{ fontWeight: '400', color: colors.text.muted }}> / night</Text>
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <SectionHeading
          title="Explore Destinations"
          detail="Operational locations fetched from the travel network."
          action="Search places"
          onAction={() => navigation.navigate('ExploreTab', { screen: 'Search' })}
        />
        {destinations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No operational destinations available right now.</Text>
          </View>
        ) : (
          <View style={styles.destGrid}>
            {destinations.slice(0, 4).map((loc) => (
              <Pressable
                key={loc._id}
                onPress={() =>
                  navigation.navigate('ExploreTab', {
                    screen: 'Search',
                    params: { town: loc.name },
                  })
                }
                style={styles.destCard}
              >
                <Ionicons name="location" size={18} color="#A66B2B" />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.destName} numberOfLines={1}>{loc.name}</Text>
                  <Text style={styles.destMeta} numberOfLines={1}>{loc.county || loc.type}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.statsBar}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            <Stat icon="bed" value={loading ? '…' : String(data.totals.properties)} label="Stays & lodges" />
            <Stat icon="restaurant" value={loading ? '…' : String(data.totals.restaurants)} label="Dining partners" />
            <Stat icon="location" value={loading ? '…' : String(destinations.length)} label="Available towns" />
            <Stat
              icon="card"
              value={
                data.wallet
                  ? formatCurrency(data.wallet.balance, data.wallet.currency)
                  : loading ? '…' : '—'
              }
              label="Wallet balance"
            />
          </View>
        </View>

        <SectionHeading title="Quick Actions" />
        <View style={styles.quickGrid}>
          <QuickAction icon="bed" label="Book Accommodation" onPress={() => navigation.navigate('ExploreTab', { screen: 'Accommodation' })} />
          <QuickAction icon="restaurant" label="Order Food" onPress={() => navigation.navigate('ExploreTab', { screen: 'Restaurant' })} />
          <QuickAction icon="car" label="Find Transport" onPress={() => navigation.navigate('ExploreTab', { screen: 'Transport' })} />
          <QuickAction icon="compass" label="Explore All" onPress={() => navigation.navigate('ExploreTab')} />
        </View>

        <SectionHeading
          title="Your Trips & Activities"
          action="View all"
          onAction={() => navigation.navigate('ActivityTab')}
        />
        {upcoming.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No upcoming trips yet. Find a stay or experience.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {upcoming.map((a) => (
              <Pressable
                key={`${a.kind}-${a.id}`}
                onPress={() => goUpcoming(a)}
                style={styles.activityRow}
              >
                {a.image ? (
                  <Image source={{ uri: a.image }} style={styles.activityImage} />
                ) : (
                  <View style={[styles.activityImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons
                      name={a.kind === 'trip' ? 'car' : a.kind === 'order' ? 'restaurant' : 'bed'}
                      size={18}
                      color={colors.text.muted}
                    />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.activityTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.activityMeta} numberOfLines={1}>
                    {formatDate(a.date)}{a.detail ? ` · ${a.detail}` : ''}
                  </Text>
                  <View style={styles.activityStatus}>
                    <Text style={styles.activityStatusText}>
                      {a.status.replace(/_/g, ' ')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.walletRow}>
          <View style={styles.walletIcon}>
            <Ionicons name="card" size={16} color="#A66B2B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.walletLabel}>Wallet balance</Text>
            <Text style={styles.walletValue}>
              {loading ? 'Loading…' : data.wallet ? formatCurrency(data.wallet.balance, data.wallet.currency) : 'Unavailable'}
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('WalletTab')} style={styles.walletBtn}>
            <Text style={styles.walletBtnText}>Wallet</Text>
          </Pressable>
        </View>

        <SectionHeading
          title="Recent Updates"
          action={`${data.unreadNotifications} unread`}
          onAction={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })}
        />
        {latestActivity.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {latestActivity.map((n) => (
              <Pressable
                key={n._id}
                onPress={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })}
                style={styles.notifRow}
              >
                <View style={[styles.notifDot, { backgroundColor: n.isRead ? colors.border : colors.secondary[500] }]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark" size={20} color="#A86B27" />
          <Text style={styles.trustText}>
            Trusted local partners, 24/7 support and secure bookings.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({
  title, detail, action, onAction,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.xl }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} hitSlop={6}>
          <Text style={styles.sectionAction}>{action}</Text>
          <Ionicons name="arrow-forward" size={11} color={colors.text.secondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '48%' }}>
      <Ionicons name={icon} size={18} color="#F7A12C" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickCard}>
      <Ionicons name={icon} size={20} color="#F47725" />
      <Text style={styles.quickLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing['3xl'] },

  warnBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  warnText: { flex: 1, fontSize: 11, color: '#78350F' },
  warnRetry: { fontSize: 11, fontWeight: '700', color: '#78350F', textDecorationLine: 'underline' },

  hero: { borderRadius: radius.lg, overflow: 'hidden', minHeight: 280, backgroundColor: colors.primary[800] },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(36,23,14,0.65)' },
  heroContent: { padding: spacing.lg, gap: spacing.xs },
  heroGreeting: { fontSize: 12, fontWeight: '700', color: '#F4A332', letterSpacing: 0.3 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: colors.white, lineHeight: 30, letterSpacing: -0.4, marginTop: 4 },
  heroChips: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.95)', marginTop: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 8,
    marginTop: spacing.md, gap: spacing.sm,
  },
  searchLabel: { fontSize: 10, fontWeight: '700', color: '#30271F' },
  searchInput: { fontSize: 11, color: '#30271F', padding: 0, marginTop: 1 },
  searchBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F58216', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: 999,
  },
  searchBtnText: { fontSize: 11, fontWeight: '700', color: colors.white },

  sectionTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  sectionDetail: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
  sectionAction: { fontSize: 11, fontWeight: '600', color: colors.text.secondary },

  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  serviceCard: {
    flexBasis: '48%',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#E9DDCC', overflow: 'hidden',
    ...shadows.card,
  },
  serviceImageWrap: { height: 110, position: 'relative' },
  serviceImage: { width: '100%', height: 110 },
  servicePlaceholder: {
    width: '100%', height: 110,
    backgroundColor: '#F4E7D4', alignItems: 'center', justifyContent: 'center',
  },
  serviceIconBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  serviceTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  serviceCount: { fontSize: 11, color: colors.text.muted, marginTop: 2, marginBottom: spacing.sm },
  serviceCta: { fontSize: 11, fontWeight: '700', color: '#A45F19' },

  emptyBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
    padding: spacing.lg, marginTop: spacing.sm,
  },
  emptyText: { fontSize: font.sm, color: colors.text.muted, textAlign: 'center' },

  featuredCard: {
    width: 200, backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#EADFCE', overflow: 'hidden',
  },
  featuredImageWrap: { height: 120, position: 'relative' },
  featuredImage: { width: '100%', height: 120 },
  featuredBadge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#238451',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, maxWidth: 100,
  },
  featuredBadgeText: { fontSize: 8, fontWeight: '700', color: colors.white, textTransform: 'capitalize' },
  featuredTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  featuredPrice: { fontSize: 11, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 10, color: colors.text.secondary, flex: 1 },

  destGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  destCard: {
    flexBasis: '48%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: '#EADFCE',
    padding: spacing.md,
  },
  destName: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  destMeta: { fontSize: 10, color: colors.text.muted, marginTop: 1 },

  statsBar: {
    backgroundColor: '#392616', borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.xl,
  },
  statValue: { fontSize: 12, fontWeight: '700', color: colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickCard: {
    flexBasis: '48%',
    backgroundColor: '#FFFDF9', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F0E7DC',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.sm,
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.text.primary, textAlign: 'center' },

  activityRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  activityImage: { width: 56, height: 56, borderRadius: radius.md },
  activityTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  activityMeta: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
  activityStatus: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: '#E4F3E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  activityStatusText: { fontSize: 9, fontWeight: '700', color: '#28744B', textTransform: 'capitalize' },

  walletRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#FFF7EA', borderRadius: radius.lg, borderWidth: 1, borderColor: '#F0E7DC',
    padding: spacing.md, marginTop: spacing.xl,
  },
  walletIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F3E5D2', alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: { fontSize: 10, color: colors.text.muted, fontWeight: '500' },
  walletValue: { fontSize: font.md, fontWeight: '700', color: colors.text.primary, marginTop: 2 },
  walletBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: '#E9DFD2',
  },
  walletBtnText: { fontSize: 11, fontWeight: '600', color: colors.text.secondary },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  notifDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  notifTitle: { fontSize: font.sm, fontWeight: '700', color: colors.text.primary },
  notifBody: { fontSize: 11, color: colors.text.muted, marginTop: 2, lineHeight: 15 },

  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#F7EFE4', borderRadius: radius.lg,
    padding: spacing.lg, marginTop: spacing.xl,
  },
  trustText: { flex: 1, fontSize: font.sm, color: colors.text.secondary },
});