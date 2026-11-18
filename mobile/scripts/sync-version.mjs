#!/usr/bin/env node
/**
 * Przenosi numer wersji z package.json do projektów natywnych:
 *   iOS     → MARKETING_VERSION w mobile/ios/App/App.xcodeproj/project.pbxproj
 *   Android → versionName w mobile/android/app/build.gradle
 *
 * Uruchamiane automatycznie przez `npm run build:mobile`. Numer kompilacji (CURRENT_PROJECT_VERSION
 * na iOS, versionCode na Androidzie) ustawia się osobno przy każdej paczce wysyłanej do sklepu —
 * patrz mobile/README.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`package.json: wersja „${version}” nie ma postaci X.Y.Z`);

function patch(file, pattern, replacement, expected) {
  const path = join(ROOT, file);
  const before = readFileSync(path, 'utf8');
  const count = (before.match(pattern) || []).length;
  if (count !== expected) throw new Error(`${file}: oczekiwano ${expected} wystąpień wzorca ${pattern}, znaleziono ${count}`);
  const after = before.replace(pattern, replacement);
  if (after !== before) writeFileSync(path, after);
  return after !== before;
}

const ios = patch('mobile/ios/App/App.xcodeproj/project.pbxproj', /MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`, 2);
const android = patch('mobile/android/app/build.gradle', /versionName "[^"]+"/g, `versionName "${version}"`, 1);
console.log(`✓ wersja aplikacji mobilnej: ${version}${ios || android ? ' (zaktualizowano projekty natywne)' : ''}`);
