import type { ActiveSession } from '../types/limesurvey';

/**
 * Publiczny adres ankiety. Styl adresu (ładny / z parametrem r=) wynika z endpointu RPC instancji.
 * `newTest` zaczyna nową odpowiedź bez danych poprzedniego respondenta (tryb CAPI / kiosk).
 */
export function surveyPublicUrl(session: Pick<ActiveSession, 'rpcEndpoint'>, surveyId: number, options: { lang?: string; newTest?: boolean } = {}): string {
  const endpoint = session.rpcEndpoint;
  const query = new URLSearchParams();
  let base: string;
  if (/[?&]r=admin\/remotecontrol/i.test(endpoint)) {
    base = endpoint.replace(/\?.*$/, '');
    query.set('r', 'survey/index');
    query.set('sid', String(surveyId));
  } else {
    base = `${endpoint.replace(/\/admin\/remotecontrol\/?$/i, '')}/${surveyId}`;
  }
  if (options.lang) query.set('lang', options.lang);
  if (options.newTest) query.set('newtest', 'Y');
  const qs = query.toString().replace(/%2F/g, '/');
  return qs ? `${base}?${qs}` : base;
}

/** Języki ankiety: bazowy + dodatkowe (właściwość additional_languages to lista rozdzielona spacjami). */
export function surveyLanguages(properties: { language?: unknown; additional_languages?: unknown } | null): string[] {
  if (!properties) return [];
  const base = typeof properties.language === 'string' ? properties.language.trim() : '';
  const extra = typeof properties.additional_languages === 'string' ? properties.additional_languages.split(/\s+/).filter(Boolean) : [];
  return [...new Set([base, ...extra].filter(Boolean))];
}
