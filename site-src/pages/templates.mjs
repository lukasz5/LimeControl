// Podstrony z szablonami ankiet: site/ankiety.html (PL), site/en/templates.html (EN) i site/de/vorlagen.html (DE).
// Katalog szablonów pochodzi z survey-templates/build.mjs.
import { APP_URL, GITHUB_URL, ROUTES, absolute, esc, layout, outputPath } from '../chrome.mjs';
import { TEMPLATES_DE, categoryLabel, localized } from './data.de.mjs';

const templateText = (t, field, lang) => localized(t, field, lang, TEMPLATES_DE, 'Vorlage');

const kb = (n) => `${Math.max(1, Math.round(n / 1024))} kB`;
const NUMBER_WORDS = {
  pl: { 10: 'Dziesięć', 11: 'Jedenaście', 12: 'Dwanaście', 13: 'Trzynaście', 14: 'Czternaście', 15: 'Piętnaście' },
  en: { 10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen' },
  de: { 10: 'Zehn', 11: 'Elf', 12: 'Zwölf', 13: 'Dreizehn', 14: 'Vierzehn', 15: 'Fünfzehn' },
};
const MODE_LABEL = { cawi: 'CAWI', cati: 'CATI', capi: 'CAPI' };

const S = {
  pl: {
    title: 'Darmowe szablony ankiet dla LimeSurvey po polsku i angielsku — LimeControl',
    description: (n) => `${n} darmowych szablonów ankiet dla LimeSurvey 6 i 7 w dwóch językach: NPS, CSAT, zaangażowanie pracowników, ewaluacja szkoleń, satysfakcja pacjenta, SUS, test koncepcji oraz wywiady CATI i CAPI. Pobierz plik .lss i zaimportuj.`,
    ogTitle: 'Szablony ankiet dla LimeSurvey — gotowe do importu, PL + EN',
    listName: 'Szablony ankiet dla LimeSurvey od LimeControl',
    eyebrow: 'Szablony ankiet dla LimeSurvey',
    h1: 'Gotowe ankiety w dwóch językach — <span class="lime">import jednym plikiem</span>.',
    lead: (n, how) => `${n} darmowych kwestionariuszy po polsku i&nbsp;angielsku: od NPS i&nbsp;satysfakcji klienta, przez badania pracownicze i&nbsp;ewaluacje, po szkielety wywiadów telefonicznych (CATI) i&nbsp;terenowych (CAPI). Każdy ma logikę warunkową, gotowe treści zaproszeń i&nbsp;dobrany motyw. <a href="#${how}">Jak zaimportować</a>.`,
    downloadAll: (size) => `Pobierz wszystkie (ZIP, ${size})`,
    importInApp: 'Importuj w aplikacji',
    meta: (versions) => ['Polski + angielski', `LimeSurvey ${versions}`, 'Logika warunkowa', 'Treści e-maili w komplecie', 'Licencja CC0 — bez ograniczeń'],
    and: ' i ',
    ids: { gallery: 'szablony', inside: 'zawartosc', how: 'import', fieldwork: 'cati-capi' },
    galleryEyebrow: 'Biblioteka',
    galleryH: 'Wybierz szablon',
    galleryP: (tested) => `Każdy szablon zaimportowaliśmy i&nbsp;wypełniliśmy od początku do końca w&nbsp;przeglądarce, w&nbsp;obu językach, na LimeSurvey ${tested}.`,
    filterLabel: 'Filtruj szablony według kategorii',
    all: 'Wszystkie',
    questions: (n) => `${n} ${n === 1 ? 'pytanie' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'pytania' : 'pytań'}`,
    minutes: (n) => `ok. ${n} min`,
    theme: 'Motyw',
    modes: 'Tryb realizacji',
    previewAlt: (t) => `Podgląd ankiety „${t}” w LimeSurvey`,
    download: 'Pobierz .lss',
    downloadAria: (t, size) => `Pobierz szablon „${t}” (plik .lss, ${size})`,
    insideEyebrow: 'W każdym szablonie',
    insideH: 'Więcej niż lista pytań',
    insideP: 'Szablony powstają z czytelnych definicji JSON i&nbsp;są budowane tym samym skryptem, który je sprawdza. Możesz je dowolnie zmieniać w&nbsp;LimeSurvey po imporcie.',
    insideList: [
      '<strong>Dwa języki w&nbsp;jednym pliku</strong> — polski jako bazowy i&nbsp;angielski jako dodatkowy; respondent przełącza język na stronie ankiety.',
      '<strong>Logika warunkowa</strong> — pytania pogłębiające zależą od oceny (np. inne pytanie dla krytyków i&nbsp;promotorów NPS).',
      '<strong>Pola wyliczane</strong> — segment NPS i&nbsp;wynik SUS (0–100) zapisują się w&nbsp;odpowiedziach, gotowe do eksportu.',
      '<strong>Kody przyjazne analizie</strong> — krótkie kody pytań, skale z&nbsp;wartościami liczbowymi 1–5 i&nbsp;0–10.',
      '<strong>Treści e-maili</strong> — zaproszenie, przypomnienie, potwierdzenie i&nbsp;rejestracja w&nbsp;obu językach.',
      '<strong>Dobrany motyw</strong> — jeśli masz zainstalowany wskazany motyw LimeControl, ankieta użyje go od razu; jeśli nie, LimeSurvey wybierze motyw domyślny.',
      '<strong>Prywatność domyślnie</strong> — odpowiedzi anonimowe, bez adresów IP i&nbsp;znaczników czasu (poza szablonami CATI/CAPI, gdzie czas jest potrzebny do kontroli jakości).',
    ],
    howEyebrow: 'Import',
    howH: 'Trzy sposoby na import',
    how: [
      ['W aplikacji LimeControl', `Połącz się ze swoją instancją i&nbsp;otwórz <em>Ankiety → Biblioteka szablonów</em>. Wybierz szablon i&nbsp;dotknij <strong>Importuj</strong> — ankieta pojawi się na liście jako nieaktywna, gotowa do edycji. <a href="${APP_URL}">Otwórz aplikację</a>.`],
      ['W panelu LimeSurvey', 'Pobierz plik <code>.lss</code>. W&nbsp;panelu wybierz <em>Ankiety → Utwórz ankietę → Importuj</em>, wskaż plik i&nbsp;kliknij <strong>Importuj ankietę</strong>.'],
      ['Przez API RemoteControl 2', 'Wywołaj <code>import_survey</code> z&nbsp;zawartością pliku zakodowaną w&nbsp;base64 i&nbsp;typem <code>lss</code>. Tak działa import w&nbsp;LimeControl i&nbsp;skrypt <code>survey-templates/verify.mjs</code> z&nbsp;repozytorium.'],
    ],
    howNote: 'Po imporcie ankieta jest <strong>nieaktywna</strong>. Uzupełnij teksty w&nbsp;nawiasach kwadratowych (nazwa firmy, temat badania), ustaw administratora i&nbsp;aktywuj ją — w&nbsp;panelu albo w&nbsp;LimeControl.',
    fwEyebrow: 'CATI i CAPI',
    fwH: 'Szkielety wywiadów dla ankieterów',
    fwP: (themes, plugins) => `Szablony <strong>CATI</strong> i <strong>CAPI</strong> mają skrypty do odczytania, wynik kontaktu, zgodę respondenta i&nbsp;blok notatek ankietera. Najlepiej wyglądają z&nbsp;<a href="${themes}">motywami CATI i&nbsp;CAPI</a>, które wyróżniają wskazówki dla ankietera i&nbsp;trzymają przyciski nawigacji przy dolnej krawędzi ekranu.`,
    fwCards: (plugins) => [
      ['Pola uczestnika w szablonie CATI', 'Szablon definiuje cztery atrybuty uczestnika: <em>Telefon</em>, <em>Status kontaktu</em>, <em>Termin oddzwonienia</em> i&nbsp;<em>Notatka ankietera</em>. Przy inicjalizacji tabeli uczestników w&nbsp;LimeControl zaznacz „Utwórz pola z&nbsp;szablonu”.'],
      ['Wywiad za wywiadem na tablecie', 'W&nbsp;LimeControl otwórz ankietę w&nbsp;trybie CAPI — po zakończeniu wywiadu ankieta zaczyna się od nowa, bez danych poprzedniego respondenta.'],
      ['Kolejka rozmów, przydziały i kwoty', `Pełną realizację CATI/CAPI — kolejkę spraw, telefon VoIP, przydziały ankieterów, kwoty i&nbsp;kontrolę jakości — zapewnia konto platformy StrefaAnkiet. Z&nbsp;LimeSurvey łączą je <a href="${plugins}">darmowe wtyczki</a>.`],
    ],
    faqTitle: 'Pytania i odpowiedzi',
    faq: [
      ['Czy mogę zmieniać szablony i&nbsp;używać ich komercyjnie?', 'Tak. Szablony są udostępnione na licencji CC0&nbsp;1.0 — możesz je kopiować, zmieniać i&nbsp;wykorzystywać w&nbsp;dowolnym celu, bez podawania źródła. Kwestionariusz SUS pochodzi od Johna Brooke’a (1986) i&nbsp;jest powszechnie dostępny do użytku.'],
      ['Z&nbsp;jakimi wersjami LimeSurvey działają?', 'Sprawdziliśmy je na LimeSurvey 6.15.12 i&nbsp;7.10.0. Pliki mają format struktury ankiety używany od LimeSurvey&nbsp;4, więc powinny zaimportować się także w&nbsp;wersjach 4 i&nbsp;5 — tych jednak nie testowaliśmy.'],
      ['Potrzebuję tylko jednego języka. Jak usunąć drugi?', 'Po imporcie otwórz <em>Ustawienia ankiety → Ogólne</em> i&nbsp;usuń język z&nbsp;listy „Dodatkowe języki”. Aby zmienić język bazowy, skopiuj ankietę i&nbsp;wybierz nowy język bazowy w&nbsp;ustawieniach kopii.'],
      ['Ankieta po imporcie nie ma motywu LimeControl', `Szablon wskazuje sugerowany motyw (np. <code>lc_medical</code>). Jeśli nie jest zainstalowany, LimeSurvey użyje motywu domyślnego. <a href="${ROUTES.themes.pl}">Pobierz motywy</a>, zainstaluj i&nbsp;wybierz motyw w&nbsp;ustawieniach ankiety albo w&nbsp;LimeControl.`],
      ['Jak zaproponować nowy szablon albo poprawkę?', `Definicje szablonów to pliki JSON w&nbsp;katalogu <code>survey-templates/templates</code> w&nbsp;<a href="${GITHUB_URL}" target="_blank" rel="noopener">repozytorium LimeControl</a>. Zgłoś propozycję lub wyślij pull request — skrypt budujący sam sprawdzi poprawność pliku.`],
    ],
    ctaH: 'Zaimportuj szablon z telefonu',
    ctaP: 'W LimeControl wybierasz szablon, importujesz go do swojej instancji i&nbsp;aktywujesz ankietę — bez logowania do panelu administratora.',
    ctaApp: 'Otwórz aplikację',
    ctaThemes: 'Zobacz motywy ankiet',
    footerNote: (v) => `Szablony ankiet w wersji ${v}, licencja CC0 1.0.`,
  },
  en: {
    title: 'Free survey templates for LimeSurvey in English and Polish — LimeControl',
    description: (n) => `${n} free survey templates for LimeSurvey 6 and 7 in two languages: NPS, CSAT, employee engagement, training evaluation, patient satisfaction, SUS, concept test, plus CATI and CAPI interviews. Download the .lss file and import it.`,
    ogTitle: 'Survey templates for LimeSurvey — ready to import, EN + PL',
    listName: 'Survey templates for LimeSurvey by LimeControl',
    eyebrow: 'Survey templates for LimeSurvey',
    h1: 'Ready-made surveys in two languages — <span class="lime">one file to import</span>.',
    lead: (n, how) => `${n} free questionnaires in English and Polish: from NPS and customer satisfaction, through employee surveys and evaluations, to telephone (CATI) and field (CAPI) interview skeletons. Each one comes with conditional logic, ready-made invitation emails and a matching theme. <a href="#${how}">How to import</a>.`,
    downloadAll: (size) => `Download all (ZIP, ${size})`,
    importInApp: 'Import in the app',
    meta: (versions) => ['English + Polish', `LimeSurvey ${versions}`, 'Conditional logic', 'Email texts included', 'CC0 licence — no restrictions'],
    and: ' and ',
    ids: { gallery: 'templates', inside: 'whats-inside', how: 'import', fieldwork: 'cati-capi' },
    galleryEyebrow: 'Library',
    galleryH: 'Choose a template',
    galleryP: (tested) => `We imported every template and completed it from start to finish in a browser, in both languages, on LimeSurvey ${tested}.`,
    filterLabel: 'Filter templates by category',
    all: 'All',
    questions: (n) => `${n} ${n === 1 ? 'question' : 'questions'}`,
    minutes: (n) => `about ${n} min`,
    theme: 'Theme',
    modes: 'Mode',
    previewAlt: (t) => `Preview of the “${t}” survey in LimeSurvey`,
    download: 'Download .lss',
    downloadAria: (t, size) => `Download the “${t}” template (.lss file, ${size})`,
    insideEyebrow: 'In every template',
    insideH: 'More than a list of questions',
    insideP: 'The templates are generated from readable JSON definitions and built by the same script that validates them. After importing you can change anything in LimeSurvey.',
    insideList: [
      '<strong>Two languages in one file</strong> — Polish as the base language and English as an additional one; respondents switch languages on the survey page.',
      '<strong>Conditional logic</strong> — follow-up questions depend on the rating (e.g. a different question for NPS detractors and promoters).',
      '<strong>Computed fields</strong> — the NPS segment and the SUS score (0–100) are stored with the responses, ready for export.',
      '<strong>Analysis-friendly codes</strong> — short question codes and scales with numeric values 1–5 and 0–10.',
      '<strong>Email texts</strong> — invitation, reminder, confirmation and registration in both languages.',
      '<strong>A matching theme</strong> — if the suggested LimeControl theme is installed, the survey uses it straight away; if not, LimeSurvey picks the default theme.',
      '<strong>Private by default</strong> — anonymous responses, no IP addresses or timestamps (except the CATI/CAPI templates, where timing is needed for quality control).',
    ],
    howEyebrow: 'Import',
    howH: 'Three ways to import',
    how: [
      ['In the LimeControl app', `Connect to your instance and open <em>Surveys → Template library</em>. Pick a template and tap <strong>Import</strong> — the survey appears in the list as inactive, ready for editing. <a href="${APP_URL}">Open the app</a>.`],
      ['In the LimeSurvey admin panel', 'Download the <code>.lss</code> file. In the panel choose <em>Surveys → Create survey → Import</em>, select the file and click <strong>Import survey</strong>.'],
      ['Through the RemoteControl 2 API', 'Call <code>import_survey</code> with the file content encoded in base64 and the type <code>lss</code>. This is how the import in LimeControl and the <code>survey-templates/verify.mjs</code> script in the repository work.'],
    ],
    howNote: 'After import the survey is <strong>inactive</strong>. Fill in the texts in square brackets (company name, study topic), set the administrator and activate it — in the panel or in LimeControl.',
    fwEyebrow: 'CATI and CAPI',
    fwH: 'Interview skeletons for interviewers',
    fwP: (themes, plugins) => `The <strong>CATI</strong> and <strong>CAPI</strong> templates include scripts to read out, the call outcome, respondent consent and an interviewer notes block. They look best with the <a href="${themes}">CATI and CAPI themes</a>, which highlight interviewer instructions and keep the navigation buttons at the bottom of the screen.`,
    fwCards: (plugins) => [
      ['Participant fields in the CATI template', 'The template defines four participant attributes: <em>Phone</em>, <em>Contact status</em>, <em>Callback time</em> and <em>Interviewer note</em>. When initialising the participant table in LimeControl, tick “Create fields from the template”.'],
      ['Interview after interview on a tablet', 'In LimeControl open the survey in CAPI mode — when an interview is finished the survey starts again, without the previous respondent’s data.'],
      ['Call queue, assignments and quotas', `Full CATI/CAPI fieldwork — a case queue, a VoIP phone, interviewer assignments, quotas and quality control — is provided by a StrefaAnkiet platform account. The <a href="${plugins}">free plugins</a> connect it to LimeSurvey.`],
    ],
    faqTitle: 'Questions and answers',
    faq: [
      ['May I modify the templates and use them commercially?', 'Yes. The templates are released under CC0&nbsp;1.0 — you may copy, change and use them for any purpose, without attribution. The SUS questionnaire was created by John Brooke (1986) and is freely available for use.'],
      ['Which LimeSurvey versions do they work with?', 'We tested them on LimeSurvey 6.15.12 and 7.10.0. The files use the survey structure format introduced in LimeSurvey&nbsp;4, so they should also import in versions 4 and 5 — but we have not tested those.'],
      ['I only need one language. How do I remove the other?', 'After importing, open <em>Survey settings → General</em> and remove the language from “Additional languages”. To change the base language, copy the survey and choose a new base language in the copy’s settings.'],
      ['The imported survey does not use a LimeControl theme', `The template names a suggested theme (e.g. <code>lc_medical</code>). If it is not installed, LimeSurvey uses the default theme. <a href="${ROUTES.themes.en}">Download the themes</a>, install them and select the theme in the survey settings or in LimeControl.`],
      ['How do I suggest a new template or a fix?', `The template definitions are JSON files in the <code>survey-templates/templates</code> directory of the <a href="${GITHUB_URL}" target="_blank" rel="noopener">LimeControl repository</a>. Open an issue or send a pull request — the build script validates the file for you.`],
    ],
    ctaH: 'Import a template from your phone',
    ctaP: 'In LimeControl you pick a template, import it into your instance and activate the survey — without logging in to the admin panel.',
    ctaApp: 'Open the app',
    ctaThemes: 'See the survey themes',
    footerNote: (v) => `Survey templates version ${v}, licensed under CC0 1.0.`,
  },
  de: {
    title: 'Kostenlose Umfragevorlagen für LimeSurvey auf Englisch und Polnisch — LimeControl',
    description: (n) => `${n} kostenlose Umfragevorlagen für LimeSurvey 6 und 7 in zwei Sprachen (Englisch und Polnisch): NPS, CSAT, Mitarbeiterengagement, Schulungsevaluation, Patientenzufriedenheit, SUS, Konzepttest sowie CATI- und CAPI-Interviews. .lss-Datei herunterladen und importieren.`,
    ogTitle: 'Umfragevorlagen für LimeSurvey — importfertig, EN + PL',
    listName: 'Umfragevorlagen für LimeSurvey von LimeControl',
    eyebrow: 'Umfragevorlagen für LimeSurvey',
    h1: 'Fertige Umfragen in zwei Sprachen — <span class="lime">mit einer Datei importiert</span>.',
    lead: (n, how) => `${n} kostenlose Fragebögen auf Englisch und Polnisch: von NPS und Kundenzufriedenheit über Mitarbeiterbefragungen und Evaluationen bis zu Gerüsten für Telefon- (CATI) und Feldinterviews (CAPI). Jeder bringt Bedingungslogik, fertige Einladungstexte und ein passendes Design mit. Eine deutsche Fassung ergänzen Sie in LimeSurvey als weitere Sprache. <a href="#${how}">So importieren Sie</a>.`,
    downloadAll: (size) => `Alle herunterladen (ZIP, ${size})`,
    importInApp: 'In der App importieren',
    meta: (versions) => ['Englisch + Polnisch', `LimeSurvey ${versions}`, 'Bedingungslogik', 'E-Mail-Texte inklusive', 'CC0-Lizenz — ohne Einschränkungen'],
    and: ' und ',
    ids: { gallery: 'vorlagen', inside: 'inhalt', how: 'import', fieldwork: 'cati-capi' },
    galleryEyebrow: 'Bibliothek',
    galleryH: 'Wählen Sie eine Vorlage',
    galleryP: (tested) => `Jede Vorlage haben wir importiert und im Browser von Anfang bis Ende ausgefüllt, in beiden Sprachen, mit LimeSurvey ${tested}.`,
    filterLabel: 'Vorlagen nach Kategorie filtern',
    all: 'Alle',
    questions: (n) => `${n} ${n === 1 ? 'Frage' : 'Fragen'}`,
    minutes: (n) => `ca. ${n} Min.`,
    theme: 'Design',
    modes: 'Erhebungsmodus',
    previewAlt: (t) => `Vorschau der Umfrage „${t}“ in LimeSurvey`,
    download: '.lss herunterladen',
    downloadAria: (t, size) => `Vorlage „${t}“ herunterladen (.lss-Datei, ${size})`,
    insideEyebrow: 'In jeder Vorlage',
    insideH: 'Mehr als eine Liste von Fragen',
    insideP: 'Die Vorlagen entstehen aus lesbaren JSON-Definitionen und werden vom selben Skript gebaut, das sie prüft. Nach dem Import können Sie in LimeSurvey alles ändern.',
    insideList: [
      '<strong>Zwei Sprachen in einer Datei</strong> — Polnisch als Basissprache und Englisch als zusätzliche; Befragte wechseln die Sprache auf der Umfrageseite. Deutsch fügen Sie als weitere Sprache hinzu.',
      '<strong>Bedingungslogik</strong> — Nachfragen hängen von der Bewertung ab (z.&nbsp;B. eine andere Frage für NPS-Kritiker und -Promotoren).',
      '<strong>Berechnete Felder</strong> — das NPS-Segment und der SUS-Wert (0–100) werden mit den Antworten gespeichert, bereit für den Export.',
      '<strong>Analysefreundliche Codes</strong> — kurze Fragecodes und Skalen mit numerischen Werten 1–5 und 0–10.',
      '<strong>E-Mail-Texte</strong> — Einladung, Erinnerung, Bestätigung und Registrierung in beiden Sprachen.',
      '<strong>Ein passendes Design</strong> — ist das vorgeschlagene LimeControl-Design installiert, nutzt die Umfrage es sofort; andernfalls wählt LimeSurvey das Standarddesign.',
      '<strong>Datensparsam voreingestellt</strong> — anonyme Antworten, ohne IP-Adressen und Zeitstempel (außer bei den CATI/CAPI-Vorlagen, wo die Zeit für die Qualitätskontrolle nötig ist).',
    ],
    howEyebrow: 'Import',
    howH: 'Drei Wege zum Import',
    how: [
      ['In der App LimeControl', `Verbinden Sie sich mit Ihrer Instanz und öffnen Sie <em>Surveys → Template library</em>. Vorlage wählen und auf <strong>Import</strong> tippen — die Umfrage erscheint inaktiv in der Liste, bereit zur Bearbeitung. <a href="${APP_URL}">App öffnen</a>.`],
      ['Im LimeSurvey-Admin-Panel', 'Laden Sie die <code>.lss</code>-Datei herunter. Wählen Sie im Panel <em>Umfragen → Umfrage erstellen → Importieren</em>, wählen Sie die Datei und klicken Sie auf <strong>Umfrage importieren</strong>.'],
      ['Über die RemoteControl-2-API', 'Rufen Sie <code>import_survey</code> mit dem base64-codierten Dateiinhalt und dem Typ <code>lss</code> auf. So funktionieren der Import in LimeControl und das Skript <code>survey-templates/verify.mjs</code> im Repository.'],
    ],
    howNote: 'Nach dem Import ist die Umfrage <strong>inaktiv</strong>. Füllen Sie die Texte in eckigen Klammern aus (Firmenname, Studienthema), legen Sie den Administrator fest und aktivieren Sie sie — im Panel oder in LimeControl.',
    fwEyebrow: 'CATI und CAPI',
    fwH: 'Interviewgerüste für Interviewer',
    fwP: (themes, plugins) => `Die Vorlagen <strong>CATI</strong> und <strong>CAPI</strong> enthalten vorzulesende Skripte, das Kontaktergebnis, die Einwilligung der befragten Person und einen Block für Interviewernotizen. Am besten wirken sie mit den <a href="${themes}">Designs CATI und CAPI</a>, die Interviewer-Hinweise hervorheben und die Navigationsbuttons am unteren Bildschirmrand halten.`,
    fwCards: (plugins) => [
      ['Teilnehmerfelder in der CATI-Vorlage', 'Die Vorlage definiert vier Teilnehmerattribute: <em>Telefon</em>, <em>Kontaktstatus</em>, <em>Rückrufzeit</em> und <em>Interviewernotiz</em>. Setzen Sie beim Initialisieren der Teilnehmertabelle in LimeControl das Häkchen bei „Create fields from the template“.'],
      ['Interview nach Interview auf dem Tablet', 'Öffnen Sie die Umfrage in LimeControl im CAPI-Modus — nach jedem Interview beginnt die Umfrage neu, ohne die Daten der vorherigen befragten Person.'],
      ['Anrufwarteschlange, Zuteilungen und Quoten', `Die vollständige CATI/CAPI-Feldarbeit — Fallwarteschlange, VoIP-Telefon, Interviewer-Zuteilungen, Quoten und Qualitätskontrolle — bietet ein Konto auf der Plattform StrefaAnkiet. Die <a href="${plugins}">kostenlosen Plugins</a> verbinden sie mit LimeSurvey.`],
    ],
    faqTitle: 'Fragen und Antworten',
    faq: [
      ['Darf ich die Vorlagen ändern und kommerziell nutzen?', 'Ja. Die Vorlagen stehen unter CC0&nbsp;1.0 — Sie dürfen sie kopieren, ändern und für jeden Zweck nutzen, ohne Quellenangabe. Der SUS-Fragebogen stammt von John Brooke (1986) und ist frei nutzbar.'],
      ['Mit welchen LimeSurvey-Versionen funktionieren sie?', 'Getestet haben wir sie mit LimeSurvey 6.15.12 und 7.10.0. Die Dateien nutzen das seit LimeSurvey&nbsp;4 verwendete Strukturformat und sollten sich daher auch in den Versionen 4 und 5 importieren lassen — diese haben wir aber nicht getestet.'],
      ['Gibt es die Vorlagen auf Deutsch?', 'Noch nicht — die Vorlagen enthalten Englisch und Polnisch. Fügen Sie nach dem Import unter <em>Umfrageeinstellungen → Allgemein</em> Deutsch als zusätzliche Sprache hinzu und übersetzen Sie die Texte in LimeSurvey; Logik, Codes und Skalen bleiben dabei erhalten.'],
      ['Ich brauche nur eine Sprache. Wie entferne ich die andere?', 'Öffnen Sie nach dem Import <em>Umfrageeinstellungen → Allgemein</em> und entfernen Sie die Sprache aus „Zusätzliche Sprachen“. Um die Basissprache zu ändern, kopieren Sie die Umfrage und wählen in den Einstellungen der Kopie eine neue Basissprache.'],
      ['Die importierte Umfrage nutzt kein LimeControl-Design', `Die Vorlage nennt ein vorgeschlagenes Design (z.&nbsp;B. <code>lc_medical</code>). Ist es nicht installiert, verwendet LimeSurvey das Standarddesign. <a href="${ROUTES.themes.de}">Designs herunterladen</a>, installieren und das Design in den Umfrageeinstellungen oder in LimeControl wählen.`],
      ['Wie schlage ich eine neue Vorlage oder eine Korrektur vor?', `Die Vorlagendefinitionen sind JSON-Dateien im Verzeichnis <code>survey-templates/templates</code> des <a href="${GITHUB_URL}" target="_blank" rel="noopener">LimeControl-Repositorys</a>. Eröffnen Sie ein Issue oder senden Sie einen Pull Request — das Build-Skript prüft die Datei selbst.`],
    ],
    ctaH: 'Importieren Sie eine Vorlage vom Smartphone',
    ctaP: 'In LimeControl wählen Sie eine Vorlage, importieren sie in Ihre Instanz und aktivieren die Umfrage — ohne Anmeldung im Admin-Panel.',
    ctaApp: 'App öffnen',
    ctaThemes: 'Umfrage-Designs ansehen',
    footerNote: (v) => `Umfragevorlagen in Version ${v}, lizenziert unter CC0 1.0.`,
  },
};

const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

function card(t, catalog, lang) {
  const s = S[lang];
  const category = catalog.categories.find((c) => c.id === t.category);
  const theme = t.theme ? catalog.themes.find((x) => x.id === t.theme) : null;
  const title = templateText(t, 'title', lang);
  const img = t.preview
    ? `<img src="/ankiety/img/${t.id}.jpg" width="960" height="720" loading="lazy" decoding="async" alt="${esc(s.previewAlt(title))}" />`
    : `<span class="tshot-empty" aria-hidden="true">${esc(categoryLabel(category, lang))}</span>`;
  return `
          <article class="tcard" id="${t.id}" data-category="${t.category}" aria-labelledby="${t.id}-title">
            <div class="tshot">${img}</div>
            <div class="tbody">
              <ul class="tags" aria-label="${s.modes}">
                <li class="tag-cat">${esc(categoryLabel(category, lang))}</li>
                ${t.modes.map((m) => `<li class="tag-mode">${MODE_LABEL[m]}</li>`).join('')}
              </ul>
              <h3 id="${t.id}-title">${esc(title)}</h3>
              <p>${esc(templateText(t, 'summary', lang))}</p>
              <p class="tmeta">${s.questions(t.questions)} · ${s.minutes(t.minutes)} · ${t.languages.map((l) => l.toUpperCase()).join(' + ')}${theme ? ` · ${s.theme}: <a href="${ROUTES.themes[lang]}#${theme.id.replace('lc_', '')}">${esc(theme.label)}</a>` : ''}</p>
              <div class="tdl-group">
                <a class="btn btn-primary tdl" href="/ankiety/pobierz/${t.file}" download aria-label="${esc(s.downloadAria(title, kb(t.bytes)))}">
                  ${DOWNLOAD_ICON}
                  ${s.download} <span class="size">${kb(t.bytes)}</span>
                </a>
              </div>
            </div>
          </article>`;
}

/**
 * @param {{ catalog: object, zipBytes: number, lang: 'pl'|'en'|'de' }} o
 * @returns {{ path: string, html: string }}
 */
export function renderTemplatesPage({ catalog, zipBytes, lang }) {
  const s = S[lang];
  const tested = catalog.testedOn.join(s.and);
  const count = NUMBER_WORDS[lang][catalog.templates.length] || String(catalog.templates.length);
  const used = catalog.categories.filter((c) => catalog.templates.some((t) => t.category === c.id));

  const body = `
  <main id="main">
    <section class="hero hero-themes">
      <div class="container">
        <div>
          <span class="eyebrow">${s.eyebrow}</span>
          <h1>${s.h1}</h1>
          <p class="lead">${s.lead(count, s.ids.how)}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="/ankiety/pobierz/limecontrol-szablony-ankiet.zip" download>
              ${s.downloadAll(kb(zipBytes))}
              ${DOWNLOAD_ICON}
            </a>
            <a class="btn btn-ghost" href="${APP_URL}">${s.importInApp}</a>
          </div>
          <ul class="hero-meta">
            ${s.meta('6' + s.and + '7').map((m) => `<li>${m}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

    <section id="${s.ids.gallery}" class="section-soft" aria-labelledby="gallery-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.galleryEyebrow}</span>
          <h2 id="gallery-h">${s.galleryH}</h2>
          <p>${s.galleryP(tested)}</p>
        </div>
        <div class="chips" role="group" aria-label="${s.filterLabel}">
          <button type="button" data-filter="" aria-pressed="true">${s.all}</button>
          ${used.map((c) => `<button type="button" data-filter="${c.id}" aria-pressed="false">${esc(categoryLabel(c, lang))}</button>`).join('\n          ')}
        </div>
        <div class="tgrid" id="template-grid">
${catalog.templates.map((t) => card(t, catalog, lang)).join('\n')}
        </div>
      </div>
    </section>

    <section id="${s.ids.inside}" aria-labelledby="inside-h">
      <div class="container split">
        <div>
          <span class="eyebrow">${s.insideEyebrow}</span>
          <h2 id="inside-h">${s.insideH}</h2>
          <p class="muted">${s.insideP}</p>
        </div>
        <ul class="checklist">
          ${s.insideList.map((li) => `<li><span>${li}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section id="${s.ids.how}" class="section-soft" aria-labelledby="how-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.howEyebrow}</span>
          <h2 id="how-h">${s.howH}</h2>
        </div>
        <ol class="steps steps-3">
          ${s.how.map(([h, p]) => `<li>
            <h3>${h}</h3>
            <p>${p}</p>
          </li>`).join('\n          ')}
        </ol>
        <div class="callout" style="margin-top:32px">
          <p>${s.howNote}</p>
        </div>
      </div>
    </section>

    <section id="${s.ids.fieldwork}" aria-labelledby="fw-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.fwEyebrow}</span>
          <h2 id="fw-h">${s.fwH}</h2>
          <p>${s.fwP(ROUTES.themes[lang], ROUTES.plugins[lang])}</p>
        </div>
        <div class="grid grid-3">
          ${s.fwCards(ROUTES.plugins[lang]).map(([h, p]) => `<article class="card">
            <h3 style="margin-top:0">${h}</h3>
            <p>${p}</p>
          </article>`).join('\n          ')}
        </div>

        <h3 class="faq-title">${s.faqTitle}</h3>
        <div class="faq">
          ${s.faq.map(([q, a]) => `<details>
            <summary>${q}</summary>
            <p>${a}</p>
          </details>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section style="padding-top:48px">
      <div class="container">
        <div class="cta">
          <h2>${s.ctaH}</h2>
          <p>${s.ctaP}</p>
          <div class="cta-actions">
            <a class="btn btn-primary" href="${APP_URL}">${s.ctaApp}</a>
            <a class="btn btn-ghost" href="${ROUTES.themes[lang]}">${s.ctaThemes}</a>
          </div>
        </div>
      </div>
    </section>
  </main>`;

  const html = layout({
    lang,
    page: 'templates',
    title: s.title,
    description: s.description(catalog.templates.length),
    ogTitle: s.ogTitle,
    ogImage: catalog.templates.some((t) => t.preview) ? `/ankiety/img/${catalog.templates.find((t) => t.preview).id}.jpg` : undefined,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: s.listName,
      itemListElement: catalog.templates.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'DigitalDocument',
          name: templateText(t, 'title', lang),
          description: templateText(t, 'summary', lang),
          inLanguage: t.languages,
          license: 'https://creativecommons.org/publicdomain/zero/1.0/',
          url: absolute(`${ROUTES.templates[lang]}#${t.id}`),
          encodingFormat: 'application/xml',
        },
      })),
    },
    body,
    footerNote: s.footerNote(catalog.version),
    scripts: `
  <script>
    // Filtr kategorii: pokazuje tylko karty z wybranej kategorii
    (function () {
      var buttons = document.querySelectorAll('.chips button');
      var cards = document.querySelectorAll('#template-grid .tcard');
      buttons.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-filter');
          buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          cards.forEach(function (c) { c.hidden = !!f && c.getAttribute('data-category') !== f; });
        });
      });
    })();
  </script>`,
  });
  return { path: outputPath('templates', lang), html };
}
