import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { decryptSecret, encryptSecret, isEncrypted, loadSecretKey } from '../server/secretbox.ts';

test('szyfrowanie jest odwracalne, losowe i wykrywa manipulację', () => {
  const key = loadSecretKey(fs.mkdtempSync(path.join(os.tmpdir(), 'lc-key-')), 'sekret-o-odpowiedniej-długości');
  const a = encryptSecret('Zażółć gęślą jaźń!', key);
  const b = encryptSecret('Zażółć gęślą jaźń!', key);
  assert.ok(isEncrypted(a));
  assert.notEqual(a, b, 'każde szyfrowanie używa nowego IV');
  assert.equal(a.includes('Zażółć'), false);
  assert.equal(decryptSecret(a, key), 'Zażółć gęślą jaźń!');
  assert.equal(decryptSecret(b, key), 'Zażółć gęślą jaźń!');
  const tampered = a.slice(0, -4) + (a.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.throws(() => decryptSecret(tampered, key));
  const other = loadSecretKey(fs.mkdtempSync(path.join(os.tmpdir(), 'lc-key-')), 'inny-sekret-o-odpowiedniej-długości');
  assert.throws(() => decryptSecret(a, other));
});

test('puste i niezaszyfrowane wartości przechodzą bez zmian', () => {
  const key = loadSecretKey(fs.mkdtempSync(path.join(os.tmpdir(), 'lc-key-')), 'sekret-o-odpowiedniej-długości');
  assert.equal(encryptSecret('', key), '');
  assert.equal(decryptSecret('', key), '');
  assert.equal(decryptSecret('stare-jawne-haslo', key), 'stare-jawne-haslo');
});

test('klucz z pliku jest tworzony raz, z uprawnieniami 600', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-key-'));
  const first = loadSecretKey(dir, '');
  const second = loadSecretKey(dir, '');
  assert.equal(first.length, 32);
  assert.deepEqual(first, second);
  if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(dir, 'secret.key')).mode & 0o777, 0o600);
});
