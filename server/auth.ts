/** Uwierzytelnianie zapytań do API: token Firebase (usługa publiczna) albo klucz dostępu (instalacja własna). */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { ServerConfig } from './config.ts';

/** Identyfikator jedynego użytkownika w trybie lokalnym. */
export const LOCAL_UID = 'local';

const verifiedTokenCache = new Map<string, { uid: string; expiresAt: number }>();

function bearer(req: Request): string {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

/** Porównanie w stałym czasie, niezależne od długości kandydata. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a, 'utf8').digest();
  const hb = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(ha, hb);
}

async function verifyFirebaseToken(idToken: string, apiKey: string): Promise<string | null> {
  const cached = verifiedTokenCache.get(idToken);
  if (cached && cached.expiresAt > Date.now()) return cached.uid;
  try {
    const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { users?: Array<{ localId?: string }> };
    const uid = data.users?.[0]?.localId;
    if (!uid) return null;
    verifiedTokenCache.set(idToken, { uid, expiresAt: Date.now() + 120_000 });
    if (verifiedTokenCache.size > 200) {
      const oldest = verifiedTokenCache.keys().next().value;
      if (oldest) verifiedTokenCache.delete(oldest);
    }
    return uid;
  } catch {
    return null;
  }
}

/** Zwraca identyfikator użytkownika albo null, gdy zapytanie nie jest uwierzytelnione. */
export async function authenticate(req: Request, config: ServerConfig): Promise<string | null> {
  const token = bearer(req);
  if (!token) return null;
  if (config.authMode === 'local') {
    return config.accessKey && safeEqual(token, config.accessKey) ? LOCAL_UID : null;
  }
  if (!config.firebaseApiKey) return null;
  return verifyFirebaseToken(token, config.firebaseApiKey);
}
