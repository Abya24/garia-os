import { useState, useCallback } from "react";

/**
 * Centralized UI interaction and state utilities for Garia OS.
 * Deduplicates list toggles, pill selections, and common UI helpers across components.
 */

/**
 * Reusable hook for managing a transient toast notification with auto-dismissal.
 */
export function useTransientToast(durationMs: number = 3000) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setToastMessage(msg);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, durationMs);
      return () => clearTimeout(timer);
    },
    [durationMs]
  );

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return { toastMessage, showToast, clearToast };
}

/**
 * Toggles an item within an array immutably.
 * If the item exists in the array, it is removed; otherwise, it is appended.
 */
export function toggleListItem<T>(list: readonly T[] | T[], item: T): T[] {
  if (list.includes(item)) {
    return list.filter((i) => i !== item);
  }
  return [...list, item];
}

/**
 * State-dispatching helper for pill/chip toggles in React components.
 */
export function toggleStateItem<T>(
  list: T[],
  setList: (val: T[] | ((prev: T[]) => T[])) => void,
  item: T
): void {
  setList(toggleListItem(list, item));
}
