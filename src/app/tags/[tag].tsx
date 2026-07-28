import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { NoteListItem } from '@/components/NoteListItem';
import { useVault } from '@/context/VaultContext';
import { splitPinned } from '@/vault/sorting';

export default function TagNotesScreen() {
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const { tagsIndex } = useVault();

  const notes = useMemo(() => tagsIndex.get(tag ?? '') ?? [], [tagsIndex, tag]);
  const sections = useMemo(() => {
    const { pinned, rest } = splitPinned(notes);
    return pinned.length > 0
      ? [
          { title: 'Pinned', data: pinned },
          { title: 'Notes', data: rest },
        ]
      : [{ title: '', data: rest }];
  }, [notes]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `#${tag}` }} />
      {notes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No notes tagged #{tag}.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.uri}
          renderItem={({ item }) => <NoteListItem note={item} />}
          renderSectionHeader={({ section }) =>
            section.title ? (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            ) : null
          }
          stickySectionHeadersEnabled={false}
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#00000022' },
});
