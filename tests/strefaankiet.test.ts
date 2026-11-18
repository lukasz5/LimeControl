import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildStrefaUrl } from '../server/strefaankiet.ts';

const base = { baseUrl: 'https://app.strefaankiet.example', token: 'abc|def' };

test('łącznik przepuszcza tylko odczyt stanu realizacji', () => {
  const ok = [
    '/api/limesurvey/lifecycle/projects',
    '/api/limesurvey/lifecycle/projects/12/studies',
    '/api/surveys/42/limesurvey-bridge',
    '/api/projects/12/limesurvey-fieldwork/42/123456/status',
    '/api/projects/12/limesurvey-fieldwork/42/123456/quotas',
    '/api/projects/12/limesurvey-fieldwork/42/123456/assignments',
    '/api/projects/12/limesurvey-cati-manager/42/123456',
    '/api/projects/12/limesurvey-cati-manager/42/123456/cases',
  ];
  for (const path of ok) assert.ok(buildStrefaUrl({ ...base, path }).url.endsWith(path), path);

  const denied = [
    '/api/auth/login',
    '/api/projects/12/limesurvey-fieldwork/42/123456/executions',
    '/api/projects/12/limesurvey-cati-manager/42/123456/sample',
    '/api/projects/12/limesurvey-cati-manager/42/123456/cases/7/assignment',
    '/api/limesurvey/lifecycle/projects/12/studies/../../../auth/me',
    '/api/surveys/42/limesurvey-bridge/response-files/1',
    '/api/headless/v1/clients',
    '//evil.example/api/limesurvey/lifecycle/projects',
    '/api/limesurvey/lifecycle/projects?x=1',
  ];
  for (const path of denied) assert.throws(() => buildStrefaUrl({ ...base, path }), /nie jest dostępna/, path);
});

test('łącznik waliduje adres platformy, klucz i parametry', () => {
  const path = '/api/limesurvey/lifecycle/projects';
  assert.throws(() => buildStrefaUrl({ ...base, baseUrl: 'ftp://x', path }), /https/);
  assert.throws(() => buildStrefaUrl({ ...base, baseUrl: 'https://x.example/panel', path }), /bez ścieżki/);
  assert.throws(() => buildStrefaUrl({ ...base, token: 'a\r\nX-Injected: 1', path }), /klucz/);
  assert.throws(() => buildStrefaUrl({ baseUrl: base.baseUrl, path }), /Wymagane/);
  assert.throws(() => buildStrefaUrl({ ...base, path, query: { redirect: 'x' } }), /Niedozwolony parametr/);
  const built = buildStrefaUrl({ ...base, baseUrl: 'https://app.strefaankiet.example/', path: '/api/projects/1/limesurvey-cati-manager/2/3/cases', query: { per_page: 1, status: 'pending' } });
  assert.equal(built.url, 'https://app.strefaankiet.example/api/projects/1/limesurvey-cati-manager/2/3/cases?per_page=1&status=pending');
  assert.equal(built.token, 'abc|def');
});
