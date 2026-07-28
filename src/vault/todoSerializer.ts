import { generateId } from '@/vault/id';
import type { ChecklistItem } from '@/types/note';

const CHECKBOX_LINE_RE = /^-\s\[([ xX])\]\s?(.*)$/;

/** Parses a todo-mode note body into checklist items. Blank lines are
 * dropped; any non-checkbox, non-blank line is kept as an unchecked item
 * rather than silently discarded. */
export function parseChecklist(body: string): ChecklistItem[] {
  return body
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const match = line.match(CHECKBOX_LINE_RE);
      if (match) {
        return { id: generateId(), text: match[2], checked: match[1].toLowerCase() === 'x' };
      }
      return { id: generateId(), text: line.trim(), checked: false };
    });
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return items.map((item) => `- [${item.checked ? 'x' : ' '}] ${item.text}`).join('\n');
}

/** Unchecked items first (original relative order), then checked items
 * (original relative order) — an explicit partition, not a generic sort,
 * so the "checked moves to the bottom" rule is correct by construction. */
export function reorderChecklist(items: ChecklistItem[]): ChecklistItem[] {
  const unchecked = items.filter((item) => !item.checked);
  const checked = items.filter((item) => item.checked);
  return [...unchecked, ...checked];
}
