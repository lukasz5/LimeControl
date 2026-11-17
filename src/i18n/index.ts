import { useSyncExternalStore } from 'react';
import { en } from './en';

export type Lang = 'pl' | 'en';
export const LANGS: Lang[] = ['pl', 'en'];

const STORAGE_KEY = 'limecontrol_lang_v1';

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch {
    /* brak dostępu do storage */
  }
  if (typeof navigator !== 'undefined' && !/^pl\b/i.test(navigator.language || '')) {
    return 'en';
  }
  return 'pl';
}

let current: Lang = detectInitial();
const listeners = new Set<() => void>();
if (typeof document !== 'undefined') document.documentElement.lang = current;

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignoruj */
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Hook: bieżący język; komponent przerenderuje się po zmianie. */
export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, getLang);
}

/** Locale dla dat i liczb (Intl / toLocaleString). */
export function locale(): string {
  return current === 'pl' ? 'pl-PL' : 'en-GB';
}

/**
 * Tłumaczenie. Kluczem jest tekst polski; `{0}`, `{1}`… zastępowane argumentami.
 * Brak tłumaczenia → tekst polski.
 */
export function t(key: string, ...args: unknown[]): string {
  const raw = current === 'pl' ? key : (en[key] ?? key);
  if (!args.length) return raw;
  return raw.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)]) : m));
}
