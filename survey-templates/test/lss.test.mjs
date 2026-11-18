import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildLss, countQuestions, normalizeTemplate, validateTemplate } from '../lib/lss.mjs';
import { loadTemplates } from '../build.mjs';

/** Minimalna kontrola poprawności XML: zbalansowane znaczniki, z pominięciem sekcji CDATA. */
function assertWellFormed(xml) {
  const stripped = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/^<\?xml[^>]*\?>/, '');
  const stack = [];
  for (const m of stripped.matchAll(/<(\/?)([A-Za-z_][\w.-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = m;
    if (selfClosing) continue;
    if (closing) assert.equal(stack.pop(), name, `niezamknięty znacznik przed </${name}>`);
    else stack.push(name);
  }
  assert.deepEqual(stack, [], 'wszystkie znaczniki zamknięte');
  assert.equal(/[<>]/.test(stripped.replace(/<[^>]+>/g, '')), false, 'brak surowych znaków < > poza znacznikami');
}

const rows = (xml, table) => {
  const block = xml.match(new RegExp(`<${table}>([\\s\\S]*?)</${table}>`));
  return block ? (block[1].match(/<row>/g) || []).length : 0;
};

const minimal = () => ({
  id: 'test-ankieta',
  languages: ['pl', 'en'],
  title: ['Tytuł', 'Title'],
  groups: [{
    title: ['Grupa', 'Group'],
    questions: [
      { code: 'Q1', type: 'radio', mandatory: true, other: true, text: ['Pytanie?', 'Question?'], options: [{ code: '1', text: ['Tak', 'Yes'] }, { code: '2', text: ['Nie', 'No'] }] },
      { code: 'Q2', type: 'array', text: ['Tablica', 'Array'], subquestions: [{ code: 'A', text: ['Wiersz A', 'Row A'] }, { code: 'B', text: ['Wiersz B', 'Row B'] }], options: '@agree' },
      { code: 'Q3', type: 'longtext', relevance: 'Q1.NAOK == 1', text: ['Dlaczego?', 'Why?'], cssClass: 'lc-interviewer', attributesL10n: { em_validation_q_tip: ['Podpowiedź', 'Hint'] } },
    ],
  }],
});
const scales = { agree: [{ code: '1', text: ['Nie', 'No'] }, { code: '2', text: ['Tak', 'Yes'] }] };

test('normalizeTemplate rozwija pary językowe i zestawy odpowiedzi', () => {
  const def = normalizeTemplate(minimal(), scales);
  assert.deepEqual(def.title, { pl: 'Tytuł', en: 'Title' });
  assert.deepEqual(def.groups[0].questions[1].options[1], { code: '2', text: { pl: 'Tak', en: 'Yes' } });
  assert.deepEqual(def.groups[0].questions[2].attributesL10n.em_validation_q_tip, { pl: 'Podpowiedź', en: 'Hint' });
  assert.deepEqual(def.languages, ['pl', 'en'], 'lista języków nie jest traktowana jak para tłumaczeń');
  assert.throws(() => normalizeTemplate({ ...minimal(), groups: [{ title: ['a', 'b'], questions: [{ code: 'X', type: 'radio', text: ['a', 'b'], options: '@brak' }] }] }, scales), /nieznany zestaw/);
});

test('validateTemplate zgłasza typowe błędy definicji', () => {
  const check = (mutate, pattern) => {
    const def = normalizeTemplate(minimal(), scales);
    mutate(def);
    const errors = validateTemplate(def);
    assert.ok(errors.some((e) => pattern.test(e)), `oczekiwano błędu ${pattern}, jest: ${JSON.stringify(errors)}`);
  };
  assert.deepEqual(validateTemplate(normalizeTemplate(minimal(), scales)), []);
  check((d) => { d.id = 'Zła Nazwa'; }, /kebab-case/);
  check((d) => { delete d.title.en; }, /title: brak tłumaczenia „en”/);
  check((d) => { d.groups[0].questions[0].code = '1Q'; }, /kod musi zaczynać się literą/);
  check((d) => { d.groups[0].questions[1].code = 'q1'; }, /zduplikowany kod pytania/);
  check((d) => { d.groups[0].questions[0].type = 'slider'; }, /nieznany typ/);
  check((d) => { d.groups[0].questions[0].options = [d.groups[0].questions[0].options[0]]; }, /co najmniej 2 opcji/);
  check((d) => { d.groups[0].questions[0].options[1].code = 'ZADLUGI'; }, /nieprawidłowy kod/);
  check((d) => { d.groups[0].questions[1].subquestions = []; }, /wymaga podpytań/);
  check((d) => { d.groups[0].questions[2].other = true; }, /„Inne” jest dostępna tylko/);
  check((d) => { d.settings = { nieistnieje: 'Y' }; }, /nieznane ustawienie/);
  check((d) => { d.groups = []; }, /co najmniej jedną grupę/);
});

test('buildLss tworzy poprawny dokument z oboma językami', () => {
  const def = normalizeTemplate(minimal(), scales);
  const xml = buildLss(def, { sid: 424242 });
  assertWellFormed(xml);
  assert.match(xml, /<LimeSurveyDocType>Survey<\/LimeSurveyDocType>/);
  assert.match(xml, /<language>pl<\/language>\s*<language>en<\/language>/);
  assert.equal(rows(xml, 'groups'), 1);
  assert.equal(rows(xml, 'group_l10ns'), 2);
  assert.equal(rows(xml, 'questions'), 3);
  assert.equal(rows(xml, 'subquestions'), 2);
  assert.equal(rows(xml, 'question_l10ns'), (3 + 2) * 2);
  assert.equal(rows(xml, 'answers'), 4);
  assert.equal(rows(xml, 'answer_l10ns'), 8);
  assert.equal(rows(xml, 'surveys'), 1);
  assert.equal(rows(xml, 'surveys_languagesettings'), 2);
  assert.match(xml, /<additional_languages><!\[CDATA\[en\]\]><\/additional_languages>/);
  assert.match(xml, /<relevance><!\[CDATA\[Q1\.NAOK == 1\]\]><\/relevance>/);
  assert.match(xml, /<attribute><!\[CDATA\[cssclass\]\]><\/attribute>\s*<value><!\[CDATA\[lc-interviewer\]\]><\/value>/);
  assert.match(xml, /<other><!\[CDATA\[Y\]\]><\/other>/);
  assert.match(xml, /<sid><!\[CDATA\[424242\]\]><\/sid>/);
  assert.match(xml, /surveyls_email_invite_subj><!\[CDATA\[Zaproszenie do ankiety/);
  assert.equal(countQuestions(def), 3);
});

test('buildLss zabezpiecza treść przed zamknięciem sekcji CDATA', () => {
  const def = normalizeTemplate(minimal(), scales);
  def.groups[0].questions[0].text.pl = 'Czy a < b && b > c? ]]> <script>alert(1)</script>';
  const xml = buildLss(def);
  assertWellFormed(xml);
  assert.ok(xml.includes(']]]]><![CDATA[>'), 'sekwencja ]]> jest dzielona między dwie sekcje CDATA');
});

test('buildLss odrzuca nieprawidłową definicję i jest deterministyczny', () => {
  const bad = normalizeTemplate(minimal(), scales);
  bad.groups[0].questions[0].code = '!!';
  assert.throws(() => buildLss(bad), /Nieprawidłowa definicja/);
  const def = normalizeTemplate(minimal(), scales);
  assert.equal(buildLss(def), buildLss(def));
});

test('atrybuty uczestnika trafiają do ustawień ankiety w obu językach', () => {
  const def = normalizeTemplate({ ...minimal(), tokenAttributes: [{ name: ['Telefon', 'Phone'] }, { name: ['Notatka', 'Note'], mandatory: true }] }, scales);
  const xml = buildLss(def);
  const desc = JSON.parse(xml.match(/<attributedescriptions><!\[CDATA\[(.*?)\]\]>/)[1]);
  assert.deepEqual(Object.keys(desc), ['attribute_1', 'attribute_2']);
  assert.equal(desc.attribute_1.description, 'Telefon');
  assert.equal(desc.attribute_2.mandatory, 'Y');
  const captions = [...xml.matchAll(/<surveyls_attributecaptions><!\[CDATA\[(.*?)\]\]>/g)].map((m) => JSON.parse(m[1]));
  assert.deepEqual(captions, [{ attribute_1: 'Telefon', attribute_2: 'Notatka' }, { attribute_1: 'Phone', attribute_2: 'Note' }]);
});

test('wszystkie szablony z repozytorium są poprawne i mają komplet tłumaczeń', () => {
  const { templates, categories } = loadTemplates();
  assert.ok(templates.length >= 12);
  for (const def of templates) {
    assert.deepEqual(def.languages, ['pl', 'en'], def.id);
    assert.deepEqual(validateTemplate(def), [], def.id);
    assertWellFormed(buildLss(def));
    assert.ok(categories.some((c) => c.id === def.category), def.id);
    // Wyrażenia warunkowe mogą odwoływać się tylko do istniejących kodów pytań.
    const codes = new Set();
    for (const g of def.groups) for (const q of g.questions) {
      codes.add(q.code);
      for (const s of q.subquestions || []) codes.add(`${q.code}_${s.code}`);
    }
    const expressions = [];
    for (const g of def.groups) {
      if (g.relevance) expressions.push(g.relevance);
      for (const q of g.questions) {
        if (q.relevance) expressions.push(q.relevance);
        if (q.type === 'equation') expressions.push(...Object.values(q.text));
      }
    }
    for (const expr of expressions) {
      for (const [, ref] of expr.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\.NAOK\b/g)) {
        assert.ok(codes.has(ref), `${def.id}: wyrażenie „${expr.slice(0, 60)}” odwołuje się do nieistniejącego kodu ${ref}`);
      }
    }
  }
});
