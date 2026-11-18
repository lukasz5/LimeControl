/**
 * Biblioteka szablonów ankiet dołączona do aplikacji (public/szablony-ankiet, budowana przez
 * survey-templates/build.mjs). Pliki .lss są serwowane z tej samej domeny, więc import działa
 * także we własnej instalacji bez dostępu do limecontrol.eu.
 */
import type { Lang } from '../i18n';

const BASE = '/szablony-ankiet';

export type L10n = Record<string, string>;

export interface TemplateCategory {
  id: string;
  label: L10n;
}

export interface TemplateTheme {
  /** Nazwa motywu w LimeSurvey, np. lc_medical. */
  id: string;
  label: string;
}

export interface TemplateEntry {
  id: string;
  file: string;
  bytes: number;
  sha256: string;
  category: string;
  modes: Array<'cawi' | 'cati' | 'capi'>;
  theme: string | null;
  minutes: number;
  groups: number;
  questions: number;
  languages: string[];
  tokenAttributes: number;
  title: L10n;
  summary: L10n;
}

export interface TemplateCatalog {
  version: string;
  testedOn: string[];
  categories: TemplateCategory[];
  themes: TemplateTheme[];
  templates: TemplateEntry[];
}

let cached: Promise<TemplateCatalog> | null = null;

export function loadTemplateCatalog(): Promise<TemplateCatalog> {
  if (!cached) {
    cached = fetch(`${BASE}/catalog.json`, { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TemplateCatalog>;
      })
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

async function sha256Hex(text: string): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null; // niedostępne poza HTTPS/localhost
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Pobiera plik struktury ankiety i sprawdza jego sumę kontrolną z katalogiem. */
export async function fetchTemplateLss(entry: TemplateEntry): Promise<string> {
  if (!/^[a-z0-9-]+\.lss$/.test(entry.file)) throw new Error('Nieprawidłowa nazwa pliku szablonu.');
  const res = await fetch(`${BASE}/${entry.file}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const hash = await sha256Hex(text);
  if (hash && hash !== entry.sha256) throw new Error('Suma kontrolna pliku szablonu nie zgadza się z katalogiem.');
  return text;
}

export function pick(value: L10n | undefined, lang: Lang): string {
  if (!value) return '';
  return value[lang] || value.pl || value.en || Object.values(value)[0] || '';
}
