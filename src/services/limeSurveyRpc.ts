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
    throw new LimeSurveyRpcError('Podaj adres URL instancji LimeSurvey.');
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

function extractStatusError(
  result: unknown
): { message: string; code?: string | number } | null {
  if (!result || typeof result !== 'object') {
    return null;
  }

  const record = result as Record<string, unknown>;
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
        : await fetch('/api/rpc-relay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
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
      let msg = `Serwer odpowiedział kodem HTTP ${response.status}`;
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

    const statusError = extractStatusError(payload.result);
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
    const msg = isNetwork
      ? 'Połączenie zablokowane przez przeglądarkę (najczęściej brak nagłówków CORS na serwerze LimeSurvey lub błędny URL).'
      : err instanceof Error
        ? err.message
        : String(err);

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

    throw new LimeSurveyRpcError(msg, { isCorsOrNetwork: isNetwork });
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
    throw new LimeSurveyRpcError('Serwer nie zwrócił prawidłowego klucza sesji.');
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
  const result = await callLimeSurveyRpc<LimeSurveyItem[]>(
    rpcEndpoint,
    'list_surveys',
    params,
    mode
  );
  return Array.isArray(result) ? result : [];
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
  mode: ConnectionMode = 'direct'
): Promise<Record<string, unknown>> {
  return callLimeSurveyRpc<Record<string, unknown>>(
    rpcEndpoint,
    'activate_tokens',
    [sessionKey, surveyId],
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
    throw new LimeSurveyRpcError('Nieoczekiwany format odpowiedzi z export_responses.');
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
