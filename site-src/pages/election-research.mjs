import { CONTACT_EMAIL, ROUTES, esc, layout, outputPath } from '../chrome.mjs';

const repository = 'https://github.com/lukasz5/limecontrol-election-polls';
const version = '0.10.0';

export const electionRelease = {
  version,
  repository,
  zip: `LimeControlElectionPolls-${version}.zip`,
  sha256: 'c87ae0f3cc9720476cbb8b32906dc6d05d1e05cdfa67253982be57dda72ca67c',
  directory: `${repository}/releases/download/v${version}/`,
};

const copy = {
  pl: {
    title: 'LimeControl Elections – planer kampanii | Moduł Polska',
    description: 'Zaplanuj wydarzenia komitetu, przydziel zadania i porównaj wydatki z budżetem. Zobacz rozliczenie debaty w planerze kampanii i zakres pilotażu dla komitetu.',
    heading: 'Moduł Polska',
    lead: 'Kto przygotuje materiały na debatę, na kiedy i za ile? W planerze komitet rozpisuje wydarzenia na zadania, wskazuje odpowiedzialnych i sprawdza, ile kosztowała realizacja.',
    plannerAction: 'Zobacz rozliczenie debaty', pilotAction: 'Pilotaż dla komitetu', download: 'Pliki do pobrania', ask: 'Zapytaj o płatny pilotaż', subject: 'Pilotaż planera kampanii dla komitetu – LimeControl Elections, Polska',
    language: 'Wtyczka i przykładowe ankiety w języku polskim.',
    sample: 'Przykład z fikcyjnej kampanii', agenda: 'Debata w powiecie gdańskim',
    dates: ['11 marca', '12 marca'], agendaItems: ['Przygotowanie materiałów', 'Debata o komunikacji'], owners: ['Zespół prasowy', 'Koordynatorka spotkania'],
    routeHeading: 'Czy z drukarni zdążymy na debatę?',
    routeExample: 'Zespół wyjeżdża z biura o 9.00. Odbiór materiałów w drukarni zajmie 15 minut, a debata w bibliotece zaczyna się o 10.30. Wpisz te przystanki i godziny. Na mapie zobaczysz całą trasę, a przy każdym odcinku odległość i czas jazdy. Sprawdź proponowaną kolejność oraz godzinę przyjazdu, zanim zapiszesz zmianę. Zatwierdź trasę, wybierz konta osób jadących na debatę i przekaż im link. Po zalogowaniu na telefonie mogą otworzyć dojazd do drukarni. Gdy oznaczą ją jako odwiedzoną, cały zespół zobaczy postęp.',
    routeEstimate: 'Podstawowy szacunek działa lokalnie. Planer mnoży odległość w linii prostej przez 1,30 i przyjmuje średnią prędkość 45 km/h. Po skonfigurowaniu usługi OSRM możesz obliczyć przejazd po sieci drogowej. Oba warianty pokazują czas oczekiwania, postoje i ewentualne spóźnienie.',
    planner: 'Koszt debaty od rezerwacji sali do rozliczenia',
    plannerIntro: 'Wydarzenie i powiązane zadanie mają własne kwoty. Po debacie koordynatorka oznacza wydarzenie jako zrealizowane, a zespół uzupełnia koszt materiałów. W podsumowaniu każdy wydatek liczy się raz.',
    budget: 'Budżet debaty · dane fikcyjne', item: 'Pozycja', budgetItems: ['Wynajem sali', 'Przygotowanie materiałów'], total: 'Razem',
    overBudget: 'ponad plan', costNote: 'Planer pokazuje różnicę, gdy przy wszystkich pozycjach uzupełniono plan i wykonanie.',
    wave1: 'Fala 1', wave2: 'Fala 2', areas: ['Powiat gdański', 'Powiat kartuski'],
    report: 'Ile wydał komitet i jak zmieniły się deklaracje?',
    context: 'Po obu falach komitet może zestawić działania ze zmianą deklaracji w maksymalnie czterech rozłącznych obszarach. W tym przykładzie w każdym powiecie ukończono po 40 wywiadów w każdej fali. Każdorazowo 25 osób wskazało listę. To wśród nich liczymy udział listy A.',
    table: 'Przykładowy raport dla dwóch powiatów · dane fikcyjne',
    area: 'Obszar', delta: 'Zmiana', plan: 'Plan', actual: 'Wykonanie', none: 'Brak kwoty', pp: 'p.p.',
    shared: 'Wspólne działanie wojewódzkie', sharedDetail: 'Plan 700,13 zł, wykonanie 740,15 zł. Ten wydatek pojawia się raz dla obu powiatów.',
    interpret: 'Dla obu powiatów łącznie udział wzrósł z 40% do 60%. Dopiero podział na obszary ujawnia przeciwne kierunki zmian. Daty wydarzeń wskazują, co działo się w czasie pomiaru. Ocena wpływu konkretnego działania wymaga osobnego badania.',
    archive: 'Jakie dane PKW zawiera moduł Polska?',
    years1: 'Sejmiki województw', scope1: 'Głosy na listy od kraju do obwodu oraz karty poszczególnych okręgów.',
    years2: 'Rady i wybory włodarzy', scope2: 'Rady gmin, miast, powiatów i dzielnic Warszawy. W wyborach wójtów, burmistrzów i prezydentów miast dostępna jest każda przeprowadzona tura.',
    caveat: 'Archiwum działa lokalnie po instalacji. W 2014 r. szczegółowość kończy się na gminie lub okręgu. Porównując lata, sprawdź granice i skład list.',
    exit: 'Exit poll w dniu głosowania', exitLead: 'Pracownia może przygotować odrębne badanie dla konkretnej karty i tury.',
    exitSteps: ['Wylosuj obwody w warstwach i ustal, co którą osobę zapraszać po wyjściu z lokalu. Krok można dostosować do wielkości obwodu.', 'Rozlicz anonimowe karty i odmowy na każdej zmianie. Odczytaj przedział uwzględniający losowanie obwodów i sprawdź, jak odmienne preferencje osób odmawiających zmieniłyby szacunek.', 'Po uzyskaniu zweryfikowanego protokołu zastąp nim szacunek dla tego obwodu w late poll. Pierwotny szacunek pozostaje do porównania.'],
    source: 'Kod źródłowy i instrukcja wtyczki na GitHubie',
    files: 'Uruchom planer w LimeSurvey', install: 'Zainstaluj ZIP w panelu wtyczek i aktywuj wtyczkę. Otwórz Planery kampanii i utwórz kampanię. Wpisz pierwsze wydarzenie, zaplanuj zadania i przystanki na trasie. Aby później przećwiczyć sondaż, zaimportuj i aktywuj obie przykładowe ankiety, a następnie podłącz fale w tej kampanii.',
    zip: 'Wtyczka z archiwum PKW', lss1: 'Przykładowa ankieta · fala 1', lss2: 'Przykładowa ankieta · fala 2', sums: 'Sumy kontrolne', tested: 'Testy lokalne na danych ćwiczeniowych', licence: 'Licencja kodu',
    pilot: 'Pilotaż planera dla komitetu', paid: 'Zakładamy kampanię i nadajemy zespołowi dostęp do planera. Koordynator ćwiczy na jednym dniu kampanii. Wpisuje spotkanie i zadania, układa kolejność przystanków i rozlicza wydatki. Fale sondażu można dołączyć później.',
    enquiry: 'Do wyceny podaj wersję LimeSurvey, termin wdrożenia i wydarzenie, które chcesz przećwiczyć. Jeśli prowadzicie sondaże, zapraszamy pracownię do przygotowania raportu po obu falach.',
  },
  en: {
    title: 'LimeControl Elections – campaign planner | Poland module',
    description: 'Plan committee events, assign tasks and compare actual spending with the budget. See a worked debate budget and a pilot for campaign teams.',
    heading: 'Poland module',
    lead: 'Who will prepare the debate materials, by when and for how much? The campaign planner lets your committee schedule events, assign tasks and see what the work actually cost.',
    plannerAction: 'See the debate budget', pilotAction: 'Pilot for committees', download: 'Download files', ask: 'Ask about a paid pilot', subject: 'Campaign planner pilot for an election committee – LimeControl Elections, Poland',
    language: 'The plugin interface and example surveys are in Polish.',
    sample: 'Fictional campaign example', agenda: 'A debate in Gdański County',
    dates: ['11 March', '12 March'], agendaItems: ['Prepare debate materials', 'Debate on local transport'], owners: ['Press team', 'Event coordinator'],
    routeHeading: 'Can the team collect the leaflets before the debate?',
    routeExample: 'The team leaves the office at 9:00. Collecting the leaflets from the printer takes 15 minutes, and the library debate starts at 10:30. Enter the stops and times. The map shows the full route, with a distance and estimated driving time for each leg. Review the suggested order and arrival time before saving the change. Approve the route, select the accounts of the people going to the debate and send them the link. Once signed in on their phones, they can open directions to the print shop. Marking it as visited updates the team’s shared progress.',
    routeEstimate: 'The offline estimate uses 1.30 times the straight-line distance and an average speed of 45 km/h. With an OSRM server configured, you can calculate the journey along roads. Both options show waiting time, time at stops and any late arrivals.',
    planner: 'What did the debate cost?',
    plannerIntro: 'The event and its linked task each have a budget. After the debate, the coordinator marks the event as held and the team records the cost of materials. Each expense appears once in the total.',
    budget: 'Debate budget · fictional data', item: 'Item', budgetItems: ['Venue hire', 'Debate materials'], total: 'Total',
    overBudget: 'over budget', costNote: 'The planner shows the difference once every item has both a budget and an actual cost.',
    wave1: 'Wave 1', wave2: 'Wave 2', areas: ['Gdański County', 'Kartuski County'],
    report: 'What did the committee spend, and how did support change?',
    context: 'After both waves, the committee can compare campaign activities and changes in voting intention across up to four non-overlapping areas. In this example each county recorded 40 completed interviews per wave. In each group, 25 respondents chose a list. They form the denominator for the share of List A.',
    table: 'Example committee report for two counties · fictional data',
    area: 'Area', delta: 'Change', plan: 'Budget', actual: 'Actual cost', none: 'Not recorded', pp: 'pp',
    shared: 'One shared regional event', sharedDetail: 'PLN 700.13 budgeted, PLN 740.15 spent. The report counts this expense once across the two counties.',
    interpret: 'Across both counties, support rose from 40% to 60%. The county figures reveal that the changes ran in opposite directions. Event dates show what happened during fieldwork. Assessing the effect of a particular activity requires a separate study.',
    archive: 'Which official Polish results are included?',
    years1: 'Regional assemblies', scope1: 'Party-list vote totals from national level down to polling district, with ballots for individual constituencies.',
    years2: 'Local councils and mayors', scope2: 'Municipal, city and county councils and Warsaw district councils. Mayoral results cover every round held in each municipality.',
    caveat: 'The archive works offline after installation. For 2014 the finest available level is the municipality or constituency. Check boundaries and list composition before comparing election years.',
    exit: 'Election day exit polling', exitLead: 'A research agency can set up a separate study for a particular ballot and round.',
    exitSteps: ['Draw polling districts within strata and set the interval for inviting voters as they leave. The interval can vary with district size.', 'Record anonymous ballots and refusals by shift. Read an interval that accounts for district sampling and check how different preferences among people who declined would change the estimate.', 'Once a verified official tally is available, use it in place of the district estimate in the late poll. The original exit poll remains available for comparison.'],
    source: 'Plugin source code and setup guide on GitHub',
    files: 'Set up the planner in LimeSurvey', install: 'Install and activate the ZIP in the plugin manager. Open Planery kampanii (Campaign planners) and create a campaign. Schedule an event, assign tasks and plan your stops. To practise linking waves later, import and activate the two example surveys and attach them to the same campaign.',
    zip: 'Plugin and official results archive', lss1: 'Example survey · wave 1', lss2: 'Example survey · wave 2', sums: 'Checksums', tested: 'Tested locally with example data', licence: 'Code licence',
    pilot: 'Campaign planner pilot for your committee', paid: 'We set up a campaign and give the committee access to its planner. The coordinator practises with one campaign day, scheduling a meeting, assigning tasks, ordering stops and checking spending against the budget. Survey waves can be linked later.',
    enquiry: 'For a quote, tell us your LimeSurvey version, preferred start date and the event you want to work through. If you run polls, your research agency can join you to prepare the report after both waves.',
  },
  de: {
    title: 'LimeControl Elections – Wahlkampfplaner | Modul Polen',
    description: 'Veranstaltungen planen, Aufgaben verteilen und Ausgaben mit dem Budget vergleichen. Sehen Sie die Abrechnung einer Debatte und das Pilotangebot für Wahlkomitees.',
    heading: 'Modul Polen',
    lead: 'Wer bereitet die Unterlagen für die Debatte vor, bis wann und zu welchen Kosten? Mit dem Wahlkampfplaner legt Ihr Komitee Termine fest, verteilt Aufgaben und behält die tatsächlichen Ausgaben im Blick.',
    plannerAction: 'Abrechnung der Debatte ansehen', pilotAction: 'Pilotprojekt für Wahlkomitees', download: 'Dateien herunterladen', ask: 'Kostenpflichtiges Pilotprojekt anfragen', subject: 'Pilotprojekt für ein Wahlkomitee mit dem Wahlkampfplaner – LimeControl Elections, Polen',
    language: 'Die Plugin-Oberfläche und die Beispielumfragen sind auf Polnisch.',
    sample: 'Beispiel aus einem fiktiven Wahlkampf', agenda: 'Debatte im Kreis Gdański',
    dates: ['11. März', '12. März'], agendaItems: ['Unterlagen vorbereiten', 'Debatte zum Nahverkehr'], owners: ['Presseteam', 'Veranstaltungsleitung'],
    routeHeading: 'Reicht die Zeit von der Druckerei bis zur Debatte?',
    routeExample: 'Das Team fährt um 9 Uhr im Büro los. Für die Abholung der Materialien in der Druckerei sind 15 Minuten vorgesehen. Die Debatte in der Bibliothek beginnt um 10.30 Uhr. Tragen Sie die Stationen und Zeiten ein. Die Karte zeigt die gesamte Route, die Übersicht für jede Etappe die Entfernung und die geschätzte Fahrzeit. Prüfen Sie die vorgeschlagene Reihenfolge und die Ankunftszeit, bevor Sie die Änderung speichern. Bestätigen Sie die Route, wählen Sie die Konten der Teammitglieder aus, die zur Debatte fahren, und geben Sie ihnen den Link. Nach der Anmeldung können sie auf dem Smartphone die Navigation zur Druckerei öffnen. Sobald sie die Druckerei als besucht markieren, sieht das ganze Team den Fortschritt.',
    routeEstimate: 'Der Planer schätzt die Strecke offline mit dem 1,30-Fachen der Luftlinie und rechnet mit durchschnittlich 45 km/h. Mit einem eingerichteten OSRM-Server können Sie die Fahrt auf dem Straßennetz berechnen. Beide Varianten zeigen Wartezeiten, Aufenthaltszeiten und mögliche Verspätungen.',
    planner: 'Was hat die Debatte gekostet?',
    plannerIntro: 'Die Veranstaltung und die zugehörige Aufgabe haben jeweils ein eigenes Budget. Nach der Debatte vermerkt die Koordinatorin, dass sie stattgefunden hat. Das Team trägt die Kosten für die Unterlagen ein. Jede Ausgabe geht einmal in die Gesamtsumme ein.',
    budget: 'Budget der Debatte · fiktive Daten', item: 'Posten', budgetItems: ['Saalmiete', 'Unterlagen für die Debatte'], total: 'Gesamt',
    overBudget: 'über dem Budget', costNote: 'Der Planer zeigt die Abweichung an, sobald für alle Posten sowohl Plan- als auch Istkosten vorliegen.',
    wave1: 'Welle 1', wave2: 'Welle 2', areas: ['Kreis Gdański', 'Kreis Kartuski'],
    report: 'Wie viel hat das Wahlkomitee ausgegeben und wie hat sich die Wahlabsicht verändert?',
    context: 'Nach beiden Wellen kann das Komitee Wahlkampfaktivitäten und Veränderungen der Wahlabsicht in bis zu vier überschneidungsfreien Gebieten vergleichen. Im Beispiel wurden je Kreis und Welle 40 Interviews abgeschlossen. In jeder dieser Gruppen entschieden sich 25 Personen für eine Liste. Auf diese 25 bezieht sich der Anteil für Liste A.',
    table: 'Beispielbericht für zwei Kreise · fiktive Daten',
    area: 'Gebiet', delta: 'Änderung', plan: 'Geplant', actual: 'Tatsächlich', none: 'Keine Angabe', pp: 'Pkt.',
    shared: 'Eine gemeinsame regionale Veranstaltung', sharedDetail: 'Geplant waren 700,13 PLN, ausgegeben wurden 740,15 PLN. Der Bericht zählt diese Ausgabe für beide Kreise zusammen einmal.',
    interpret: 'In beiden Kreisen zusammen stieg der Anteil von 40 % auf 60 %. Erst der Blick auf die einzelnen Kreise zeigt die gegenläufige Entwicklung. Die Termine zeigen, welche Veranstaltungen während der Erhebung stattfanden. Für Aussagen zur Wirkung einer einzelnen Maßnahme ist eine eigene Untersuchung erforderlich.',
    archive: 'Welche amtlichen Wahldaten aus Polen sind enthalten?',
    years1: 'Regionalparlamente', scope1: 'Listenstimmen vom landesweiten Ergebnis bis zum Stimmbezirk sowie die Stimmzettel der einzelnen Wahlkreise.',
    years2: 'Kommunale Räte und Bürgermeister', scope2: 'Gemeinde-, Stadt- und Kreisräte sowie Warschauer Bezirksräte. Für die direkt gewählten Gemeinde- und Stadtoberhäupter sind alle durchgeführten Wahlgänge enthalten.',
    caveat: 'Das Archiv ist nach der Installation offline nutzbar. Für 2014 reichen die Angaben bis zur Gemeinde oder zum Wahlkreis. Prüfen Sie vor Jahresvergleichen die Gebietsgrenzen und die Zusammensetzung der Listen.',
    exit: 'Nachwahlbefragung am Wahltag', exitLead: 'Das Institut kann für einen bestimmten Stimmzettel und Wahlgang eine eigene Studie anlegen.',
    exitSteps: ['Ziehen Sie Stimmbezirke innerhalb der Schichten und legen Sie fest, jede wievielte Person beim Verlassen des Wahllokals eingeladen wird. Der Abstand lässt sich an die Größe des Bezirks anpassen.', 'Erfassen Sie anonyme Stimmzettel und Teilnahmeverweigerungen je Schicht. Das Intervall berücksichtigt die Bezirksauswahl. Eine Sensitivitätsanalyse zeigt, wie andere Präferenzen der Personen, die die Teilnahme abgelehnt haben, die Schätzung verändern würden.', 'Liegt eine geprüfte amtliche Niederschrift vor, ersetzt sie im Late Poll die Schätzung für diesen Bezirk. Der ursprüngliche Exit Poll bleibt zum Vergleich verfügbar.'],
    source: 'Quellcode und Installationsanleitung des Plugins auf GitHub',
    files: 'Planer in LimeSurvey einrichten', install: 'Installieren und aktivieren Sie die ZIP-Datei in der Plugin-Verwaltung. Öffnen Sie Planery kampanii (Wahlkampfplaner) und legen Sie einen Wahlkampf an. Planen Sie Termine, Aufgaben und Haltestellen. Die beiden Beispielumfragen können Sie später importieren, aktivieren und als Wellen mit dem Wahlkampf verknüpfen.',
    zip: 'Plugin mit amtlichem Wahlarchiv', lss1: 'Beispielumfrage · Welle 1', lss2: 'Beispielumfrage · Welle 2', sums: 'Prüfsummen', tested: 'Lokal mit Beispieldaten getestet', licence: 'Lizenz des Codes',
    pilot: 'Pilotprojekt für Ihr Wahlkomitee', paid: 'Wir legen einen Wahlkampf an und richten den Zugang für das Team ein. Anhand eines Wahlkampftages plant die Koordination einen Termin, verteilt Aufgaben, ordnet die Stationen der Tagesroute und gleicht die Ausgaben mit dem Budget ab. Befragungswellen können später hinzukommen.',
    enquiry: 'Für ein Angebot nennen Sie uns Ihre LimeSurvey-Version, den gewünschten Starttermin und eine Veranstaltung für den Probelauf. Bei einer Befragung kann Ihr Institut nach beiden Wellen den Bericht mit Ihnen erstellen.',
  },
};

const comparison = [
  { counts: [5, 20], planned: 1450.35, actual: 1650.15 },
  { counts: [15, 10], planned: 90.16, actual: null },
];

function percent(lang, value) {
  return new Intl.NumberFormat(lang, { style: 'percent' }).format(value / 25);
}

function agenda(t) {
  return `<figure class="er-figure">
    <figcaption><span>${esc(t.sample)}</span><strong>${esc(t.agenda)}</strong></figcaption>
    <ol class="er-agenda">${t.agendaItems.map((item, index) => `<li>
      <time datetime="${['2024-03-11', '2024-03-12'][index]}">${esc(t.dates[index])}</time>
      <div><strong>${esc(item)}</strong><small>${esc(t.owners[index])}</small></div>
    </li>`).join('')}</ol>
  </figure>`;
}

function debateBudget(t, lang) {
  const money = new Intl.NumberFormat(lang, { style: 'currency', currency: 'PLN' });
  const rows = [
    { name: t.budgetItems[0], planned: 120010, actual: 130005 },
    { name: t.budgetItems[1], planned: 25025, actual: 35010 },
  ];
  const planned = rows[0].planned + rows[1].planned;
  const actual = rows[0].actual + rows[1].actual;
  return `<div class="er-table-wrap" role="region" aria-labelledby="budget-caption" tabindex="0">
    <table class="table er-table er-budget">
      <caption id="budget-caption">${esc(t.budget)}</caption>
      <thead><tr>${[t.item, t.plan, t.actual].map(label => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr><th scope="row">${esc(row.name)}</th><td>${money.format(row.planned / 100)}</td><td>${money.format(row.actual / 100)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><th scope="row">${esc(t.total)}</th><td>${money.format(planned / 100)}</td><td>${money.format(actual / 100)}</td></tr></tfoot>
    </table>
  </div>
  <p class="er-variance"><strong>${money.format((actual - planned) / 100)} ${esc(t.overBudget)}</strong> ${esc(t.costNote)}</p>`;
}

function table(t, lang) {
  const money = new Intl.NumberFormat(lang, { style: 'currency', currency: 'PLN' });
  return `<div class="er-table-wrap" role="region" aria-labelledby="er-caption" tabindex="0">
    <table class="table er-table">
      <caption id="er-caption">${esc(t.table)}</caption>
      <thead><tr>${[t.area, t.wave1, t.wave2, t.delta, t.plan, t.actual].map(x => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead>
      <tbody>${comparison.map(({ counts, planned, actual }, i) => {
        const change = (counts[1] - counts[0]) * 4;
        return `<tr><th scope="row">${esc(t.areas[i])}</th>${counts.map(count => `<td>${percent(lang, count)} <small>(${count}/25)</small></td>`).join('')}
          <td><b>${change > 0 ? '+' : '−'}${Math.abs(change)} ${esc(t.pp)}</b></td>
          <td>${money.format(planned)}</td><td>${actual == null ? esc(t.none) : money.format(actual)}</td></tr>`;
      }).join('')}</tbody>
    </table>
  </div>`;
}

export function renderElectionPoland(lang) {
  const release = electionRelease;
  const t = copy[lang];
  const email = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t.subject)}`;
  const files = [[release.zip, t.zip, 'ZIP'], ['fala-1.lss', t.lss1, 'LSS'], ['fala-2.lss', t.lss2, 'LSS'], ['SHA256SUMS', t.sums, 'SHA-256']];
  const body = `<main id="main" class="er-page">
    <header class="er-hero"><div class="container er-hero-grid">
      <div><a class="eyebrow link" href="${ROUTES.election[lang]}">LimeControl Elections</a><h1>${esc(t.heading)}</h1><p class="er-lead">${esc(t.lead)}</p>
        <div class="er-actions"><a class="btn btn-primary" href="#planner">${esc(t.plannerAction)}</a>
          <a class="btn btn-ghost" href="#pilot">${esc(t.pilotAction)}</a></div>
        <p class="er-meta"><a href="#download">${esc(t.download)}</a> · ${esc(t.language)}</p>
      </div>${agenda(t)}
    </div></header>
    <div class="container er-content">
      <section class="er-block er-split" id="planner"><div><h2>${esc(t.planner)}</h2><p>${esc(t.plannerIntro)}</p>
        ${debateBudget(t, lang)}
      </div><div class="er-pilot" id="pilot"><h2>${esc(t.pilot)}</h2><p>${esc(t.paid)}</p><p>${esc(t.enquiry)}</p>
        <a class="btn btn-primary" href="${esc(email)}">${esc(t.ask)}</a>
      </div>
      </section>
      <section class="er-block" id="route"><h2>${esc(t.routeHeading)}</h2>
        <p class="er-intro">${esc(t.routeExample)}</p><p class="er-meta">${esc(t.routeEstimate)}</p>
      </section>
      <section class="er-block" id="report"><h2>${esc(t.report)}</h2><p class="er-intro">${esc(t.context)}</p>
        ${table(t, lang)}
        <p class="er-shared"><strong>${esc(t.shared)}</strong> · ${esc(t.sharedDetail)}</p>
        <p class="er-intro">${esc(t.interpret)}</p>
      </section>
      <section class="er-block er-split"><div><h2>${esc(t.archive)}</h2>
        <dl class="er-archive"><dt><small>2018 · 2024</small>${esc(t.years1)}</dt><dd>${esc(t.scope1)}</dd>
          <dt><small>2014 · 2018 · 2024</small>${esc(t.years2)}</dt><dd>${esc(t.scope2)}</dd></dl>
        <p class="er-meta">${esc(t.caveat)}</p>
      </div><div class="er-exit"><h2>${esc(t.exit)}</h2><p>${esc(t.exitLead)}</p>
        <ul>${t.exitSteps.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </div></section>
      <section class="er-block er-split" id="download"><div><h2>${esc(t.files)}</h2><p>${esc(t.install)}</p></div><div>
        <ul class="er-files">${files.map(([file, label, type]) => `<li><a href="${esc(release.directory + file)}" download>${esc(label)}<span>${type} ↓</span></a></li>`).join('')}</ul>
        <p><a href="${esc(release.repository)}">${esc(t.source)}</a></p>
        <p class="er-meta">ZIP · SHA-256<br><samp>${release.sha256.match(/.{8}/g).map(esc).join('<wbr>')}</samp></p>
        <p class="er-meta">v${esc(release.version)} · ${esc(t.licence)} GPL-2.0-or-later<br>${esc(t.tested)} · LimeSurvey CE 6.17.19 / 7.11.0</p>
      </div></section>
    </div>
  </main>`;
  return {
    path: outputPath('electionPoland', lang),
    html: layout({ lang, page: 'electionPoland', title: t.title, description: t.description, body,
      extraHead: '<link rel="stylesheet" href="/assets/election-research.css?v=2" />' }),
  };
}
