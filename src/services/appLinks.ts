import type { InstanceProfile } from '../types/limesurvey';

/**
 * Linki do aplikacji mobilnej: `limecontrol://open?server=…&user=…&name=…&plugin=…&sid=…`.
 *
 *  - Bez `sid` link wypełnia formularz nowej instancji (albo wskazuje istniejący profil).
 *  - Z `sid` aplikacja po połączeniu otwiera wskazaną ankietę.
 *
 * Link nigdy nie zawiera hasła — parametr `password` (i podobne) jest ignorowany, a adres serwera
 * z wpisanym loginem lub hasłem (`https://user:pass@…`) jest odrzucany. Ten sam link trafia do kodu QR,
 * który aplikacja skanuje, i do kodu QR zeskanowanego aparatem systemu (otwiera aplikację).
 * Zeskanowany zwykły adres serwera (`https://ankiety.example.com`) też jest przyjmowany.
 */

export const APP_LINK_SCHEME = 'limecontrol';

export interface AppLink {
  /** Adres serwera albo endpoint RPC, tak jak w polu formularza. */
  server: string;
  username?: string;
  name?: string;
  authPlugin?: string;
  surveyId?: number;
}

const MAX = { server: 500, username: 120, name: 120, authPlugin: 80 };

function clean(value: string | null, max: number): string | undefined {
  const text = (value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return text ? text.slice(0, max) : undefined;
}

function safeServer(raw: string | null | undefined): string | null {
  const value = clean(raw ?? null, MAX.server);
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || !url.hostname) return null;
  return url.toString().replace(/\/+$/, '');
}

/** Rozpoznaje link aplikacji (albo zwykły adres serwera z kodu QR). Zwraca null dla czegoś innego. */
export function parseAppLink(raw: string): AppLink | null {
  const text = (raw || '').trim();
  if (!text) return null;

  if (/^https?:\/\//i.test(text)) {
    const server = safeServer(text);
    return server ? { server } : null;
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== `${APP_LINK_SCHEME}:`) return null;
  // limecontrol://open?… — host „open”; starsze parsery mogą widzieć ścieżkę „//open”.
  const action = (url.hostname || url.pathname.replace(/^\/+/, '')).toLowerCase();
  if (action !== 'open') return null;

  const params = url.searchParams;
  const server = safeServer(params.get('server'));
  if (!server) return null;
  const sidRaw = params.get('sid');
  const sid = sidRaw && /^\d{1,10}$/.test(sidRaw) ? Number(sidRaw) : undefined;

  const link: AppLink = { server };
  const username = clean(params.get('user'), MAX.username);
  const name = clean(params.get('name'), MAX.name);
  const authPlugin = clean(params.get('plugin'), MAX.authPlugin);
  if (username) link.username = username;
  if (name) link.name = name;
  if (authPlugin && /^[A-Za-z0-9_]+$/.test(authPlugin)) link.authPlugin = authPlugin;
  if (sid && sid > 0) link.surveyId = sid;
  return link;
}

/** Buduje link aplikacji do profilu (bez hasła), opcjonalnie do konkretnej ankiety. */
export function buildAppLink(profile: Pick<InstanceProfile, 'rpcEndpoint' | 'username' | 'name' | 'authPlugin'>, surveyId?: number): string {
  const params = new URLSearchParams();
  params.set('server', profile.rpcEndpoint);
  if (profile.username) params.set('user', profile.username);
  if (profile.name) params.set('name', profile.name);
  if (profile.authPlugin && profile.authPlugin !== 'Authdb') params.set('plugin', profile.authPlugin);
  if (surveyId) params.set('sid', String(surveyId));
  return `${APP_LINK_SCHEME}://open?${params.toString()}`;
}

/** Porównywalna postać adresu: bez protokołu, końcowych ukośników i z hostem małymi literami. */
function comparable(endpoint: string): string {
  try {
    const url = new URL(/^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`);
    const path = url.pathname.replace(/\/+$/, '').replace(/\/index\.php\/admin\/remotecontrol$/i, '').replace(/\/admin\/remotecontrol$/i, '');
    const query = url.search.replace(/[?&]r=admin\/remotecontrol/i, '');
    return `${url.host.toLowerCase()}${path}${query}`;
  } catch {
    return endpoint.trim().toLowerCase();
  }
}

/** Zapisany profil pasujący do linku: ten sam serwer i — jeśli link go podaje — ten sam login. */
export function findProfileForLink(profiles: InstanceProfile[], link: AppLink): InstanceProfile | null {
  const target = comparable(link.server);
  const sameServer = profiles.filter((p) => comparable(p.rpcEndpoint) === target || comparable(p.baseUrl) === target);
  if (!link.username) return sameServer[0] ?? null;
  return sameServer.find((p) => p.username.toLowerCase() === link.username!.toLowerCase()) ?? null;
}
