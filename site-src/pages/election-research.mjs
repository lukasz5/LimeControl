import { CONTACT_EMAIL, ROUTES, esc, layout, outputPath } from '../chrome.mjs';

const repository = 'https://github.com/lukasz5/limecontrol-election-polls';
const version = '0.7.0';

export const electionRelease = {
  version,
  repository,
  zip: `LimeControlElectionPolls-${version}.zip`,
  sha256: '609a19955bea6f67391d773736ba7b20f42840889ee1624504b0bcc840a4f25f',
  directory: `${repository}/releases/download/v${version}/`,
};

const copy = {
  pl: {
    title: 'LimeControl Elections – moduł Polska',
    description: 'Przygotuj sondaż na podstawie karty z archiwum PKW. Porównaj zmianę poparcia między dwiema falami w wybranych obszarach Polski z wydarzeniami i kosztami kampanii.',
    heading: 'Moduł Polska',
    lead: 'Wybierz kartę z archiwum PKW i porównaj poparcie w dwóch falach sondażu. Raport dla komitetu zestawia wyniki z wybranych obszarów z kalendarzem kampanii i poniesionymi kosztami.',
    download: 'Pobierz wtyczkę', ask: 'Zapytaj o płatny pilotaż', subject: 'Pilotaż LimeControl Elections – moduł Polska',
    language: 'Wtyczka i przykładowe ankiety w języku polskim.',
    sample: 'Dane fikcyjne', figure: 'Poparcie dla listy A', wave1: 'Fala 1', wave2: 'Fala 2',
    areas: ['Powiat gdański', 'Powiat kartuski'], exampleLink: 'Zobacz liczebności i koszty',
    journey: 'Od projektu badania do raportu dla komitetu',
    steps: [
      ['Ustal, kogo badasz', 'Wybierz obszar, głosowanie i kartę. Uzgodnij populację, sposób rekrutacji i terminy. Wyniki PKW z danego roku pomagają osadzić pomiar w lokalnym kontekście.'],
      ['Przeprowadź dwie fale', 'Połącz dwie anonimowe ankiety z takimi samymi pytaniami o wybór i obszar. Sprawdź liczby ukończonych wywiadów i zdecydowanych w obu falach.'],
      ['Prowadź kalendarz kampanii', 'Koordynator wpisuje wydarzenia i powiązane zadania, wskazuje osoby odpowiedzialne i terminy oraz uzupełnia koszty planowane i rzeczywiste. Dostęp do planera można nadać osobno.'],
      ['Omów wynik z komitetem', 'Zestaw do czterech rozłącznych obszarów. Komitet może otrzymać dostęp do raportu zbiorczego. Przy małej liczbie odpowiedzi wtyczka ukrywa wynik.'],
    ],
    report: 'Ile wydał komitet i jak zmieniły się deklaracje?',
    context: 'W każdym powiecie ukończono po 40 wywiadów w każdej fali. W każdym z tych pomiarów 25 osób wskazało listę. To wśród nich liczymy udział listy A.',
    table: 'Przykładowy raport dla dwóch powiatów · dane fikcyjne',
    area: 'Obszar', delta: 'Zmiana', plan: 'Plan', actual: 'Wykonanie', none: 'Brak kwoty', pp: 'p.p.',
    shared: 'Wspólne działanie wojewódzkie', sharedDetail: 'Plan 700,13 zł, wykonanie 740,15 zł. Ten wydatek pojawia się raz dla obu powiatów.',
    interpret: 'Dla obu powiatów łącznie udział wzrósł z 40% do 60%. Dopiero podział na obszary ujawnia przeciwne kierunki zmian. Daty wydarzeń wskazują, co działo się w czasie pomiaru. Ocena wpływu konkretnego działania wymaga osobnego badania.',
    archive: 'Jakie dane PKW zawiera moduł Polska?',
    years1: 'Sejmiki województw', scope1: 'Głosy na listy od kraju do obwodu oraz karty poszczególnych okręgów.',
    years2: 'Rady i wybory włodarzy', scope2: 'Rady gmin, miast, powiatów i dzielnic Warszawy. W wyborach wójtów, burmistrzów i prezydentów miast dostępna jest każda przeprowadzona tura.',
    caveat: 'Archiwum działa lokalnie po instalacji. W 2014 r. szczegółowość kończy się na gminie lub okręgu. Porównując lata, sprawdź granice i skład list.',
    exit: 'W dniu głosowania: exit poll', exitLead: 'Pracownia może przygotować odrębne badanie dla konkretnej karty i tury.',
    exitSteps: ['Wylosuj obwody w warstwach i ustal, co którą osobę zapraszać po wyjściu z lokalu. Krok można dostosować do wielkości obwodu.', 'Rozlicz anonimowe karty i odmowy na każdej zmianie. Odczytaj przedział uwzględniający losowanie obwodów i sprawdź, jak odmienne preferencje osób odmawiających zmieniłyby szacunek.', 'Po uzyskaniu zweryfikowanego protokołu zastąp nim szacunek dla tego obwodu w late poll. Pierwotny szacunek pozostaje do porównania.'],
    source: 'Kod źródłowy i instrukcja wtyczki na GitHubie',
    files: 'Uruchom projekt w LimeSurvey', install: 'Wgraj ZIP w panelu wtyczek i aktywuj wtyczkę. Zaimportuj oba pliki LSS jako oddzielne ankiety. W narzędziu Sondaże wyborcze połącz je jako fale jednego projektu.',
    zip: 'Wtyczka z archiwum PKW', lss1: 'Przykładowa ankieta · fala 1', lss2: 'Przykładowa ankieta · fala 2', sums: 'Sumy kontrolne', tested: 'Testy lokalne na danych ćwiczeniowych', licence: 'Licencja kodu',
    pilot: 'Pilotaż dla pracowni badawczej', paid: 'Razem konfigurujemy jedną instalację, dwie fale i dwa uzgodnione obszary. Pilotaż obejmuje konfigurację uprawnień, warsztat na danych ćwiczeniowych i wspólny odbiór raportu.',
    enquiry: 'Podaj wersję LimeSurvey, obszary i planowany termin badania. Na tej podstawie przygotujemy wycenę. Rekrutacja, wywiady i teren exit poll wymagają osobnego uzgodnienia.',
  },
  en: {
    title: 'LimeControl Elections – Poland module',
    description: 'Design a poll using an archived Polish ballot. Compare changes in support across two survey waves with campaign events and spending in selected areas of Poland.',
    heading: 'Poland module',
    lead: 'Choose a ballot from the Polish National Electoral Commission archive and compare support across two survey waves. The committee report shows results for selected areas alongside campaign dates and spending.',
    download: 'Download plugin', ask: 'Ask about a paid pilot', subject: 'LimeControl Elections pilot – Poland module',
    language: 'The plugin interface and example surveys are in Polish.',
    sample: 'Fictional data', figure: 'Support for List A', wave1: 'Wave 1', wave2: 'Wave 2',
    areas: ['Gdański County', 'Kartuski County'], exampleLink: 'See sample sizes and costs',
    journey: 'From study design to the committee report',
    steps: [
      ['Define the population', 'Select the area, election and ballot. Agree on the target population, recruitment method and fieldwork dates. Official results from the same election year provide local context.'],
      ['Run two survey waves', 'Link two anonymous surveys with matching questions on voting intention and area. Check the counts of completed interviews and decided respondents in both waves.'],
      ['Keep a campaign calendar', 'The coordinator records events and related tasks, assigns owners and deadlines, and enters planned and actual costs. Planner access can be granted separately.'],
      ['Review the results together', 'Compare up to four non-overlapping areas. The committee can receive access to an aggregate report. The plugin suppresses results when response counts are too small.'],
    ],
    report: 'What did the committee spend, and how did support change?',
    context: 'Each county recorded 40 completed interviews per wave. In each group, 25 respondents chose a list. They form the denominator for the share of List A.',
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
    files: 'Set up the project in LimeSurvey', install: 'Upload the ZIP in the plugin manager and activate it. Import the two LSS files as separate surveys. Open Sondaże wyborcze (Election polls) and link them as two waves of one project.',
    zip: 'Plugin and official results archive', lss1: 'Example survey · wave 1', lss2: 'Example survey · wave 2', sums: 'Checksums', tested: 'Tested locally with example data', licence: 'Code licence',
    pilot: 'Pilot for a research agency', paid: 'Set up one installation, two waves and two agreed areas with our team. The pilot includes access configuration, a workshop using example data and a joint review of the report.',
    enquiry: 'Tell us your LimeSurvey version, study areas and fieldwork dates for a quote. Respondent recruitment, interviewing and exit poll fieldwork are scoped separately.',
  },
  de: {
    title: 'LimeControl Elections – Modul Polen',
    description: 'Eine Wahlumfrage mit einem Stimmzettel aus dem polnischen Wahlarchiv planen. Ergebnisse aus zwei Befragungswellen mit Wahlkampfterminen und Kosten vergleichen.',
    heading: 'Modul Polen',
    lead: 'Wählen Sie einen Stimmzettel aus dem Archiv der polnischen Wahlkommission und vergleichen Sie die Wahlabsicht in zwei Befragungswellen. Der Bericht für das Wahlkomitee zeigt die Ergebnisse ausgewählter Gebiete zusammen mit Wahlkampfterminen und Ausgaben.',
    download: 'Plugin herunterladen', ask: 'Kostenpflichtiges Pilotprojekt anfragen', subject: 'Pilotprojekt mit LimeControl Elections – Modul Polen',
    language: 'Die Plugin-Oberfläche und die Beispielumfragen sind auf Polnisch.',
    sample: 'Fiktive Daten', figure: 'Anteil für Liste A', wave1: 'Welle 1', wave2: 'Welle 2',
    areas: ['Kreis Gdański', 'Kreis Kartuski'], exampleLink: 'Fallzahlen und Kosten ansehen',
    journey: 'Vom Studiendesign zum Bericht für das Wahlkomitee',
    steps: [
      ['Zielgruppe festlegen', 'Wählen Sie Gebiet, Wahl und Stimmzettel. Legen Sie Grundgesamtheit, Rekrutierung und Feldzeiten fest. Die amtlichen Ergebnisse des jeweiligen Jahres liefern den lokalen Bezug.'],
      ['Zwei Wellen durchführen', 'Verknüpfen Sie zwei anonyme Umfragen mit identischen Fragen zur Wahlabsicht und zum Gebiet. Prüfen Sie je Welle die Zahl der abgeschlossenen Interviews und der Befragten mit Listenwahl.'],
      ['Wahlkampfkalender führen', 'Die Koordination trägt Veranstaltungen und Aufgaben ein, benennt Verantwortliche und Fristen und erfasst geplante und tatsächliche Kosten. Der Planer hat eigene Zugriffsrechte.'],
      ['Ergebnisse besprechen', 'Vergleichen Sie bis zu vier überschneidungsfreie Gebiete. Das Wahlkomitee kann Zugriff auf den aggregierten Bericht erhalten. Bei zu kleinen Fallzahlen blendet das Plugin die Ergebnisse aus.'],
    ],
    report: 'Wie viel hat das Wahlkomitee ausgegeben und wie hat sich die Wahlabsicht verändert?',
    context: 'Je Kreis wurden pro Welle 40 Interviews abgeschlossen. In jeder dieser Gruppen entschieden sich 25 Personen für eine Liste. Auf diese 25 bezieht sich der Anteil für Liste A.',
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
    files: 'Das Projekt in LimeSurvey einrichten', install: 'Laden Sie die ZIP-Datei in der Plugin-Verwaltung hoch und aktivieren Sie das Plugin. Importieren Sie beide LSS-Dateien als eigene Umfragen. Verknüpfen Sie sie unter Sondaże wyborcze (Wahlumfragen) als zwei Wellen eines Projekts.',
    zip: 'Plugin mit amtlichem Wahlarchiv', lss1: 'Beispielumfrage · Welle 1', lss2: 'Beispielumfrage · Welle 2', sums: 'Prüfsummen', tested: 'Lokal mit Beispieldaten getestet', licence: 'Lizenz des Codes',
    pilot: 'Pilotprojekt für ein Forschungsinstitut', paid: 'Gemeinsam richten wir eine Installation mit zwei Wellen und zwei vereinbarten Gebieten ein. Das Pilotprojekt umfasst die Rechtevergabe, einen Workshop mit Beispieldaten und die gemeinsame Auswertung des Berichts.',
    enquiry: 'Nennen Sie uns Ihre LimeSurvey-Version, die Gebiete und den gewünschten Erhebungszeitraum für ein Angebot. Rekrutierung, Interviews und die Feldarbeit am Wahltag vereinbaren wir gesondert.',
  },
};

const comparison = [
  { counts: [5, 20], planned: 1450.35, actual: 1650.15 },
  { counts: [15, 10], planned: 90.16, actual: null },
];

function percent(lang, value) {
  return new Intl.NumberFormat(lang, { style: 'percent' }).format(value / 25);
}

function figure(t, lang) {
  return `<figure class="er-figure">
    <figcaption><span>${esc(t.sample)}</span><strong>${esc(t.figure)}</strong></figcaption>
    ${comparison.map(({ counts }, index) => `<div class="er-plot">
      <strong>${esc(t.areas[index])}</strong>
      ${counts.map((count, wave) => `<div class="er-bar er-wave-${wave + 1}"><span>${esc(wave ? t.wave2 : t.wave1)}</span><span class="er-track" aria-hidden="true"><i style="width:${count * 4}%"></i></span><b>${percent(lang, count)}</b></div>`).join('')}
    </div>`).join('')}
    <a href="#report">${esc(t.exampleLink)} <span aria-hidden="true">↓</span></a>
  </figure>`;
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
        <div class="er-actions"><a class="btn btn-primary" href="${esc(release.directory + release.zip)}" download>${esc(t.download)} <span aria-hidden="true">↓</span></a>
          <a class="btn btn-ghost" href="${esc(email)}">${esc(t.ask)}</a></div>
        <p class="er-meta">${esc(t.language)}</p>
      </div>${figure(t, lang)}
    </div></header>
    <div class="container er-content">
      <section class="er-block"><h2>${esc(t.journey)}</h2>
        <ol class="er-steps">${t.steps.map(([heading, text]) => `<li><h3>${esc(heading)}</h3><p>${esc(text)}</p></li>`).join('')}</ol>
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
      <section class="er-block er-split" id="download"><div><h2>${esc(t.files)}</h2><p>${esc(t.install)}</p>
        <ul class="er-files">${files.map(([file, label, type]) => `<li><a href="${esc(release.directory + file)}" download>${esc(label)}<span>${type} ↓</span></a></li>`).join('')}</ul>
        <p><a href="${esc(release.repository)}">${esc(t.source)}</a></p>
        <p class="er-meta">ZIP · SHA-256<br><samp>${release.sha256.match(/.{8}/g).map(esc).join('<wbr>')}</samp></p>
        <p class="er-meta">v${esc(release.version)} · ${esc(t.licence)} GPL-2.0-or-later<br>${esc(t.tested)} · LimeSurvey CE 6.17.19 / 7.11.0</p>
      </div><div class="er-pilot"><h2>${esc(t.pilot)}</h2><p>${esc(t.paid)}</p><p>${esc(t.enquiry)}</p>
        <a class="btn btn-primary" href="${esc(email)}">${esc(t.ask)}</a>
      </div></section>
    </div>
  </main>`;
  return {
    path: outputPath('electionPoland', lang),
    html: layout({ lang, page: 'electionPoland', title: t.title, description: t.description, body,
      extraHead: '<link rel="stylesheet" href="/assets/election-research.css?v=1" />' }),
  };
}
