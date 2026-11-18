/**
 * Szyfrowanie haseł przechowywanych w kolejce harmonogramu (AES-256-GCM).
 *
 * Zaplanowane zadanie musi zalogować się do LimeSurvey, gdy użytkownika nie ma przy aplikacji,
 * więc hasło jest zapisywane na serwerze. Zamiast jawnego tekstu w data/schedules.json trzymamy
 * szyfrogram; klucz pochodzi ze zmiennej LIMECONTROL_SECRET albo z pliku data/secret.key
 * (tworzonego automatycznie z uprawnieniami 600). Kopia samego pliku kolejki nie ujawnia haseł.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PREFIX = 'enc:v1:';

export function loadSecretKey(dataDir: string, envSecret = process.env.LIMECONTROL_SECRET): Buffer {
  if (envSecret && envSecret.length >= 16) {
    return createHash('sha256').update(envSecret, 'utf8').digest();
  }
  const file = path.join(dataDir, 'secret.key');
  try {
    const existing = fs.readFileSync(file, 'utf8').trim();
    if (/^[0-9a-f]{64}$/.test(existing)) return Buffer.from(existing, 'hex');
  } catch {
    // brak pliku — utworzymy nowy klucz
  }
  const key = randomBytes(32);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, `${key.toString('hex')}\n`, { mode: 0o600 });
  return key;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string, key: Buffer): string {
  if (!plain) return '';
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return `${PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')}`;
}

/** Zwraca jawny tekst. Wartości bez prefiksu (zapisane przed wprowadzeniem szyfrowania) przechodzą bez zmian. */
export function decryptSecret(stored: string, key: Buffer): string {
  if (!stored) return '';
  if (!isEncrypted(stored)) return stored;
  const raw = Buffer.from(stored.slice(PREFIX.length), 'base64');
  if (raw.length < 12 + 16) throw new Error('Uszkodzony szyfrogram hasła.');
  const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
}
