import { parseNoteFile, serializeNoteFile } from '@/vault/frontmatter';
import { resolveNewFilename } from '@/vault/filenames';
import { createNoteFile, deleteNoteFile, listMarkdownFiles, readNoteFile, writeNoteFile } from '@/vault/vaultFs';
import type { NoteContent, NoteFrontmatter, NoteSummary, NoteType } from '@/types/note';

/** Scans the vault root and parses each .md file's frontmatter + title. No
 * caching — fine at a few-hundred-note scale, per the plan; revisit only if
 * it's actually slow. */
export async function listNotes(directoryUri: string): Promise<NoteSummary[]> {
  const files = await listMarkdownFiles(directoryUri);
  const summaries = await Promise.all(
    files.map(async (file): Promise<NoteSummary | null> => {
      try {
        const raw = await readNoteFile(file.uri);
        const { frontmatter, title } = parseNoteFile(raw);
        return {
          uri: file.uri,
          filename: file.name,
          title,
          tags: frontmatter.tags,
          noteType: frontmatter.noteType,
          pinned: frontmatter.pinned,
          updated: frontmatter.updated,
        };
      } catch {
        return null;
      }
    })
  );
  return summaries.filter((s): s is NoteSummary => s !== null);
}

export async function readNote(uri: string, filename: string): Promise<NoteContent> {
  const raw = await readNoteFile(uri);
  const { frontmatter, title, body } = parseNoteFile(raw);
  return { uri, filename, title, frontmatter, body };
}

export async function createNote(
  directoryUri: string,
  title: string,
  noteType: NoteType,
  tags: string[],
  pinned: boolean,
  body: string,
  existingFilenames: ReadonlySet<string>
): Promise<NoteContent> {
  const requestedFilename = resolveNewFilename(existingFilenames);
  const now = new Date().toISOString();
  const frontmatter: NoteFrontmatter = { tags, noteType, pinned, created: now, updated: now };
  const content = serializeNoteFile(frontmatter, title, body);
  const { uri, name: filename } = await createNoteFile(directoryUri, requestedFilename, content);
  return { uri, filename, title, frontmatter, body };
}

export async function saveNote(
  directoryUri: string,
  uri: string,
  filename: string,
  title: string,
  frontmatter: NoteFrontmatter,
  body: string
): Promise<NoteContent> {
  const updated: NoteFrontmatter = { ...frontmatter, updated: new Date().toISOString() };
  const content = serializeNoteFile(updated, title, body);
  const file = await writeNoteFile(directoryUri, uri, filename, content);
  return { uri: file.uri, filename: file.name, title, frontmatter: updated, body };
}

export async function deleteNote(uri: string): Promise<void> {
  await deleteNoteFile(uri);
}
