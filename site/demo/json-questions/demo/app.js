// SPDX-License-Identifier: GPL-2.0-or-later
(() => {
    'use strict';
    const cases = window.LimeControlDemoCases;
    const examplesDir = new URL('../examples/', document.currentScript.src);

    const byId = id => document.getElementById(id);
    const casesMenu = byId('case');
    const blockMenu = byId('block');
    const questions = byId('questions');
    const hints = {
        fieldwork: 'Zmień pomiar w Łodzi z 9 na 8 godzin. Sprawdź, co stanie się z pytaniem o powód i jego zapisem JSON.',
        equipment: 'Podnieś naładowanie tabletu z 0 do 21%. Sprawdź, kiedy znika plan działania. Wpisz 101, aby zobaczyć walidację zakresu.'
    };
    const kindNames = {
        choice: 'Wybór dla pozycji',
        matrix: 'Macierz',
        followup: 'Pytanie uzupełniające'
    };

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
        const initial = new Set(sample ? example.sample[first].rows.map(row => row.path[0]) : []);
        const panel = questionPanel(source.code, 'Wybór lokalizacji', source.title);
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
            label.append(input, document.createTextNode(field.label));
            choices.append(label);
        }
        panel.append(choices);
    }

    function addBlock(example, question, sample) {
        const { source } = example;
        const { code, definition } = question;
        const panel = questionPanel(code, kindNames[definition.kind], question.title);
        const block = element('div', 'lcjq-block');
        const name = 'demo-' + code;
        block.dataset.lcjqKind = definition.kind;
        block.dataset.lcjq = JSON.stringify({
            surveyId: example.surveyId, questionCode: code, fieldName: name, definition,
            language: 'pl', sources: { [source.code]: [] }, sourceFields: { [source.code]: source.fields }
        });
        const storage = element('textarea', 'lcjq-storage');
        storage.id = name;
        storage.name = name;
        storage.hidden = true;
        storage.setAttribute('aria-labelledby', 'title-' + code);
        if (sample) storage.value = JSON.stringify(example.sample[code]);
        block.append(storage);
        panel.append(block);
    }

    function preview() {
        const example = cases[casesMenu.value];
        const code = blockMenu.value;
        const storage = byId('demo-' + code);
        if (!storage) return;
        byId('json').textContent = storage.value ? JSON.stringify(JSON.parse(storage.value), null, 2) : 'Puste pole';
        const valid = window.lcjqValid(storage.value, code, example.surveyId);
        const message = !valid ? 'Uzupełnij lub popraw wartości w tym bloku.' :
            storage.value ? 'Odpowiedź zgodna z regułami bloku.' : 'Brak zapisanych wartości.';
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
            blockMenu.add(new Option(question.code + ' · ' + kindNames[question.definition.kind], question.code));
        }
        const fallback = example.questions.find(q => q.definition.kind === 'matrix');
        blockMenu.value = example.questions.some(q => q.code === previous) ? previous : fallback.code;
        byId('experiment').textContent = hints[slug];
        byId('survey-file').href = examplesDir.href + slug + '.lss';
        byId('csv-file').href = examplesDir.href + slug + '-expected.csv';
        window.LimeControlJsonRespondent.mount();
        preview();
    }

    for (const [slug, example] of Object.entries(cases)) casesMenu.add(new Option(example.title, slug));
    const entry = new URL(location.href);
    const initialCase = entry.searchParams.get('example') || entry.hash.slice(1);
    casesMenu.value = Object.hasOwn(cases, initialCase) ? initialCase : 'fieldwork';
    casesMenu.addEventListener('change', () => {
        const url = new URL(location.href);
        url.searchParams.set('example', casesMenu.value);
        url.hash = '';
        history.replaceState(null, '', url);
        render(true);
        byId('notice').textContent = 'Wczytano ankietę i przykładowe odpowiedzi.';
    });
    byId('sample').addEventListener('click', () => {
        render(true);
        byId('notice').textContent = 'Wczytano przykładowe odpowiedzi.';
    });
    byId('clear').addEventListener('click', () => {
        render(false);
        byId('notice').textContent = 'Wyczyszczono odpowiedzi. Zacznij od wyboru lokalizacji.';
    });
    blockMenu.addEventListener('change', preview);
    // The renderer commits the native multiple-choice change at document level.
    // Wait for it before reading the dependent storage, including when a field becomes empty.
    for (const event of ['input', 'change']) questions.addEventListener(event, () => queueMicrotask(preview));
    render(true);
    byId('demo').hidden = false;
})();
