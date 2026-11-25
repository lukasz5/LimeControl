// Paczki CRM, CRM Desk i Feedback z repozytorium limecontrol-survey-suite.
// Odsyłacze wskazują pliki w konkretnym commicie, więc treść pod adresem się nie zmienia.
import { readFileSync } from 'node:fs';
import { esc } from '../chrome.mjs';

export const surveySuiteRelease = JSON.parse(readFileSync(new URL('../releases/survey-suite.json', import.meta.url), 'utf8'));

const LABELS = {
  crm: { pl: 'CRM', en: 'CRM', de: 'CRM' },
  crmDesk: { pl: 'Oferty, skrzynka i kalendarz', en: 'Quotes, inbox and calendar', de: 'Angebote, Postfach und Kalender' },
  feedback: { pl: 'Opinie klientów sklepu', en: 'Customer feedback', de: 'Kundenfeedback' },
  surveys: { pl: 'Siedem szablonów ankiet PL/EN (LSS)', en: 'Seven PL/EN survey templates (LSS)', de: 'Sieben Umfragevorlagen PL/EN (LSS)' },
  woocommerce: { pl: 'Konektor WooCommerce', en: 'WooCommerce connector', de: 'WooCommerce-Konnektor' },
  prestashop: { pl: 'Moduł PrestaShop', en: 'PrestaShop module', de: 'PrestaShop-Modul' },
  opencart: { pl: 'Rozszerzenie OpenCart 4', en: 'OpenCart 4 extension', de: 'OpenCart-4-Erweiterung' },
  shopify: { pl: 'Konektor Shopify (własny serwer PHP)', en: 'Shopify connector (your own PHP server)', de: 'Shopify-Konnektor (eigener PHP-Server)' },
  shoper: { pl: 'Konektor Shoper (własny serwer PHP)', en: 'Shoper connector (your own PHP server)', de: 'Shoper-Konnektor (eigener PHP-Server)' },
};

const copy = {
  pl: {
    version: 'Wersja', tested: 'Sprawdzone wersje LimeSurvey CE', download: 'Pobierz wtyczkę', source: 'Kod źródłowy',
    guide: 'Instrukcja', extras: 'Dodatkowe paczki', sums: 'Sumy kontrolne SHA-256', checksumFile: 'Pobierz plik SHA256SUMS',
    pending: 'Wydanie w przygotowaniu',
  },
  en: {
    version: 'Version', tested: 'Tested LimeSurvey CE versions', download: 'Download plugin', source: 'Source code',
    guide: 'Guide', extras: 'Additional packages', sums: 'SHA-256 checksums', checksumFile: 'Download SHA256SUMS',
    pending: 'Release in preparation',
  },
  de: {
    version: 'Version', tested: 'Getestete LimeSurvey-CE-Versionen', download: 'Plugin herunterladen', source: 'Quellcode',
    guide: 'Anleitung', extras: 'Weitere Pakete', sums: 'SHA-256-Prüfsummen', checksumFile: 'SHA256SUMS herunterladen',
    pending: 'Veröffentlichung in Vorbereitung',
  },
};

/**
 * Panel pobierania dla jednej karty.
 * @param {{ main: string, extras?: string[], install: Record<string,string>, guide: string, note?: Record<string,string> }} pkg
 */
export function suitePanel(pkg, lang) {
  const r = surveySuiteRelease;
  const s = copy[lang];
  const keys = [pkg.main, ...(pkg.extras || [])];
  if (r.status === 'published') {
    if (!r.qualifiedOn.length || !/^[a-f0-9]{40}$/.test(r.commit)) throw new Error('Survey suite release needs tested versions and a pinned commit');
    for (const k of keys) if (!/^[a-f0-9]{64}$/.test(r.assets[k]?.sha256 || '')) throw new Error(`Survey suite asset ${k} lacks a SHA-256 checksum`);
  }
  const base = `${r.repository}/raw/${r.commit}/${r.distPath}`;
  const url = (k) => esc(`${base}/${r.assets[k].file}`);
  const guide = esc(`${r.repository}/blob/${r.commit}/${pkg.guide}`);
  if (r.status !== 'published') {
    return `<div class="pcard-downloads">
              <h4>${s.version} ${esc(r.version)}</h4>
              <p>${s.pending}</p>
              <a class="btn btn-ghost" href="${esc(r.repository)}">${s.source}</a>
            </div>`;
  }
  const extras = pkg.extras?.length
    ? `<p><strong>${s.extras}</strong></p>
              <ul>${pkg.extras.map((k) => `<li><a href="${url(k)}">${esc(LABELS[k][lang])} (ZIP)</a></li>`).join('')}</ul>`
    : '';
  return `<div class="pcard-downloads">
              <h4>${s.version} ${esc(r.version)}</h4>
              <p>${s.tested} · ${r.qualifiedOn.map(esc).join(', ')}</p>
              <p>${pkg.install[lang]}</p>
              <div class="hero-cta"><a class="btn btn-primary" href="${url(pkg.main)}">${s.download} (ZIP)</a>
                <a class="btn btn-ghost" href="${guide}">${s.guide}</a>
                <a class="btn btn-ghost" href="${esc(r.repository)}">${s.source}</a></div>
              ${extras}${pkg.note ? `\n              <p>${pkg.note[lang]}</p>` : ''}
              <details><summary>${s.sums}</summary>
                <dl>${keys.map((k) => `<dt>${esc(r.assets[k].file)}</dt><dd><code>${esc(r.assets[k].sha256)}</code></dd>`).join('')}</dl>
                <a href="${esc(base)}/SHA256SUMS">${s.checksumFile}</a>
              </details>
            </div>`;
}
