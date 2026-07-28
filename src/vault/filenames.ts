const ILLEGAL_CHARS_RE = /[/\\:*?"<>|]/g;
const MAX_LENGTH = 100;

export function sanitizeTitle(title: string): string {
  const cleaned = title.replace(ILLEGAL_CHARS_RE, '').replace(/\s+/g, ' ').trim();
  const base = cleaned.length > 0 ? cleaned : 'Untitled';
  return base.slice(0, MAX_LENGTH);
}

export function titleFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '');
}

/** Resolves "Title.md" to a non-colliding filename against a set of
 * filenames already present in the vault ("Title 1.md", "Title 2.md", ...). */
export function resolveFilename(title: string, existingFilenames: ReadonlySet<string>): string {
  const base = sanitizeTitle(title);
  let candidate = `${base}.md`;
  let counter = 1;
  while (existingFilenames.has(candidate)) {
    candidate = `${base} ${counter}.md`;
    counter += 1;
  }
  return candidate;
}
