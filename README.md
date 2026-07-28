# Notes

An Android note-taking app (Expo / React Native) that reads and writes its notes directly as
`.md` files into an Obsidian vault folder, so notes stay usable inside Obsidian itself.

## Features

- Notes are plain markdown files with YAML frontmatter, saved directly into a vault folder you
  pick once via Android's Storage Access Framework — no cloud sync, no Obsidian app required.
- Filenames are opaque, chronologically-sortable timestamps (`YY-MM-DD-HH-mm.md`) assigned once
  at creation. The note's title lives inside the file as an `# H1` heading and can be edited
  freely at any time — since the filename never changes, editing the title is just a normal save,
  not a rename.
- Multiple tags per note, stored in both frontmatter (`tags: [...]`) and inline `#hashtags`.
  Browse all tags and tap one to see the notes under it.
- Todo mode: turn a note's body into a checklist (`- [ ]` / `- [x]`). Checking an item moves it
  to the bottom of the list; each item has an "×" to delete it; items can also be reordered
  manually by long-pressing the "⠿" handle and dragging.
- Pin notes (📌 in the note editor's header) to keep them in a "Pinned" section at the top of the
  note list and of each tag's filtered note list.

## Local development (Expo Go)

No Android Studio or emulator needed — just a physical Android phone (11+) and Expo Go, on the
same Wi-Fi network as your computer:

1. Install **Expo Go** from the Play Store on your phone.
2. From the project directory, start the dev server:
   ```bash
   npm install
   npx expo start
   ```
3. Scan the printed QR code with the Expo Go app (or your phone's camera). The app loads over
   the network — no build or install step.
4. On first launch, tap **Choose folder** and pick a vault folder. Point it at a **scratch test
   folder** first (not your real vault) until you've tried the core flows — a throwaway folder
   or subfolder works fine, it just needs Android 11+ for the SAF picker.
5. Try the full loop: create a note, edit its title, add a couple of tags, confirm the Tags
   screen filters correctly, toggle Todo mode, check an item off (it should sink to the bottom),
   drag an item to reorder it via the "⠿" handle, delete a line with "×", pin the note and confirm
   it shows under "Pinned" at the top of the list — then open that same folder directly in
   Obsidian and confirm it all renders there too.

Prefer an emulator instead of a physical device? That needs Android Studio + the Android SDK
installed first (not set up in this repo/environment) — then `npx expo start --android` will
launch it. A physical device is the faster path if you have one.

`expo-file-system`'s Storage Access Framework calls are expected to work inside Expo Go for the
SDK version this project pins — no custom dev client should be required. If you hit an error
suggesting the module isn't available, that's the signal to build a custom dev client instead
(see below, using a `development` EAS profile).

## Production builds

This app isn't intended for the Play Store — the practical "production" path is building an
installable APK and sideloading it onto your own phone, via [EAS Build](https://docs.expo.dev/build/introduction/)
(Expo's cloud build service; free tier is enough for personal use, and no local Android SDK is
required since the build runs remotely).

1. Install the EAS CLI and log in (requires a free Expo account):
   ```bash
   npx eas-cli login
   ```
2. Configure the project for EAS Build (creates `eas.json`, links the project to your Expo
   account):
   ```bash
   npx eas-cli build:configure
   ```
3. Add (or edit) a `preview` profile in `eas.json` so it produces a directly-installable `.apk`
   rather than the Play-Store-only `.aab` format:
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
4. Kick off the build:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
   This builds in the cloud and prints a download link when it finishes (also viewable at
   expo.dev under your account).
5. On your phone, open that link (or scan the QR code EAS prints), download the `.apk`, and
   install it — Android will prompt to allow installing from this source the first time.

Re-run step 4 any time you want an updated build; each run produces a new APK to reinstall over
the old one (SAF vault access should persist across the reinstall as long as the app isn't
uninstalled first — Android ties the granted permission to the app's package, not the specific
build).

## Known limitation

Obsidian's Android app doesn't always pick up changes written by another app while a note is
open in Obsidian itself. If you have the same note open in both apps, close and reopen it in
Obsidian to see the latest content.

## Project layout

- `src/app/` — screens (Expo Router, file-based routing)
- `src/vault/` — all vault file I/O: the SAF wrapper (`vaultFs.ts`), frontmatter parsing,
  todo-checklist serialization, filename handling, and note CRUD
- `src/context/VaultContext.tsx` — holds the picked vault folder, the note/tag index, and reload
- `src/components/` — `NoteEditor`, `TagEditor`, `NoteListItem`
- `patches/` — a `patch-package` fix for a `react-native-draggable-flatlist` bug; applied
  automatically by `npm install` via the `postinstall` script
