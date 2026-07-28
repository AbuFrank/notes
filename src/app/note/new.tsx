import { NoteEditor } from '@/components/NoteEditor';
import { useVault } from '@/context/VaultContext';

export default function NewNoteScreen() {
  const { directoryUri } = useVault();
  if (!directoryUri) return null;
  return <NoteEditor directoryUri={directoryUri} isNew />;
}
