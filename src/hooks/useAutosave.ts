import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const DEFAULT_DELAY_MS = 700;

/** Debounces `save` on dependency changes, and flushes immediately (skipping
 * the debounce) when the app backgrounds. Callers should also call the
 * returned `flush` when navigating away from the editor. Overlapping saves
 * are coalesced into a single follow-up rather than firing concurrently. */
export function useAutosave(save: () => Promise<void>, deps: unknown[], delayMs = DEFAULT_DELAY_MS) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef(false);
  const savingRef = useRef(false);
  const saveRef = useRef(save);
  const mountedRef = useRef(false);
  useEffect(() => {
    saveRef.current = save;
  });

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    try {
      let more = true;
      while (more) {
        await saveRef.current();
        more = pendingRef.current;
        pendingRef.current = false;
      }
    } finally {
      savingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      flush();
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        flush();
      }
    });
    return () => sub.remove();
  }, [flush]);

  return { flush };
}
