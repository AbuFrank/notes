# Changelog

## 2026-07-28

Initial build: an Android note-taking app that reads and writes notes directly into an Obsidian
vault folder via Storage Access Framework.

- Vault folder picker with persistent SAF access; note list, editor, and CRUD.
- Multiple tags per note (frontmatter + inline `#hashtags`), with a Tags screen and tag-filtered
  note lists.
- Todo mode: checkbox lines, check-to-bottom ordering on check, per-line delete, drag-to-reorder
  via a handle, new items get keyboard focus automatically.
- Editable note titles at any time, stored as an `# H1` heading in the note body — filenames are
  opaque timestamps assigned once at creation, so editing a title is a normal save, never a
  rename.
- Pin notes into a "Pinned" section at the top of the note list and each tag's filtered list.
- Fixes found while testing on-device: SAF file creation no longer gets a stray `.txt` appended
  to `.md` filenames; note routing uses filename instead of the raw vault URI (which broke on
  reopen); the keyboard no longer covers the last checklist item / "+ Add item" button; patched
  a `react-native-draggable-flatlist` ref-measurement bug via `patch-package`; deleting a
  checklist item wasn't persisting (SAF overwrite left old trailing bytes on shorter writes) —
  saves now delete-and-recreate the note file instead of overwriting in place.
