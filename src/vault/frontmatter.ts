import { dump, load } from 'js-yaml';

import type { NoteFrontmatter, NoteType } from '@/types/note';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const HASHTAG_LINE_RE = /^(\s*#[^\s#]+\s*)+$/;
const TITLE_LINE_RE = /^#\s+(.*)$/;

function normalizeFrontmatter(raw: unknown): NoteFrontmatter {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const noteType: NoteType = record.noteType === 'todo' ? 'todo' : 'note';
  const pinned = record.pinned === true;
  const now = new Date().toISOString();
  return {
    tags,
    noteType,
    pinned,
    created: typeof record.created === 'string' ? record.created : now,
    updated: typeof record.updated === 'string' ? record.updated : now,
  };
}

function buildAnchorLine(tags: string[]): string {
  return tags.map((tag) => `#${tag}`).join(' ');
}

/** Consumes a leading line matching `predicate` plus the blank line after it,
 * returning the consumed line's text (or null if it didn't match) and the
 * remaining lines. */
function consumeLine(
  lines: string[],
  predicate: (line: string) => boolean
): { matched: string | null; rest: string[] } {
  if (lines.length === 0 || !predicate(lines[0])) {
    return { matched: null, rest: lines };
  }
  let rest = lines.slice(1);
  if (rest[0] === '') rest = rest.slice(1);
  return { matched: lines[0], rest };
}

/** Splits a raw markdown file into frontmatter, title, and body. Strips the
 * inline hashtag anchor line (the tags mirror line we write right after
 * frontmatter) and the `# Title` heading line, so callers only ever deal
 * with the note's actual content. */
export function parseNoteFile(content: string): {
  frontmatter: NoteFrontmatter;
  title: string;
  body: string;
} {
  const match = content.match(FRONTMATTER_RE);
  let rest = content;
  let raw: unknown = {};
  if (match) {
    raw = load(match[1]) ?? {};
    rest = content.slice(match[0].length);
  }
  const frontmatter = normalizeFrontmatter(raw);

  let lines = rest.split('\n');
  ({ rest: lines } = consumeLine(lines, (line) => line.trim().length > 0 && HASHTAG_LINE_RE.test(line)));
  const { matched: titleLine, rest: afterTitle } = consumeLine(lines, (line) => TITLE_LINE_RE.test(line));
  const title = titleLine ? (titleLine.match(TITLE_LINE_RE)?.[1] ?? '').trim() : '';

  return { frontmatter, title, body: afterTitle.join('\n') };
}

/** Serializes frontmatter + title + body back into a full markdown file,
 * re-adding the inline hashtag anchor line (tags visible in Obsidian's tag
 * pane) and the `# Title` heading (visible immediately in Obsidian, not just
 * via Properties). */
export function serializeNoteFile(frontmatter: NoteFrontmatter, title: string, body: string): string {
  const fmBlock = dump(frontmatter, { flowLevel: 1, lineWidth: -1 });
  const anchor = buildAnchorLine(frontmatter.tags);
  const anchorBlock = anchor ? `${anchor}\n\n` : '';
  const titleBlock = title.trim() ? `# ${title.trim()}\n\n` : '';
  return `---\n${fmBlock}---\n${anchorBlock}${titleBlock}${body}`;
}
