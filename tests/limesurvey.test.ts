import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatLimeSurveyDate, parseMailBatch, statusError } from '../server/limesurvey.ts';

test('statusError rozpoznaje błędy w strukturze status/error_code', () => {
  assert.equal(statusError({ status: 'OK' }), null);
  assert.equal(statusError('abc'), null);
  assert.equal(statusError({ status: 'No permission' }), 'No permission');
  assert.equal(statusError({ status: 'Invalid session key', error_code: 'ERR_INVALID_SESSION' }), '[Kod ERR_INVALID_SESSION] Invalid session key');
});

test('parseMailBatch liczy wysłane, nieudane i pozostałe wiadomości', () => {
  const ok = parseMailBatch({ 1: { name: 'A', email: 'a@example.com', status: 'OK' }, 2: { name: 'B', email: 'b@example.com', status: 'OK' }, status: '0 left to send' });
  assert.deepEqual(ok, { sent: 2, failed: 0, left: 0, none: false, error: null, firstFailure: null });
  const partial = parseMailBatch({ 5: { status: 'OK' }, 6: { status: 'fail', error: 'SMTP connect() failed.' }, status: '48 left to send' });
  assert.deepEqual(partial, { sent: 1, failed: 1, left: 48, none: false, error: null, firstFailure: 'SMTP connect() failed.' });
  assert.equal(parseMailBatch({ status: 'Error: No candidate tokens' }).none, true);
  assert.match(String(parseMailBatch({ status: 'Error: No survey participants table' }).error), /No survey participants table/);
  assert.ok(parseMailBatch(null).error);
});

test('formatLimeSurveyDate: UTC dla LimeSurvey 7, czas użytkownika dla starszych wersji', () => {
  const iso = '2026-12-01T17:30:00.000Z';
  assert.equal(formatLimeSurveyDate(iso, { utc: true }), '2026-12-01 17:30:00');
  // Warszawa zimą: getTimezoneOffset() === -60
  assert.equal(formatLimeSurveyDate(iso, { utc: false, tzOffsetMinutes: -60 }), '2026-12-01 18:30:00');
  // Nowy Jork zimą: +300
  assert.equal(formatLimeSurveyDate(iso, { utc: false, tzOffsetMinutes: 300 }), '2026-12-01 12:30:00');
  assert.equal(formatLimeSurveyDate('zła-data', { utc: true }), 'zła-data');
});
