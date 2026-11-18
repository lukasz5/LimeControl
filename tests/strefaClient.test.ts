import assert from 'node:assert/strict';
import { test } from 'node:test';
import { StrefaError, discoverStudy, loadFieldwork, type StrefaTransport } from '../src/services/strefaAnkiet.ts';

const conn = { baseUrl: 'https://app.strefaankiet.example', token: 'tok' };

/** Atrapa API zbudowana na podstawie kontraktu kontrolerów platformy. */
function mockApi(overrides: Record<string, { status: number; body: unknown }> = {}) {
  const calls: string[] = [];
  const routes: Record<string, { status: number; body: unknown }> = {
    '/api/limesurvey/lifecycle/projects': { status: 200, body: { data: [{ id: 3 }, { id: 4 }] } },
    '/api/limesurvey/lifecycle/projects/3/studies': { status: 200, body: { data: [{ id: 30, title: 'Badanie A' }] } },
    '/api/limesurvey/lifecycle/projects/4/studies': { status: 200, body: { data: [{ id: 41, title: 'Inny serwer' }, { id: 42, title: 'Satysfakcja 2026' }] } },
    '/api/surveys/30/limesurvey-bridge': { status: 200, body: { connection: null } },
    '/api/surveys/41/limesurvey-bridge': { status: 200, body: { connection: { instance_url: 'https://inny.example.com', remote_survey_id: 123456, enabled: true } } },
    '/api/surveys/42/limesurvey-bridge': { status: 200, body: { connection: { instance_url: 'https://ankiety.example.com/', remote_survey_id: '123456', enabled: true } } },
    '/api/projects/4/limesurvey-fieldwork/42/123456/status': { status: 200, body: { study: { id: 42, title: 'Satysfakcja 2026' }, progress: { native_completed: 7, external_completed: 12 } } },
    '/api/projects/4/limesurvey-fieldwork/42/123456/assignments': {
      status: 200,
      body: { data: [
        { id: 1, field_worker_id: 9, status: 'active', target_count: 30, interview_modes: ['capi'], field_worker: { id: 9, code: 'A-09', name: 'Anna Nowak' }, progress: { native_completed: 4, external_completed: 6 } },
        { id: 2, field_worker_id: 10, status: 'paused', target_count: null, interview_modes: ['capi', 'cati'], field_worker: { id: 10, code: 'A-10', name: null }, progress: { native_completed: 3, external_completed: 6 } },
      ] },
    },
    '/api/projects/4/limesurvey-cati-manager/42/123456': { status: 200, body: { study: { id: 42, title: 'Satysfakcja 2026' }, blocking_reasons: [] } },
    '/api/projects/4/limesurvey-cati-manager/42/123456/cases': { status: 200, body: { data: [], summary: { total: 250, needs_assignment: 40, attention: 3 } } },
    ...overrides,
  };
  const transport: StrefaTransport = async (_c, path) => {
    calls.push(path);
    return routes[path] || { status: 404, body: { message: 'Not found' } };
  };
  return { transport, calls };
}

test('discoverStudy znajduje badanie po numerze ankiety i hoście instancji', async () => {
  const { transport } = mockApi();
  const link = await discoverStudy(conn, 123456, 'https://ankiety.example.com', transport);
  assert.deepEqual(link, { projectId: 4, studyId: 42, studyTitle: 'Satysfakcja 2026' });
  assert.equal(await discoverStudy(conn, 999999, 'https://ankiety.example.com', transport), null);
});

test('discoverStudy respektuje limit zapytań i pomija projekty bez dostępu', async () => {
  const limited = mockApi();
  assert.equal(await discoverStudy(conn, 123456, 'https://ankiety.example.com', limited.transport, 3), null);
  assert.ok(limited.calls.length <= 3);
  const forbidden = mockApi({ '/api/limesurvey/lifecycle/projects/3/studies': { status: 403, body: { message: 'Brak dostępu' } } });
  const link = await discoverStudy(conn, 123456, 'https://ankiety.example.com', forbidden.transport);
  assert.equal(link?.studyId, 42);
});

test('discoverStudy zgłasza błąd logowania', async () => {
  const { transport } = mockApi({ '/api/limesurvey/lifecycle/projects': { status: 401, body: { message: 'Unauthenticated.' } } });
  await assert.rejects(discoverStudy(conn, 1, '', transport), (e: unknown) => e instanceof StrefaError && e.status === 401 && /Unauthenticated/.test(e.message));
});

test('loadFieldwork składa stan CAPI i CATI', async () => {
  const { transport } = mockApi();
  const snapshot = await loadFieldwork(conn, { projectId: 4, studyId: 42 }, 123456, transport);
  assert.equal(snapshot.studyTitle, 'Satysfakcja 2026');
  assert.deepEqual(snapshot.capi, {
    available: true,
    nativeCompleted: 7,
    confirmedCompleted: 12,
    assignments: [
      { id: 1, worker: 'Anna Nowak', modes: ['capi'], status: 'active', target: 30, completed: 10 },
      { id: 2, worker: 'A-10', modes: ['capi', 'cati'], status: 'paused', target: null, completed: 9 },
    ],
  });
  assert.deepEqual(snapshot.cati, { available: true, total: 250, needsAssignment: 40, attention: 3, blockingReasons: [] });
});

test('loadFieldwork: brak dostępu do jednego trybu nie blokuje drugiego', async () => {
  const { transport } = mockApi({
    '/api/projects/4/limesurvey-cati-manager/42/123456': { status: 403, body: { message: 'Brak zakresu cati.read' } },
    '/api/projects/4/limesurvey-fieldwork/42/123456/assignments': { status: 403, body: { message: 'Wymagana rola koordynatora' } },
  });
  const snapshot = await loadFieldwork(conn, { projectId: 4, studyId: 42, studyTitle: 'X' }, 123456, transport);
  assert.equal(snapshot.capi.available, true);
  if (snapshot.capi.available) assert.deepEqual(snapshot.capi.assignments, []);
  assert.deepEqual(snapshot.cati, { available: false, reason: 'Brak zakresu cati.read' });
});
