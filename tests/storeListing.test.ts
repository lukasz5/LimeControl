import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

/**
 * Opisy aplikacji mobilnej dla App Store i Google Play (mobile/fastlane/metadata).
 * Sklepy odrzucają zbyt długie pola, a nazwa „LimeSurvey” jest zastrzeżonym znakiem towarowym:
 * wolno jej użyć w opisie, żeby wskazać zgodność, ale nie w nazwie, podtytule ani słowach kluczowych.
 */
// Testy uruchamia się z katalogu głównego repozytorium (npm test).
const ROOT = path.resolve('mobile', 'fastlane', 'metadata');
const read = (...parts: string[]) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8').trim();
const length = (text: string) => [...text].length;

const IOS_LOCALES = ['pl', 'en-US'];
const ANDROID_LOCALES = ['pl-PL', 'en-US'];
const IOS_LIMITS: Record<string, number> = { name: 30, subtitle: 30, keywords: 100, promotional_text: 170, description: 4000, release_notes: 4000 };
const ANDROID_LIMITS: Record<string, number> = { title: 30, short_description: 80, full_description: 4000, 'changelogs/default': 500 };
/** Pola, w których nie może paść nazwa cudzego produktu. */
const BRAND_FIELDS_IOS = ['name', 'subtitle', 'keywords', 'promotional_text'];
const BRAND_FIELDS_ANDROID = ['title', 'short_description'];
const DISCLAIMER = /LimeSurvey GmbH\.?$/;

test('App Store: pola mieszczą się w limitach znaków w obu językach', () => {
  for (const locale of IOS_LOCALES) {
    for (const [field, limit] of Object.entries(IOS_LIMITS)) {
      const text = read('ios', locale, `${field}.txt`);
      assert.ok(text.length > 0, `ios/${locale}/${field}.txt jest pusty`);
      assert.ok(length(text) <= limit, `ios/${locale}/${field}.txt: ${length(text)} znaków (limit ${limit})`);
    }
  }
});

test('Google Play: pola mieszczą się w limitach znaków w obu językach', () => {
  for (const locale of ANDROID_LOCALES) {
    for (const [field, limit] of Object.entries(ANDROID_LIMITS)) {
      const text = read('android', locale, `${field}.txt`);
      assert.ok(text.length > 0, `android/${locale}/${field}.txt jest pusty`);
      assert.ok(length(text) <= limit, `android/${locale}/${field}.txt: ${length(text)} znaków (limit ${limit})`);
    }
  }
});

test('nazwa, podtytuł i słowa kluczowe nie używają znaku towarowego LimeSurvey', () => {
  for (const locale of IOS_LOCALES) {
    for (const field of BRAND_FIELDS_IOS) assert.doesNotMatch(read('ios', locale, `${field}.txt`), /lime\s*survey/i, `ios/${locale}/${field}.txt`);
    assert.equal(read('ios', locale, 'name.txt'), 'LimeControl');
  }
  for (const locale of ANDROID_LOCALES) {
    for (const field of BRAND_FIELDS_ANDROID) assert.doesNotMatch(read('android', locale, `${field}.txt`), /lime\s*survey/i, `android/${locale}/${field}.txt`);
    assert.equal(read('android', locale, 'title.txt'), 'LimeControl');
  }
});

test('opis kończy się notą o niezależności od LimeSurvey GmbH', () => {
  for (const locale of IOS_LOCALES) assert.match(read('ios', locale, 'description.txt'), DISCLAIMER, `ios/${locale}`);
  for (const locale of ANDROID_LOCALES) assert.match(read('android', locale, 'full_description.txt'), DISCLAIMER, `android/${locale}`);
});

test('opis w App Store nie wspomina o innych platformach', () => {
  for (const locale of IOS_LOCALES) {
    for (const field of ['description', 'promotional_text', 'keywords', 'release_notes']) {
      assert.doesNotMatch(read('ios', locale, `${field}.txt`), /android|google play/i, `ios/${locale}/${field}.txt`);
    }
  }
});

test('obie wersje językowe mają ten sam zestaw plików, a adresy prowadzą do limecontrol.eu', () => {
  const files = (dir: string, prefix = ''): string[] => fs.readdirSync(path.join(ROOT, dir, prefix), { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? files(dir, path.join(prefix, entry.name)) : entry.name.endsWith('.txt') ? [path.join(prefix, entry.name)] : []))
    .sort();
  assert.deepEqual(files('ios/pl'), files('ios/en-US'));
  assert.deepEqual(files('android/pl-PL'), files('android/en-US'));

  for (const locale of IOS_LOCALES) {
    for (const field of ['privacy_url', 'support_url', 'marketing_url']) {
      const url = new URL(read('ios', locale, `${field}.txt`));
      assert.equal(url.origin, 'https://limecontrol.eu', `ios/${locale}/${field}.txt`);
      assert.equal(url.pathname.startsWith('/en/'), locale === 'en-US', `ios/${locale}/${field}.txt: język adresu`);
    }
  }
});
