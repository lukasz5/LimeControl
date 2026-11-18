import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { loadConfig } from '../server/config.ts';

function tempRoot(files: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-config-'));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  return dir;
}

const FIREBASE = JSON.stringify({ apiKey: 'test-web-api-key', projectId: 'demo' });

test('bez konfiguracji Firebase serwer startuje w trybie lokalnym i generuje klucz', () => {
  const root = tempRoot();
  const first = loadConfig(root, {});
  assert.equal(first.authMode, 'local');
  assert.equal(first.accessKeyGenerated, true);
  assert.ok(first.accessKey.length >= 16);
  assert.equal(fs.readFileSync(path.join(root, 'data', 'access-key'), 'utf8').trim(), first.accessKey);

  // Drugi start czyta ten sam klucz z pliku i już go nie wypisuje.
  const second = loadConfig(root, {});
  assert.equal(second.accessKey, first.accessKey);
  assert.equal(second.accessKeyGenerated, false);
});

test('klucz z LIMECONTROL_ACCESS_KEY ma pierwszeństwo, a zbyt krótki jest odrzucany', () => {
  const root = tempRoot();
  const config = loadConfig(root, { LIMECONTROL_ACCESS_KEY: '  klucz-testowy-0123456789  ' });
  assert.equal(config.accessKey, 'klucz-testowy-0123456789');
  assert.equal(config.accessKeyGenerated, false);
  assert.equal(fs.existsSync(path.join(root, 'data', 'access-key')), false);
  assert.throws(() => loadConfig(root, { LIMECONTROL_ACCESS_KEY: 'krotki' }), /16/);
});

test('plik konfiguracji Firebase włącza tryb firebase, AUTH_MODE go nadpisuje', () => {
  const root = tempRoot({ 'firebase-applet-config.json': FIREBASE });
  const cloud = loadConfig(root, {});
  assert.equal(cloud.authMode, 'firebase');
  assert.equal(cloud.firebaseApiKey, 'test-web-api-key');
  assert.equal(cloud.accessKey, '');
  assert.equal(loadConfig(root, { AUTH_MODE: 'local' }).authMode, 'local');
});

test('AUTH_MODE=firebase bez klucza API oraz nieznany tryb kończą się błędem', () => {
  assert.throws(() => loadConfig(tempRoot(), { AUTH_MODE: 'firebase' }), /firebase-applet-config\.json/);
  assert.throws(() => loadConfig(tempRoot({ 'firebase-applet-config.json': '{"apiKey":"YOUR_API_KEY"}' }), { AUTH_MODE: 'firebase' }));
  assert.throws(() => loadConfig(tempRoot(), { AUTH_MODE: 'ldap' }), /AUTH_MODE/);
});

test('RELAY_ALLOW_PRIVATE: domyślnie zależy od trybu, pusta wartość znaczy „domyślnie”', () => {
  const local = tempRoot();
  const cloud = tempRoot({ 'firebase-applet-config.json': FIREBASE });
  assert.equal(loadConfig(local, {}).relayAllowPrivate, true);
  assert.equal(loadConfig(cloud, {}).relayAllowPrivate, false);
  assert.equal(loadConfig(local, { RELAY_ALLOW_PRIVATE: '' }).relayAllowPrivate, true);
  assert.equal(loadConfig(cloud, { RELAY_ALLOW_PRIVATE: '' }).relayAllowPrivate, false);
  assert.equal(loadConfig(local, { RELAY_ALLOW_PRIVATE: '0' }).relayAllowPrivate, false);
  assert.equal(loadConfig(cloud, { RELAY_ALLOW_PRIVATE: '1' }).relayAllowPrivate, true);
});

test('port, katalog danych i wersja pochodzą ze środowiska lub z package.json', () => {
  const root = tempRoot({ 'package.json': JSON.stringify({ version: '9.8.7' }) });
  const defaults = loadConfig(root, {});
  assert.equal(defaults.port, 3000);
  assert.equal(defaults.dataDir, path.join(root, 'data'));
  assert.equal(defaults.version, '9.8.7');
  const custom = loadConfig(root, { PORT: '8080', DATA_DIR: 'var', APP_VERSION: '1.2.3' });
  assert.equal(custom.port, 8080);
  assert.equal(custom.dataDir, path.join(root, 'var'));
  assert.equal(custom.version, '1.2.3');
});
