import { ROUTES, esc, layout, outputPath } from '../chrome.mjs';

const product = 'LimeControl Elections';

const copy = {
  pl: {
    title: 'LimeControl Elections – planer kampanii dla komitetu wyborczego',
    description: 'Zaplanuj wydarzenia kampanii, przydziel zadania i terminy. Porównaj planowane i rzeczywiste wydatki komitetu. Zobacz planer w module Polska.',
    lead: 'Prowadź kampanię komitetu w jednym kalendarzu. Przy każdym wydarzeniu widzisz, kto odpowiada za przygotowania, co trzeba zrobić na czas i ile wydano w stosunku do planu.',
    setup: 'Załóż kampanię w swojej instalacji LimeSurvey i od razu ułóż kalendarz, budżet i trasę spotkań. Jeśli rozpoczniesz sondaż, podłącz dwie fale do tej samej kampanii.',
    available: 'Dostępny moduł krajowy', country: 'Polska',
    module: 'Zobacz, jak komitet rozpisuje debatę na zadania i rozlicza wynajem sali oraz przygotowanie materiałów.',
    planner: 'Zobacz przykład planera', route: 'Zobacz trasę dnia', files: 'Pobierz wtyczkę i przykłady',
    workflow: 'Od wydarzenia do rozliczenia',
    parts: [
      ['Ułóż kalendarz', 'Wpisz spotkanie lub debatę, określ daty i obszar. Na mapie dnia sprawdzisz odległości między przystankami i szacowany czas przejazdu przed kolejnym spotkaniem.'],
      ['Rozdziel zadania', 'Przypisz przygotowanie materiałów do wydarzenia, wskaż osobę lub zespół i podaj termin. Po wykonaniu zadania zmień jego status.'],
      ['Rozlicz wydatki', 'Zapisz planowany koszt przy wydarzeniu i przy każdym płatnym zadaniu. Po realizacji wpisz kwoty rzeczywiste. Podsumowanie uwzględnia każdą pozycję raz i wskazuje brakujące kwoty.'],
    ],
    reportHeading: 'Raport dla komitetu po dwóch falach',
    reportText: 'Gdy pracownia zbierze odpowiedzi, zestawisz zmianę poparcia w wybranych obszarach z terminami i kosztami działań komitetu.',
    report: 'Zobacz raport dla dwóch powiatów',
    exitText: 'W dniu wyborów pracownia może również przeprowadzić exit poll.',
  },
  en: {
    title: 'LimeControl Elections – campaign planner for election committees',
    description: 'Plan campaign events, assign tasks and deadlines, and compare actual spending with the budget. See the campaign planner in the Poland module.',
    lead: 'Run your committee’s campaign from one calendar. For each event, see who is responsible, what is due and how actual spending compares with the budget.',
    setup: 'Create a campaign on your LimeSurvey installation to start scheduling events, budgeting and planning a daily itinerary. You can link two survey waves to the same campaign later.',
    available: 'Available country module', country: 'Poland',
    module: 'See how a committee prepares for a debate, assigns tasks and tracks the costs of the venue and materials.',
    planner: 'See the planner example', route: 'See a day’s route', files: 'Download the plugin and examples',
    workflow: 'From planning an event to checking the bill',
    parts: [
      ['Plan the calendar', 'Enter a meeting or debate, set the dates and select the area. Open the day’s route map to check distances between stops and estimated driving times before the next meeting.'],
      ['Assign the work', 'Link a task such as preparing materials to the event, name the person or team responsible and set a deadline. Mark the task complete when it is done.'],
      ['Track spending', 'Enter the budget for the event and any tasks with a cost. Record actual amounts as they come in. The summary counts each item once and flags missing amounts.'],
    ],
    reportHeading: 'A committee report after two polling waves',
    reportText: 'Once the polling team has collected responses, compare changes in support across selected areas alongside the dates and costs of campaign activities.',
    report: 'See a report for two Polish counties',
    exitText: 'On election day, the polling team can also run an exit poll.',
  },
  de: {
    title: 'LimeControl Elections – Wahlkampfplaner für Wahlkomitees',
    description: 'Planen Sie Wahlkampfveranstaltungen, verteilen Sie Aufgaben und setzen Sie Fristen. Vergleichen Sie geplante und tatsächliche Ausgaben im Modul Polen.',
    lead: 'Koordinieren Sie den Wahlkampf Ihres Komitees in einem Kalender. Für jede Veranstaltung sehen Sie, wer zuständig ist, welche Aufgaben anstehen und wie die Ausgaben im Vergleich zum Budget ausfallen.',
    setup: 'Legen Sie in Ihrer LimeSurvey-Installation einen Wahlkampf an und planen Sie Termine, Budget und Tagesrouten. Zwei Befragungswellen können Sie später mit demselben Wahlkampf verknüpfen.',
    available: 'Verfügbares Ländermodul', country: 'Polen',
    module: 'Sehen Sie, wie ein Komitee eine Debatte vorbereitet, Aufgaben verteilt und die Kosten für Saalmiete und Materialien abrechnet.',
    planner: 'Beispiel im Wahlkampfplaner ansehen', route: 'Beispiel für eine Tagesroute', files: 'Plugin und Beispiele herunterladen',
    workflow: 'Von der Terminplanung bis zur Abrechnung',
    parts: [
      ['Termine planen', 'Tragen Sie eine Versammlung oder eine Debatte mit Datum und Gebiet ein. Auf der Karte der Tagesroute sehen Sie die Entfernung zwischen den Stationen und die geschätzte Fahrzeit bis zum nächsten Termin.'],
      ['Aufgaben verteilen', 'Ordnen Sie etwa die Vorbereitung der Materialien einer Veranstaltung zu. Tragen Sie die zuständige Person oder das Team und die Frist ein. Nach Abschluss markieren Sie die Aufgabe als erledigt.'],
      ['Ausgaben abrechnen', 'Erfassen Sie die geplanten Kosten für die Veranstaltung und für einzelne Aufgaben. Tragen Sie die tatsächlichen Beträge nach. Die Übersicht zählt jeden Posten einmal und weist auf fehlende Angaben hin.'],
    ],
    reportHeading: 'Bericht für das Komitee nach zwei Befragungswellen',
    reportText: 'Sobald das Institut die Antworten erhoben hat, können Sie Veränderungen der Zustimmung in ausgewählten Gebieten mit den Terminen und Kosten Ihrer Wahlkampfaktivitäten vergleichen.',
    report: 'Beispielbericht für zwei polnische Kreise ansehen',
    exitText: 'Am Wahltag kann das Institut auch eine Nachwahlbefragung durchführen.',
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
        </div>
        <aside class="card elections-country" id="download" aria-labelledby="country-title">
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
