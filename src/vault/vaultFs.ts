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
function deriveName(uri: string): string {
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

export async function writeNoteFile(uri: string, content: string): Promise<void> {
  await StorageAccessFramework.writeAsStringAsync(uri, content);
}

/** Creates a new file in the vault folder and writes its initial content.
 * mimeType is fixed to text/plain since some SAF providers rename files to
 * match a recognized mime type's default extension. */
export async function createNoteFile(
  directoryUri: string,
  filename: string,
  content: string
): Promise<string> {
  const uri = await StorageAccessFramework.createFileAsync(directoryUri, filename, 'text/plain');
  await StorageAccessFramework.writeAsStringAsync(uri, content);
  return uri;
}

export async function deleteNoteFile(uri: string): Promise<void> {
  await StorageAccessFramework.deleteAsync(uri);
}
