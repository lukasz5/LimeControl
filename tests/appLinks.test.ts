import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildAppLink, findProfileForLink, parseAppLink } from '../src/services/appLinks.ts';
import { parseSnapshot } from '../src/services/surveyCache.ts';
import { credentialServer, isInvalidCredentialsError } from '../src/services/secureCredentials.ts';
import { normalizeProfile } from '../src/backend/profileStore.ts';
import type { InstanceProfile } from '../src/types/limesurvey.ts';

const profile = (overrides: Partial<InstanceProfile> = {}): InstanceProfile => ({
  id: 'inst_1',
  name: 'Badania 2026',
  baseUrl: 'https://ankiety.example.com',
  rpcEndpoint: 'https://ankiety.example.com/index.php/admin/remotecontrol',
  username: 'admin',
  authPlugin: 'Authdb',
  connectionMode: 'direct',
  limeVersion: 'auto',
  ...overrides,
});

test('link aplikacji: budowa i odczyt dają te same dane, bez hasła', () => {
  const link = buildAppLink(profile({ authPlugin: 'AuthLDAP' }), 123456);
  assert.match(link, /^limecontrol:\/\/open\?/);
  assert.doesNotMatch(link, /password/i);
  assert.deepEqual(parseAppLink(link), {
    server: 'https://ankiety.example.com/index.php/admin/remotecontrol',
    username: 'admin',
    name: 'Badania 2026',
    authPlugin: 'AuthLDAP',
    surveyId: 123456,
  });
});

test('link aplikacji: domyślny plugin Authdb i brak ankiety nie trafiają do linku', () => {
  const link = buildAppLink(profile());
  assert.doesNotMatch(link, /plugin=|sid=/);
  assert.equal(parseAppLink(link)?.surveyId, undefined);
});

test('link aplikacji: parametr password jest ignorowany, a adres z danymi logowania odrzucany', () => {
  const parsed = parseAppLink('limecontrol://open?server=https%3A%2F%2Fls.example.com&user=a&password=tajne');
  assert.deepEqual(parsed, { server: 'https://ls.example.com', username: 'a' });
  assert.equal(parseAppLink('limecontrol://open?server=https%3A%2F%2Fa%3Ab%40ls.example.com'), null);
  assert.equal(parseAppLink('https://user:pass@ls.example.com'), null);
});

test('link aplikacji: odrzuca obce schematy, akcje i protokoły', () => {
  assert.equal(parseAppLink('limecontrol://delete?server=https%3A%2F%2Fls.example.com'), null);
  assert.equal(parseAppLink('limecontrol://open'), null);
  assert.equal(parseAppLink('limecontrol://open?server=javascript%3Aalert(1)'), null);
  assert.equal(parseAppLink('ftp://ls.example.com'), null);
  assert.equal(parseAppLink('tekst bez adresu'), null);
  assert.equal(parseAppLink(''), null);
});

test('link aplikacji: zwykły adres serwera z kodu QR wypełnia formularz', () => {
  assert.deepEqual(parseAppLink('https://ankiety.example.com/'), { server: 'https://ankiety.example.com' });
});

test('link aplikacji: niepoprawny SID i niedozwolona nazwa pluginu są pomijane', () => {
  const parsed = parseAppLink('limecontrol://open?server=ls.example.com&sid=12a&plugin=..%2Fx');
  assert.deepEqual(parsed, { server: 'https://ls.example.com' });
});

test('link aplikacji: dopasowanie profilu po serwerze (adres bazowy lub endpoint) i loginie', () => {
  const profiles = [profile(), profile({ id: 'inst_2', username: 'ankieter' }), profile({ id: 'inst_3', baseUrl: 'https://inny.example.com', rpcEndpoint: 'https://inny.example.com/index.php/admin/remotecontrol' })];
  assert.equal(findProfileForLink(profiles, { server: 'https://ANKIETY.example.com/' })?.id, 'inst_1');
  assert.equal(findProfileForLink(profiles, { server: 'https://ankiety.example.com/index.php/admin/remotecontrol', username: 'Ankieter' })?.id, 'inst_2');
  assert.equal(findProfileForLink(profiles, { server: 'https://ankiety.example.com', username: 'ktos' }), null);
  assert.equal(findProfileForLink(profiles, { server: 'https://inny.example.com' })?.id, 'inst_3');
  assert.equal(findProfileForLink(profiles, { server: 'https://obcy.example.com' }), null);
});

test('zapamiętana lista ankiet: odczyt odrzuca uszkodzone dane i zostawia tylko potrzebne pola', () => {
  assert.equal(parseSnapshot(null), null);
  assert.equal(parseSnapshot('{"zle":1}'), null);
  assert.equal(parseSnapshot('nie json'), null);
  const snapshot = parseSnapshot(
    JSON.stringify({
      profileId: 'inst_1',
      profileName: 'Badania',
      savedAt: '2026-11-25T10:00:00.000Z',
      surveys: [{ sid: '11', surveyls_title: 'NPS', active: 'Y', expires: null, startdate: null, secret: 'x' }, { sid: 'abc' }],
    })
  );
  assert.deepEqual(snapshot?.surveys, [{ sid: 11, surveyls_title: 'NPS', startdate: null, expires: null, active: 'Y' }]);
});

test('pęk kluczy: osobny wpis na profil i rozpoznawanie złego hasła', () => {
  assert.equal(credentialServer('inst_1'), 'eu.limecontrol.app/profile/inst_1');
  assert.ok(isInvalidCredentialsError('Invalid user name or password'));
  assert.ok(!isInvalidCredentialsError('No surveys found'));
});

test('profil: flaga hasła w pęku kluczy jest zachowywana tylko jako true', () => {
  assert.equal(normalizeProfile(profile({ biometricPassword: true })).biometricPassword, true);
  assert.equal('biometricPassword' in normalizeProfile(profile({ biometricPassword: false })), false);
  assert.equal('password' in normalizeProfile(profile({ password: 'tajne' })), false);
});
