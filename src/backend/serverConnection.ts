import { storageGet, storageRemove, storageSet } from './storage';

/**
 * Połączenie aplikacji mobilnej z serwerem LimeControl (opcjonalne).
 * Serwer dodaje to, czego samo urządzenie nie zapewni: harmonogram działający pod nieobecność
 * użytkownika i przekaźnik. Zapisywany jest wyłącznie adres — klucz dostępu obsługuje tryb local.
 */
const KEY_SERVER = 'limecontrol_server_url_v1';

export interface ServerInfo {
  authMode: 'local' | 'firebase';
  version: string;
}

/** Sprowadza wpisany adres do postaci https://host[:port] (http tylko dla sieci lokalnej i testów). */
export function normalizeServerUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const hasHttpScheme = /^https?:\/\//i.test(raw);
  // Inny protokół (ftp://, file:// …) to pomyłka, a nie nazwa hosta.
  if (!hasHttpScheme && /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return null;
  const withScheme = hasHttpScheme ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export async function getServerUrl(): Promise<string | null> {
  const stored = await storageGet(KEY_SERVER);
  return stored ? normalizeServerUrl(stored) : null;
}

export async function setServerUrl(url: string | null): Promise<void> {
  if (url) await storageSet(KEY_SERVER, url);
  else await storageRemove(KEY_SERVER);
}

/** Sprawdza, czy pod adresem działa serwer LimeControl, i zwraca jego tryb logowania. */
export async function probeServer(url: string): Promise<ServerInfo> {
  const res = await fetch(`${url}/api/config`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { authMode?: unknown; version?: unknown };
  if (data.authMode !== 'local' && data.authMode !== 'firebase') throw new Error('not-limecontrol');
  return { authMode: data.authMode, version: typeof data.version === 'string' ? data.version : '' };
}
