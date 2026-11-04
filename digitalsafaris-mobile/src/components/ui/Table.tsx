import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, font, radius } from '../../theme';

export interface Column<T> {
  key: string;
  header: string;
  width?: number;
  render?: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowKey: (row: T) => string;
}

export default function Table<T>({
  columns,
  data,
  loading,
  emptyState,
  rowKey,
}: TableProps<T>) {
  if (loading) {
    return (
      <View style={{ padding: 16, gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={{ height: 40, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm }} />
        ))}
      </View>
    );
  }
  if (data.length === 0) {
    return <View style={{ padding: 16 }}>{emptyState ?? <Text style={styles.empty}>No records</Text>}</View>;
  }

  return (
    <View>
      <View style={styles.header}>
        {columns.map((c) => (
          <Text key={c.key} style={[styles.th, c.width ? { width: c.width } : { flex: 1 }]}>
            {c.header}
          </Text>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(r) => rowKey(r)}
        renderItem={({ item }) => (
          <View style={styles.tr}>
            {columns.map((c) => (
              <View key={c.key} style={[c.width ? { width: c.width } : { flex: 1 }]}>
                {c.render ? (
                  c.render(item)
                ) : (
                  <Text style={styles.tdText}>
                    {String((item as any)[c.key] ?? '—')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: { fontSize: 11, fontWeight: '600', color: colors.text.muted, textTransform: 'uppercase' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  tdText: { fontSize: font.sm, color: colors.text.primary },
  empty: { textAlign: 'center', fontSize: font.sm, color: colors.text.muted, paddingVertical: 24 },
});