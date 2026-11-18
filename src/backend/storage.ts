import { isNativeApp } from '../platform';

/**
 * Trwała pamięć klucz–wartość: Preferences (UserDefaults / SharedPreferences) w aplikacji mobilnej,
 * localStorage w przeglądarce. System może wyczyścić localStorage widoku WWW przy braku miejsca,
 * dlatego dane, które mają przetrwać, w aplikacji mobilnej trafiają do Preferences.
 */
export async function storageGet(key: string): Promise<string | null> {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    return (await Preferences.get({ key })).value;
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (isNativeApp()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // brak dostępu do pamięci przeglądarki
  }
}
