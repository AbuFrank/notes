function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function timestampBase(date: Date): string {
  return [
    pad(date.getFullYear() % 100),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('-');
}

/** Filenames are opaque, chronologically-sortable timestamps, independent of
 * the note's title (which lives inside the file as an H1 heading and can be
 * edited freely without ever renaming the file). Collisions — two notes
 * created in the same minute — get a numeric suffix. */
export function resolveNewFilename(existingFilenames: ReadonlySet<string>, date = new Date()): string {
  const base = timestampBase(date);
  let candidate = `${base}.md`;
  let counter = 1;
  while (existingFilenames.has(candidate)) {
    candidate = `${base}-${counter}.md`;
    counter += 1;
  }
  return candidate;
}
