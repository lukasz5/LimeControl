import type {
  ConnectionMode,
  FieldmapEntry,
  LimeSurveyItem,
  LimeSurveyVersion,
  ParticipantItem,
  RpcTraceEntry,
  SurveyLanguageProperties,
  SurveyProperties,
  SurveySummary,
} from '../types/limesurvey';
import { authHeaders } from '../backend';
import { apiUrl } from '../backend/apiBase';
import { isNativeApp } from '../platform';
import { t } from '../i18n';

export class LimeSurveyRpcError extends Error {
  readonly isCorsOrNetwork: boolean;
  readonly rpcStatus?: string;
  readonly rpcCode?: string | number;

  constructor(
    message: string,
    options?: {
      isCorsOrNetwork?: boolean;
      rpcStatus?: string;
      rpcCode?: string | number;
    }
  ) {
    super(message);
    this.name = 'LimeSurveyRpcError';
    this.isCorsOrNetwork = Boolean(options?.isCorsOrNetwork);
    this.rpcStatus = options?.rpcStatus;
    this.rpcCode = options?.rpcCode;
  }
}

export function normalizeRpcEndpoint(rawUrl: string): {
  baseUrl: string;
  rpcEndpoint: string;
} {
  let trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new LimeSurveyRpcError(t('Podaj adres URL instancji LimeSurvey.'));
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  const clean = trimmed.replace(/\/+$/, '');

  if (
    clean.endsWith('/remotecontrol') ||
    clean.includes('r=admin/remotecontrol')
  ) {
    const baseUrl = clean
      .replace(/\/index\.php\/admin\/remotecontrol$/i, '')
      .replace(/\/admin\/remotecontrol$/i, '')
      .replace(/\/index\.php\?r=admin\/remotecontrol$/i, '');
    return { baseUrl, rpcEndpoint: clean };
  }

  return {
    baseUrl: clean,
    rpcEndpoint: `${clean}/index.php/admin/remotecontrol`,
  };
}

export function shouldUseUtcDates(limeVersion?: LimeSurveyVersion): boolean {
  return limeVersion === 'v7';
}

export function formatLimeSurveyDateTime(
  localDateTime: string,
  useUtc = false
): string {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  if (Number.isNaN(date.getTime())) return localDateTime;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (useUtc) {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00`;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

/** Metody wysyłające e-maile zwracają w polu status postęp („3 left to send”), a nie błąd. */
const MAIL_METHODS = new Set(['invite_participants', 'remind_participants', 'mail_registered_participants']);

function extractStatusError(
  result: unknown,
  method?: string
): { message: string; code?: string | number } | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const record = result as Record<string, unknown>;
  if (method && MAIL_METHODS.has(method) && typeof record.status === 'string' && /^\d+ left to send$/i.test(record.status)) {
    return null;
  }
  const rawCode =
    typeof record.error_code === 'string' || typeof record.error_code === 'number'
      ? record.error_code
      : typeof record.code === 'string' || typeof record.code === 'number'
        ? record.code
        : undefined;

  if (typeof record.status === 'string' && record.status.toUpperCase() !== 'OK') {
    const message =
      rawCode !== undefined
        ? `[Kod ${rawCode}] ${record.status}`
        : record.status;
    return { message, code: rawCode };
  }

  if (rawCode !== undefined && typeof record.message === 'string') {
    return {
      message: `[Kod ${rawCode}] ${record.message}`,
      code: rawCode,
    };
  }

  return null;
}

type TraceListener = (entry: RpcTraceEntry) => void;
const listeners = new Set<TraceListener>();

export function subscribeRpcTrace(listener: TraceListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitTrace(entry: RpcTraceEntry): void {
  for (const listener of listeners) {
    listener(entry);
  }
}

export async function callLimeSurveyRpc<T = unknown>(
  rpcEndpoint: string,
  method: string,
  params: unknown[],
  mode: ConnectionMode = 'direct'
): Promise<T> {
  const startedAt = performance.now();
  const requestId = Math.floor(Math.random() * 100_000) + 1;

  try {
    const response =
      mode === 'direct'
        ? await fetch(rpcEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method,
              params,
              id: requestId,
            }),
          })
        : await fetch(apiUrl('/api/rpc-relay'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...(await authHeaders()),
            },
            body: JSON.stringify({
              endpoint: rpcEndpoint,
              method,
              params,
              id: requestId,
            }),
          });

    const durationMs = Math.round(performance.now() - startedAt);

    if (!response.ok) {
      let msg = t('Serwer odpowiedział kodem HTTP {0}', response.status);
      try {
        const errJson = (await response.json()) as { error?: string };
        if (errJson?.error) msg = errJson.error;
      } catch {
        // Ignore parse error
      }
      emitTrace({
        id: `${Date.now()}_${requestId}`,
        method,
        endpoint: rpcEndpoint,
        mode,
        ok: false,
        durationMs,
        summary: msg,
        timestamp: new Date().toISOString(),
      });
      throw new LimeSurveyRpcError(msg);
    }

    const payload = (await response.json()) as {
      result?: T;
      error?: { message?: string; code?: number | string } | string | null;
    };

    if (payload.error) {
      let errMsg: string;
      let errCode: string | number | undefined;
      if (typeof payload.error === 'string') {
        errMsg = payload.error;
      } else {
        errCode = payload.error.code;
        const baseText =
          payload.error.message || JSON.stringify(payload.error);
        errMsg =
          errCode !== undefined ? `[RPC ${errCode}] ${baseText}` : baseText;
      }
      emitTrace({
        id: `${Date.now()}_${requestId}`,
        method,
        endpoint: rpcEndpoint,
        mode,
        ok: false,
        durationMs,
        summary: errMsg,
        timestamp: new Date().toISOString(),
      });
      throw new LimeSurveyRpcError(errMsg, { rpcCode: errCode });
    }

    const statusError = extractStatusError(payload.result, method);
    if (statusError) {
      emitTrace({
        id: `${Date.now()}_${requestId}`,
        method,
        endpoint: rpcEndpoint,
        mode,
        ok: false,
        durationMs,
        summary: `LimeSurvey: ${statusError.message}`,
        timestamp: new Date().toISOString(),
      });
      throw new LimeSurveyRpcError(statusError.message, {
        rpcStatus: statusError.message,
        rpcCode: statusError.code,
      });
    }

    emitTrace({
      id: `${Date.now()}_${requestId}`,
      method,
      endpoint: rpcEndpoint,
      mode,
      ok: true,
      durationMs,
      summary: 'OK',
      timestamp: new Date().toISOString(),
    });

    return payload.result as T;
  } catch (err) {
    const durationMs = Math.round(performance.now() - startedAt);
    if (err instanceof LimeSurveyRpcError) {
      throw err;
    }
    const isNetwork =
      err instanceof TypeError ||
      (err instanceof Error &&
        /failed to fetch|networkerror|load failed|cors/i.test(err.message));
    const detail = err instanceof Error ? err.message : String(err);
    // Aplikacja mobilna łączy się natywnie — CORS jej nie dotyczy, więc pokazujemy rzeczywistą przyczynę.
    // iOS i Android blokują nieszyfrowane http:// (iOS dopuszcza je tylko w sieci lokalnej).
    const cleartextBlocked =
      isNativeApp() && /^http:\/\//i.test(rpcEndpoint) && /cleartext|transport security|secure connection|-1022/i.test(detail);
    const msg = cleartextBlocked
      ? t('System zablokował nieszyfrowane połączenie (http://). Użyj adresu https:// — aplikacja mobilna łączy się bez szyfrowania tylko z serwerami w sieci lokalnej.')
      : isNativeApp()
      ? t('Nie udało się połączyć z serwerem: {0}', detail)
      : isNetwork
        ? t('Połączenie zablokowane przez przeglądarkę (najczęściej brak nagłówków CORS na serwerze LimeSurvey lub błędny URL).')
        : detail;

    emitTrace({
      id: `${Date.now()}_${requestId}`,
      method,
      endpoint: rpcEndpoint,
      mode,
      ok: false,
      durationMs,
      summary: msg,
      timestamp: new Date().toISOString(),
    });

    throw new LimeSurveyRpcError(msg, { isCorsOrNetwork: isNetwork && !isNativeApp() });
  }
}

export async function getSessionKey(
  rpcEndpoint: string,
  username: string,
  password: string,
  authPlugin = 'Authdb',
  mode: ConnectionMode = 'direct'
): Promise<string> {
  const params = authPlugin ? [username, password, authPlugin] : [username, password];
  const result = await callLimeSurveyRpc<string>(
    rpcEndpoint,
    'get_session_key',
    params,
    mode
  );
  if (typeof result !== 'string' || !result) {
    throw new LimeSurveyRpcError(t('Serwer nie zwrócił prawidłowego klucza sesji.'));
  }
  return result;
}

export async function releaseSessionKey(
  rpcEndpoint: string,
  sessionKey: string,
  mode: ConnectionMode = 'direct'
): Promise<string> {
  return callLimeSurveyRpc<string>(
    rpcEndpoint,
    'release_session_key',
    [sessionKey],
    mode
  );
}

export async function getSiteSettings(
  rpcEndpoint: string,
  sessionKey: string,
  settingName = 'sitename',
  mode: ConnectionMode = 'direct'
): Promise<unknown> {
  return callLimeSurveyRpc<unknown>(
    rpcEndpoint,
    'get_site_settings',
    [sessionKey, settingName],
    mode
  );
}

export async function listSurveys(
  rpcEndpoint: string,
  sessionKey: string,
  username?: string,
  mode: ConnectionMode = 'direct'
): Promise<LimeSurveyItem[]> {
  const params = username ? [sessionKey, username] : [sessionKey];
  try {
    const result = await callLimeSurveyRpc<LimeSurveyItem[]>(
      rpcEndpoint,
      'list_surveys',
      params,
      mode
    );
    return Array.isArray(result) ? result : [];
  } catch (err) {
    // Świeża instancja bez ankiet zwraca status „No surveys found” — to pusta lista, nie błąd.
    if (err instanceof LimeSurveyRpcError && /no surveys found/i.test(err.message)) {
      return [];
    }
    throw err;
  }
}

/**
 * Importuje ankietę z pliku struktury (.lss) lub archiwum (.lsa). Zwraca identyfikator nowej ankiety.
 * Podanie nowej nazwy nadpisuje tytuł we wszystkich językach — dla szablonów wielojęzycznych zostaw puste.
 */
export async function importSurvey(
  rpcEndpoint: string,
  sessionKey: string,
  base64Data: string,
  dataType: 'lss' | 'lsa' | 'csv' | 'txt' = 'lss',
  newSurveyName: string | null = null,
  mode: ConnectionMode = 'direct'
): Promise<number> {
  const params: unknown[] = newSurveyName ? [sessionKey, base64Data, dataType, newSurveyName] : [sessionKey, base64Data, dataType];
  const result = await callLimeSurveyRpc<number | string>(rpcEndpoint, 'import_survey', params, mode);
  const sid = Number(result);
  if (!Number.isInteger(sid) || sid <= 0) {
    throw new LimeSurveyRpcError(t('Serwer nie zwrócił identyfikatora zaimportowanej ankiety.'));
  }
  return sid;
}

/** Kodowanie base64 tekstu UTF-8 (pliki .lss zawierają polskie znaki). */
export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Numery dodatkowych pól uczestnika zdefiniowanych w ankiecie (attribute_1 → 1).
 * LimeSurvey 4+ zapisuje definicje jako JSON; starsze wersje — w formacie serialize() PHP.
 */
export function tokenAttributeNumbers(attributeDescriptions: unknown): number[] {
  let source: unknown = attributeDescriptions;
  if (typeof source === 'string') {
    const text = source.trim();
    if (!text) return [];
    try {
      source = JSON.parse(text);
    } catch {
      const found = [...text.matchAll(/attribute_(\d+)/g)].map((m) => Number(m[1]));
      return [...new Set(found)].sort((a, b) => a - b);
    }
  }
  if (!source || typeof source !== 'object') return [];
  return Object.keys(source as Record<string, unknown>)
    .map((key) => /^attribute_(\d+)$/.exec(key))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

/** Ankieta nie ma jeszcze tabeli uczestników (komunikat zależy od wersji LimeSurvey). */
export function isMissingParticipantTable(message: string): boolean {
  return /no token table|no survey participants? (table|list)|ERR_NO_PARTICIPANT_TABLE/i.test(message);
}

/** Tabela uczestników istnieje, ale nie ma w niej pasujących wpisów. */
export function isEmptyParticipantList(message: string): boolean {
  return /no tokens found|no survey participants found|no data/i.test(message);
}

export interface MailSendResult {
  sent: number;
  failed: number;
  left: number;
  /** Komunikaty błędów dla nieudanych wysyłek (maks. kilka pierwszych). */
  errors: string[];
}

/** Podsumowanie wyniku invite_participants / remind_participants. */
export function summarizeMailResult(result: unknown): MailSendResult {
  const summary: MailSendResult = { sent: 0, failed: 0, left: 0, errors: [] };
  if (!result || typeof result !== 'object') return summary;
  for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
    if (key === 'status') {
      const match = /^(\d+) left to send$/i.exec(String(value));
      if (match) summary.left = Number(match[1]);
      continue;
    }
    if (!value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    if (/^ok$/i.test(String(item.status || ''))) summary.sent += 1;
    else {
      summary.failed += 1;
      if (summary.errors.length < 3) summary.errors.push(String(item.error || item.status || '').slice(0, 200));
    }
  }
  return summary;
}

export async function getSurveyProperties(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  mode: ConnectionMode = 'direct'
): Promise<SurveyProperties> {
  return callLimeSurveyRpc<SurveyProperties>(
    rpcEndpoint,
    'get_survey_properties',
    [sessionKey, surveyId],
    mode
  );
}

export async function setSurveyProperties(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  properties: Record<string, string | number | null>,
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'set_survey_properties',
    [sessionKey, surveyId, properties],
    mode
  );
}

export async function activateSurvey(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'activate_survey',
    [sessionKey, surveyId],
    mode
  );
}

export async function copySurvey(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  newName: string,
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'copy_survey',
    [sessionKey, surveyId, newName],
    mode
  );
}

export async function getLanguageProperties(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  settings: string[] | null = [
    'surveyls_language',
    'surveyls_title',
    'surveyls_email_invite_subj',
    'surveyls_email_invite',
    'surveyls_email_remind_subj',
    'surveyls_email_remind',
  ],
  language: string | null = null,
  mode: ConnectionMode = 'direct'
): Promise<SurveyLanguageProperties> {
  return callLimeSurveyRpc<SurveyLanguageProperties>(
    rpcEndpoint,
    'get_language_properties',
    [sessionKey, surveyId, settings, language],
    mode
  );
}

export async function setLanguageProperties(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  localeData: Partial<SurveyLanguageProperties>,
  language: string | null = null,
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'set_language_properties',
    [sessionKey, surveyId, localeData, language],
    mode
  );
}

export async function getSummary(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  statName = 'all',
  mode: ConnectionMode = 'direct'
): Promise<SurveySummary> {
  return callLimeSurveyRpc<SurveySummary>(
    rpcEndpoint,
    'get_summary',
    [sessionKey, surveyId, statName],
    mode
  );
}

export async function getFieldmap(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  language: string | null = null,
  mode: ConnectionMode = 'direct'
): Promise<Record<string, FieldmapEntry>> {
  const params: unknown[] = language
    ? [sessionKey, surveyId, language]
    : [sessionKey, surveyId];
  const result = await callLimeSurveyRpc<Record<string, FieldmapEntry>>(
    rpcEndpoint,
    'get_fieldmap',
    params,
    mode
  );
  return result && typeof result === 'object' ? result : {};
}

export async function activateTokens(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  mode: ConnectionMode = 'direct',
  /** Numery dodatkowych pól (np. [1, 2] tworzy attribute_1 i attribute_2). */
  attributeFields: number[] = []
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'activate_tokens',
    attributeFields.length ? [sessionKey, surveyId, attributeFields] : [sessionKey, surveyId],
    mode
  );
}

export async function listParticipants(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  start = 0,
  limit = 50,
  unusedOnly = false,
  mode: ConnectionMode = 'direct'
): Promise<ParticipantItem[]> {
  const result = await callLimeSurveyRpc<ParticipantItem[]>(
    rpcEndpoint,
    'list_participants',
    [
      sessionKey,
      surveyId,
      start,
      limit,
      unusedOnly,
      ['email', 'firstname', 'lastname', 'sent', 'completed', 'usesleft', 'validfrom', 'validuntil'],
    ],
    mode
  );
  return Array.isArray(result) ? result : [];
}

export async function addParticipants(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  participants: Array<{
    email: string;
    firstname: string;
    lastname: string;
  }>,
  createToken = true,
  mode: ConnectionMode = 'direct'
): Promise<unknown[]> {
  const result = await callLimeSurveyRpc<unknown[]>(
    rpcEndpoint,
    'add_participants',
    [sessionKey, surveyId, participants, createToken],
    mode
  );
  return Array.isArray(result) ? result : [];
}

export async function deleteParticipants(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  tokenIds: number[],
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'delete_participants',
    [sessionKey, surveyId, tokenIds],
    mode
  );
}

export async function inviteParticipants(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  tokenIds: number[] = [],
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'invite_participants',
    [sessionKey, surveyId, tokenIds],
    mode
  );
}

export async function remindParticipants(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  tokenIds: number[] = [],
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'remind_participants',
    [sessionKey, surveyId, undefined, undefined, tokenIds],
    mode
  );
}

export async function exportResponses(
  rpcEndpoint: string,
  sessionKey: string,
  surveyId: number,
  documentType: 'csv' | 'xls' | 'json' | 'pdf',
  completionStatus: 'all' | 'complete' | 'incomplete' = 'all',
  headingType: 'code' | 'full' | 'abbreviated' = 'full',
  languageCode?: string,
  mode: ConnectionMode = 'direct'
): Promise<{ base64: string; bytes: Uint8Array; textPreview?: string }> {
  const params: unknown[] = [
    sessionKey,
    surveyId,
    documentType,
    languageCode || null,
    completionStatus,
    headingType,
    'long',
  ];

  const base64 = await callLimeSurveyRpc<string>(
    rpcEndpoint,
    'export_responses',
    params,
    mode
  );

  if (typeof base64 !== 'string') {
    throw new LimeSurveyRpcError(t('Nieoczekiwany format odpowiedzi z export_responses.'));
  }

  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  let textPreview: string | undefined;
  if (documentType === 'csv' || documentType === 'json') {
    textPreview = new TextDecoder('utf-8').decode(bytes);
  }

  return { base64, bytes, textPreview };
}
