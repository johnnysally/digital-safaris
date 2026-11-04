import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, Pressable, RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '../../api';
import { colors, font, spacing, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils/formatCurrency';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Alert from '../../components/ui/Alert';
import EmptyState from '../../components/ui/EmptyState';
import type { PropertyDetails, PropertyRoom } from '../../types';

const { width: SCREEN_W } = Dimensions.get('window');

function bedsLabel(room: PropertyRoom): string {
  if (!room.beds?.length) return '';
  return room.beds.map((bed) => `${bed.count}× ${bed.type}`).join(', ');
}

function RoomCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const current = total > 0 ? images[Math.min(index, total - 1)] : null;

  const go = (delta: number) => {
    if (total === 0) return;
    setIndex((prev) => (prev + delta + total) % total);
  };

  return (
    <View style={styles.carousel}>
      {current ? (
        <Image source={{ uri: current }} style={styles.carouselImage} resizeMode="cover" />
      ) : (
        <View style={[styles.carouselImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="image-outline" size={32} color={colors.text.muted} />
        </View>
      )}

      {total > 1 ? (
        <>
          <Pressable onPress={() => go(-1)} style={[styles.carouselBtn, { left: 8 }]} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => go(1)} style={[styles.carouselBtn, { right: 8 }]} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={colors.white} />
          </Pressable>
          <View style={styles.carouselDots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

export default function AccommodationDetail({ navigation, route }: any) {
  const idOrSlug = route?.params?.idOrSlug;
  const [data, setData] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (isRefresh = false) => {
    if (!idOrSlug) { setError('Missing property reference.'); setLoading(false); return; }
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const res = await searchApi.propertyDetails(idOrSlug);
      setData(res);
    } catch {
      setError('Could not load this property.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOrSlug]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <Alert variant="danger" title="Property not available">
            {error ?? 'This property could not be found.'}
          </Alert>
          <Button
            title="Back to stays"
            variant="ghost"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.text.primary} />}
            onPress={() => navigation.goBack()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const { property } = data;
  const cover = property.coverImage || property.images?.[0] || property.partner?.logo || null;
  const reviewLabel =
    property.totalRatings > 0
      ? `${property.totalRatings} review${property.totalRatings === 1 ? '' : 's'}`
      : 'No reviews yet';

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
        <View style={styles.heroWrap}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={48} color={colors.text.muted} />
            </View>
          )}

          {property.isFeatured ? (
            <View style={styles.heroFeatured}>
              <Text style={styles.heroBadgeText}>FEATURED</Text>
            </View>
          ) : null}

          <View style={styles.heroType}>
            <Text style={styles.heroBadgeText}>{property.type}</Text>
          </View>
        </View>

        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <View>
            <Text style={styles.title}>{property.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs }}>
              <Ionicons name="location" size={14} color={colors.text.muted} />
              <Text style={styles.meta} numberOfLines={2}>
                {property.address ? `${property.address}, ` : ''}{property.town}
              </Text>
            </View>
            {property.partner?.name ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="business" size={12} color={colors.text.muted} />
                <Text style={styles.metaSmall}>Managed by {property.partner.name}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={14} color={colors.secondary[500]} />
              <Text style={styles.meta}>
                {property.rating.toFixed(1)}
                <Text style={{ color: colors.text.muted }}> ({reviewLabel})</Text>
              </Text>
            </View>
            {property.roomTypes > 0 ? (
              <Badge variant="neutral">
                {property.roomTypes} room type{property.roomTypes === 1 ? '' : 's'} · {property.roomUnits} unit{property.roomUnits === 1 ? '' : 's'}
              </Badge>
            ) : null}
          </View>

          {property.description ? (
            <Text style={styles.description}>{property.description}</Text>
          ) : null}

          {property.amenities && property.amenities.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {property.amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.timesRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={colors.text.muted} />
              <Text style={styles.metaSmall}>Check-in from {property.checkInTime}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="time-outline" size={13} color={colors.text.muted} />
              <Text style={styles.metaSmall}>Check-out by {property.checkOutTime}</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xs }}>
          <Text style={styles.sectionTitle}>AVAILABLE ROOMS</Text>
          <Text style={styles.metaSmall}>Choose a room type to start your booking.</Text>
        </View>

        {property.rooms.length === 0 ? (
          <View style={{ padding: spacing.lg }}>
            <Alert variant="info" title="No rooms published yet">
              This property has not published any rooms. Check back soon.
            </Alert>
          </View>
        ) : (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            {property.rooms.map((room) => {
              const beds = bedsLabel(room);
              const roomImages = room.images?.length ? room.images : cover ? [cover] : [];

              return (
                <View key={room._id} style={styles.roomCard}>
                  <RoomCarousel images={roomImages} alt={room.name} />

                  <View style={{ padding: spacing.lg, gap: spacing.sm }}>
                    <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
                    {room.description ? (
                      <Text style={styles.metaSmall} numberOfLines={2}>{room.description}</Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people" size={13} color={colors.text.muted} />
                        <Text style={styles.metaSmall}>{room.capacity} guest{room.capacity === 1 ? '' : 's'}</Text>
                      </View>
                      {beds ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="bed" size={13} color={colors.text.muted} />
                          <Text style={styles.metaSmall}>{beds}</Text>
                        </View>
                      ) : null}
                      <Text style={styles.metaSmall}>{room.totalUnits} unit{room.totalUnits === 1 ? '' : 's'}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 10, color: colors.text.muted }}>From</Text>
                        <Text style={{ fontSize: font.sm, fontWeight: '700', color: colors.text.primary }} numberOfLines={1}>
                          {formatCurrency(room.basePrice, room.currency)}
                          <Text style={{ fontWeight: '400', fontSize: 10, color: colors.text.muted }}> / night</Text>
                        </Text>
                      </View>
                      <Button
                        title="Book"
                        size="sm"
                        onPress={() =>
                          navigation.navigate('AccommodationBooking', {
                            idOrSlug: property.slug || property._id,
                            roomId: room._id,
                          })
                        }
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing['3xl'] },
  heroWrap: { position: 'relative', height: 260 },
  heroImage: { width: '100%', height: 260 },
  heroFeatured: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: colors.secondary[500],
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  heroType: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(34,132,81,0.92)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white, letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: font['2xl'], fontWeight: '700', color: colors.text.primary, letterSpacing: -0.4 },
  meta: { fontSize: font.sm, color: colors.text.secondary, flex: 1 },
  metaSmall: { fontSize: font.xs, color: colors.text.muted },
  description: { fontSize: font.sm, color: colors.text.secondary, lineHeight: 20 },
  amenityChip: { backgroundColor: 'rgba(119,104,85,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  amenityText: { fontSize: 11, fontWeight: '600', color: colors.text.muted },
  timesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.text.muted, letterSpacing: 1.2 },
  roomCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadows.card },
  roomName: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  carousel: { position: 'relative', height: 160 },
  carouselImage: { width: '100%', height: 160 },
  carouselBtn: {
    position: 'absolute', top: '50%', marginTop: -16,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  carouselDots: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: colors.white },
});