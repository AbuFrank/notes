import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { listNotes } from '@/vault/noteRepository';
import { requestVaultAccess } from '@/vault/vaultFs';
import type { NoteSummary } from '@/types/note';

const VAULT_URI_KEY = 'vaultDirectoryUri';

interface VaultContextValue {
  directoryUri: string | null;
  isLoading: boolean;
  error: string | null;
  notes: NoteSummary[];
  tagsIndex: Map<string, NoteSummary[]>;
  connectVault: () => Promise<boolean>;
  reload: () => Promise<void>;
  upsertNoteSummary: (summary: NoteSummary) => void;
  removeNoteSummary: (uri: string) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: PropsWithChildren) {
  const [directoryUri, setDirectoryUri] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (uri?: string | null) => {
    const target = uri ?? directoryUri;
    if (!target) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listNotes(target);
      setNotes(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read vault folder.');
    } finally {
      setIsLoading(false);
    }
  }, [directoryUri]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(VAULT_URI_KEY);
      if (stored) {
        setDirectoryUri(stored);
        await reload(stored);
      } else {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectVault = useCallback(async (): Promise<boolean> => {
    setError(null);
    let uri: string | null;
    try {
      uri = await requestVaultAccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to access the selected folder.');
      return false;
    }
    if (!uri) return false;
    await AsyncStorage.setItem(VAULT_URI_KEY, uri);
    setDirectoryUri(uri);
    await reload(uri);
    return true;
  }, [reload]);

  const upsertNoteSummary = useCallback((summary: NoteSummary) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.uri !== summary.uri);
      next.push(summary);
      return next;
    });
  }, []);

  const removeNoteSummary = useCallback((uri: string) => {
    setNotes((prev) => prev.filter((n) => n.uri !== uri));
  }, []);

  const tagsIndex = useMemo(() => {
    const index = new Map<string, NoteSummary[]>();
    for (const note of notes) {
      for (const tag of note.tags) {
        const existing = index.get(tag);
        if (existing) existing.push(note);
        else index.set(tag, [note]);
      }
    }
    return index;
  }, [notes]);

  const value: VaultContextValue = {
    directoryUri,
    isLoading,
    error,
    notes,
    tagsIndex,
    connectVault,
    reload: () => reload(),
    upsertNoteSummary,
    removeNoteSummary,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within a VaultProvider');
  return ctx;
}
