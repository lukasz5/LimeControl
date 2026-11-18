import { getLang } from '../i18n';
import { isNativeApp } from '../platform';
import { setApiBase } from './apiBase';
import { getServerUrl } from './serverConnection';
import type { AuthMode, Backend } from './types';

export type { AuthMode, Backend, BackendUser, InstancePatch } from './types';

const MODE_CACHE = 'limecontrol_auth_mode_v1';
/**
 * Stała czasu budowania: w paczce aplikacji mobilnej nie ma modułów Firebase.
 * (Poza Vite — np. w testach uruchamianych w Node — import.meta.env nie istnieje.)
 */
const NATIVE_BUILD = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_PLATFORM === 'native';
let current: Backend | null = null;

async function detectMode(): Promise<AuthMode> {
  // Aplikacja mobilna nie ma własnego serwera: działa samodzielnie (device) albo — gdy użytkownik
  // wskazał serwer LimeControl — loguje się do niego kluczem dostępu (local).
  if (isNativeApp()) {
    const server = await getServerUrl();
    setApiBase(server);
    return server ? 'local' : 'device';
  }
  try {
    const res = await fetch('/api/config', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { authMode?: string };
    const mode: AuthMode = data.authMode === 'local' ? 'local' : 'firebase';
    try {
      localStorage.setItem(MODE_CACHE, mode);
    } catch {
      // ignoruj brak dostępu do storage
    }
    return mode;
  } catch (err) {
    // Offline (PWA): użyj trybu zapamiętanego przy ostatnim udanym starcie.
    try {
      const cached = localStorage.getItem(MODE_CACHE);
      if (cached === 'local' || cached === 'firebase') return cached;
    } catch {
      // ignoruj
    }
    throw err;
  }
}

/**
 * Wybiera warstwę logowania: w przeglądarce na podstawie konfiguracji serwera (/api/config),
 * w aplikacji mobilnej — zależnie od tego, czy wskazano serwer LimeControl.
 * Moduły Firebase są ładowane tylko w trybie chmurowym — własna instalacja ich nie pobiera.
 */
export async function initBackend(): Promise<Backend> {
  if (current) return current;
  const mode = await detectMode();
  if (mode === 'device') current = (await import('./device')).deviceBackend;
  else if (mode === 'local') current = (await import('./local')).localBackend;
  else if (!NATIVE_BUILD) current = (await import('./firebase')).firebaseBackend;
  else throw new Error('Logowanie kontem Google nie jest dostępne w aplikacji mobilnej.');
  return current;
}

export function getBackend(): Backend {
  if (!current) throw new Error('Backend nie został zainicjowany (initBackend).');
  return current;
}

/** Nagłówki dla /api/*: uwierzytelnienie (gdy ktoś jest zalogowany) i język komunikatów serwera. */
export async function authHeaders(): Promise<Record<string, string>> {
  const auth = current ? await current.getAuthHeaders() : {};
  return { ...auth, 'X-LimeControl-Lang': getLang() };
}
