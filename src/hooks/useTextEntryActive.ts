import { useEffect, useState } from 'react';

const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'file', 'color', 'image']);

function isTextField(el: Element | null): boolean {
  if (!el || !el.isConnected) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(el.type);
}

/**
 * Czy użytkownik właśnie pisze w polu tekstowym (na telefonie: czy otwarta jest klawiatura ekranowa).
 * Aplikacja mobilna chowa wtedy dolną nawigację, żeby nie zasłaniała formularza.
 */
export function useTextEntryActive(enabled: boolean): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const sync = () => setActive(isTextField(document.activeElement));
    // Po zdarzeniu focusout document.activeElement zmienia się dopiero w następnym kroku pętli zdarzeń.
    const syncLater = () => setTimeout(sync, 0);
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', syncLater);
    // Pole usunięte ze strony razem z fokusem (zamknięte okno dialogowe) nie zgłasza focusout.
    const timer = setInterval(sync, 400);
    return () => {
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', syncLater);
      clearInterval(timer);
    };
  }, [enabled]);

  return active;
}
