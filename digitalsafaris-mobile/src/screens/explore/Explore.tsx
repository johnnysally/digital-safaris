import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, spacing, radius, shadows } from '../../theme';

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; screen: string }[] = [
  { icon: 'bed', title: 'Accommodation', subtitle: 'Verified stays across Kenya', screen: 'Accommodation' },
  { icon: 'restaurant', title: 'Restaurants', subtitle: 'Order from local kitchens', screen: 'Restaurant' },
  { icon: 'car-sport', title: 'Transport', subtitle: 'Request a ride with upfront fare', screen: 'Transport' },
  { icon: 'sparkles', title: 'AI Concierge', subtitle: 'Ask anything travel-related', screen: 'AiConcierge' },
  { icon: 'search', title: 'Search', subtitle: 'Find stays, food, and places', screen: 'Search' },
];

export default function Explore({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>Discover stays, food, transport, and more.</Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={styles.card}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.secondary[600]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </Pressable>
          ))}
        </View>
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: font.md, fontWeight: '700', color: colors.text.primary },
  cardSubtitle: { fontSize: font.xs, color: colors.text.muted, marginTop: 2 },
});