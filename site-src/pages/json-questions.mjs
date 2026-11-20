import { readFileSync } from 'node:fs';
import { esc } from '../chrome.mjs';

const release = JSON.parse(readFileSync(new URL('../releases/json-questions.json', import.meta.url), 'utf8'));
const copy = {
  pl: {
    title: 'Pytania zależne JSON', link: 'Pytania zależne JSON',
    lead: 'Zbuduj pytania na podstawie wcześniejszych odpowiedzi. Gdy respondent wybierze miasta i rodzaje prac, ankieta może poprosić o liczbę godzin dla każdej pary, a po przekroczeniu progu także o wyjaśnienie.',
    storage: 'Każdy blok zajmuje jedno pole odpowiedzi LimeSurvey. Ułatwia to tworzenie rozbudowanych tabel w długich ankietach. Wtyczka działa na własnym serwerze bez konta LimeControl.',
    install: 'Zainstaluj wtyczkę w menedżerze wtyczek i włącz ją. Następnie zaimportuj wybrane motywy w sekcji motywów pytań.',
    themes: 'Motywy pytań', choice: 'Wybór dla każdej pozycji', matrix: 'Tabela z wcześniejszych odpowiedzi', followup: 'Pytanie uzupełniające',
    download: 'Pobierz wtyczkę', source: 'Kod źródłowy', pending: 'Wydanie w przygotowaniu', tested: 'Sprawdzone wersje LimeSurvey CE',
    sums: 'Sumy kontrolne SHA-256'
  },
  en: {
    title: 'Dependent JSON questions', link: 'Dependent JSON questions',
    lead: 'Build questions from earlier answers. After someone chooses cities and activities, the survey can ask how many hours they spent on each pair and request an explanation when the hours exceed a threshold.',
    storage: 'Each block uses one LimeSurvey response field, helping large tables fit into long surveys. The plugin runs on your server without a LimeControl account.',
    install: 'Install and activate the plugin in Plugin Manager. Then import the themes you need under Question themes.',
    themes: 'Question themes', choice: 'Choice for each item', matrix: 'Table from earlier answers', followup: 'Follow-up question',
    download: 'Download plugin', source: 'Source code', pending: 'Release in preparation', tested: 'Tested LimeSurvey CE versions',
    sums: 'SHA-256 checksums'
  },
  de: {
    title: 'Abhängige JSON-Fragen', link: 'Abhängige JSON-Fragen',
    lead: 'Bauen Sie Fragen auf früheren Antworten auf. Nach der Auswahl von Städten und Tätigkeiten kann die Umfrage für jede Kombination die Stunden erfassen und bei Überschreitung eines Grenzwerts nach dem Grund fragen.',
    storage: 'Jeder Fragenblock belegt ein einziges Antwortfeld in LimeSurvey. So lassen sich umfangreiche Tabellen in langen Umfragen einsetzen. Das Plugin läuft auf Ihrem Server ohne LimeControl-Konto.',
    install: 'Installieren und aktivieren Sie das Plugin im Plugin-Manager. Importieren Sie anschließend die gewünschten Designs unter Fragendesigns.',
    themes: 'Fragendesigns', choice: 'Auswahl je Eintrag', matrix: 'Tabelle aus früheren Antworten', followup: 'Anschlussfrage',
    download: 'Plugin herunterladen', source: 'Quellcode', pending: 'Veröffentlichung in Vorbereitung', tested: 'Getestete LimeSurvey-CE-Versionen',
    sums: 'SHA-256-Prüfsummen'
  }
};
const keys = ['choice', 'matrix', 'followup'];

export function jsonQuestionsAnchor(lang) {
  return `<a class="btn btn-ghost" href="#json-questions">${copy[lang].link}</a>`;
}

export function jsonQuestionsSection(lang) {
  const s = copy[lang];
  const published = release.status === 'published';
  if (published && (!release.qualifiedOn.length ||
      !Object.values(release.assets).every(asset => /^[a-f0-9]{64}$/.test(asset.sha256)))) {
    throw new Error('A published JSON Questions release must list tested versions and all four SHA-256 checksums');
  }
  const base = `${release.repository}/releases/download/v${release.version}`;
  const url = key => esc(`${base}/${release.assets[key].name}-${release.version}.zip`);
  return `<section id="json-questions" aria-labelledby="json-questions-h">
    <div class="container split">
      <div>
        <h2 id="json-questions-h">${s.title}</h2>
        <p>${s.lead}</p>
        <p class="muted">${s.storage}</p>
      </div>
      <div class="card host-card">
        <h3>LimeControl JSON Questions ${esc(release.version)}</h3>
        <p>${s.install}</p>
        <h4>${s.themes}</h4>
        <ul>
          ${keys.map(key => published ? `<li><a href="${url(key)}">${s[key]} (ZIP)</a></li>` : `<li>${s[key]}</li>`).join('\n          ')}
        </ul>
        ${published ? `<p>${s.tested} · ${release.qualifiedOn.map(esc).join(', ')}</p>
        <p><a href="${esc(base)}/SHA256SUMS">${s.sums}</a></p>` : `<p class="fineprint">${s.pending}</p>`}
        <div class="actions">
          ${published ? `<a class="btn btn-primary" href="${url('plugin')}">${s.download} (ZIP)</a>\n          ` : ''}<a class="btn btn-ghost" href="${esc(release.repository)}">${s.source}</a>
        </div>
      </div>
    </div>
  </section>`;
}
