'use client';

import { useEffect, useRef } from 'react';

export function useFormDraft<T>(key: string, value: T, setValue: (v: T) => void, enabled: boolean) {
  const didHydrate = useRef(false);

  // Hydrate on open
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as T;
        setValue(parsed);
      } catch {
        // ignore
      }
    }
    didHydrate.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  // Autosave (debounced)
  useEffect(() => {
    if (!enabled) return;
    if (!didHydrate.current) return;
    if (typeof window === 'undefined') return;
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [enabled, key, value]);
}

