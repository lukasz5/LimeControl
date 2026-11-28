import { useEffect, useRef, useState } from 'react';

/** Odległość (px), po której puszczenie palca odświeża listę. */
export const PULL_THRESHOLD = 60;
const MAX_PULL = 110;

/**
 * Gest „pociągnij, aby odświeżyć” na ekranach dotykowych: działa, gdy strona jest przewinięta
 * na sam początek. Okna i szuflady oznaczone atrybutem data-no-pull nie uruchamiają gestu.
 */
export function usePullToRefresh(enabled: boolean, onRefresh: () => Promise<void>): { pull: number; refreshing: boolean } {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: null as number | null, pull: 0, refreshing: false, onRefresh });
  state.current.onRefresh = onRefresh;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('ontouchstart' in window)) return;
    const s = state.current;

    const onStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (s.refreshing || event.touches.length !== 1 || window.scrollY > 0 || target?.closest('[data-no-pull], input, textarea, select')) {
        s.startY = null;
        return;
      }
      s.startY = event.touches[0].clientY;
    };
    const onMove = (event: TouchEvent) => {
      if (s.startY === null) return;
      const dy = event.touches[0].clientY - s.startY;
      if (dy <= 0 || window.scrollY > 0) {
        if (s.pull) setPull((s.pull = 0));
        return;
      }
      // Opór: im dalej, tym wolniej rośnie wskaźnik.
      const next = Math.min(MAX_PULL, dy * 0.5);
      if (Math.abs(next - s.pull) >= 1) setPull((s.pull = next));
    };
    const onEnd = () => {
      if (s.startY === null) return;
      s.startY = null;
      const triggered = s.pull >= PULL_THRESHOLD;
      setPull((s.pull = 0));
      if (!triggered) return;
      s.refreshing = true;
      setRefreshing(true);
      void s.onRefresh().finally(() => {
        s.refreshing = false;
        setRefreshing(false);
      });
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled]);

  return { pull, refreshing };
}
