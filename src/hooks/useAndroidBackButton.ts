import { useEffect, useRef } from 'react';
import { nativePlatform } from '../platform';

/**
 * Systemowy przycisk „Wstecz” na Androidzie: najpierw zamyka otwarte okno (element z atrybutem
 * data-back-close), potem wraca do ekranu głównego aplikacji, a dopiero z niego chowa aplikację.
 */
export function useAndroidBackButton(onHome: boolean, goHome: () => void): void {
  const state = useRef({ onHome, goHome });
  state.current = { onHome, goHome };

  useEffect(() => {
    if (nativePlatform() !== 'android') return;
    let cancelled = false;
    let remove: (() => void) | null = null;

    void import('@capacitor/app')
      .then(({ App }) =>
        App.addListener('backButton', () => {
          const closers = [...document.querySelectorAll<HTMLElement>('[data-back-close]')].filter((el) => el.offsetParent !== null);
          const top = closers[closers.length - 1];
          if (top) top.click();
          else if (!state.current.onHome) state.current.goHome();
          else void App.minimizeApp();
        })
      )
      .then((handle) => {
        if (cancelled) void handle.remove();
        else remove = () => void handle.remove();
      })
      .catch(() => {
        // brak wtyczki — zostaje domyślne zachowanie systemu
      });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
