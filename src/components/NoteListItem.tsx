import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NoteSummary } from '@/types/note';

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NoteListItem({ note }: { note: NoteSummary }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: '/note/[uri]',
          params: { uri: encodeURIComponent(note.uri), filename: note.filename },
        })
      }>
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {note.noteType === 'todo' ? '☑ ' : ''}
          {note.title}
        </Text>
        {note.tags.length > 0 && (
          <Text style={styles.rowTags} numberOfLines={1}>
            {note.tags.map((t) => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
      <Text style={styles.rowDate}>{formatUpdated(note.updated)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowMain: { flex: 1, marginRight: 8, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowTags: { fontSize: 13, opacity: 0.6 },
  rowDate: { fontSize: 12, opacity: 0.5 },
});
