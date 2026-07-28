// All Storage Access Framework (SAF) calls live in this module. SAF support
// only exists in expo-file-system's legacy API (not the newer File/Directory
// API), so if a future Expo SDK removes it, this is the only file that needs
// to change.
import * as FileSystem from 'expo-file-system/legacy';

const { StorageAccessFramework } = FileSystem;

export interface VaultFile {
  uri: string;
  name: string;
}

/** Prompts the user to pick a folder (e.g. their Obsidian vault) and grants
 * persistent read/write access to it. Returns null if the user cancels. */
export async function requestVaultAccess(): Promise<string | null> {
  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  return result.granted ? result.directoryUri : null;
}

/** SAF returns full content:// child URIs, not bare filenames — this derives
 * the display name from the URI's last path segment. */
export function deriveName(uri: string): string {
  const decoded = decodeURIComponent(uri);
  const segments = decoded.split('/');
  return segments[segments.length - 1] ?? '';
}

/** Lists .md files directly in the vault folder (non-recursive), skipping
 * dotfiles/folders like .obsidian and .trash. */
export async function listMarkdownFiles(directoryUri: string): Promise<VaultFile[]> {
  const uris = await StorageAccessFramework.readDirectoryAsync(directoryUri);
  return uris
    .map((uri) => ({ uri, name: deriveName(uri) }))
    .filter((file) => file.name.toLowerCase().endsWith('.md') && !file.name.startsWith('.'));
}

export async function readNoteFile(uri: string): Promise<string> {
  return StorageAccessFramework.readAsStringAsync(uri);
}

/** Overwrites an existing note by deleting and recreating it rather than
 * writing the new content directly to the old uri. SAF's writeAsStringAsync
 * opens the file in "w" mode, and whether that actually truncates trailing
 * bytes from the previous (longer) content is up to the storage provider —
 * on at least the local storage provider, writing content *shorter* than
 * what's on disk left the old tail behind (e.g. a deleted checklist item
 * reappearing after reopening the note), while same-length or longer writes
 * looked fine. Delete+recreate sidesteps provider truncation behavior
 * entirely since the new document is always empty before it's written. */
export async function writeNoteFile(
  directoryUri: string,
  uri: string,
  filename: string,
  content: string
): Promise<VaultFile> {
  await StorageAccessFramework.deleteAsync(uri);
  const newUri = await StorageAccessFramework.createFileAsync(directoryUri, filename, 'application/octet-stream');
  await StorageAccessFramework.writeAsStringAsync(newUri, content);
  return { uri: newUri, name: deriveName(newUri) };
}

/** Creates a new file in the vault folder and writes its initial content.
 * mimeType is `application/octet-stream` — a generic type with no canonical
 * extension in Android's MimeTypeMap — because some SAF providers (confirmed:
 * the local storage provider) otherwise append their mime type's canonical
 * extension to the filename (e.g. `text/plain` → `.txt`), producing files
 * like `note.md.txt` instead of `note.md`. The actual on-disk name is always
 * re-derived from the returned uri rather than trusted from the request, as
 * a second line of defense against any provider that renames regardless. */
export async function createNoteFile(
  directoryUri: string,
  filename: string,
  content: string
): Promise<VaultFile> {
  const uri = await StorageAccessFramework.createFileAsync(directoryUri, filename, 'application/octet-stream');
  await StorageAccessFramework.writeAsStringAsync(uri, content);
  return { uri, name: deriveName(uri) };
}

export async function deleteNoteFile(uri: string): Promise<void> {
  await StorageAccessFramework.deleteAsync(uri);
}
