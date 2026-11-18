#!/usr/bin/env node
/**
 * Sprawdza szablony na prawdziwej instancji LimeSurvey przez API RemoteControl 2:
 * importuje każdy plik .lss, porównuje strukturę z definicją, aktywuje ankietę,
 * otwiera jej stronę publiczną i na koniec usuwa ankietę.
 *
 *   LS_URL=https://ankiety.example.com LS_USER=admin LS_PASSWORD=sekret \
 *     node survey-templates/verify.mjs [--keep] [id-szablonu ...]
 *
 * Zmienne:
 *   LS_URL       adres instancji (wymagany)
 *   LS_RPC_URL   pełny adres endpointu, gdy instancja nie używa „ładnych” adresów
 *                (np. https://ankiety.example.com/index.php?r=admin/remotecontrol)
 *   LS_USER, LS_PASSWORD   konto z prawem tworzenia ankiet (użyj instancji testowej!)
 *
 * Wymaga włączonego interfejsu JSON-RPC (Konfiguracja → Ustawienia globalne → Interfejsy).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplates } from './build.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const keep = args.includes('--keep');
const only = args.filter((a) => !a.startsWith('--'));
const base = (process.env.LS_URL || '').replace(/\/+$/, '');
const user = process.env.LS_USER;
const password = process.env.LS_PASSWORD;
if (!base || !user || !password) {
  console.error('Ustaw LS_URL, LS_USER i LS_PASSWORD (patrz komentarz na początku pliku).');
  process.exit(2);
}
const endpoint = process.env.LS_RPC_URL || `${base}/index.php/admin/remotecontrol`;
const surveyUrl = (sid, lang) => (endpoint.includes('?r=') ? `${base}/index.php?r=survey/index&sid=${sid}&lang=${lang}&newtest=Y` : `${base}/index.php/${sid}?lang=${lang}&newtest=Y`);

let rpcId = 0;
async function rpc(method, params) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: ++rpcId }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${method}: HTTP ${res.status} — odpowiedź nie jest JSON-em (czy JSON-RPC jest włączone?)`); }
  if (json.error) throw new Error(`${method}: ${JSON.stringify(json.error)}`);
  return json.result;
}

const { templates } = loadTemplates();
const selected = only.length ? templates.filter((t) => only.includes(t.id)) : templates;
if (!selected.length) { console.error('Nie znaleziono szablonów o podanych id.'); process.exit(2); }

const key = await rpc('get_session_key', [user, password]);
if (typeof key !== 'string') { console.error(`Logowanie nieudane: ${JSON.stringify(key)}`); process.exit(1); }
const version = await rpc('get_site_settings', [key, 'versionnumber']).catch(() => '?');
console.log(`LimeSurvey ${version} — ${endpoint}\n`);

let failed = 0;
for (const def of selected) {
  const problems = [];
  let sid = null;
  try {
    const xml = readFileSync(join(REPO, 'site', 'ankiety', 'pobierz', `${def.id}.lss`));
    sid = await rpc('import_survey', [key, xml.toString('base64'), 'lss']);
    if (typeof sid !== 'number') throw new Error(`import_survey: ${JSON.stringify(sid)}`);

    const groups = await rpc('list_groups', [key, sid]);
    if (!Array.isArray(groups) || groups.length !== def.groups.length) problems.push(`grupy: ${Array.isArray(groups) ? groups.length : JSON.stringify(groups)} zamiast ${def.groups.length}`);

    // LimeSurvey 7 przechowuje pozycje rankingu jako podpytania (konwertuje je przy imporcie).
    const rankingAsSubquestions = parseInt(String(version), 10) >= 7;
    const expected = def.groups.reduce((n, g) => n + g.questions.reduce((m, q) => m + 1 + (q.subquestions?.length || 0) + (rankingAsSubquestions && q.type === 'ranking' ? q.options.length : 0), 0), 0);
    for (const lang of def.languages) {
      const questions = await rpc('list_questions', [key, sid, null, lang]);
      if (!Array.isArray(questions) || questions.length !== expected) problems.push(`pytania (${lang}): ${Array.isArray(questions) ? questions.length : JSON.stringify(questions)} zamiast ${expected}`);
      const props = await rpc('get_language_properties', [key, sid, ['surveyls_title', 'surveyls_email_invite_subj'], lang]);
      if (props?.surveyls_title !== def.title[lang]) problems.push(`tytuł (${lang}): „${props?.surveyls_title}”`);
      if (!props?.surveyls_email_invite_subj) problems.push(`brak tematu zaproszenia (${lang})`);
    }

    const props = await rpc('get_survey_properties', [key, sid, ['language', 'additional_languages', 'template']]);
    if (props.language !== def.languages[0]) problems.push(`język bazowy: ${props.language}`);
    if ((props.additional_languages || '').trim() !== def.languages.slice(1).join(' ')) problems.push(`języki dodatkowe: „${props.additional_languages}”`);

    const activation = await rpc('activate_survey', [key, sid]);
    if (activation?.status !== 'OK') problems.push(`aktywacja: ${JSON.stringify(activation)}`);

    for (const lang of def.languages) {
      const res = await fetch(surveyUrl(sid, lang));
      const html = await res.text();
      if (res.status !== 200) problems.push(`strona ankiety (${lang}): HTTP ${res.status}`);
      // LimeSurvey koduje znaki w HTML — porównujemy po usunięciu znaczników i encji.
      const plain = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
      const probe = def.title[lang].split(/[—(]/)[0].trim();
      if (!plain.includes(probe)) problems.push(`strona ankiety (${lang}): brak tytułu „${probe}”`);
    }
    console.log(`${problems.length ? '✗' : '✓'} ${def.id}  SID ${sid}  motyw: ${props.template}${problems.length ? `\n    - ${problems.join('\n    - ')}` : ''}`);
  } catch (err) {
    problems.push(err.message);
    console.log(`✗ ${def.id}\n    - ${err.message}`);
  } finally {
    if (sid && typeof sid === 'number' && !keep) await rpc('delete_survey', [key, sid]).catch(() => null);
  }
  if (problems.length) failed += 1;
}
await rpc('release_session_key', [key]).catch(() => null);
console.log(`\n${selected.length - failed}/${selected.length} szablonów poprawnych.${keep ? ' Ankiety pozostawiono na serwerze (--keep).' : ''}`);
process.exit(failed ? 1 : 0);
