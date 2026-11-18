import { LOCAL_USER, deleteInstance, saveInstance, subscribeInstances, updateInstance } from './profileStore';
import type { Backend } from './types';

/**
 * Tryb „na urządzeniu” — aplikacja mobilna bez konta i bez serwera LimeControl.
 * Nie ma logowania: jedyny użytkownik jest od razu „zalogowany”, a profile instancji zostają
 * w pamięci aplikacji. Zapytania do LimeSurvey idą bezpośrednio z urządzenia (natywnie, bez CORS).
 */
export const deviceBackend: Backend = {
  mode: 'device',

  onAuthChange(callback) {
    let active = true;
    queueMicrotask(() => {
      if (active) callback(LOCAL_USER);
    });
    return () => {
      active = false;
    };
  },

  async signIn() {
    // brak kont w trybie urządzenia
  },

  async signOut() {
    // brak kont w trybie urządzenia
  },

  async getAuthHeaders(): Promise<Record<string, string>> {
    return {};
  },

  async ensureUserProfile() {
    // brak profilu użytkownika w trybie urządzenia
  },

  subscribeInstances,
  saveInstance,
  deleteInstance,
  updateInstance,
};
