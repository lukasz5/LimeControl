/**
 * Łącznik StrefaAnkiet (tylko odczyt): stan realizacji CATI/CAPI badania powiązanego z ankietą LimeSurvey.
 *
 * Zapytania przechodzą przez serwer LimeControl (/api/strefaankiet), który przepuszcza wyłącznie
 * odczyt kilku ścieżek API platformy. Klucz dostępu żyje tylko w pamięci otwartej karty.
 */
import { authHeaders } from '../backend';
import { apiUrl, getApiBase } from '../backend/apiBase';
import { isNativeApp } from '../platform';

export interface StrefaConnection {
  baseUrl: string;
  token: string;
}

/** Powiązanie ankiety LimeSurvey z badaniem w StrefieAnkiet. */
export interface StrefaLink {
  projectId: number;
  studyId: number;
  studyTitle?: string;
}

export interface StrefaResponse {
  status: number;
  body: unknown;
}

export type StrefaTransport = (connection: StrefaConnection, path: string, query?: Record<string, string | number>) => Promise<StrefaResponse>;

export class StrefaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'StrefaError';
  }
}

/** Domyślny transport: pośrednik na serwerze LimeControl. */
export const proxyTransport: StrefaTransport = async (connection, path, query) => {
  const res = await fetch(apiUrl('/api/strefaankiet'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ baseUrl: connection.baseUrl, token: connection.token, path, query }),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
};

/**
 * Aplikacja mobilna bez serwera LimeControl: zapytanie idzie z urządzenia prosto do platformy
 * (natywnie, bez CORS). Dozwolone są te same ścieżki tylko do odczytu, co w pośredniku serwera.
 */
const DIRECT_PATHS = [
  /^\/api\/limesurvey\/lifecycle\/projects$/,
  /^\/api\/limesurvey\/lifecycle\/projects\/[1-9][0-9]{0,9}\/studies$/,
  /^\/api\/surveys\/[1-9][0-9]{0,9}\/limesurvey-bridge$/,
  /^\/api\/projects\/[1-9][0-9]{0,9}\/limesurvey-fieldwork\/[1-9][0-9]{0,9}\/[1-9][0-9]{0,9}\/(status|quotas|assignments)$/,
  /^\/api\/projects\/[1-9][0-9]{0,9}\/limesurvey-cati-manager\/[1-9][0-9]{0,9}\/[1-9][0-9]{0,9}(\/cases)?$/,
];

export const directTransport: StrefaTransport = async (connection, path, query) => {
  if (!DIRECT_PATHS.some((re) => re.test(path))) return { status: 403, body: { error: 'Path not allowed' } };
  const url = new URL(path, connection.baseUrl);
  for (const [key, value] of Object.entries(query || {})) url.searchParams.set(key, String(value));
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${connection.token}` },
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
};

/** Pośrednik serwera, a w aplikacji mobilnej bez serwera — połączenie bezpośrednie. */
export function defaultTransport(): StrefaTransport {
  return isNativeApp() && !getApiBase() ? directTransport : proxyTransport;
}

function messageOf(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.message === 'string') return record.message;
  }
  return fallback;
}

async function get<T>(transport: StrefaTransport, connection: StrefaConnection, path: string, query?: Record<string, string | number>): Promise<T> {
  const res = await transport(connection, path, query);
  if (res.status < 200 || res.status >= 300) throw new StrefaError(messageOf(res.body, `HTTP ${res.status}`), res.status);
  return res.body as T;
}

interface Paginated<T> {
  data?: T[];
  last_page?: number;
}

const hostOf = (url: string): string => {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Szuka badania powiązanego z ankietą: projekty → badania ilościowe → połączenie z LimeSurvey.
 * Liczba zapytań jest ograniczona; gdy badań jest więcej, powiązanie można wpisać ręcznie.
 */
export async function discoverStudy(
  connection: StrefaConnection,
  surveyId: number,
  instanceBaseUrl: string,
  transport: StrefaTransport = defaultTransport(),
  maxRequests = 60
): Promise<StrefaLink | null> {
  let budget = maxRequests;
  const spend = () => {
    budget -= 1;
    return budget >= 0;
  };
  const instanceHost = hostOf(instanceBaseUrl);
  if (!spend()) return null;
  const projects = await get<Paginated<{ id: number }>>(transport, connection, '/api/limesurvey/lifecycle/projects', { per_page: 100 });
  for (const project of projects.data || []) {
    if (!spend()) return null;
    let studies: Paginated<{ id: number; title?: string }>;
    try {
      studies = await get(transport, connection, `/api/limesurvey/lifecycle/projects/${project.id}/studies`, { per_page: 100, method: 'quantitative' });
    } catch (err) {
      if (err instanceof StrefaError && (err.status === 403 || err.status === 404)) continue;
      throw err;
    }
    for (const study of studies.data || []) {
      if (!spend()) return null;
      let bridge: { connection?: { instance_url?: string; remote_survey_id?: number | string } | null };
      try {
        bridge = await get(transport, connection, `/api/surveys/${study.id}/limesurvey-bridge`);
      } catch (err) {
        if (err instanceof StrefaError && (err.status === 403 || err.status === 404)) continue;
        throw err;
      }
      const linked = bridge.connection;
      if (!linked || Number(linked.remote_survey_id) !== surveyId) continue;
      const linkedHost = hostOf(String(linked.instance_url || ''));
      // Ten sam numer ankiety może istnieć na różnych serwerach — porównujemy też host instancji.
      if (instanceHost && linkedHost && instanceHost !== linkedHost) continue;
      return { projectId: Number(project.id), studyId: Number(study.id), studyTitle: study.title };
    }
  }
  return null;
}

export interface FieldworkAssignment {
  id: number;
  worker: string;
  modes: string[];
  status: string;
  target: number | null;
  completed: number;
}

export interface FieldworkSnapshot {
  studyTitle: string;
  capi:
    | { available: true; nativeCompleted: number; confirmedCompleted: number; assignments: FieldworkAssignment[] }
    | { available: false; reason: string };
  cati:
    | { available: true; total: number; needsAssignment: number; attention: number; blockingReasons: string[] }
    | { available: false; reason: string };
}

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Pobiera stan realizacji. Brak zakresu lub modułu w jednym trybie nie blokuje drugiego. */
export async function loadFieldwork(
  connection: StrefaConnection,
  link: StrefaLink,
  surveyId: number,
  transport: StrefaTransport = defaultTransport()
): Promise<FieldworkSnapshot> {
  const fieldworkBase = `/api/projects/${link.projectId}/limesurvey-fieldwork/${link.studyId}/${surveyId}`;
  const catiBase = `/api/projects/${link.projectId}/limesurvey-cati-manager/${link.studyId}/${surveyId}`;
  const reason = (err: unknown) => (err instanceof Error ? err.message : String(err));
  let studyTitle = link.studyTitle || '';

  const capi: FieldworkSnapshot['capi'] = await (async () => {
    try {
      const status = await get<{ study?: { title?: string }; progress?: { native_completed?: unknown; external_completed?: unknown } }>(transport, connection, `${fieldworkBase}/status`);
      studyTitle = status.study?.title || studyTitle;
      let assignments: FieldworkAssignment[] = [];
      try {
        const page = await get<Paginated<Record<string, unknown>>>(transport, connection, `${fieldworkBase}/assignments`, { per_page: 100 });
        assignments = (page.data || []).map((row) => {
          const worker = (row.field_worker || {}) as Record<string, unknown>;
          const progress = (row.progress || {}) as Record<string, unknown>;
          return {
            id: num(row.id),
            worker: String(worker.name || worker.code || `#${row.field_worker_id ?? '?'}`),
            modes: Array.isArray(row.interview_modes) ? row.interview_modes.map(String) : [],
            status: String(row.status || ''),
            target: row.target_count === null || row.target_count === undefined ? null : num(row.target_count),
            completed: num(progress.native_completed) + num(progress.external_completed),
          };
        });
      } catch (err) {
        // Podgląd przydziałów wymaga roli koordynatora — sam postęp pokazujemy mimo to.
        if (!(err instanceof StrefaError && err.status === 403)) throw err;
      }
      return {
        available: true as const,
        nativeCompleted: num(status.progress?.native_completed),
        confirmedCompleted: num(status.progress?.external_completed),
        assignments,
      };
    } catch (err) {
      return { available: false as const, reason: reason(err) };
    }
  })();

  const cati: FieldworkSnapshot['cati'] = await (async () => {
    try {
      const status = await get<{ study?: { title?: string }; blocking_reasons?: unknown }>(transport, connection, catiBase);
      studyTitle = studyTitle || status.study?.title || '';
      const cases = await get<{ summary?: { total?: unknown; needs_assignment?: unknown; attention?: unknown } }>(transport, connection, `${catiBase}/cases`, { per_page: 1 });
      return {
        available: true as const,
        total: num(cases.summary?.total),
        needsAssignment: num(cases.summary?.needs_assignment),
        attention: num(cases.summary?.attention),
        blockingReasons: Array.isArray(status.blocking_reasons) ? status.blocking_reasons.map(String) : [],
      };
    } catch (err) {
      return { available: false as const, reason: reason(err) };
    }
  })();

  return { studyTitle, capi, cati };
}

// ----- ustawienia połączenia -----
const KEY_URL = 'limecontrol_strefa_url_v1';
const KEY_LINKS = 'limecontrol_strefa_links_v1';
/** Klucz dostępu trzymamy wyłącznie w pamięci tej karty. */
let memoryToken = '';

export function getStoredBaseUrl(): string {
  try {
    return localStorage.getItem(KEY_URL) || '';
  } catch {
    return '';
  }
}

export function getConnection(): StrefaConnection | null {
  const baseUrl = getStoredBaseUrl();
  return baseUrl && memoryToken ? { baseUrl, token: memoryToken } : null;
}

export function setConnection(baseUrl: string, token: string): StrefaConnection {
  const clean = baseUrl.trim().replace(/\/+$/, '');
  memoryToken = token.trim();
  try {
    localStorage.setItem(KEY_URL, clean);
  } catch {
    // adres zostaje tylko w pamięci
  }
  return { baseUrl: clean, token: memoryToken };
}

export function clearConnection(): void {
  memoryToken = '';
}

function readLinks(): Record<string, StrefaLink> {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY_LINKS) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, StrefaLink>) : {};
  } catch {
    return {};
  }
}

export function getStoredLink(profileId: string, surveyId: number): StrefaLink | null {
  const link = readLinks()[`${profileId}:${surveyId}`];
  return link && Number.isInteger(link.projectId) && Number.isInteger(link.studyId) ? link : null;
}

export function storeLink(profileId: string, surveyId: number, link: StrefaLink | null): void {
  const links = readLinks();
  if (link) links[`${profileId}:${surveyId}`] = link;
  else delete links[`${profileId}:${surveyId}`];
  try {
    localStorage.setItem(KEY_LINKS, JSON.stringify(links));
  } catch {
    // brak dostępu do storage
  }
}
