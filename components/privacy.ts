"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cuan-privacy-mode";
const listeners = new Set<() => void>();

function readHidden() {
  try {
    // Hidden unless the user explicitly turned it off.
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAmountsHidden(hidden: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(hidden));
  } catch {
    // Storage blocked: the setting just won't persist.
  }
  listeners.forEach((l) => l());
}

/**
 * Whether amounts are masked. The server render always masks, so balances never
 * flash on screen before the stored preference is read.
 */
export function useAmountsHidden() {
  return useSyncExternalStore(subscribe, readHidden, () => true);
}
