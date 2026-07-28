import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import { TagEditor } from '@/components/TagEditor';
import { useVault } from '@/context/VaultContext';
import { useAutosave } from '@/hooks/useAutosave';
import { generateId } from '@/vault/id';
import { createNote, deleteNote, saveNote } from '@/vault/noteRepository';
import { parseChecklist, reorderChecklist, serializeChecklist } from '@/vault/todoSerializer';
import type { ChecklistItem, NoteFrontmatter, NoteType } from '@/types/note';

interface NoteEditorProps {
  directoryUri: string;
  isNew: boolean;
  initialUri?: string;
  initialFilename?: string;
  initialTitle?: string;
  initialFrontmatter?: NoteFrontmatter;
  initialBody?: string;
}

function isEmptyContent(
  title: string,
  tags: string[],
  noteType: NoteType,
  items: ChecklistItem[],
  plainBody: string
): boolean {
  const bodyEmpty = noteType === 'todo' ? items.length === 0 : plainBody.trim().length === 0;
  return title.trim().length === 0 && tags.length === 0 && bodyEmpty;
}

export function NoteEditor({
  directoryUri,
  isNew,
  initialUri,
  initialFilename,
  initialTitle,
  initialFrontmatter,
  initialBody,
}: NoteEditorProps) {
  const router = useRouter();
  const { notes, upsertNoteSummary, removeNoteSummary } = useVault();

  const [title, setTitle] = useState(initialTitle ?? '');
  const [tags, setTags] = useState<string[]>(initialFrontmatter?.tags ?? []);
  const [noteType, setNoteType] = useState<NoteType>(initialFrontmatter?.noteType ?? 'note');
  const [plainBody, setPlainBody] = useState(
    (initialFrontmatter?.noteType ?? 'note') === 'note' ? initialBody ?? '' : ''
  );
  const [items, setItems] = useState<ChecklistItem[]>(
    (initialFrontmatter?.noteType ?? 'note') === 'todo' ? parseChecklist(initialBody ?? '') : []
  );
  const [pinned, setPinned] = useState(initialFrontmatter?.pinned ?? false);

  const fileRef = useRef<{ uri: string; filename: string } | null>(
    isNew ? null : { uri: initialUri!, filename: initialFilename! }
  );
  const createdAtRef = useRef<string | null>(initialFrontmatter?.created ?? null);
  // Mirrors fileRef.current's presence for rendering (title editability, header
  // title) — refs can't be read during render, so this state drives the UI.
  const [isPersisted, setIsPersisted] = useState(!isNew);

  const performSave = useCallback(async () => {
    if (!directoryUri) return;
    const body = noteType === 'todo' ? serializeChecklist(items) : plainBody;

    if (!fileRef.current) {
      if (isEmptyContent(title, tags, noteType, items, plainBody)) return;
      const existingFilenames = new Set(notes.map((n) => n.filename));
      const created = await createNote(directoryUri, title, noteType, tags, pinned, body, existingFilenames);
      fileRef.current = { uri: created.uri, filename: created.filename };
      createdAtRef.current = created.frontmatter.created;
      setIsPersisted(true);
      upsertNoteSummary({
        uri: created.uri,
        filename: created.filename,
        title: created.title,
        tags: created.frontmatter.tags,
        noteType: created.frontmatter.noteType,
        pinned: created.frontmatter.pinned,
        updated: created.frontmatter.updated,
      });
      return;
    }

    const frontmatter: NoteFrontmatter = {
      tags,
      noteType,
      pinned,
      created: createdAtRef.current ?? new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    const saved = await saveNote(
      directoryUri,
      fileRef.current.uri,
      fileRef.current.filename,
      title,
      frontmatter,
      body
    );
    fileRef.current = { uri: saved.uri, filename: saved.filename };
    upsertNoteSummary({
      uri: saved.uri,
      filename: saved.filename,
      title: saved.title,
      tags: saved.frontmatter.tags,
      noteType: saved.frontmatter.noteType,
      pinned: saved.frontmatter.pinned,
      updated: saved.frontmatter.updated,
    });
  }, [directoryUri, title, tags, noteType, pinned, items, plainBody, notes, upsertNoteSummary]);

  const { flush } = useAutosave(performSave, [title, tags, noteType, pinned, plainBody, items]);

  // Pin toggles flush right away (once the state update has actually
  // committed) instead of waiting out the debounce, since it's a discrete
  // action the user expects to see reflected in the list section promptly.
  const pinnedMountedRef = useRef(false);
  useEffect(() => {
    if (!pinnedMountedRef.current) {
      pinnedMountedRef.current = true;
      return;
    }
    flush();
  }, [pinned, flush]);

  const togglePinned = () => setPinned((prev) => !prev);

  useFocusEffect(
    useCallback(() => {
      return () => {
        flush();
      };
    }, [flush])
  );

  const handleToggleType = () => {
    if (noteType === 'note') {
      setItems(parseChecklist(plainBody));
      setNoteType('todo');
    } else {
      setPlainBody(serializeChecklist(items));
      setNoteType('note');
    }
  };

  const toggleChecked = (id: string) => {
    setItems((prev) =>
      reorderChecklist(prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)))
    );
  };

  const updateItemText = (id: string, text: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const pendingFocusIdRef = useRef<string | null>(null);

  const addItem = () => {
    const id = generateId();
    pendingFocusIdRef.current = id;
    setItems((prev) => reorderChecklist([...prev, { id, text: '', checked: false }]));
  };

  const renderChecklistItem = ({ item, drag, isActive }: RenderItemParams<ChecklistItem>) => (
    <View style={[styles.checklistRow, isActive && styles.checklistRowActive]}>
      <Pressable onPress={() => toggleChecked(item.id)} style={styles.checkbox} hitSlop={8}>
        <Text style={styles.checkboxMark}>{item.checked ? '☑' : '☐'}</Text>
      </Pressable>
      <TextInput
        ref={(el) => {
          if (el && pendingFocusIdRef.current === item.id) {
            el.focus();
            pendingFocusIdRef.current = null;
          }
        }}
        style={[styles.checklistText, item.checked && styles.checklistTextChecked]}
        value={item.text}
        onChangeText={(text) => updateItemText(item.id, text)}
        placeholder="List item"
        multiline
      />
      <Pressable onPress={() => deleteItem(item.id)} hitSlop={8} style={styles.deleteItemButton}>
        <Text style={styles.deleteItemText}>×</Text>
      </Pressable>
      <Pressable
        onLongPress={drag}
        delayLongPress={150}
        disabled={isActive}
        hitSlop={8}
        style={styles.dragHandle}>
        <Text style={styles.dragHandleText}>⠿</Text>
      </Pressable>
    </View>
  );

  const handleDelete = () => {
    Alert.alert('Delete note?', fileRef.current ? 'This deletes the file from your vault.' : undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (fileRef.current) {
            await deleteNote(fileRef.current.uri);
            removeNoteSummary(fileRef.current.uri);
          }
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <Stack.Screen
        options={{
          title: isPersisted ? 'Note' : 'New Note',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable onPress={togglePinned} hitSlop={8}>
                <Text style={styles.pinText}>{pinned ? '📌' : '📍'}</Text>
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <NestableScrollContainer
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        <TagEditor tags={tags} onChange={setTags} />

        <View style={styles.todoToggleRow}>
          <Text style={styles.todoToggleLabel}>Todo mode</Text>
          <Switch value={noteType === 'todo'} onValueChange={handleToggleType} />
        </View>

        {noteType === 'todo' ? (
          <View style={styles.checklist}>
            <NestableDraggableFlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderChecklistItem}
              onDragEnd={({ data }) => setItems(data)}
            />
            <Pressable onPress={addItem} style={styles.addItemButton}>
              <Text style={styles.addItemText}>+ Add item</Text>
            </Pressable>
          </View>
        ) : (
          <TextInput
            style={styles.bodyInput}
            placeholder="Note"
            value={plainBody}
            onChangeText={setPlainBody}
            multiline
            textAlignVertical="top"
          />
        )}
      </NestableScrollContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: 16 },
  // Extra bottom space so the last checklist item / "+ Add item" button can
  // be scrolled up above the keyboard instead of staying hidden behind it.
  scrollContent: { paddingBottom: 300 },
  headerButtons: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  pinText: { fontSize: 17 },
  deleteText: { color: '#c0392b', fontSize: 15 },
  titleInput: { fontSize: 22, fontWeight: '600', paddingVertical: 8, marginBottom: 8 },
  todoToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 4,
  },
  todoToggleLabel: { fontSize: 15, fontWeight: '500' },
  bodyInput: { fontSize: 16, minHeight: 300, paddingTop: 8, lineHeight: 22 },
  checklist: { gap: 4, marginTop: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistRowActive: { backgroundColor: '#3f51b511', borderRadius: 8 },
  checkbox: { padding: 4 },
  checkboxMark: { fontSize: 20 },
  checklistText: { flex: 1, fontSize: 16, paddingVertical: 8 },
  checklistTextChecked: { textDecorationLine: 'line-through', opacity: 0.5 },
  deleteItemButton: { padding: 8 },
  deleteItemText: { fontSize: 20, opacity: 0.5 },
  dragHandle: { padding: 8 },
  dragHandleText: { fontSize: 18, opacity: 0.4 },
  addItemButton: { paddingVertical: 12 },
  addItemText: { fontSize: 15, color: '#3f51b5', fontWeight: '500' },
});
