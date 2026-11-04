import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, font, radius } from '../../theme';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <View style={styles.row}>
      <Pressable
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
        style={[styles.btn, page <= 1 && { opacity: 0.4 }]}
      >
        <Text style={styles.btnText}>Prev</Text>
      </Pressable>
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const gap = prev && p - prev > 1;
        const active = p === page;
        return (
          <View key={p} style={styles.row}>
            {gap ? <Text style={{ color: colors.text.muted }}>…</Text> : null}
            <Pressable
              onPress={() => onChange(p)}
              style={[styles.num, active && styles.numActive]}
            >
              <Text style={[styles.numText, active && { color: colors.white }]}>{p}</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable
        disabled={page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={[styles.btn, page >= totalPages && { opacity: 0.4 }]}
      >
        <Text style={styles.btnText}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', justifyContent: 'center', paddingVertical: 12 },
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  btnText: { fontSize: font.xs, fontWeight: '600', color: colors.text.secondary },
  num: { minWidth: 30, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  numActive: { backgroundColor: colors.secondary[500] },
  numText: { fontSize: font.xs, fontWeight: '600', color: colors.text.primary },
});