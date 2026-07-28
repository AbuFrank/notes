import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { NoteListItem } from '@/components/NoteListItem';
import { useVault } from '@/context/VaultContext';
import { splitPinned } from '@/vault/sorting';

export default function NoteListScreen() {
  const { directoryUri, isLoading, error, notes, connectVault, reload } = useVault();
  const router = useRouter();

  const sections = useMemo(() => {
    const { pinned, rest } = splitPinned(notes);
    return pinned.length > 0
      ? [
          { title: 'Pinned', data: pinned },
          { title: 'Notes', data: rest },
        ]
      : [{ title: '', data: rest }];
  }, [notes]);

  if (!directoryUri) {
    return (
      <View style={styles.centered}>
        <Text style={styles.onboardingTitle}>Connect your Obsidian vault</Text>
        <Text style={styles.onboardingBody}>
          Pick the folder (your vault, or a subfolder of it) where notes created here should be
          saved as .md files.
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable style={styles.primaryButton} onPress={connectVault}>
          <Text style={styles.primaryButtonText}>Choose folder</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={() => router.push('/tags')} hitSlop={8}>
                <Text style={styles.headerButtonText}>Tags</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/note/new')} hitSlop={8}>
                <Text style={styles.headerButtonTextBold}>+ New</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      {isLoading && notes.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.primaryButton} onPress={connectVault}>
            <Text style={styles.primaryButtonText}>Re-pick folder</Text>
          </Pressable>
        </View>
      ) : notes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.onboardingBody}>No notes yet. Tap + New to create one.</Text>
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
          onRefresh={reload}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  onboardingTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  onboardingBody: { fontSize: 15, textAlign: 'center', opacity: 0.7 },
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center' },
  primaryButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  primaryButtonText: { color: 'white', fontWeight: '600' },
  headerButtons: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  headerButtonText: { fontSize: 15, opacity: 0.8 },
  headerButtonTextBold: { fontSize: 15, fontWeight: '700', color: '#3f51b5' },
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
