import React from 'react';
import { Pressable, ScrollView, Text, StyleSheet } from 'react-native';
import { colors, font } from '../../theme';

export interface Tab {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 4 }}
    >
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.secondary[500] },
  label: { fontSize: font.sm, fontWeight: '600', color: colors.text.muted },
  labelActive: { color: colors.secondary[600] },
});