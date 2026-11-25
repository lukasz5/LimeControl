// SPDX-License-Identifier: GPL-2.0-or-later
(() => {
    'use strict';
    const cases = window.LimeControlDemoCases;
    const byId = id => document.getElementById(id);
    const casesMenu = byId('case');
    const blockMenu = byId('block');
    const questions = byId('questions');
    const language = document.documentElement.lang.split('-')[0] === 'en' ? 'en' : 'pl';
    const examplesDir = new URL('../examples/', document.currentScript.src);
    const languageLink = byId('demo-language');
    const languageUrl = languageLink && new URL(languageLink.href);
    const translations = {
        pl: {
            hints: {
                fieldwork: 'Zmień pomiar w Łodzi z 9 na 8 godzin. Sprawdź, co stanie się z pytaniem o powód i jego zapisem JSON.',
                equipment: 'Podnieś naładowanie tabletu z 0 do 21%. Sprawdź, kiedy znika plan działania. Wpisz 101, aby zobaczyć walidację zakresu.'
            },
            kinds: { choice: 'Wybór dla pozycji', matrix: 'Macierz', followup: 'Pytanie uzupełniające' },
            source: 'Wybór lokalizacji', empty: 'Puste pole', invalid: 'Uzupełnij lub popraw wartości w tym bloku.',
            valid: 'Odpowiedź zgodna z regułami bloku.', noValues: 'Brak zapisanych wartości.',
            surveyLoaded: 'Wczytano ankietę i przykładowe odpowiedzi.', sampleLoaded: 'Wczytano przykładowe odpowiedzi.',
            cleared: 'Wyczyszczono odpowiedzi. Zacznij od wyboru lokalizacji.'
        },
        en: {
            hints: {
                fieldwork: 'Change the measurement in Łódź from 9 to 8 hours. Watch what happens to the follow-up question and its stored JSON.',
                equipment: 'Raise the tablet’s battery level from 0 to 21%. Watch when the action plan disappears. Enter 101 to test the upper limit.'
            },
            kinds: { choice: 'Choice per item', matrix: 'Matrix', followup: 'Follow-up question' },
            source: 'Location selection', empty: 'Empty field', invalid: 'Complete or correct the values in this block.',
            valid: 'This answer meets the rules for this block.', noValues: 'No stored values.',
            surveyLoaded: 'Survey and sample answers loaded.', sampleLoaded: 'Sample answers loaded.',
            cleared: 'Answers cleared. Start by choosing a location.'
        }
    };
    const text = translations[language];

    function element(tag, className, value) {
        const item = document.createElement(tag);
        if (className) item.className = className;
        if (value !== undefined) item.textContent = value;
        return item;
    }

    function questionPanel(code, kind, title) {
        const section = element('section', 'question');
        const type = element('div', 'question-type');
        type.append(element('span', '', kind), element('code', '', code));
        const heading = element('h2', '', title);
        heading.id = 'title-' + code;
        section.setAttribute('aria-labelledby', heading.id);
        section.append(type, heading);
        questions.append(section);
        return section;
    }

    function addSource(example, sample) {
        const { source } = example;
        const first = example.questions[0].code;
        const initial = new Set(sample ? example.samples[language][first].rows.map(row => row.path[0]) : []);
        const panel = questionPanel(source.code, text.source, source.title[language]);
        const choices = element('div', 'native-choices');
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-labelledby', 'title-' + source.code);
        for (const field of source.fields) {
            const label = element('label', 'native-option');
            const input = element('input', 'checkbox');
            input.type = 'checkbox';
            input.name = field.fieldName;
            input.value = field.value;
            input.checked = initial.has(field.path[0]);
            label.append(input, document.createTextNode(field.label[language]));
            choices.append(label);
        }
        panel.append(choices);
    }

    function addBlock(example, question, sample) {
        const { source } = example;
        const { code, definition } = question;
        const panel = questionPanel(code, text.kinds[definition.kind], question.title[language]);
        const block = element('div', 'lcjq-block');
        const name = 'demo-' + code;
        block.dataset.lcjqKind = definition.kind;
        block.dataset.lcjq = JSON.stringify({
            surveyId: example.surveyId, questionCode: code, fieldName: name, definition,
            language, sources: { [source.code]: [] }, sourceFields: { [source.code]: source.fields }
        });
        const storage = element('textarea', 'lcjq-storage');
        storage.id = name;
        storage.name = name;
        storage.hidden = true;
        storage.setAttribute('aria-labelledby', 'title-' + code);
        if (sample) storage.value = JSON.stringify(example.samples[language][code]);
        block.append(storage);
        panel.append(block);
    }

    function preview() {
        const example = cases[casesMenu.value];
        const code = blockMenu.value;
        const storage = byId('demo-' + code);
        if (!storage) return;
        byId('json').textContent = storage.value ? JSON.stringify(JSON.parse(storage.value), null, 2) : text.empty;
        const valid = window.lcjqValid(storage.value, code, example.surveyId);
        const message = !valid ? text.invalid : storage.value ? text.valid : text.noValues;
        const status = byId('validation');
        status.classList.toggle('error', !valid);
        if (status.textContent !== message) status.textContent = message;
    }

    function render(sample) {
        const slug = casesMenu.value;
        const example = cases[slug];
        const previous = blockMenu.value;
        questions.replaceChildren();
        blockMenu.replaceChildren();
        addSource(example, sample);
        for (const question of example.questions) {
            addBlock(example, question, sample);
            blockMenu.add(new Option(question.code + ' · ' + text.kinds[question.definition.kind], question.code));
        }
        const fallback = example.questions.find(q => q.definition.kind === 'matrix');
        blockMenu.value = example.questions.some(q => q.code === previous) ? previous : fallback.code;
        byId('experiment').textContent = text.hints[slug];
        byId('survey-file').href = new URL(slug + '.lss', examplesDir).href;
        const csv = language === 'en' ? '-expected.en.csv' : '-expected.csv';
        byId('csv-file').href = new URL(slug + csv, examplesDir).href;
        if (languageLink) languageLink.href = scenarioUrl(languageUrl, slug);
        window.LimeControlJsonRespondent.mount();
        preview();
    }

    function currentScenario() {
        const url = new URL(location.href);
        return [url.searchParams.get('example'), url.hash.slice(1)].find(slug => Object.hasOwn(cases, slug)) || 'fieldwork';
    }

    function scenarioUrl(base, slug) {
        const current = new URL(location.href);
        const url = new URL(base);
        const useHash = !current.searchParams.has('example') &&
            (current.protocol === 'file:' || Object.hasOwn(cases, current.hash.slice(1)));
        if (useHash) {
            url.searchParams.delete('example');
            url.hash = slug;
        } else {
            url.searchParams.set('example', slug);
            if (Object.hasOwn(cases, url.hash.slice(1))) url.hash = '';
        }
        return url.href;
    }

    function syncFromUrl() {
        const slug = currentScenario();
        if (casesMenu.value !== slug) {
            casesMenu.value = slug;
            render(true);
            byId('notice').textContent = text.surveyLoaded;
        }
    }

    for (const [slug, example] of Object.entries(cases)) casesMenu.add(new Option(example.title[language], slug));
    casesMenu.value = currentScenario();
    casesMenu.addEventListener('change', () => {
        history.replaceState(null, '', scenarioUrl(location.href, casesMenu.value));
        render(true);
        byId('notice').textContent = text.surveyLoaded;
    });
    window.addEventListener('hashchange', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    byId('sample').addEventListener('click', () => {
        render(true);
        byId('notice').textContent = text.sampleLoaded;
    });
    byId('clear').addEventListener('click', () => {
        render(false);
        byId('notice').textContent = text.cleared;
    });
    blockMenu.addEventListener('change', preview);
    // The renderer commits the native multiple-choice change at document level.
    // Wait for it before reading the dependent storage, including when a field becomes empty.
    for (const event of ['input', 'change']) questions.addEventListener(event, () => queueMicrotask(preview));
    render(true);
    byId('demo').hidden = false;
})();
