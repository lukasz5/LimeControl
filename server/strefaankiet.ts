/**
 * Łącznik StrefaAnkiet — pośrednik tylko do odczytu.
 *
 * Aplikacja pokazuje stan realizacji CATI/CAPI badania powiązanego z ankietą LimeSurvey.
 * Przeglądarka nie łączy się z platformą bezpośrednio (CORS), więc zapytanie przechodzi przez
 * serwer LimeControl. Pośrednik przepuszcza wyłącznie zapytania GET z poniższej listy,
 * klucza dostępu nie zapisuje i nie loguje.
 */
import { OutboundRequestError, guardedRequest } from './netguard.ts';

const ID = '[1-9][0-9]{0,9}';
/** Dozwolone ścieżki API platformy (wszystkie tylko do odczytu). */
export const ALLOWED_PATHS: RegExp[] = [
  new RegExp('^/api/limesurvey/lifecycle/projects$'),
  new RegExp(`^/api/limesurvey/lifecycle/projects/${ID}/studies$`),
  new RegExp(`^/api/surveys/${ID}/limesurvey-bridge$`),
  new RegExp(`^/api/projects/${ID}/limesurvey-fieldwork/${ID}/${ID}/(status|quotas|assignments)$`),
  new RegExp(`^/api/projects/${ID}/limesurvey-cati-manager/${ID}/${ID}(/cases)?$`),
];
const ALLOWED_QUERY = new Set(['page', 'per_page', 'status', 'method', 'search']);

export interface StrefaRequest {
  baseUrl?: unknown;
  token?: unknown;
  path?: unknown;
  query?: unknown;
}

export function buildStrefaUrl(input: StrefaRequest): { url: string; token: string } {
  const baseUrl = typeof input.baseUrl === 'string' ? input.baseUrl.trim().replace(/\/+$/, '') : '';
  const token = typeof input.token === 'string' ? input.token.trim() : '';
  const path = typeof input.path === 'string' ? input.path : '';
  if (!baseUrl || !token || !path) throw new OutboundRequestError('strefa_required');
  if (token.length > 4096 || /[\r\n]/.test(token)) throw new OutboundRequestError('strefa_token_invalid');
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new OutboundRequestError('strefa_url_invalid');
  }
  if (base.protocol !== 'https:' && base.protocol !== 'http:') throw new OutboundRequestError('strefa_url_protocol');
  if (base.pathname !== '/' && base.pathname !== '') throw new OutboundRequestError('strefa_url_path');
  if (!ALLOWED_PATHS.some((re) => re.test(path))) throw new OutboundRequestError('strefa_path_denied', 403);

  const url = new URL(path, base);
  if (input.query && typeof input.query === 'object') {
    for (const [key, value] of Object.entries(input.query as Record<string, unknown>)) {
      if (!ALLOWED_QUERY.has(key)) throw new OutboundRequestError('strefa_query_denied', 400, [key]);
      if (typeof value !== 'string' && typeof value !== 'number') continue;
      const text = String(value);
      if (text.length > 190) throw new OutboundRequestError('strefa_query_long', 400, [key]);
      url.searchParams.set(key, text);
    }
  }
  return { url: url.toString(), token };
}

export async function forwardStrefaRequest(input: StrefaRequest, options: { allowPrivate: boolean }) {
  const { url, token } = buildStrefaUrl(input);
  return guardedRequest(
    url,
    { method: 'GET', headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }, timeoutMs: 20_000, maxBytes: 4 * 1024 * 1024 },
    { allowPrivate: options.allowPrivate }
  );
}
