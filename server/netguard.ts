/**
 * Ochrona przed SSRF dla zapytań wychodzących z serwera (przekaźnik RPC, harmonogram, łącznik StrefaAnkiet).
 *
 * Serwer łączy się z adresem podanym przez użytkownika, więc bez tej kontroli każdy zalogowany
 * mógłby sięgnąć do usług w sieci wewnętrznej (metadane chmury, panele administracyjne, bazy).
 * Zasady:
 *  - tylko http/https, bez danych logowania w adresie;
 *  - nazwa hosta jest rozwiązywana raz, a połączenie idzie dokładnie na sprawdzony adres IP
 *    (przypięty `lookup`) — podmiana rekordu DNS między kontrolą a połączeniem nic nie daje;
 *  - adresy prywatne, pętli zwrotnej i link-local są odrzucane, chyba że administrator
 *    świadomie je dopuści (RELAY_ALLOW_PRIVATE=1 — typowe przy instalacji we własnej sieci);
 *  - przekierowania nie są śledzone, odpowiedź ma limit rozmiaru i czasu.
 */
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import { LocalizedError } from './messages.ts';

/** Błąd zapytania wychodzącego; `key` wskazuje komunikat w server/messages.ts. */
export class OutboundRequestError extends LocalizedError {
  constructor(key: string, status = 400, args: unknown[] = []) {
    super(key, args, status);
    this.name = 'OutboundRequestError';
  }
}

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

const BLOCKED_V4: Array<[string, number]> = [
  ['0.0.0.0', 8], // „ta sieć”
  ['10.0.0.0', 8], // prywatne
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // pętla zwrotna
  ['169.254.0.0', 16], // link-local, w tym metadane chmur (169.254.169.254)
  ['172.16.0.0', 12], // prywatne
  ['192.0.0.0', 24], // przydziały IETF
  ['192.0.2.0', 24], // dokumentacja
  ['192.168.0.0', 16], // prywatne
  ['198.18.0.0', 15], // testy wydajności
  ['198.51.100.0', 24], // dokumentacja
  ['203.0.113.0', 24], // dokumentacja
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // zarezerwowane + broadcast
];

/** Czy adres IP wskazuje na sieć, do której serwer nie powinien łączyć się w imieniu użytkownika. */
export function isPrivateAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const value = ipv4ToInt(ip);
    return BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (value & mask) === (ipv4ToInt(base) & mask);
    });
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    // IPv4 zmapowane na IPv6 (::ffff:a.b.c.d oraz zapis szesnastkowy ::ffff:7f00:1)
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (mappedHex) {
      const hi = parseInt(mappedHex[1], 16);
      const lo = parseInt(mappedHex[2], 16);
      return isPrivateAddress(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
    }
    if (lower === '::' || lower === '::1') return true; // nieokreślony, pętla zwrotna
    const first = parseInt(lower.split(':')[0] || '0', 16);
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 — unikalne lokalne
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 — link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 — multicast
    if (lower.startsWith('2001:db8:')) return true; // dokumentacja
    return false;
  }
  return true; // nie-IP traktujemy jak niedozwolone
}

export interface ResolvedTarget {
  url: URL;
  address: string;
  family: 4 | 6;
}

/**
 * Sprawdza adres docelowy i rozwiązuje go do jednego, dozwolonego adresu IP.
 * @throws OutboundRequestError gdy adres jest nieprawidłowy lub wskazuje na sieć prywatną
 */
export async function resolveTarget(
  rawUrl: string,
  options: { allowPrivate?: boolean; lookup?: (host: string) => Promise<Array<{ address: string; family: number }>> } = {}
): Promise<ResolvedTarget> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new OutboundRequestError('url_invalid');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new OutboundRequestError('url_protocol');
  }
  if (url.username || url.password) {
    throw new OutboundRequestError('url_credentials');
  }
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (!host) throw new OutboundRequestError('url_no_host');

  let candidates: Array<{ address: string; family: number }>;
  if (net.isIP(host)) {
    candidates = [{ address: host, family: net.isIP(host) }];
  } else {
    try {
      candidates = options.lookup
        ? await options.lookup(host)
        : await dns.promises.lookup(host, { all: true, verbatim: true });
    } catch {
      throw new OutboundRequestError('dns_failed', 502, [host]);
    }
  }
  if (!candidates.length) throw new OutboundRequestError('dns_empty', 502, [host]);

  if (!options.allowPrivate) {
    // Wystarczy jeden adres prywatny wśród rekordów, żeby odmówić — inaczej da się wygrać losowanie rekordu.
    const blocked = candidates.find((c) => isPrivateAddress(c.address));
    if (blocked) {
      throw new OutboundRequestError('private_address', 403);
    }
  }
  const chosen = candidates[0];
  return { url, address: chosen.address, family: chosen.family === 6 ? 6 : 4 };
}

export interface OutboundResponse {
  status: number;
  contentType: string;
  body: string;
}

/**
 * Wysyła zapytanie HTTP(S) na wcześniej sprawdzony adres. Nie śledzi przekierowań.
 */
export function sendRequest(
  target: ResolvedTarget,
  init: { method: 'GET' | 'POST'; headers?: Record<string, string>; body?: string; timeoutMs?: number; maxBytes?: number }
): Promise<OutboundResponse> {
  const { url, address, family } = target;
  const timeoutMs = init.timeoutMs ?? 30_000;
  const maxBytes = init.maxBytes ?? 32 * 1024 * 1024;
  const transport = url.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err instanceof OutboundRequestError ? err : new OutboundRequestError('connection_error', 502, [err.message]));
    };
    const req = transport.request(
      url,
      {
        method: init.method,
        headers: { ...(init.headers || {}), ...(init.body !== undefined ? { 'Content-Length': String(Buffer.byteLength(init.body)) } : {}) },
        // Połączenie zawsze na sprawdzony adres — bez drugiego zapytania DNS.
        lookup: (_hostname, opts, callback) => {
          if (typeof opts === 'object' && opts && (opts as { all?: boolean }).all) {
            (callback as unknown as (err: null, list: Array<{ address: string; family: number }>) => void)(null, [{ address, family }]);
          } else {
            (callback as (err: null, address: string, family: number) => void)(null, address, family);
          }
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        res.on('data', (chunk: Buffer) => {
          if (settled) return;
          size += chunk.length;
          if (size > maxBytes) {
            fail(new OutboundRequestError('response_too_large', 502));
            res.destroy();
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          if (settled) return;
          settled = true;
          resolve({
            status: res.statusCode || 502,
            contentType: String(res.headers['content-type'] || 'application/json'),
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
        res.on('error', fail);
      }
    );
    req.on('timeout', () => {
      fail(new OutboundRequestError('upstream_timeout', 504));
      req.destroy();
    });
    req.on('error', fail);
    if (init.body !== undefined) req.write(init.body);
    req.end();
  });
}

/** Skrót: kontrola adresu + zapytanie. */
export async function guardedRequest(
  rawUrl: string,
  init: Parameters<typeof sendRequest>[1],
  options: { allowPrivate?: boolean } = {}
): Promise<OutboundResponse> {
  return sendRequest(await resolveTarget(rawUrl, options), init);
}
