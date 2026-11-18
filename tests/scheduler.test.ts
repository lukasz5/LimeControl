import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { Scheduler, buildJob, sanitizeJobForClient } from '../server/scheduler.ts';
import { loadSecretKey } from '../server/secretbox.ts';

type Call = { method: string; params: unknown[] };

function setup(handler: (method: string, params: unknown[]) => unknown, now = new Date('2026-12-01T10:00:00Z')) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-sched-'));
  const calls: Call[] = [];
  let clock = now;
  const scheduler = new Scheduler({
    dataDir,
    secretKey: loadSecretKey(dataDir, 'sekret-testowy-o-odpowiedniej-długości'),
    allowPrivate: false,
    rpc: async (_endpoint, method, params) => {
      calls.push({ method, params });
      if (method === 'get_session_key') return 'KEY';
      if (method === 'release_session_key') return 'OK';
      return handler(method, params);
    },
    now: () => clock,
  });
  return { scheduler, calls, dataDir, setNow: (d: Date) => { clock = d; } };
}

const base = {
  surveyId: 123456,
  surveyTitle: 'Ankieta testowa',
  instanceName: 'Test',
  rpcEndpoint: 'https://ankiety.example.com/index.php/admin/remotecontrol',
  username: 'admin',
  password: 'tajne-hasło',
  authPlugin: 'Authdb',
  scheduledAt: '2026-12-01T09:00:00Z',
};

test('buildJob waliduje dane i szyfruje hasło', () => {
  const { scheduler } = setup(() => ({ status: 'OK' }));
  const job = buildJob({ ...base }, 'u1', scheduler.encrypt);
  assert.equal(job.action, 'activate');
  assert.ok(job.password.startsWith('enc:v1:'));
  assert.equal(JSON.stringify(sanitizeJobForClient(job)).includes('tajne'), false);
  assert.equal(sanitizeJobForClient(job).hasPassword, true);

  assert.throws(() => buildJob({ ...base, action: 'drop_database' }, 'u1', scheduler.encrypt), /Nieznana akcja/);
  assert.throws(() => buildJob({ ...base, rpcEndpoint: 'file:///etc/passwd' }, 'u1', scheduler.encrypt), /HTTP lub HTTPS/);
  assert.throws(() => buildJob({ ...base, surveyId: 'abc' }, 'u1', scheduler.encrypt), /identyfikator/);
  assert.throws(() => buildJob({ ...base, password: '' }, 'u1', scheduler.encrypt), /Wymagane pola/);
  assert.throws(() => buildJob({ ...base, scheduledAt: 'kiedyś' }, 'u1', scheduler.encrypt), /scheduledAt/);
  assert.throws(() => buildJob({ ...base, action: 'invite', repeatEveryDays: 3, repeatRemaining: 2 }, 'u1', scheduler.encrypt), /tylko dla przypomnień/);
  assert.throws(() => buildJob({ ...base, action: 'remind', repeatEveryDays: 3 }, 'u1', scheduler.encrypt), /jednocześnie/);
  assert.throws(() => buildJob({ ...base, action: 'remind', maxReminders: 999 }, 'u1', scheduler.encrypt), /liczbowa/);
});

test('hasło nie trafia na dysk jawnym tekstem i znika po wykonaniu', async () => {
  const { scheduler, dataDir } = setup(() => ({ status: 'OK' }));
  scheduler.add(buildJob({ ...base }, 'u1', scheduler.encrypt));
  const onDisk = fs.readFileSync(path.join(dataDir, 'schedules.json'), 'utf8');
  assert.equal(onDisk.includes('tajne-hasło'), false);
  await scheduler.tick();
  const [job] = scheduler.readJobs();
  assert.equal(job.status, 'completed');
  assert.equal(job.password, '');
});

test('activate: aktywuje ankietę, tokeny i zapisuje daty w strefie użytkownika', async () => {
  const { scheduler, calls } = setup(() => ({ status: 'OK' }));
  scheduler.add(buildJob({ ...base, activateTokens: true, expiresAt: '2026-12-24T17:00:00Z', tzOffsetMinutes: -60, limeVersion: 'legacy' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  assert.deepEqual(calls.map((c) => c.method), ['get_session_key', 'activate_survey', 'activate_tokens', 'set_survey_properties', 'release_session_key']);
  assert.deepEqual(calls[0].params, ['admin', 'tajne-hasło', 'Authdb']);
  assert.deepEqual(calls[3].params, ['KEY', 123456, { expires: '2026-12-24 18:00:00' }]);
});

test('activate dla LimeSurvey 7 zapisuje daty w UTC, a „already active” nie jest błędem', async () => {
  const { scheduler, calls } = setup((method) => (method === 'activate_survey' ? { status: 'Error: Survey already active' } : { status: 'OK' }));
  scheduler.add(buildJob({ ...base, startdateAt: '2026-12-02T08:00:00Z', tzOffsetMinutes: -60, limeVersion: 'v7' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  const [job] = scheduler.readJobs();
  assert.equal(job.status, 'completed');
  assert.deepEqual(calls.find((c) => c.method === 'set_survey_properties')?.params[2], { startdate: '2026-12-02 08:00:00' });
});

test('expire: ustawia datę wygaśnięcia na chwilę wykonania', async () => {
  const { scheduler, calls } = setup(() => ({ status: 'OK' }));
  scheduler.add(buildJob({ ...base, action: 'expire', limeVersion: 'v7' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  assert.deepEqual(calls.find((c) => c.method === 'set_survey_properties')?.params, ['KEY', 123456, { expires: '2026-12-01 10:00:00' }]);
  assert.equal(scheduler.readJobs()[0].status, 'completed');
});

test('invite: wysyła partiami aż do „0 left to send”', async () => {
  let n = 0;
  const { scheduler, calls } = setup(() => {
    n += 1;
    return n === 1
      ? { 1: { status: 'OK' }, 2: { status: 'OK' }, status: '1 left to send' }
      : { 3: { status: 'OK' }, status: '0 left to send' };
  });
  scheduler.add(buildJob({ ...base, action: 'invite' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  const [job] = scheduler.readJobs();
  assert.equal(job.status, 'completed');
  assert.equal(calls.filter((c) => c.method === 'invite_participants').length, 2);
  assert.match(job.resultMessage, /wysłano 3 zaproszeń/);
});

test('invite bez adresatów kończy się poprawnie, a brak tabeli uczestników — błędem', async () => {
  const none = setup(() => ({ status: 'Error: No candidate tokens' }));
  none.scheduler.add(buildJob({ ...base, action: 'invite' }, 'u1', none.scheduler.encrypt));
  await none.scheduler.tick();
  assert.equal(none.scheduler.readJobs()[0].status, 'completed');
  assert.match(none.scheduler.readJobs()[0].resultMessage, /nie było zaproszeń/);

  const broken = setup(() => ({ status: 'Error: No survey participants table' }));
  broken.scheduler.add(buildJob({ ...base, action: 'invite' }, 'u1', broken.scheduler.encrypt));
  await broken.scheduler.tick();
  const job = broken.scheduler.readJobs()[0];
  assert.equal(job.status, 'failed');
  assert.match(job.resultMessage, /No survey participants table/);
  assert.ok(broken.calls.some((c) => c.method === 'release_session_key'), 'sesja jest zamykana także po błędzie');
});

test('invite: gdy żadna wiadomość nie wychodzi (np. błąd SMTP), zadanie kończy się błędem', async () => {
  const { scheduler } = setup(() => ({ 1: { status: 'fail', error: 'SMTP connect() failed.' }, status: '0 left to send' }));
  scheduler.add(buildJob({ ...base, action: 'invite' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  const [job] = scheduler.readJobs();
  assert.equal(job.status, 'failed');
  assert.match(job.resultMessage, /nie udało się wysłać żadnej z 1 wiadomości\. SMTP connect\(\) failed/);
});

test('remind: przekazuje parametry i planuje kolejne wykonania serii', async () => {
  const { scheduler, calls, setNow } = setup(() => ({ 9: { status: 'OK' }, status: '0 left to send' }));
  scheduler.add(buildJob({ ...base, action: 'remind', minDaysBetween: 3, maxReminders: 2, repeatEveryDays: 7, repeatRemaining: 2, clearCredentialsAfterRun: true }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  assert.deepEqual(calls.find((c) => c.method === 'remind_participants')?.params, ['KEY', 123456, 3, 2]);
  let jobs = scheduler.readJobs();
  assert.equal(jobs.length, 2);
  const next = jobs.find((j) => j.status === 'scheduled')!;
  const done = jobs.find((j) => j.status === 'completed')!;
  assert.equal(done.password, '', 'wykonane zadanie nie trzyma hasła');
  assert.ok(next.password.startsWith('enc:v1:'), 'kolejne zadanie dziedziczy zaszyfrowane hasło');
  assert.equal(next.scheduledAt, '2026-12-08T09:00:00.000Z');
  assert.equal(next.repeatRemaining, 1);

  setNow(new Date('2026-12-08T09:00:30Z'));
  await scheduler.tick();
  jobs = scheduler.readJobs();
  assert.equal(jobs.length, 3);
  const last = jobs.find((j) => j.status === 'scheduled')!;
  assert.equal(last.scheduledAt, '2026-12-15T09:00:00.000Z');
  assert.equal(last.repeatRemaining, null, 'ostatnie wykonanie nie planuje następnych');

  setNow(new Date('2026-12-15T09:00:30Z'));
  await scheduler.tick();
  jobs = scheduler.readJobs();
  assert.equal(jobs.length, 3);
  assert.ok(jobs.every((j) => j.status === 'completed' && j.password === ''));
});

test('zadania sprzed terminu nie są uruchamiane, a błąd logowania oznacza zadanie jako nieudane', async () => {
  const { scheduler, calls } = setup(() => ({ status: 'OK' }));
  scheduler.add(buildJob({ ...base, scheduledAt: '2027-01-01T00:00:00Z' }, 'u1', scheduler.encrypt));
  await scheduler.tick();
  assert.equal(calls.length, 0);
  assert.equal(scheduler.readJobs()[0].status, 'scheduled');

  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-sched-'));
  const failing = new Scheduler({
    dataDir,
    secretKey: loadSecretKey(dataDir, 'sekret-testowy-o-odpowiedniej-długości'),
    allowPrivate: false,
    rpc: async () => ({ status: 'Invalid user name or password' }),
    now: () => new Date('2026-12-01T10:00:00Z'),
  });
  failing.add(buildJob({ ...base }, 'u1', failing.encrypt));
  await failing.tick();
  const job = failing.readJobs()[0];
  assert.equal(job.status, 'failed');
  assert.match(job.resultMessage, /Invalid user name or password/);
});

test('migracja szyfruje hasła zapisane wcześniej jawnym tekstem', () => {
  const { scheduler, dataDir } = setup(() => ({ status: 'OK' }));
  const legacy = { ...buildJob({ ...base }, 'u1', scheduler.encrypt), password: 'stare-jawne' };
  fs.writeFileSync(path.join(dataDir, 'schedules.json'), JSON.stringify([legacy]));
  assert.equal(scheduler.migratePlaintextPasswords(), 1);
  assert.equal(fs.readFileSync(path.join(dataDir, 'schedules.json'), 'utf8').includes('stare-jawne'), false);
  assert.equal(scheduler.migratePlaintextPasswords(), 0);
});
