import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

// Pamięć przeglądarki w testach: prosta atrapa localStorage (Node nie ma jej domyślnie we wszystkich wersjach).
const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: {
    getItem: (key: string) => (memory.has(key) ? memory.get(key)! : null),
    setItem: (key: string, value: string) => void memory.set(key, String(value)),
    removeItem: (key: string) => void memory.delete(key),
    clear: () => memory.clear(),
  },
});

const { apiUrl, getApiBase, setApiBase } = await import('../src/backend/apiBase.ts');
const { getServerUrl, normalizeServerUrl, probeServer, setServerUrl } = await import('../src/backend/serverConnection.ts');
const {
  KEY_INSTANCES, LOCAL_USER, deleteInstance, normalizeProfile, parseProfiles, resetProfileStoreForTests,
  saveInstance, subscribeInstances, updateInstance,
} = await import('../src/backend/profileStore.ts');

beforeEach(() => {
  memory.clear();
  resetProfileStoreForTests();
  setApiBase(null);
});

const profile = (overrides: Record<string, unknown> = {}) => ({
  id: 'inst_1',
  ownerUid: 'someone-else',
  name: 'Badania 2026',
  baseUrl: 'https://ankiety.example.com',
  rpcEndpoint: 'https://ankiety.example.com/index.php/admin/remotecontrol',
  username: 'admin',
  authPlugin: 'Authdb',
  connectionMode: 'direct' as const,
  limeVersion: 'auto' as const,
  ...overrides,
});

// ---------- adres serwera LimeControl ----------

test('normalizeServerUrl: dopisuje https i obcina ścieżkę, zapytanie oraz dane logowania', () => {
  assert.equal(normalizeServerUrl('control.example.com'), 'https://control.example.com');
  assert.equal(normalizeServerUrl('  https://control.example.com/app/?x=1#y  '), 'https://control.example.com');
  assert.equal(normalizeServerUrl('HTTPS://Control.Example.com:8443/'), 'https://control.example.com:8443');
  assert.equal(normalizeServerUrl('https://user:secret@control.example.com'), 'https://control.example.com');
});

test('normalizeServerUrl: http zostaje (sieć lokalna), inne protokoły i śmieci są odrzucane', () => {
  assert.equal(normalizeServerUrl('http://192.168.1.10:8080/'), 'http://192.168.1.10:8080');
  assert.equal(normalizeServerUrl('localhost:3000'), 'https://localhost:3000');
  for (const bad of ['', '   ', 'https://', 'ftp://control.example.com', 'file:///etc/passwd', 'mój serwer']) {
    assert.equal(normalizeServerUrl(bad), null, `powinno odrzucić: „${bad}”`);
  }
});

test('adres serwera jest zapamiętywany, normalizowany przy odczycie i usuwany po odłączeniu', async () => {
  assert.equal(await getServerUrl(), null);
  await setServerUrl('https://control.example.com');
  assert.equal(await getServerUrl(), 'https://control.example.com');

  // Wpis zapisany przez starszą wersję (ze ścieżką) nadal daje poprawny adres bazowy.
  memory.set('limecontrol_server_url_v1', 'https://control.example.com/panel/');
  assert.equal(await getServerUrl(), 'https://control.example.com');

  await setServerUrl(null);
  assert.equal(await getServerUrl(), null);
  assert.equal(memory.has('limecontrol_server_url_v1'), false);
});

test('probeServer: rozpoznaje serwer LimeControl i odrzuca inne odpowiedzi', async () => {
  const realFetch = globalThis.fetch;
  const requested: string[] = [];
  const respond = (status: number, body: unknown) => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requested.push(String(input));
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
  };
  try {
    respond(200, { authMode: 'local', version: '1.1.0' });
    assert.deepEqual(await probeServer('https://control.example.com'), { authMode: 'local', version: '1.1.0' });
    assert.deepEqual(requested, ['https://control.example.com/api/config']);

    respond(200, { authMode: 'firebase' });
    assert.deepEqual(await probeServer('https://app.example.com'), { authMode: 'firebase', version: '' });

    respond(200, { hello: 'world' });
    await assert.rejects(probeServer('https://inny.example.com'), /not-limecontrol/);

    respond(404, {});
    await assert.rejects(probeServer('https://inny.example.com'), /HTTP 404/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('apiUrl: w przeglądarce ścieżki względne, po połączeniu z serwerem — pełny adres', () => {
  assert.equal(apiUrl('/api/schedules'), '/api/schedules');
  setApiBase('https://control.example.com///');
  assert.equal(getApiBase(), 'https://control.example.com');
  assert.equal(apiUrl('/api/schedules'), 'https://control.example.com/api/schedules');
  setApiBase(undefined);
  assert.equal(apiUrl('/api/schedules'), '/api/schedules');
});

// ---------- profile instancji na urządzeniu ----------

test('normalizeProfile: wartości domyślne, bezpieczny identyfikator i właściciel „local”', () => {
  const clean = normalizeProfile({ id: 'a b/c<script>', name: '  Demo  ', connectionMode: 'cokolwiek' as never, limeVersion: 'v9' as never });
  assert.equal(clean.id, 'a_b_c_script_');
  assert.equal(clean.name, 'Demo');
  assert.equal(clean.ownerUid, LOCAL_USER.uid);
  assert.equal(clean.authPlugin, 'Authdb');
  assert.equal(clean.connectionMode, 'direct');
  assert.equal(clean.limeVersion, 'auto');
  assert.equal(normalizeProfile({ name: 'x'.repeat(500) }).name.length, 120);
  assert.equal(normalizeProfile({ connectionMode: 'relay', limeVersion: 'v7' }).connectionMode, 'relay');
  assert.equal(normalizeProfile({ limeVersion: 'legacy' }).limeVersion, 'legacy');
});

test('parseProfiles: uszkodzony zapis daje pustą listę, a poprawny — profile posortowane po polsku', () => {
  assert.deepEqual(parseProfiles(null), []);
  assert.deepEqual(parseProfiles('{nie json'), []);
  assert.deepEqual(parseProfiles('{"id":"x"}'), []);
  const names = parseProfiles(JSON.stringify([profile({ id: 'c', name: 'Zebra' }), profile({ id: 'a', name: 'Łódź' }), profile({ id: 'b', name: 'Lublin' })])).map((p) => p.name);
  assert.deepEqual(names, ['Lublin', 'Łódź', 'Zebra']);
});

test('zapis profilu nigdy nie utrwala hasła ani nieznanych pól', async () => {
  const saved = await saveInstance('ignored', profile({ password: 'tajne-haslo', sessionKey: 'abc' }) as never);
  assert.equal(saved.ownerUid, LOCAL_USER.uid);

  const stored = memory.get(KEY_INSTANCES)!;
  assert.ok(stored.includes('ankiety.example.com'));
  assert.equal(stored.includes('tajne-haslo'), false);
  assert.equal(stored.includes('sessionKey'), false);
  assert.deepEqual(Object.keys(JSON.parse(stored)[0]).sort(), [
    'authPlugin', 'baseUrl', 'connectionMode', 'id', 'limeVersion', 'name', 'ownerUid', 'rpcEndpoint', 'username',
  ]);
});

test('zapis, zmiana i usunięcie profilu powiadamiają subskrybentów i trafiają do pamięci urządzenia', async () => {
  const seen: string[][] = [];
  const unsubscribe = subscribeInstances('local', (profiles) => seen.push(profiles.map((p) => `${p.id}:${p.connectionMode}:${p.limeVersion}`)));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(seen, [[]]);

  await saveInstance('local', profile({ id: 'b', name: 'Beta' }));
  await saveInstance('local', profile({ id: 'a', name: 'Alfa' }));
  // Ponowny zapis tego samego identyfikatora zastępuje profil zamiast go dublować.
  await saveInstance('local', profile({ id: 'b', name: 'Beta 2' }));
  assert.deepEqual(seen.at(-1), ['a:direct:auto', 'b:direct:auto']);

  await updateInstance('local', 'b', { connectionMode: 'relay', limeVersion: 'v7', lastConnectedAt: '2026-11-18T10:00:00.000Z', siteName: 'Ankiety' });
  assert.deepEqual(seen.at(-1), ['a:direct:auto', 'b:relay:v7']);
  const persisted = parseProfiles(memory.get(KEY_INSTANCES)!);
  assert.equal(persisted.find((p) => p.id === 'b')?.name, 'Beta 2');
  assert.equal(persisted.find((p) => p.id === 'b')?.siteName, 'Ankiety');

  await deleteInstance('local', 'a');
  assert.deepEqual(seen.at(-1), ['b:relay:v7']);

  unsubscribe();
  await deleteInstance('local', 'b');
  assert.deepEqual(seen.at(-1), ['b:relay:v7'], 'po wypisaniu się nie ma kolejnych powiadomień');
  assert.deepEqual(parseProfiles(memory.get(KEY_INSTANCES)!), []);
});
