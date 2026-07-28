# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Architecture notes

- **Vault I/O** goes through `expo-file-system`'s Storage Access Framework, isolated entirely in
  `src/vault/vaultFs.ts`. SAF only exists under the `expo-file-system/legacy` import — the
  package's default export is a newer File/Directory API that doesn't support SAF at all.
- **File creation mimeType is `application/octet-stream`, not `text/plain`.** The local storage
  provider maps `text/plain` to its canonical `.txt` extension and appends it whenever the
  requested filename doesn't already end in `.txt` — so a `.md` file got created as `.md.txt`.
  `application/octet-stream` has no canonical extension, so nothing gets appended.
  `createNoteFile` also always re-derives the real on-disk name from the returned uri rather than
  trusting the requested name, as a second line of defense against any provider doing this.
- **Filenames are opaque timestamps, decoupled from the title.** `resolveNewFilename` in
  `src/vault/filenames.ts` assigns `YY-MM-DD-HH-mm.md` once at creation; it's never touched
  again. The title lives inside the file as an `# H1` heading (parsed/serialized in
  `src/vault/frontmatter.ts`), so editing the title is a normal save — there's no rename
  operation anywhere in this codebase, intentionally, since SAF has no real rename primitive
  (only directory-level `moveAsync`).
- **Routing is by filename, not by the raw `content://` URI.** An earlier version passed the URI
  through `encodeURIComponent`/route params and it broke specifically on reopening a note
  (worked right after creation, failed after navigating back to the list and tapping it again) —
  almost certainly expo-router doing its own encode/decode pass on top of ours, corrupting the
  URI's own `%3A`/`%2F` sequences. `note/[filename].tsx` takes the filename (a safe plain
  string) and looks up the real uri from `VaultContext`'s in-memory note list instead.
- **`react-native-draggable-flatlist` is patched via `patch-package`** (`patches/react-native-draggable-flatlist+4.0.3.patch`,
  applied by the `postinstall` script) — its `NestableDraggableFlatList` measured layout using a
  legacy `findNodeHandle()` numeric handle, which newer React Native's `measureLayout` rejects.
  This library has a real, still-open history of New Architecture problems beyond this one fix
  (see GitHub issues #543/#593/#614/#621 upstream) — if drag-and-drop misbehaves again after a
  dependency bump, suspect this library before assuming it's app code.
- `tsconfig.json` has a `paths` override pointing `react-native-draggable-flatlist` at its
  precompiled `.d.ts` — without it, `tsc` resolves to the package's raw `.tsx` source (via its
  `react-native` package.json field + this project's `bundler`/`customConditions` resolution),
  which fails to typecheck against Reanimated 4's renamed exports even though the bundle itself
  compiles and runs fine.
