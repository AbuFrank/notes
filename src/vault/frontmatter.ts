import { dump, load } from 'js-yaml';

import type { NoteFrontmatter, NoteType } from '@/types/note';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const HASHTAG_LINE_RE = /^(\s*#[^\s#]+\s*)+$/;

function normalizeFrontmatter(raw: unknown): NoteFrontmatter {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const noteType: NoteType = record.noteType === 'todo' ? 'todo' : 'note';
  const now = new Date().toISOString();
  return {
    tags,
    noteType,
    created: typeof record.created === 'string' ? record.created : now,
    updated: typeof record.updated === 'string' ? record.updated : now,
  };
}

function buildAnchorLine(tags: string[]): string {
  return tags.map((tag) => `#${tag}`).join(' ');
}

/** Splits a raw markdown file into frontmatter + body, stripping the inline
 * hashtag anchor line (the tags mirror line we write right after
 * frontmatter) so callers only ever deal with the note's actual content. */
export function parseNoteFile(content: string): { frontmatter: NoteFrontmatter; body: string } {
  const match = content.match(FRONTMATTER_RE);
  let rest = content;
  let raw: unknown = {};
  if (match) {
    raw = load(match[1]) ?? {};
    rest = content.slice(match[0].length);
  }
  const frontmatter = normalizeFrontmatter(raw);

  const lines = rest.split('\n');
  let body = rest;
  if (lines.length > 0 && lines[0].trim().length > 0 && HASHTAG_LINE_RE.test(lines[0])) {
    body = lines.slice(1).join('\n').replace(/^\n/, '');
  }
  return { frontmatter, body };
}

/** Serializes frontmatter + body back into a full markdown file, re-adding
 * the inline hashtag anchor line so tags are visible in Obsidian's tag pane
 * even though the source of truth is the frontmatter `tags` list. */
export function serializeNoteFile(frontmatter: NoteFrontmatter, body: string): string {
  const fmBlock = dump(frontmatter, { flowLevel: 1, lineWidth: -1 });
  const anchor = buildAnchorLine(frontmatter.tags);
  const anchorBlock = anchor ? `${anchor}\n\n` : '';
  return `---\n${fmBlock}---\n${anchorBlock}${body}`;
}
