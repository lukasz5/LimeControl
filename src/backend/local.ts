import { getLang, t } from '../i18n';
import { apiUrl } from './apiBase';
import { LOCAL_USER, deleteInstance, saveInstance, subscribeInstances, updateInstance } from './profileStore';
import type { Backend, BackendUser } from './types';

/**
 * Tryb lokalny (własna instalacja LimeControl, bez Firebase).
 * Logowanie kluczem dostępu ustawionym na serwerze; profile instancji na urządzeniu (profileStore).
 * Hasła do LimeSurvey nigdy nie są zapisywane — tak jak w trybie chmurowym.
 */
const KEY_SESSION = 'limecontrol_access_key';

const authListeners = new Set<(user: BackendUser | null) => void>();
let accessKey: string | null = null;

function readStoredKey(): string | null {
  try {
    return sessionStorage.getItem(KEY_SESSION) || localStorage.getItem(KEY_SESSION);
  } catch {
    return null;
  }
}

function storeKey(key: string | null, remember: boolean): void {
  try {
    sessionStorage.removeItem(KEY_SESSION);
    localStorage.removeItem(KEY_SESSION);
    if (key) (remember ? localStorage : sessionStorage).setItem(KEY_SESSION, key);
  } catch {
    // brak dostępu do storage — klucz zostaje tylko w pamięci karty
  }
}

async function verifyKey(key: string): Promise<{ ok: boolean; status: number; message?: string }> {
  const res = await fetch(apiUrl('/api/session'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-LimeControl-Lang': getLang() },
    body: JSON.stringify({ accessKey: key }),
  });
  if (res.ok) return { ok: true, status: res.status };
  let message: string | undefined;
  try {
    message = ((await res.json()) as { error?: string }).error;
  } catch {
    // odpowiedź bez JSON-a
  }
  return { ok: false, status: res.status, message };
}

function emitAuth(): void {
  const user = accessKey ? LOCAL_USER : null;
  authListeners.forEach((listener) => listener(user));
}

export const localBackend: Backend = {
  mode: 'local',

  onAuthChange(callback) {
    authListeners.add(callback);
    let cancelled = false;
    void (async () => {
      const stored = accessKey || readStoredKey();
      if (!stored) {
        if (!cancelled) callback(null);
        return;
      }
      try {
        const check = await verifyKey(stored);
        if (cancelled) return;
        if (check.ok) accessKey = stored;
        else if (check.status === 401) {
          accessKey = null;
          storeKey(null, false);
        } else accessKey = stored; // serwer chwilowo niedostępny — nie wylogowujemy
      } catch {
        accessKey = stored; // tryb offline: PWA pokaże interfejs, zapytania do API i tak zwrócą błąd
      }
      if (!cancelled) callback(accessKey ? LOCAL_USER : null);
    })();
    return () => {
      cancelled = true;
      authListeners.delete(callback);
    };
  },

  async signIn(key, remember = false) {
    const candidate = (key || '').trim();
    if (!candidate) throw new Error(t('Podaj klucz dostępu.'));
    const check = await verifyKey(candidate);
    if (!check.ok) {
      throw new Error(check.status === 401 ? t('Nieprawidłowy klucz dostępu.') : check.message || t('Serwer odpowiedział kodem HTTP {0}', check.status));
    }
    accessKey = candidate;
    storeKey(candidate, remember);
    emitAuth();
  },

  async signOut() {
    accessKey = null;
    storeKey(null, false);
    emitAuth();
  },

  async getAuthHeaders(): Promise<Record<string, string>> {
    return accessKey ? { Authorization: `Bearer ${accessKey}` } : {};
  },

  async ensureUserProfile() {
    // brak profilu użytkownika w trybie lokalnym
  },

  subscribeInstances,
  saveInstance,
  deleteInstance,
  updateInstance,
};
