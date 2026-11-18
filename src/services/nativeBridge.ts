import { isNativeApp } from '../platform';

/**
 * Funkcje, które w przeglądarce załatwia sama przeglądarka (pobieranie pliku, okno udostępniania),
 * a w aplikacji mobilnej wymagają wtyczek natywnych.
 */

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Zapisuje plik: w przeglądarce — zwykłe pobieranie; w aplikacji mobilnej — plik trafia do pamięci
 * tymczasowej aplikacji i otwiera się systemowe okno udostępniania („Zachowaj w Plikach”, poczta…).
 */
export async function saveFile(filename: string, bytes: Uint8Array, mimeType: string): Promise<void> {
  if (isNativeApp()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const safeName = filename.replace(/[^A-Za-z0-9._-]/g, '_');
    const written = await Filesystem.writeFile({ path: safeName, data: bytesToBase64(bytes), directory: Directory.Cache });
    try {
      await Share.share({ title: filename, files: [written.uri] });
    } catch (err) {
      // Zamknięcie okna udostępniania nie jest błędem — plik i tak został przygotowany.
      if (!/cancel/i.test(err instanceof Error ? err.message : String(err))) throw err;
    }
    return;
  }
  const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Czy da się otworzyć systemowe okno udostępniania. */
export function canShare(): boolean {
  return isNativeApp() || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');
}

/** Udostępnia link przez systemowe okno udostępniania. Zamknięcie okna nie jest błędem. */
export async function shareLink(title: string, url: string): Promise<void> {
  try {
    if (isNativeApp()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, url });
    } else {
      await navigator.share({ title, url });
    }
  } catch {
    // użytkownik zamknął okno udostępniania
  }
}

/** Dopasowuje kolor ikon paska stanu do jasnego / ciemnego motywu aplikacji (tylko aplikacja mobilna). */
export async function syncStatusBar(darkMode: boolean): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light });
  } catch {
    // brak wtyczki lub platforma bez paska stanu
  }
}
