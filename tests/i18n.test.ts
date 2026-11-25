import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { de } from '../src/i18n/de.ts';
import { en } from '../src/i18n/en.ts';
import { buildJob, Scheduler } from '../server/scheduler.ts';
import { loadSecretKey } from '../server/secretbox.ts';
import { msg, normalizeLang } from '../server/messages.ts';
import os from 'node:os';

/** Wszystkie literały przekazane do t('…') w kodzie aplikacji. */
function collectKeys(dir: string, out = new Set<string>()): Set<string> {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectKeys(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !full.includes(`${path.sep}i18n${path.sep}`)) {
      const source = fs.readFileSync(full, 'utf8');
      for (const m of source.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) out.add(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
      for (const m of source.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) out.add(m[1].replace(/\\"/g, '"'));
      for (const m of source.matchAll(/\bt\(\s*`((?:[^`\\$]|\\.)*)`/g)) out.add(m[1]);
    }
  }
  return out;
}

test('każdy tekst interfejsu ma tłumaczenie angielskie', () => {
  const keys = collectKeys(path.resolve('src'));
  assert.ok(keys.size > 300, `znaleziono tylko ${keys.size} kluczy — sprawdź wyrażenie wyszukujące`);
  const missing = [...keys].filter((key) => !(key in en)).sort();
  assert.deepEqual(missing, [], `brak tłumaczeń EN dla ${missing.length} tekstów`);
});

test('tłumaczenia zachowują znaczniki {0}, {1}… z tekstu polskiego', () => {
  const placeholders = (text: string) => [...text.matchAll(/\{(\d+)\}/g)].map((m) => m[1]).sort().join(',');
  const broken = Object.entries(en).filter(([pl, english]) => placeholders(pl) !== placeholders(english)).map(([pl]) => pl);
  assert.deepEqual(broken, []);
});

test('każdy tekst interfejsu ma tłumaczenie niemieckie z tymi samymi znacznikami', () => {
  const keys = collectKeys(path.resolve('src'));
  const missing = [...keys].filter((key) => !(key in de)).sort();
  assert.deepEqual(missing, [], `brak tłumaczeń DE dla ${missing.length} tekstów`);
  const placeholders = (text: string) => [...text.matchAll(/\{([A-Z0-9]+)\}/g)].map((m) => m[1]).sort().join(',');
  const broken = Object.entries(de).filter(([pl, german]) => placeholders(pl) !== placeholders(german)).map(([pl]) => pl);
  assert.deepEqual(broken, []);
  const stale = Object.keys(de).filter((key) => !(key in en));
  assert.deepEqual(stale, [], 'słownik DE ma klucze, których nie ma w EN');
});

test('zadanie harmonogramu zapisuje komunikaty w języku, w którym je utworzono', async () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-i18n-'));
  const scheduler = new Scheduler({
    dataDir,
    secretKey: loadSecretKey(dataDir, 'sekret-testowy-o-odpowiedniej-długości'),
    allowPrivate: false,
    rpc: async (_e, method) => (method === 'get_session_key' ? 'KEY' : method === 'invite_participants' ? { 1: { status: 'OK' }, status: '0 left to send' } : { status: 'OK' }),
    now: () => new Date('2026-12-01T10:00:00Z'),
  });
  const body = { surveyId: 5, rpcEndpoint: 'https://ls.example.com/index.php/admin/remotecontrol', username: 'a', password: 'p', scheduledAt: '2026-12-01T09:00:00Z', action: 'invite' };
  scheduler.add(buildJob({ ...body, lang: 'en' }, 'u', scheduler.encrypt));
  scheduler.add(buildJob({ ...body, lang: 'pl' }, 'u', scheduler.encrypt));
  await scheduler.tick();
  const [pl, english] = scheduler.readJobs();
  assert.equal(english.resultMessage, 'Survey #5: sent 1 invitations.');
  assert.equal(pl.resultMessage, 'Ankieta #5: wysłano 1 zaproszeń.');
  assert.ok(english.steps.some((s) => s.detail === 'Administrator session key obtained.'));
});

test('komunikaty serwera istnieją w obu językach', () => {
  assert.equal(msg('private_address', 'en'), 'The address points to a private or local network. The server relay only connects to public servers.');
  assert.equal(msg('job_date_invalid', 'en', 'scheduledAt'), 'Invalid date format: scheduledAt.');
  assert.equal(normalizeLang('en-GB'), 'en');
  assert.equal(normalizeLang('pl'), 'pl');
  assert.equal(normalizeLang('de'), 'en');
  assert.equal(normalizeLang(undefined), 'pl');
});
