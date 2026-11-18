#!/usr/bin/env node
/**
 * Wypełnia TESTOWĄ instancję LimeSurvey danymi demonstracyjnymi — do zrzutów ekranu dla sklepów
 * i jako konto demo dla recenzentów App Store / Google Play.
 *
 *   LS_URL=https://demo.example.com LS_USER=admin LS_PASSWORD='…' \
 *     node mobile/store/seed-demo.mjs --lang pl [--reset]
 *
 *   --lang pl|en   język tytułów ankiet (domyślnie pl)
 *   --reset        NAJPIERW USUWA WSZYSTKIE ANKIETY na instancji — tylko dla instancji przeznaczonej na demo
 *
 * Zmienne: LS_URL (wymagana), LS_RPC_URL (gdy instancja nie używa „ładnych” adresów), LS_USER, LS_PASSWORD.
 * Importuje pięć szablonów z public/szablony-ankiet/, aktywuje cztery z nich, dodaje fikcyjnych
 * uczestników (adresy @example.com) i puste odpowiedzi, żeby statystyki pokazywały liczby.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'pl';
if (lang !== 'pl' && lang !== 'en') throw new Error('--lang: dozwolone wartości to pl i en');
const reset = args.includes('--reset');
const base = (process.env.LS_URL || '').replace(/\/+$/, '');
const user = process.env.LS_USER;
const password = process.env.LS_PASSWORD;
if (!base || !user || !password) {
  console.error('Ustaw LS_URL, LS_USER i LS_PASSWORD (patrz komentarz na początku pliku).');
  process.exit(2);
}
const endpoint = process.env.LS_RPC_URL || `${base}/index.php/admin/remotecontrol`;

let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: ++rpcId }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}
const failed = (result) => (result && typeof result === 'object' && typeof result.status === 'string' && !/^ok$/i.test(result.status) ? result.status : null);

/** Ankiety demo: szablon, czy aktywna, odpowiedzi pełne / niepełne, uczestnicy (zaproszeni, ukończyli, bez zaproszenia). */
const PLAN = [
  { id: 'nps-klienta', active: true, complete: 184, incomplete: 23, participants: { invited: 120, completed: 96, pending: 40 } },
  { id: 'satysfakcja-klienta-csat', active: true, complete: 92, incomplete: 11, participants: null },
  { id: 'zaangazowanie-pracownikow', active: true, complete: 57, incomplete: 9, participants: { invited: 60, completed: 41, pending: 15 } },
  { id: 'wywiad-cati', active: true, complete: 38, incomplete: 6, participants: { invited: 0, completed: 0, pending: 50 } },
  { id: 'ewaluacja-szkolenia', active: false, complete: 0, incomplete: 0, participants: null },
];
const FIRST = ['Anna', 'Jan', 'Maria', 'Piotr', 'Ewa', 'Tomasz', 'Olga', 'Adam', 'Zofia', 'Marek'];
const LAST = ['Demo', 'Test', 'Sample', 'Example', 'Próbny', 'Wzorcowy'];

const catalog = JSON.parse(readFileSync(join(REPO, 'public', 'szablony-ankiet', 'catalog.json'), 'utf8'));
const key = await rpc('get_session_key', [user, password]);
if (typeof key !== 'string') throw new Error(`Logowanie nieudane: ${JSON.stringify(key)}`);

try {
  if (reset) {
    const existing = await rpc('list_surveys', [key]);
    if (Array.isArray(existing)) {
      for (const survey of existing) await rpc('delete_survey', [key, survey.sid]);
      console.log(`usunięto ${existing.length} ankiet`);
    }
  }

  for (const item of PLAN) {
    const entry = catalog.templates.find((t) => t.id === item.id);
    if (!entry) throw new Error(`Brak szablonu ${item.id} w katalogu — uruchom npm run build:templates`);
    const lss = readFileSync(join(REPO, 'public', 'szablony-ankiet', entry.file));
    // Nazwa podana przy imporcie zastępuje tytuł we wszystkich językach ankiety.
    const sid = await rpc('import_survey', [key, lss.toString('base64'), 'lss', entry.title[lang]]);
    if (typeof sid !== 'number' && !/^\d+$/.test(String(sid))) throw new Error(`import ${item.id}: ${JSON.stringify(sid)}`);

    if (item.active) {
      const activated = failed(await rpc('activate_survey', [key, sid]));
      if (activated) throw new Error(`activate_survey ${sid}: ${activated}`);
      for (let i = 0; i < item.complete + item.incomplete; i++) {
        const day = String(1 + (i % 17)).padStart(2, '0');
        const hour = String(8 + (i % 10)).padStart(2, '0');
        // Pusta data zakończenia = odpowiedź niepełna (bez tego pola LimeSurvey wpisałby bieżącą datę).
        const row = { startlanguage: 'pl', submitdate: i < item.complete ? `2026-11-${day} ${hour}:15:00` : '' };
        await rpc('add_response', [key, sid, row]);
      }
    }

    if (item.participants) {
      // Pola uczestnika z szablonu (np. telefon i status kontaktu w wywiadzie CATI) powstają razem z tabelą.
      const attributes = Array.from({ length: entry.tokenAttributes }, (_v, i) => i + 1);
      const tokens = failed(await rpc('activate_tokens', [key, sid, attributes]));
      if (tokens) throw new Error(`activate_tokens ${sid}: ${tokens}`);
      const { invited, completed, pending } = item.participants;
      const rows = [];
      for (let i = 0; i < invited + pending; i++) {
        const firstname = FIRST[i % FIRST.length];
        const lastname = `${LAST[i % LAST.length]} ${i + 1}`;
        rows.push({
          firstname,
          lastname,
          email: `${firstname.toLowerCase()}.${i + 1}@example.com`,
          language: 'pl',
          ...(i < invited ? { sent: '2026-11-05 09:00' } : {}),
          ...(i < completed ? { completed: '2026-11-08 12:30', usesleft: 0 } : {}),
        });
      }
      for (let i = 0; i < rows.length; i += 50) await rpc('add_participants', [key, sid, rows.slice(i, i + 50), true]);
    }
    console.log(`✓ #${sid}  ${entry.title[lang]}  ${item.active ? `aktywna, ${item.complete}+${item.incomplete} odpowiedzi` : 'nieaktywna'}${item.participants ? `, ${item.participants.invited + item.participants.pending} uczestników` : ''}`);
  }
} finally {
  await rpc('release_session_key', [key]);
}
