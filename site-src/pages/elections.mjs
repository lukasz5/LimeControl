import { ROUTES, esc, layout, outputPath } from '../chrome.mjs';
import { electionRelease } from './election-research.mjs';

const product = 'LimeControl Elections';

const copy = {
  pl: {
    title: 'LimeControl Elections – planer kampanii dla komitetu wyborczego',
    description: 'Wybierz kraj i obszar kampanii, zaplanuj wydarzenia, zadania i budżet. Sprawdź oficjalne wyniki wyborów w archiwach 29 krajów.',
    lead: 'Prowadź kampanię komitetu w jednym kalendarzu. Przy każdym wydarzeniu widzisz, kto odpowiada za przygotowania, co trzeba zrobić na czas i ile wydano w stosunku do planu.',
    setup: 'Zakładając kampanię, wybierz kraj i obszar działania. Możesz od razu ułożyć trasę spotkań i przypisać wydarzenia do miejsc z krajowego wykazu. Dwie fale sondażu możesz dołączyć później.',
    downloadZip: 'Pobierz wtyczkę',
    archives: 'Jakie wyniki zobaczysz w swoim kraju?',
    archiveScope: 'Planer obejmuje 27 państw UE, Szwajcarię i USA. W archiwum kampanii wybierasz wybory i jednostkę terytorialną. Przy tabeli wyników znajdziesz link do oficjalnego źródła.',
    examples: 'Dla wyborów do Bundestagu w 2025 r. dostępne są oba głosy dla kraju, 16 landów i 299 okręgów. Francja obejmuje obie tury wyborów prezydenckich w 2022 r. i 107 jednostek z urzędowego zestawienia w każdej turze. Archiwum rumuńskiej drugiej tury z 2025 r. zawiera wynik krajowy i przykładowe wyniki z trzech okręgów (județe).',
    available: 'Przykład kampanii', country: 'Polska',
    module: 'Zobacz, jak komitet przygotowuje debatę i udostępnia zatwierdzoną trasę wybranym osobom. Po zalogowaniu ekipa otwiera nawigację na telefonie i oznacza odwiedzone przystanki.',
    planner: 'Zobacz przykład planera', route: 'Zobacz trasę dnia', files: 'Pobierz wtyczkę i przykłady',
    workflow: 'Od wydarzenia do rozliczenia',
    parts: [
      ['Ułóż kalendarz', 'Wpisz spotkanie lub debatę, określ daty i obszar. Na mapie dnia sprawdzisz odległości między przystankami i szacowany czas przejazdu przed kolejnym spotkaniem.'],
      ['Rozdziel zadania', 'Przypisz przygotowanie materiałów do wydarzenia, wskaż osobę lub zespół i podaj termin. Po wykonaniu zadania zmień jego status.'],
      ['Rozlicz wydatki', 'Zapisz planowany koszt przy wydarzeniu i przy każdym płatnym zadaniu. Po realizacji wpisz kwoty rzeczywiste. Podsumowanie uwzględnia każdą pozycję raz i wskazuje brakujące kwoty.'],
    ],
    reportHeading: 'Raport dla komitetu po dwóch falach',
    reportText: 'Po obu falach porównasz zmianę poparcia w całej kampanii z terminami i kosztami działań. W module Polska możesz też zestawić wyniki dla wybranych powiatów lub gmin, jeżeli oba sondaże zawierają zgodne pytanie o obszar.',
    report: 'Zobacz raport dla dwóch powiatów',
    exitText: 'W Polsce pracownia może przygotować exit poll z losowaniem obwodów w warstwach.',
  },
  en: {
    title: 'LimeControl Elections – campaign planner for election committees',
    description: 'Choose a country and campaign area, schedule events and tasks, set a budget and look up official election results in 29 country archives.',
    lead: 'Run your committee’s campaign from one calendar. For each event, see who is responsible, what is due and how actual spending compares with the budget.',
    setup: 'When you create a campaign, choose the country and the area you cover. You can plan a daily route and assign events to places in that country’s directory. You can link two polling waves later. The planner interface is in Polish.',
    downloadZip: 'Download the plugin',
    archives: 'Which election results can you look up?',
    archiveScope: 'The planner covers all 27 EU countries, Switzerland and the United States. Select an election and an area in the campaign archive. Each results table links to its official source.',
    examples: 'Germany’s 2025 Bundestag election includes first and second votes nationwide, for all 16 states and for all 299 constituencies. France’s 2022 presidential election covers both rounds and all 107 units in each official departmental file. The Romanian 2025 presidential runoff includes the national result and a sample of three counties (județe).',
    available: 'Campaign example', country: 'Poland',
    module: 'See how a committee prepares for a debate and shares the approved route with selected team members. They sign in on their phones, open directions and mark each stop as visited.',
    planner: 'See the planner example', route: 'See a day’s route', files: 'Download the plugin and examples',
    workflow: 'From planning an event to checking the bill',
    parts: [
      ['Plan the calendar', 'Enter a meeting or debate, set the dates and select the area. Open the day’s route map to check distances between stops and estimated driving times before the next meeting.'],
      ['Assign the work', 'Link a task such as preparing materials to the event, name the person or team responsible and set a deadline. Mark the task complete when it is done.'],
      ['Track spending', 'Enter the budget for the event and any tasks with a cost. Record actual amounts as they come in. The summary counts each item once and flags missing amounts.'],
    ],
    reportHeading: 'A committee report after two polling waves',
    reportText: 'After both surveys, compare the change in support across the campaign area with the dates and costs of your activities. The Poland module also supports comparisons between selected counties or municipalities when both surveys use matching geography questions.',
    report: 'See a report for two Polish counties',
    exitText: 'In Poland, the polling team can also run an exit poll with a stratified sample of polling districts.',
  },
  de: {
    title: 'LimeControl Elections – Wahlkampfplaner für Wahlkomitees',
    description: 'Wählen Sie Land und Wahlkampfgebiet, planen Sie Veranstaltungen, Aufgaben und Budget. Rufen Sie amtliche Wahlergebnisse in 29 Länderarchiven ab.',
    lead: 'Koordinieren Sie den Wahlkampf Ihres Komitees in einem Kalender. Für jede Veranstaltung sehen Sie, wer zuständig ist, welche Aufgaben anstehen und wie die Ausgaben im Vergleich zum Budget ausfallen.',
    setup: 'Wählen Sie beim Anlegen Ihres Wahlkampfs das Land und Ihr Einsatzgebiet. Sie können Tagesrouten planen und Veranstaltungen den Gebieten aus dem Landesverzeichnis zuordnen. Zwei Befragungswellen lassen sich später verknüpfen. Die Bedienoberfläche ist auf Polnisch.',
    downloadZip: 'Plugin herunterladen',
    archives: 'Welche Wahlergebnisse sind für Ihr Land verfügbar?',
    archiveScope: 'Der Planer umfasst alle 27 EU-Staaten, die Schweiz und die USA. Wählen Sie im Archiv Ihres Wahlkampfs eine Wahl und ein Gebiet. Bei jeder Ergebnistabelle finden Sie den Link zur amtlichen Quelle.',
    examples: 'Für die Bundestagswahl 2025 liegen Erst- und Zweitstimmen für das Bundesgebiet, alle 16 Länder und alle 299 Wahlkreise vor. Das französische Archiv enthält beide Runden der Präsidentschaftswahl 2022 mit jeweils allen 107 Gebietseinheiten der amtlichen Départementstatistik. Für die rumänische Stichwahl 2025 stehen das landesweite Ergebnis und Beispiele aus drei Kreisen (județe) zur Verfügung.',
    available: 'Wahlkampfbeispiel', country: 'Polen',
    module: 'Sehen Sie, wie ein Komitee eine Debatte vorbereitet und die bestätigte Route für ausgewählte Teammitglieder freigibt. Nach der Anmeldung können diese auf dem Smartphone die Navigation öffnen und besuchte Stationen abhaken.',
    planner: 'Beispiel im Wahlkampfplaner ansehen', route: 'Beispiel für eine Tagesroute', files: 'Plugin und Beispiele herunterladen',
    workflow: 'Von der Terminplanung bis zur Abrechnung',
    parts: [
      ['Termine planen', 'Tragen Sie eine Versammlung oder eine Debatte mit Datum und Gebiet ein. Auf der Karte der Tagesroute sehen Sie die Entfernung zwischen den Stationen und die geschätzte Fahrzeit bis zum nächsten Termin.'],
      ['Aufgaben verteilen', 'Ordnen Sie etwa die Vorbereitung der Materialien einer Veranstaltung zu. Tragen Sie die zuständige Person oder das Team und die Frist ein. Nach Abschluss markieren Sie die Aufgabe als erledigt.'],
      ['Ausgaben abrechnen', 'Erfassen Sie die geplanten Kosten für die Veranstaltung und für einzelne Aufgaben. Tragen Sie die tatsächlichen Beträge nach. Die Übersicht zählt jeden Posten einmal und weist auf fehlende Angaben hin.'],
    ],
    reportHeading: 'Bericht für das Komitee nach zwei Befragungswellen',
    reportText: 'Nach beiden Befragungen können Sie die Veränderung der Zustimmung im gesamten Wahlkampfgebiet mit den Terminen und Kosten Ihrer Aktivitäten vergleichen. Im Modul Polen sind auch Vergleiche zwischen ausgewählten Kreisen oder Gemeinden möglich, wenn beide Umfragen dieselben Gebietsangaben erfassen.',
    report: 'Beispielbericht für zwei polnische Kreise ansehen',
    exitText: 'In Polen kann das Institut zudem eine Nachwahlbefragung mit einer geschichteten Stichprobe von Stimmbezirken durchführen.',
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
          <p class="muted">${esc(t.setup)}</p>
          <p id="download"><a class="btn btn-primary" href="${esc(electionRelease.directory + electionRelease.zip)}" download>${esc(t.downloadZip)} ${esc(electionRelease.version)} (ZIP)</a></p>
        </div>
        <aside class="card elections-country" aria-labelledby="country-title">
          <div class="card-body">
            <p class="elections-module-label">${esc(t.available)}</p>
            <h2 class="card-title" id="country-title"><a href="${moduleUrl}">${esc(t.country)}</a></h2>
            <p>${esc(t.module)}</p>
            <div class="card-actions">
              <a class="btn btn-primary" href="${moduleUrl}#planner">${esc(t.planner)}</a>
              <a href="${moduleUrl}#route">${esc(t.route)}</a>
              <a href="${moduleUrl}#download">${esc(t.files)}</a>
            </div>
          </div>
        </aside>
      </div>
    </header>
    <div class="container">
      <section class="elections-workflow" aria-labelledby="workflow-title">
        <h2 id="workflow-title">${esc(t.workflow)}</h2>
        <div class="elections-phases">${t.parts.map(([heading, detail]) => `
          <div>
            <h3>${esc(heading)}</h3>
            <p>${esc(detail)}</p>
          </div>`).join('')}
        </div>
      </section>
      <section class="elections-report" aria-labelledby="archive-title">
        <h2 id="archive-title">${esc(t.archives)}</h2>
        <div><p>${esc(t.archiveScope)}</p>
          <p class="elections-research-note">${esc(t.examples)}</p>
        </div>
      </section>
      <section id="report" class="elections-report" aria-labelledby="report-title">
        <h2 id="report-title">${esc(t.reportHeading)}</h2>
        <div>
          <p>${esc(t.reportText)}</p>
          <a href="${moduleUrl}#report">${esc(t.report)}</a>
          <p class="elections-research-note">${esc(t.exitText)}</p>
        </div>
      </section>
    </div>
  </main>`;
  return {
    path: outputPath('election', lang),
    html: layout({ lang, page: 'election', title: t.title, description: t.description, body,
      extraHead: '<link rel="stylesheet" href="/assets/elections.css?v=2" />' }),
  };
}
