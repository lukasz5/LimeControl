import { readFileSync } from 'node:fs';
import { esc } from '../chrome.mjs';

export const jsonQuestionsRelease = JSON.parse(readFileSync(new URL('../releases/json-questions.json', import.meta.url), 'utf8'));

const copy = {
  pl: {
    version: 'Wersja', install: 'Włącz wtyczkę w menedżerze wtyczek i zaimportuj wybrane motywy w sekcji motywów pytań.',
    choice: 'Wybór dla każdej pozycji', matrix: 'Tabela z wcześniejszych odpowiedzi', followup: 'Pytanie uzupełniające',
    plugin: 'Wtyczka', download: 'Pobierz wtyczkę', source: 'Kod źródłowy', pending: 'Wydanie w przygotowaniu',
    demo: 'Interaktywne demo wersji 0.2.0', fieldwork: 'Prace terenowe', equipment: 'Gotowość sprzętu do zajęć',
    tested: 'Sprawdzone wersje LimeSurvey CE', sums: 'Sumy kontrolne SHA-256', checksumFile: 'Pobierz plik SHA256SUMS'
  },
  en: {
    version: 'Version', install: 'Activate the plugin in Plugin Manager, then import the themes you need under Question themes.',
    choice: 'Choice for each item', matrix: 'Table from earlier answers', followup: 'Follow-up question',
    plugin: 'Plugin', download: 'Download plugin', source: 'Source code', pending: 'Release in preparation',
    demo: 'Interactive demo of version 0.2.0 (in Polish)', fieldwork: 'Fieldwork', equipment: 'Equipment readiness for class',
    tested: 'Tested LimeSurvey CE versions', sums: 'SHA-256 checksums', checksumFile: 'Download SHA256SUMS'
  },
  de: {
    version: 'Version', install: 'Aktivieren Sie das Plugin im Plugin-Manager. Importieren Sie anschließend die benötigten Designs unter Fragendesigns.',
    choice: 'Auswahl je Eintrag', matrix: 'Tabelle aus früheren Antworten', followup: 'Anschlussfrage',
    plugin: 'Plugin', download: 'Plugin herunterladen', source: 'Quellcode', pending: 'Veröffentlichung in Vorbereitung',
    demo: 'Interaktive Demo der Version 0.2.0 (auf Polnisch)', fieldwork: 'Arbeiten vor Ort', equipment: 'Einsatzbereitschaft der Geräte für den Unterricht',
    tested: 'Getestete LimeSurvey-CE-Versionen', sums: 'SHA-256-Prüfsummen', checksumFile: 'SHA256SUMS herunterladen'
  }
};

export function downloadPanel(release, lang) {
  const s = copy[lang];
  const published = release.status === 'published';
  const themes = ['choice','matrix','followup'];
  const assets = ['plugin', ...themes];
  if (published && (!release.qualifiedOn.length || !assets.every(key => /^[a-f0-9]{64}$/.test(release.assets[key]?.sha256)))) {
    throw new Error('A published JSON Questions release must list tested versions and all four SHA-256 checksums');
  }
  const base = `${release.repository}/releases/download/v${release.version}`;
  const zip = key => esc(`${base}/${release.assets[key].name}-${release.version}.zip`);
  return `<div class="pcard-downloads">
              <h4>${s.version} ${esc(release.version)}</h4>
              ${published ? `<p>${s.tested} · ${release.qualifiedOn.map(esc).join(', ')}</p>
              <p>${s.install}</p>
              <div class="hero-cta"><a class="btn btn-primary" href="${zip('plugin')}">${s.download} (ZIP)</a>
                <a class="btn btn-ghost" href="${esc(release.repository)}">${s.source}</a></div>
              <ul>${themes.map(key => `<li><a href="${zip(key)}">${s[key]} (ZIP)</a></li>`).join('')}</ul>
              <details><summary>${s.sums}</summary>
                <dl>${assets.map(key => `<dt>${s[key]}</dt><dd><code>${esc(release.assets[key].sha256)}</code></dd>`).join('')}</dl>
                <a href="${esc(base)}/SHA256SUMS">${s.checksumFile}</a>
              </details>` : `<p>${s.pending}</p>
              <a class="btn btn-ghost" href="${esc(release.repository)}">${s.source}</a>`}
              <h4>${s.demo}</h4>
              <ul>
                <li><a href="/demo/json-questions/?example=fieldwork" hreflang="pl">${s.fieldwork}</a></li>
                <li><a href="/demo/json-questions/?example=equipment" hreflang="pl">${s.equipment}</a></li>
              </ul>
            </div>`;
}
