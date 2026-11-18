/**
 * Adres serwera LimeControl dla zapytań /api/*.
 *
 * W przeglądarce aplikacja i jej API mają ten sam adres, więc baza jest pusta. Aplikacja mobilna
 * nie ma własnego serwera — jeśli użytkownik połączy ją z serwerem LimeControl, zapytania do
 * harmonogramu i przekaźnika idą pod wskazany adres.
 */
let base = '';

export function setApiBase(url: string | null | undefined): void {
  base = (url || '').trim().replace(/\/+$/, '');
}

export function getApiBase(): string {
  return base;
}

export function apiUrl(path: string): string {
  return `${base}${path}`;
}
