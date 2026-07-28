import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { NoteListItem } from '@/components/NoteListItem';
import { useVault } from '@/context/VaultContext';

export default function TagNotesScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { tagsIndex } = useVault();

  const notes = useMemo(() => tagsIndex.get(tag ?? '') ?? [], [tagsIndex, tag]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `#${tag}` }} />
      {notes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No notes tagged #{tag}.</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => <NoteListItem note={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 15, textAlign: 'center', opacity: 0.7 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#00000022' },
});
