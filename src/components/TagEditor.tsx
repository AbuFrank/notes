import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#/, '').replace(/\s+/g, '-').toLowerCase();
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const normalized = normalizeTag(draft);
    if (normalized.length === 0) {
      setDraft('');
      return;
    }
    if (!tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <View style={styles.container}>
      <View style={styles.chips}>
        {tags.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>#{tag}</Text>
            <Pressable onPress={() => removeTag(tag)} hitSlop={8}>
              <Text style={styles.chipRemove}>×</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Add a tag"
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={addTag}
        onBlur={addTag}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3f51b522',
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 4,
  },
  chipText: { fontSize: 13, color: '#3f51b5', fontWeight: '500' },
  chipRemove: { fontSize: 16, color: '#3f51b5', paddingHorizontal: 4, lineHeight: 16 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000033',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
});
