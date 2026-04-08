"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * SSR-safe localStorage hook.
 * - Starts with initialValue (avoids hydration mismatch)
 * - Reads from localStorage after mount (client-only)
 * - Writes to localStorage inside the setter (atomic, no race conditions)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (updater: T | ((prev: T) => T)) => void] {
  const [value, _setValue] = useState<T>(initialValue);

  // Read from localStorage after hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) _setValue(JSON.parse(stored));
    } catch {}
  }, [key]);

  // Setter: updates state AND persists to localStorage in one atomic operation
  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      _setValue(current => {
        const next =
          typeof updater === "function"
            ? (updater as (p: T) => T)(current)
            : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, setValue];
}
