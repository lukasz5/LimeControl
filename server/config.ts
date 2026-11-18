/** Konfiguracja serwera z pliku firebase-applet-config.json i zmiennych środowiskowych. */
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type AuthMode = 'firebase' | 'local';

export interface ServerConfig {
  port: number;
  dataDir: string;
  authMode: AuthMode;
  /** Klucz API Firebase do weryfikacji tokenów (tryb firebase). */
  firebaseApiKey: string;
  /** Klucz dostępu do instancji (tryb local). */
  accessKey: string;
  /** Czy klucz dostępu został wygenerowany przy tym starcie (wtedy wypisujemy go w logu). */
  accessKeyGenerated: boolean;
  /** Czy przekaźnik może łączyć się z adresami prywatnymi (instalacja we własnej sieci). */
  relayAllowPrivate: boolean;
  version: string;
}

function readFirebaseApiKey(file: string): string {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { apiKey?: unknown };
    return typeof parsed.apiKey === 'string' && !/^YOUR_/i.test(parsed.apiKey) ? parsed.apiKey : '';
  } catch {
    return '';
  }
}

const truthy = (value: string | undefined) => /^(1|true|yes|on)$/i.test(value || '');

export function loadConfig(rootDir: string, env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dataDir = path.resolve(rootDir, env.DATA_DIR || 'data');
  const firebaseApiKey = readFirebaseApiKey(path.resolve(rootDir, 'firebase-applet-config.json'));
  const requested = (env.AUTH_MODE || '').toLowerCase();
  if (requested && requested !== 'firebase' && requested !== 'local') {
    throw new Error(`AUTH_MODE=${env.AUTH_MODE} — dozwolone wartości: firebase, local.`);
  }
  if (requested === 'firebase' && !firebaseApiKey) {
    throw new Error('AUTH_MODE=firebase wymaga pliku firebase-applet-config.json z kluczem apiKey.');
  }
  const authMode: AuthMode = requested === 'firebase' || requested === 'local' ? requested : firebaseApiKey ? 'firebase' : 'local';

  let accessKey = '';
  let accessKeyGenerated = false;
  if (authMode === 'local') {
    accessKey = (env.LIMECONTROL_ACCESS_KEY || '').trim();
    if (accessKey && accessKey.length < 16) {
      throw new Error('LIMECONTROL_ACCESS_KEY musi mieć co najmniej 16 znaków.');
    }
    if (!accessKey) {
      const file = path.join(dataDir, 'access-key');
      try {
        accessKey = fs.readFileSync(file, 'utf8').trim();
      } catch {
        accessKey = '';
      }
      if (accessKey.length < 16) {
        accessKey = randomBytes(24).toString('base64url');
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(file, `${accessKey}\n`, { mode: 0o600 });
        accessKeyGenerated = true;
      }
    }
  }

  let version = '0.0.0';
  try {
    version = String((JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8')) as { version?: string }).version || version);
  } catch {
    // w obrazie produkcyjnym nie ma package.json — wersję podaje APP_VERSION
  }

  return {
    port: Number(env.PORT || 3000),
    dataDir,
    authMode,
    firebaseApiKey,
    accessKey,
    accessKeyGenerated,
    // W trybie lokalnym LimeSurvey zwykle stoi w tej samej sieci — domyślnie zezwalamy;
    // w usłudze publicznej (firebase) adresy prywatne są zablokowane, chyba że jawnie włączone.
    // Pusta wartość (np. RELAY_ALLOW_PRIVATE="" w pliku .env) oznacza „domyślnie”.
    relayAllowPrivate: env.RELAY_ALLOW_PRIVATE ? truthy(env.RELAY_ALLOW_PRIVATE) : authMode === 'local',
    version: env.APP_VERSION || version,
  };
}
