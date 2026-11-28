import { useEffect, useRef } from 'react';
import { isNativeApp } from '../platform';
import { parseAppLink, type AppLink } from '../services/appLinks';

/**
 * Aplikacja mobilna: linki `limecontrol://open?…` — zarówno ten, którym uruchomiono aplikację,
 * jak i te otwarte, gdy już działa (np. kod QR zeskanowany aparatem systemu).
 */
export function useAppLinks(onLink: (link: AppLink) => void): void {
  const handler = useRef(onLink);
  handler.current = onLink;

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;
    let remove: (() => void) | null = null;

    const deliver = (url: string | undefined) => {
      const link = url ? parseAppLink(url) : null;
      if (link && !cancelled) handler.current(link);
    };

    void import('@capacitor/app')
      .then(async ({ App }) => {
        const handle = await App.addListener('appUrlOpen', (event) => deliver(event.url));
        if (cancelled) {
          void handle.remove();
          return;
        }
        remove = () => void handle.remove();
        const launch = await App.getLaunchUrl();
        deliver(launch?.url);
      })
      .catch(() => {
        // brak wtyczki — linki nie są obsługiwane
      });

    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
