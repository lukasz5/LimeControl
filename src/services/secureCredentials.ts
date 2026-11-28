import { isNativeApp } from '../platform';
import { t } from '../i18n';

/**
 * Hasło do LimeSurvey zapisane w pęku kluczy systemu (iOS Keychain / Android Keystore), dostępne
 * wyłącznie po potwierdzeniu tożsamości biometrią (Face ID, Touch ID, odcisk palca).
 *
 * Tylko aplikacja mobilna i tylko na wyraźne życzenie użytkownika. Hasło nie opuszcza urządzenia:
 * nie trafia do profilu, do Preferences ani do kopii zapasowej. Zmiana zestawu odcisków palców
 * lub twarzy nie unieważnia wpisu (BIOMETRY_ANY), ale wyłączenie blokady ekranu — tak.
 */

/** Klucz wpisu w pęku kluczy: jeden na profil instancji. */
export function credentialServer(profileId: string): string {
  return `eu.limecontrol.app/profile/${profileId}`;
}

export interface BiometryInfo {
  /** Czy na tym urządzeniu można zapisać hasło chronione biometrią. */
  available: boolean;
  /** Nazwa metody do wyświetlenia: „Face ID”, „Touch ID”, „odcisk palca”… */
  label: string;
}

const UNAVAILABLE: BiometryInfo = { available: false, label: '' };

let infoPromise: Promise<BiometryInfo> | null = null;

async function plugin() {
  return import('@capgo/capacitor-native-biometric');
}

/** Dostępność biometrii (wynik zapamiętany do końca działania aplikacji). */
export function biometryInfo(): Promise<BiometryInfo> {
  if (!isNativeApp()) return Promise.resolve(UNAVAILABLE);
  if (!infoPromise) {
    infoPromise = (async () => {
      try {
        const { NativeBiometric, BiometryType } = await plugin();
        const result = await NativeBiometric.isAvailable({ useFallback: false });
        // Klucz chroniony biometrią wymaga silnej biometrii (klasa 3 na Androidzie, Face ID / Touch ID na iOS).
        if (!result.isAvailable || !result.strongBiometryIsAvailable) return UNAVAILABLE;
        return { available: true, label: biometryLabel(result.biometryType, BiometryType) };
      } catch {
        return UNAVAILABLE;
      }
    })();
  }
  return infoPromise;
}

function biometryLabel(type: number, types: Record<string, number | string>): string {
  if (type === types.FACE_ID) return 'Face ID';
  if (type === types.TOUCH_ID) return 'Touch ID';
  if (type === types.FINGERPRINT) return t('odcisk palca');
  if (type === types.FACE_AUTHENTICATION) return t('rozpoznawanie twarzy');
  return t('biometria');
}

/** Zapisuje hasło profilu. Na Androidzie system od razu prosi o potwierdzenie biometrią. */
export async function storePassword(profileId: string, username: string, password: string): Promise<boolean> {
  if (!isNativeApp() || !password) return false;
  try {
    const { NativeBiometric, AccessControl } = await plugin();
    await NativeBiometric.setCredentials({
      server: credentialServer(profileId),
      username,
      password,
      accessControl: AccessControl.BIOMETRY_ANY,
      title: t('Zapisz hasło LimeSurvey'),
      negativeButtonText: t('Anuluj'),
    });
    return true;
  } catch {
    return false;
  }
}

export type ReadPasswordResult =
  | { status: 'ok'; password: string }
  /** Użytkownik przerwał potwierdzenie albo biometria się nie powiodła. */
  | { status: 'cancelled' }
  /** Wpisu nie ma (usunięty, unieważniony po wyłączeniu blokady ekranu). */
  | { status: 'missing' };

/** Odczytuje hasło profilu — zawsze po potwierdzeniu biometrią. */
export async function readPassword(profileId: string, profileName: string): Promise<ReadPasswordResult> {
  if (!isNativeApp()) return { status: 'missing' };
  try {
    const { NativeBiometric } = await plugin();
    const server = credentialServer(profileId);
    const saved = await NativeBiometric.isCredentialsSaved({ server });
    if (!saved.isSaved) return { status: 'missing' };
    const credentials = await NativeBiometric.getSecureCredentials({
      server,
      reason: t('Połącz z {0}', profileName),
      title: t('Połącz z {0}', profileName),
      subtitle: t('Hasło LimeSurvey jest zapisane w pęku kluczy urządzenia'),
      negativeButtonText: t('Wpisz hasło'),
    });
    return credentials.password ? { status: 'ok', password: credentials.password } : { status: 'missing' };
  } catch {
    return { status: 'cancelled' };
  }
}

/** Usuwa zapisane hasło profilu (brak wpisu nie jest błędem). */
export async function forgetPassword(profileId: string): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { NativeBiometric } = await plugin();
    await NativeBiometric.deleteCredentials({ server: credentialServer(profileId) });
  } catch {
    // wpisu nie było
  }
}

/** Czy błąd logowania oznacza złe hasło (wtedy zapisane hasło trzeba usunąć). */
export function isInvalidCredentialsError(message: string): boolean {
  return /invalid user ?name or password|nieprawidłow\w* (login|nazw\w* użytkownika|hasł)/i.test(message);
}
