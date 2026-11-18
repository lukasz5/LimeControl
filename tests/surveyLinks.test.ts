import assert from 'node:assert/strict';
import { test } from 'node:test';
import { surveyLanguages, surveyPublicUrl } from '../src/services/surveyLinks.ts';

test('surveyPublicUrl obsługuje oba style adresów LimeSurvey', () => {
  const pretty = { rpcEndpoint: 'https://ankiety.example.com/index.php/admin/remotecontrol' };
  assert.equal(surveyPublicUrl(pretty, 123456), 'https://ankiety.example.com/index.php/123456');
  assert.equal(surveyPublicUrl(pretty, 123456, { lang: 'en' }), 'https://ankiety.example.com/index.php/123456?lang=en');
  assert.equal(surveyPublicUrl(pretty, 123456, { lang: 'pl', newTest: true }), 'https://ankiety.example.com/index.php/123456?lang=pl&newtest=Y');
  const plain = { rpcEndpoint: 'https://ankiety.example.com/ls/index.php?r=admin/remotecontrol' };
  assert.equal(surveyPublicUrl(plain, 42, { newTest: true }), 'https://ankiety.example.com/ls/index.php?r=survey/index&sid=42&newtest=Y');
  const noIndex = { rpcEndpoint: 'https://ankiety.example.com/admin/remotecontrol' };
  assert.equal(surveyPublicUrl(noIndex, 7), 'https://ankiety.example.com/7');
});

test('surveyLanguages łączy język bazowy z dodatkowymi', () => {
  assert.deepEqual(surveyLanguages({ language: 'pl', additional_languages: 'en de' }), ['pl', 'en', 'de']);
  assert.deepEqual(surveyLanguages({ language: 'pl', additional_languages: '' }), ['pl']);
  assert.deepEqual(surveyLanguages({ language: 'pl', additional_languages: 'pl  en' }), ['pl', 'en']);
  assert.deepEqual(surveyLanguages(null), []);
});

import { isEmptyParticipantList, isMissingParticipantTable, summarizeMailResult, tokenAttributeNumbers } from '../src/services/limeSurveyRpc.ts';

test('rozpoznawanie braku tabeli uczestników w różnych wersjach LimeSurvey', () => {
  for (const msg of ['Error: No token table', '[Kod ERR_NO_PARTICIPANT_TABLE] Error: No survey participant list', 'Error: No survey participants table']) {
    assert.equal(isMissingParticipantTable(msg), true, msg);
    assert.equal(isEmptyParticipantList(msg), false, msg);
  }
  for (const msg of ['No Tokens found', '[Kod ERR_NO_DATA] No survey participants found.']) {
    assert.equal(isEmptyParticipantList(msg), true, msg);
    assert.equal(isMissingParticipantTable(msg), false, msg);
  }
  assert.equal(isMissingParticipantTable('No permission'), false);
});

test('tokenAttributeNumbers czyta definicje pól w formacie JSON i serialize()', () => {
  assert.deepEqual(tokenAttributeNumbers('{"attribute_1":{"description":"Telefon"},"attribute_3":{"description":"Notatka"}}'), [1, 3]);
  assert.deepEqual(tokenAttributeNumbers({ attribute_2: {}, attribute_10: {} }), [2, 10]);
  assert.deepEqual(tokenAttributeNumbers('a:1:{s:11:"attribute_4";a:1:{s:11:"description";s:1:"x";}}'), [4]);
  assert.deepEqual(tokenAttributeNumbers(''), []);
  assert.deepEqual(tokenAttributeNumbers(null), []);
});

test('summarizeMailResult liczy wysłane i nieudane wiadomości', () => {
  assert.deepEqual(summarizeMailResult({ 1: { status: 'OK' }, 2: { status: 'fail', error: 'SMTP connect() failed.' }, status: '5 left to send' }), { sent: 1, failed: 1, left: 5, errors: ['SMTP connect() failed.'] });
  assert.deepEqual(summarizeMailResult(null), { sent: 0, failed: 0, left: 0, errors: [] });
});
