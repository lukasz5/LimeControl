import { useSyncExternalStore } from 'react';
import { de } from './de';
import { en } from './en';

export type Lang = 'pl' | 'en' | 'de';
export const LANGS: Lang[] = ['pl', 'en', 'de'];

function isLang(value: unknown): value is Lang {
  return value === 'pl' || value === 'en' || value === 'de';
}

const STORAGE_KEY = 'limecontrol_lang_v1';

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* brak dostępu do storage */
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language || '' : '';
  if (/^pl\b/i.test(browser) || !browser) return 'pl';
  if (/^de\b/i.test(browser)) return 'de';
  return 'en';
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
  return current === 'pl' ? 'pl-PL' : current === 'de' ? 'de-DE' : 'en-GB';
}

/**
 * Tłumaczenie. Kluczem jest tekst polski; `{0}`, `{1}`… zastępowane argumentami.
 * Brak tłumaczenia niemieckiego → tekst angielski; brak angielskiego → tekst polski.
 */
export function t(key: string, ...args: unknown[]): string {
  const raw = current === 'pl' ? key : current === 'de' ? (de[key] ?? en[key] ?? key) : (en[key] ?? key);
  if (!args.length) return raw;
  return raw.replace(/\{(\d+)\}/g, (m, i) => (Number(i) < args.length ? String(args[Number(i)]) : m));
}

/**
 * Odmiana rzeczownika przez liczby: plural(3, ['pytanie', 'pytania', 'pytań'], ['question', 'questions'], ['Frage', 'Fragen'])
 * → „3 pytania” / “3 questions” / „3 Fragen”. Bez form niemieckich — angielskie.
 */
export function plural(count: number, pl: [string, string, string], english: [string, string], german?: [string, string]): string {
  if (current === 'de' && german) return `${count} ${count === 1 ? german[0] : german[1]}`;
  if (current !== 'pl') return `${count} ${count === 1 ? english[0] : english[1]}`;
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form = count === 1 ? pl[0] : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? pl[1] : pl[2];
  return `${count} ${form}`;
}
