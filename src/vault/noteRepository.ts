import { parseNoteFile, serializeNoteFile } from '@/vault/frontmatter';
import { resolveFilename, titleFromFilename } from '@/vault/filenames';
import { createNoteFile, deleteNoteFile, listMarkdownFiles, readNoteFile, writeNoteFile } from '@/vault/vaultFs';
import type { NoteContent, NoteFrontmatter, NoteSummary, NoteType } from '@/types/note';

/** Scans the vault root and parses each .md file's frontmatter. No caching —
 * fine at a few-hundred-note scale, per the plan; revisit only if it's
 * actually slow. */
export async function listNotes(directoryUri: string): Promise<NoteSummary[]> {
  const files = await listMarkdownFiles(directoryUri);
  const summaries = await Promise.all(
    files.map(async (file): Promise<NoteSummary | null> => {
      try {
        const raw = await readNoteFile(file.uri);
        const { frontmatter } = parseNoteFile(raw);
        return {
          uri: file.uri,
          filename: file.name,
          title: titleFromFilename(file.name),
          tags: frontmatter.tags,
          noteType: frontmatter.noteType,
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
  const { frontmatter, body } = parseNoteFile(raw);
  return { uri, filename, title: titleFromFilename(filename), frontmatter, body };
}

export async function createNote(
  directoryUri: string,
  title: string,
  noteType: NoteType,
  tags: string[],
  body: string,
  existingFilenames: ReadonlySet<string>
): Promise<NoteContent> {
  const filename = resolveFilename(title, existingFilenames);
  const now = new Date().toISOString();
  const frontmatter: NoteFrontmatter = { tags, noteType, created: now, updated: now };
  const content = serializeNoteFile(frontmatter, body);
  const uri = await createNoteFile(directoryUri, filename, content);
  return { uri, filename, title: titleFromFilename(filename), frontmatter, body };
}

export async function saveNote(
  uri: string,
  filename: string,
  frontmatter: NoteFrontmatter,
  body: string
): Promise<NoteContent> {
  const updated: NoteFrontmatter = { ...frontmatter, updated: new Date().toISOString() };
  const content = serializeNoteFile(updated, body);
  await writeNoteFile(uri, content);
  return { uri, filename, title: titleFromFilename(filename), frontmatter: updated, body };
}

export async function deleteNote(uri: string): Promise<void> {
  await deleteNoteFile(uri);
}
