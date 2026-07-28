export type NoteType = 'note' | 'todo';

export interface NoteFrontmatter {
  tags: string[];
  noteType: NoteType;
  pinned: boolean;
  created: string;
  updated: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

/** Lightweight entry used for the note list and tag index. */
export interface NoteSummary {
  uri: string;
  filename: string;
  title: string;
  tags: string[];
  noteType: NoteType;
  pinned: boolean;
  updated: string;
}

/** Full note content, loaded when opening a note in the editor. */
export interface NoteContent {
  uri: string;
  filename: string;
  title: string;
  frontmatter: NoteFrontmatter;
  body: string;
}
