import type { NoteSummary } from '@/types/note';

function byUpdatedDesc(a: NoteSummary, b: NoteSummary): number {
  return a.updated < b.updated ? 1 : -1;
}

export function splitPinned(notes: NoteSummary[]): { pinned: NoteSummary[]; rest: NoteSummary[] } {
  const pinned = notes.filter((n) => n.pinned).sort(byUpdatedDesc);
  const rest = notes.filter((n) => !n.pinned).sort(byUpdatedDesc);
  return { pinned, rest };
}
