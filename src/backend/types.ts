import type { ConnectionMode, InstanceProfile, LimeSurveyVersion } from '../types/limesurvey';

export type AuthMode = 'firebase' | 'local' | 'device';

/** Zalogowany użytkownik — niezależnie od sposobu logowania. */
export interface BackendUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface InstancePatch {
  connectionMode?: ConnectionMode;
  limeVersion?: LimeSurveyVersion;
  lastConnectedAt?: string;
  siteName?: string;
}

/**
 * Warstwa logowania i przechowywania profili instancji.
 *  - firebase: logowanie Google, profile w Cloud Firestore (usługa app.limecontrol.eu),
 *  - local: klucz dostępu do własnej instalacji, profile w pamięci przeglądarki,
 *  - device: aplikacja mobilna bez konta i bez serwera — profile na urządzeniu, połączenia
 *    bezpośrednio z LimeSurvey (harmonogram i przekaźnik wymagają serwera, więc są niedostępne).
 * Hasła do LimeSurvey nie są zapisywane w żadnym z trybów.
 */
export interface Backend {
  readonly mode: AuthMode;
  onAuthChange(callback: (user: BackendUser | null) => void): () => void;
  /** firebase: okno logowania Google; local: weryfikacja klucza dostępu. */
  signIn(accessKey?: string, remember?: boolean): Promise<void>;
  signOut(): Promise<void>;
  /** Nagłówki uwierzytelniające zapytania do /api/*. */
  getAuthHeaders(): Promise<Record<string, string>>;
  ensureUserProfile(user: BackendUser): Promise<void>;
  subscribeInstances(uid: string, onData: (profiles: InstanceProfile[]) => void, onError?: (err: Error) => void): () => void;
  saveInstance(uid: string, profile: InstanceProfile): Promise<InstanceProfile>;
  deleteInstance(uid: string, instanceId: string): Promise<void>;
  updateInstance(uid: string, instanceId: string, patch: InstancePatch): Promise<void>;
}
