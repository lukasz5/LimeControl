import { ROUTES, esc, layout, outputPath } from '../chrome.mjs';

const product = 'LimeControl Elections';

const copy = {
  pl: {
    title: 'LimeControl Elections – sondaże wyborcze i exit poll',
    description: 'Porównuj dwie fale sondażu i zestawiaj zmiany poparcia z wydarzeniami oraz kosztami kampanii. Zobacz dostępny moduł Polska.',
    lead: 'Narzędzie dla pracowni badawczych i komitetów wyborczych. Pracownia porównuje dwie fale sondażu, a komitet widzi, jak zmieniały się deklaracje wyborców w czasie kampanii.',
    compatibility: 'Wtyczka działa we własnej instalacji LimeSurvey.',
    available: 'Dostępny moduł krajowy', country: 'Polska',
    module: 'Karty i oficjalne wyniki wyborów samorządowych z archiwum PKW, od kraju po obszar objęty badaniem.',
    open: 'Otwórz moduł Polska', files: 'Pliki do pobrania',
    workflow: 'Od dwóch pomiarów do raportu',
    parts: [
      ['Dwie fale sondażu', 'Pracownia zadaje w obu falach te same pytania o wybór i obszar. W raporcie porównuje udziały odpowiedzi i liczebności prób.'],
      ['Kalendarz i koszty kampanii', 'Koordynator przypisuje zadania, osoby odpowiedzialne i terminy do wydarzeń. Wpisuje planowane i rzeczywiste wydatki.'],
      ['Raport dla komitetu', 'Komitet porównuje zmianę poparcia w wybranych obszarach i sprawdza, jakie działania przypadały na ten okres.'],
    ],
    report: 'Zobacz przykładowy raport dla dwóch powiatów',
    exit: 'Exit poll w dniu wyborów',
    exitText: 'Pracownia może osobno zaplanować badanie przed lokalami wyborczymi. Wybiera obwody w warstwach, ustala, co którą osobę zaprosić do wywiadu, i ocenia, jak odmowy mogły wpłynąć na wynik.',
  },
  en: {
    title: 'LimeControl Elections – election surveys and exit polls',
    description: 'Compare two survey waves and see changes in support alongside campaign events and costs. Explore the Poland module.',
    lead: 'A polling tool for research agencies and election committees. The agency compares two survey waves, and the committee sees how voting intentions changed during the campaign.',
    compatibility: 'The plugin runs on a self-hosted LimeSurvey installation.',
    available: 'Available country module', country: 'Poland',
    module: 'Historical ballots and official local election results from Poland’s National Electoral Commission, from the national level down to the area under study.',
    open: 'Open the Poland module', files: 'Download files',
    workflow: 'From two survey waves to a report',
    parts: [
      ['Two survey waves', 'The agency asks the same questions about voting intention and area in each wave. The report shows response shares and sample sizes side by side.'],
      ['Campaign calendar and costs', 'The coordinator links tasks, owners and deadlines to campaign events and records budgeted and actual spending.'],
      ['Committee report', 'The committee compares changes in support across selected areas and sees which activities took place during the same period.'],
    ],
    report: 'See a sample report for two Polish counties',
    exit: 'Exit polling on election day',
    exitText: 'The agency can run a separate survey outside polling stations. It samples precincts within strata, sets an interval for inviting voters and examines how refusals might affect the estimate.',
  },
  de: {
    title: 'LimeControl Elections – Wahlumfragen und Nachwahlbefragungen',
    description: 'Vergleichen Sie zwei Befragungswellen und betrachten Sie Veränderungen der Zustimmung im Zusammenhang mit Wahlkampfterminen und Ausgaben. Entdecken Sie das Modul für Polen.',
    lead: 'Ein Werkzeug für Forschungsinstitute und Wahlkomitees. Das Institut vergleicht zwei Befragungswellen. Das Wahlkomitee sieht, wie sich die Wahlabsichten im Lauf des Wahlkampfs verändert haben.',
    compatibility: 'Das Plugin läuft auf einer eigenen LimeSurvey-Installation.',
    available: 'Verfügbares Ländermodul', country: 'Polen',
    module: 'Historische Stimmzettel und amtliche Kommunalwahlergebnisse der polnischen Wahlkommission PKW, von der Landesebene bis zum Untersuchungsgebiet.',
    open: 'Modul für Polen öffnen', files: 'Dateien herunterladen',
    workflow: 'Von zwei Befragungswellen zum Bericht',
    parts: [
      ['Zwei Befragungswellen', 'Das Institut stellt in beiden Wellen dieselben Fragen zu Wahlabsicht und Gebiet. Der Bericht zeigt die Anteile der Antworten und die jeweilige Stichprobengröße.'],
      ['Wahlkampfkalender und Kosten', 'Die Koordination ordnet den Veranstaltungen Aufgaben, Zuständige und Fristen zu und erfasst geplante und tatsächliche Ausgaben.'],
      ['Bericht für das Wahlkomitee', 'Das Wahlkomitee vergleicht, wie sich die Zustimmung in ausgewählten Gebieten verändert hat und welche Aktivitäten in diesen Zeitraum fielen.'],
    ],
    report: 'Beispielbericht für zwei polnische Kreise ansehen',
    exit: 'Nachwahlbefragung am Wahltag',
    exitText: 'Das Institut kann eine eigene Befragung vor den Wahllokalen durchführen. Es zieht Stimmbezirke nach Schichten, legt das Auswahlintervall fest und prüft, wie sich Teilnahmeverweigerungen auf die Schätzung auswirken könnten.',
  },
};

export function renderElections(lang) {
  const t = copy[lang];
  const moduleUrl = ROUTES.electionPoland[lang];
  const body = `<main id="main" class="elections-home">
    <header class="elections-intro">
      <div class="container elections-intro-grid">
        <div>
          <h1>${product}</h1>
          <p class="elections-lead">${esc(t.lead)}</p>
          <p class="muted">${esc(t.compatibility)}</p>
        </div>
        <aside class="card elections-country" id="download" aria-labelledby="country-title">
          <div class="card-body">
            <p class="elections-module-label">${esc(t.available)}</p>
            <h2 class="card-title" id="country-title">${esc(t.country)}</h2>
            <p>${esc(t.module)}</p>
            <div class="card-actions">
              <a class="btn btn-primary" href="${moduleUrl}">${esc(t.open)}</a>
              <a href="${moduleUrl}#download">${esc(t.files)}</a>
            </div>
          </div>
        </aside>
      </div>
    </header>
    <div class="container">
      <section class="elections-workflow" aria-labelledby="workflow-title">
        <h2 id="workflow-title">${esc(t.workflow)}</h2>
        <div class="elections-phases">${t.parts.map(([heading, detail], i) => `
          <div${i === 2 ? ' id="report"' : ''}>
            <h3>${esc(heading)}</h3>
            <p>${esc(detail)}</p>${i === 2 ? `\n            <a href="${moduleUrl}#report">${esc(t.report)}</a>` : ''}
          </div>`).join('')}
        </div>
      </section>
      <section class="elections-exit" aria-labelledby="exit-title">
        <h2 id="exit-title">${esc(t.exit)}</h2>
        <p>${esc(t.exitText)}</p>
      </section>
    </div>
  </main>`;
  return {
    path: outputPath('election', lang),
    html: layout({ lang, page: 'election', title: t.title, description: t.description, body,
      extraHead: '<link rel="stylesheet" href="/assets/elections.css?v=1" />' }),
  };
}
