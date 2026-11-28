/**
 * Komunikaty serwera w dwóch językach (polski i angielski; interfejs niemiecki dostaje angielskie).
 *
 * Aplikacja wysyła swój język w nagłówku X-LimeControl-Lang; zadania harmonogramu zapamiętują
 * język, w którym zostały utworzone, bo ich wynik powstaje później, bez udziału przeglądarki.
 */
import type { Request } from 'express';

export type Lang = 'pl' | 'en';

type Template = (...args: unknown[]) => string;

const kind = (action: unknown, lang: Lang, form: 'gen' | 'acc') => {
  const invite = action === 'invite';
  if (lang === 'en') return invite ? (form === 'acc' ? 'an invitation' : 'invitations') : form === 'acc' ? 'a reminder' : 'reminders';
  return invite ? (form === 'acc' ? 'zaproszenie' : 'zaproszeń') : form === 'acc' ? 'przypomnienie' : 'przypomnień';
};

const MESSAGES: Record<string, Record<Lang, Template>> = {
  // --- adresy docelowe (ochrona SSRF) ---
  url_invalid: { pl: () => 'Nieprawidłowy adres URL.', en: () => 'Invalid URL.' },
  url_protocol: { pl: () => 'Dozwolone są wyłącznie protokoły HTTP i HTTPS.', en: () => 'Only the HTTP and HTTPS protocols are allowed.' },
  url_credentials: { pl: () => 'Adres nie może zawierać nazwy użytkownika ani hasła.', en: () => 'The address must not contain a user name or password.' },
  url_no_host: { pl: () => 'Adres nie zawiera nazwy hosta.', en: () => 'The address has no host name.' },
  dns_failed: { pl: (host) => `Nie udało się rozwiązać nazwy hosta „${host}”.`, en: (host) => `Could not resolve the host name "${host}".` },
  dns_empty: { pl: (host) => `Host „${host}” nie ma adresu IP.`, en: (host) => `The host "${host}" has no IP address.` },
  private_address: {
    pl: () => 'Adres wskazuje na sieć prywatną lub lokalną. Przekaźnik serwerowy łączy się tylko z publicznymi serwerami.',
    en: () => 'The address points to a private or local network. The server relay only connects to public servers.',
  },
  response_too_large: { pl: () => 'Odpowiedź serwera jest zbyt duża.', en: () => 'The server response is too large.' },
  upstream_timeout: { pl: () => 'Serwer docelowy nie odpowiedział w wyznaczonym czasie.', en: () => 'The target server did not respond in time.' },
  connection_error: { pl: (detail) => `Błąd połączenia: ${detail}`, en: (detail) => `Connection error: ${detail}` },

  // --- łącznik StrefaAnkiet ---
  strefa_required: { pl: () => 'Wymagane pola: baseUrl, token i path.', en: () => 'Required fields: baseUrl, token and path.' },
  strefa_token_invalid: { pl: () => 'Nieprawidłowy klucz dostępu.', en: () => 'Invalid access key.' },
  strefa_url_invalid: { pl: () => 'Nieprawidłowy adres platformy StrefaAnkiet.', en: () => 'Invalid StrefaAnkiet platform address.' },
  strefa_url_protocol: { pl: () => 'Adres platformy musi zaczynać się od https://.', en: () => 'The platform address must start with https://.' },
  strefa_url_path: {
    pl: () => 'Podaj sam adres platformy, bez ścieżki (np. https://app.example.com).',
    en: () => 'Enter the platform address only, without a path (e.g. https://app.example.com).',
  },
  strefa_path_denied: {
    pl: () => 'Ta operacja nie jest dostępna przez łącznik (dozwolony jest tylko odczyt stanu realizacji).',
    en: () => 'This operation is not available through the connector (only reading the fieldwork status is allowed).',
  },
  strefa_query_denied: { pl: (key) => `Niedozwolony parametr zapytania: ${key}.`, en: (key) => `Query parameter not allowed: ${key}.` },
  strefa_query_long: { pl: (key) => `Zbyt długa wartość parametru ${key}.`, en: (key) => `The value of the ${key} parameter is too long.` },

  // --- harmonogram: walidacja zadania ---
  job_action_unknown: { pl: (action) => `Nieznana akcja harmonogramu: ${action}.`, en: (action) => `Unknown schedule action: ${action}.` },
  job_sid_invalid: { pl: () => 'Nieprawidłowy identyfikator ankiety (surveyId).', en: () => 'Invalid survey ID (surveyId).' },
  job_required: {
    pl: () => 'Wymagane pola: surveyId, rpcEndpoint, username, password oraz scheduledAt.',
    en: () => 'Required fields: surveyId, rpcEndpoint, username, password and scheduledAt.',
  },
  job_endpoint_invalid: { pl: () => 'Nieprawidłowy adres endpointu RPC.', en: () => 'Invalid RPC endpoint address.' },
  job_endpoint_protocol: { pl: () => 'Adres endpointu RPC musi używać HTTP lub HTTPS.', en: () => 'The RPC endpoint address must use HTTP or HTTPS.' },
  job_too_long: { pl: () => 'Zbyt długie dane połączenia.', en: () => 'The connection details are too long.' },
  job_date_invalid: { pl: (name) => `Nieprawidłowy format daty ${name}.`, en: (name) => `Invalid date format: ${name}.` },
  job_number_invalid: { pl: () => 'Nieprawidłowa wartość liczbowa w parametrach zadania.', en: () => 'Invalid numeric value in the job parameters.' },
  job_repeat_remind_only: { pl: () => 'Powtarzanie jest dostępne tylko dla przypomnień.', en: () => 'Repeating is only available for reminders.' },
  job_repeat_pair: {
    pl: () => 'Podaj jednocześnie odstęp (repeatEveryDays) i liczbę powtórzeń (repeatRemaining).',
    en: () => 'Provide both the interval (repeatEveryDays) and the number of repeats (repeatRemaining).',
  },
  job_limit: {
    pl: (n) => `Osiągnięto limit ${n} zadań. Usuń zakończone zadania z historii.`,
    en: (n) => `The limit of ${n} jobs has been reached. Delete finished jobs from the history.`,
  },

  // --- harmonogram: przebieg zadania ---
  job_waiting: { pl: () => 'Oczekuje na zaplanowaną godzinę uruchomienia.', en: () => 'Waiting for the scheduled time.' },
  job_no_password: { pl: () => 'Brak zapisanego hasła do uwierzytelnienia sesji LimeSurvey.', en: () => 'No stored password to authenticate the LimeSurvey session.' },
  job_session_ok: { pl: () => 'Uzyskano klucz sesji administratora.', en: () => 'Administrator session key obtained.' },
  job_session_failed: { pl: (detail) => `Nie udało się uzyskać klucza sesji: ${detail}`, en: (detail) => `Could not obtain a session key: ${detail}` },
  job_activated: { pl: (sid) => `Ankieta #${sid} została aktywowana.`, en: (sid) => `Survey #${sid} has been activated.` },
  job_already_active: { pl: () => 'Ankieta była już aktywna w LimeSurvey.', en: () => 'The survey was already active in LimeSurvey.' },
  job_tokens_ok: { pl: () => 'Tabela uczestników (tokenów) jest aktywna.', en: () => 'The participant (token) table is active.' },
  job_warning: { pl: (detail) => `Ostrzeżenie: ${detail}`, en: (detail) => `Warning: ${detail}` },
  job_props_failed: { pl: (detail) => `Nie udało się zapisać dat ankiety: ${detail}`, en: (detail) => `Could not save the survey dates: ${detail}` },
  job_props_ok: { pl: (list) => `Zaktualizowano właściwości: ${list}`, en: (list) => `Properties updated: ${list}` },
  job_result_activated: { pl: (sid) => `Ankieta #${sid} została aktywowana przez harmonogram.`, en: (sid) => `Survey #${sid} was activated by the scheduler.` },
  job_expired_step: { pl: (expires, utc) => `Ustawiono expires=${expires}${utc ? ' (UTC)' : ''}.`, en: (expires, utc) => `Set expires=${expires}${utc ? ' (UTC)' : ''}.` },
  job_result_expired: { pl: (sid) => `Ankieta #${sid} została zamknięta przez harmonogram.`, en: (sid) => `Survey #${sid} was closed by the scheduler.` },
  job_mail_none_step: {
    pl: (action) => `Brak uczestników, do których należałoby wysłać ${kind(action, 'pl', 'acc')}.`,
    en: (action) => `There are no participants who should receive ${kind(action, 'en', 'acc')}.`,
  },
  job_mail_step: {
    pl: (action, sent, failed, left) => `Wysłano ${sent} ${kind(action, 'pl', 'gen')}${failed ? `, nieudanych: ${failed}` : ''}${left ? `, pozostało: ${left}` : ''}.`,
    en: (action, sent, failed, left) => `Sent ${sent} ${kind(action, 'en', 'gen')}${failed ? `, failed: ${failed}` : ''}${left ? `, left: ${left}` : ''}.`,
  },
  job_result_mail_none: {
    pl: (sid, action) => `Ankieta #${sid}: nie było ${kind(action, 'pl', 'gen')} do wysłania.`,
    en: (sid, action) => `Survey #${sid}: there were no ${kind(action, 'en', 'gen')} to send.`,
  },
  job_result_mail: {
    pl: (sid, action, sent, failed) => `Ankieta #${sid}: wysłano ${sent} ${kind(action, 'pl', 'gen')}${failed ? ` (nieudanych: ${failed})` : ''}.`,
    en: (sid, action, sent, failed) => `Survey #${sid}: sent ${sent} ${kind(action, 'en', 'gen')}${failed ? ` (failed: ${failed})` : ''}.`,
  },
  job_mail_all_failed: {
    pl: (method, failed, detail) => `${method}: nie udało się wysłać żadnej z ${failed} wiadomości. ${detail || ''}`.trim(),
    en: (method, failed, detail) => `${method}: none of the ${failed} messages could be sent. ${detail || ''}`.trim(),
  },
  job_session_closed: { pl: () => 'Sesja RPC została zamknięta.', en: () => 'The RPC session has been closed.' },
  job_cancelled: { pl: () => 'Anulowane przez użytkownika.', en: () => 'Cancelled by the user.' },
  job_next_in_series: { pl: () => 'Kolejne przypomnienie z serii.', en: () => 'Next reminder in the series.' },
  job_survey_fallback: { pl: (sid) => `Ankieta #${sid}`, en: (sid) => `Survey #${sid}` },
  rpc_not_json: {
    pl: () => 'Serwer LimeSurvey zwrócił odpowiedź, która nie jest poprawnym JSON-em (czy interfejs JSON-RPC jest włączony?).',
    en: () => 'The LimeSurvey server returned a response that is not valid JSON (is the JSON-RPC interface enabled?).',
  },
  rpc_unexpected: { pl: () => 'Nieoczekiwana odpowiedź LimeSurvey.', en: () => 'Unexpected LimeSurvey response.' },

  // --- API ---
  auth_required_local: { pl: () => 'Wymagany klucz dostępu do tej instancji LimeControl.', en: () => 'An access key for this LimeControl installation is required.' },
  auth_required_firebase: { pl: () => 'Wymagane uwierzytelnienie kontem Google.', en: () => 'Google account authentication is required.' },
  too_many_attempts: { pl: () => 'Zbyt wiele prób. Spróbuj ponownie za chwilę.', en: () => 'Too many attempts. Please try again in a moment.' },
  access_key_invalid: { pl: () => 'Nieprawidłowy klucz dostępu.', en: () => 'Invalid access key.' },
  job_not_found: { pl: () => 'Nie znaleziono zadania harmonogramu.', en: () => 'Scheduled job not found.' },
  job_running: { pl: () => 'Zadanie jest w trakcie wykonywania.', en: () => 'The job is currently running.' },
  job_run_failed: { pl: () => 'Nie udało się uruchomić zadania.', en: () => 'The job could not be started.' },
  job_cancel_only_scheduled: {
    pl: () => 'Można anulować wyłącznie zadania o statusie „Zaplanowane”.',
    en: () => 'Only jobs with the “Scheduled” status can be cancelled.',
  },
  relay_rate: { pl: () => 'Zbyt wiele zapytań przez przekaźnik. Spróbuj ponownie za chwilę.', en: () => 'Too many requests through the relay. Please try again in a moment.' },
  relay_missing: { pl: () => 'Brak adresu endpoint lub nazwy metody RPC.', en: () => 'Missing endpoint address or RPC method name.' },
  relay_method_invalid: { pl: () => 'Nieprawidłowa nazwa metody RPC.', en: () => 'Invalid RPC method name.' },
  relay_error: {
    pl: (detail) => `Błąd połączenia przekaźnika z serwerem LimeSurvey: ${detail}`,
    en: (detail) => `The relay could not connect to the LimeSurvey server: ${detail}`,
  },
  strefa_rate: { pl: () => 'Zbyt wiele zapytań do StrefyAnkiet. Spróbuj ponownie za chwilę.', en: () => 'Too many requests to StrefaAnkiet. Please try again in a moment.' },
  strefa_error: { pl: (detail) => `Błąd połączenia z platformą StrefaAnkiet: ${detail}`, en: (detail) => `Could not connect to the StrefaAnkiet platform: ${detail}` },
  not_found: { pl: () => 'Nie znaleziono.', en: () => 'Not found.' },
};

export type MessageKey = keyof typeof MESSAGES;

export function msg(key: string, lang: Lang = 'pl', ...args: unknown[]): string {
  const entry = MESSAGES[key];
  if (!entry) return key;
  return (entry[lang] || entry.pl)(...args);
}

/** Komunikaty serwera są po polsku i angielsku; interfejs niemiecki dostaje angielskie. */
export function normalizeLang(value: unknown): Lang {
  return typeof value === 'string' && /^(en|de)\b/i.test(value.trim()) ? 'en' : 'pl';
}

/** Język odpowiedzi: nagłówek aplikacji, a w razie jego braku — Accept-Language przeglądarki. */
export function requestLang(req: Request): Lang {
  const explicit = req.headers['x-limecontrol-lang'];
  if (typeof explicit === 'string' && explicit) return normalizeLang(explicit);
  const accept = req.headers['accept-language'];
  if (typeof accept === 'string' && accept) return /^pl\b/i.test(accept.trim()) ? 'pl' : 'en';
  return 'pl';
}

/** Błąd z komunikatem dostępnym w obu językach. `message` jest zawsze po polsku (logi, testy). */
export class LocalizedError extends Error {
  readonly args: unknown[];

  constructor(
    readonly key: string,
    args: unknown[] = [],
    readonly status = 400
  ) {
    super(msg(key, 'pl', ...args));
    this.name = 'LocalizedError';
    this.args = args;
  }

  localized(lang: Lang): string {
    return msg(this.key, lang, ...this.args);
  }
}

/** Tekst błędu w języku żądania (dla błędów spoza słownika — oryginalny komunikat). */
export function errorText(err: unknown, lang: Lang): string {
  if (err instanceof LocalizedError) return err.localized(lang);
  return err instanceof Error ? err.message : String(err);
}
