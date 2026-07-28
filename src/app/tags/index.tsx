import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useVault } from '@/context/VaultContext';

export default function TagListScreen() {
  const { tagsIndex } = useVault();
  const router = useRouter();

  const tags = useMemo(
    () =>
      Array.from(tagsIndex.entries())
        .map(([tag, notes]) => ({ tag, count: notes.length }))
        .sort((a, b) => a.tag.localeCompare(b.tag)),
    [tagsIndex]
  );

  if (tags.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No tags yet. Add tags to a note to see them here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tags}
      keyExtractor={(item) => item.tag}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/tags/${item.tag}`)}>
          <Text style={styles.tagText}>#{item.tag}</Text>
          <Text style={styles.countText}>{item.count}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center', opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tagText: { fontSize: 16, fontWeight: '500', color: '#3f51b5' },
  countText: { fontSize: 14, opacity: 0.5 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#00000022' },
});
