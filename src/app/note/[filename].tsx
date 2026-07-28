import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NoteEditor } from '@/components/NoteEditor';
import { useVault } from '@/context/VaultContext';
import { readNote } from '@/vault/noteRepository';
import type { NoteContent } from '@/types/note';

export default function NoteScreen() {
  const { filename } = useLocalSearchParams<{ filename: string }>();
  const { directoryUri, notes, isLoading } = useVault();
  const [content, setContent] = useState<NoteContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summary = notes.find((n) => n.filename === filename);

  useEffect(() => {
    if (!summary) return;
    readNote(summary.uri, summary.filename)
      .then(setContent)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load note.'));
  }, [summary]);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!summary && !isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Note not found.</Text>
      </View>
    );
  }

  if (!content || !directoryUri) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NoteEditor
      directoryUri={directoryUri}
      isNew={false}
      initialUri={content.uri}
      initialFilename={content.filename}
      initialTitle={content.title}
      initialFrontmatter={content.frontmatter}
      initialBody={content.body}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#c0392b', textAlign: 'center' },
});
