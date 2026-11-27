// Strona „Wtyczki StrefaAnkiet” — darmowe wtyczki łączące LimeSurvey z platformą StrefaAnkiet
// oraz płatne usługi platformy (konto, zarządzany Amazon SES, telefonia VoIP).
//   site/wtyczki.html (PL), site/en/plugins.html (EN) i site/de/plugins.html (DE)
import {
  APP_URL, CONTACT_EMAIL, PLUGINS_URL, ROUTES, STREFAANKIET_PRICING_URL, STREFAANKIET_URL,
  esc, homeUrl, layout, outputPath,
} from '../chrome.mjs';
import { downloadPanel, jsonQuestionsRelease } from './json-questions.mjs';
import { suitePanel, surveySuiteRelease } from './survey-suite.mjs';

/** Stan pakietu wtyczek opisany na stronie — zaktualizuj przy nowym wydaniu StrefaAnkiet dla LimeSurvey. */
const SUITE = { version: '0.9', testedOn: '6.15 i 7.10', testedOnEn: '6.15 and 7.10', testedOnDe: '6.15 und 7.10', php: '8.1' };

/**
 * Dwie grupy na stronie:
 *   group: 'open'   — otwarte wtyczki i narzędzia, działają samodzielnie, bez konta StrefaAnkiet;
 *   group: 'strefa' — wtyczki łączące LimeSurvey z usługami platformy StrefaAnkiet (wymagają konta).
 * Każda karta ma ten sam układ: rodzaj, tytuł, nazwa techniczna, opis, dokładnie trzy punkty
 * i stopka (`where` — gdzie działa / z jaką usługą łączy).
 */
const PLUGINS = [
  {
    id: 'LimeControlElectionPolls',
    group: 'open',
    kind: 'plugin',
    title: 'LimeControl Elections',
    lead: {
      pl: 'Planer kampanii dla komitetu wyborczego. Wpisz wydarzenia do kalendarza, przydziel zadania i porównaj wydatki z planem. Moduł Polska pozwala także zestawić te działania z wynikami dwóch fal sondażu.',
      en: 'A campaign planner for election committees. Schedule events, assign tasks and compare actual spending with the budget. The Poland module also shows campaign activities alongside two waves of polling.',
      de: 'Ein Wahlkampfplaner für Wahlkomitees. Tragen Sie Termine ein, verteilen Sie Aufgaben und vergleichen Sie Ausgaben mit dem geplanten Budget. Im Modul Polen können Sie die Aktivitäten auch neben den Ergebnissen zweier Befragungswellen betrachten.',
    },
    action: { pl: 'Zobacz planer kampanii', en: 'Explore the campaign planner', de: 'Zum Wahlkampfplaner' },
    page: 'election',
  },
  {
    id: 'StrefaSurveyExchange',
    group: 'open',
    kind: 'plugin',
    title: { pl: 'Wymiana kwestionariuszy', en: 'Questionnaire exchange', de: 'Fragebogenaustausch' },
    lead: {
      pl: 'Pobiera kwestionariusz z LimeSurvey jako strukturę .lss albo pakiet JSON z mapą pól i raportem różnic.',
      en: 'Downloads a questionnaire from LimeSurvey as an .lss structure or a JSON package with a field map and a difference report.',
      de: 'Lädt einen Fragebogen aus LimeSurvey als .lss-Struktur oder als JSON-Paket mit Feldzuordnung und Differenzbericht herunter.',
    },
    points: {
      pl: ['Eksport struktury (.lss) lub pakietu JSON z mapą kodów pól', 'Lista elementów, których nie da się przenieść — bez cichego upraszczania', 'Ustawienia innych wtyczek są usuwane z eksportu'],
      en: ['Export of the structure (.lss) or a JSON package with a field-code map', 'A list of elements that cannot be transferred — nothing is silently simplified', 'Settings of other plugins are stripped from the export'],
      de: ['Export der Struktur (.lss) oder eines JSON-Pakets mit Feldcode-Zuordnung', 'Eine Liste nicht übertragbarer Elemente — nichts wird stillschweigend vereinfacht', 'Einstellungen anderer Plugins werden aus dem Export entfernt'],
    },
    where: { pl: `LimeSurvey (sprawdzone na ${SUITE.testedOn})`, en: `LimeSurvey (tested on ${SUITE.testedOnEn})`, de: `LimeSurvey (getestet mit ${SUITE.testedOnDe})` },
  },
  {
    id: 'StrefaResponseExport',
    group: 'open',
    kind: 'plugin',
    title: { pl: 'Eksport odpowiedzi', en: 'Response export', de: 'Antwortexport' },
    lead: {
      pl: 'Udostępnia zakodowane odpowiedzi aktywnej ankiety do analiz — stronicowane i bez technicznych identyfikatorów.',
      en: 'Provides coded responses of an active survey for analysis — paginated and without technical identifiers.',
      de: 'Stellt die codierten Antworten einer aktiven Umfrage für Analysen bereit — seitenweise und ohne technische Kennungen.',
    },
    points: {
      pl: ['Pomija tokeny, adresy IP i adres odsyłający', 'Wymaga uprawnień odczytu i eksportu odpowiedzi do konkretnej ankiety', 'Pobieranie załączników z pytań plikowych'],
      en: ['Skips tokens, IP addresses and the referrer', 'Requires read and export permissions for the specific survey', 'Download of attachments from file-upload questions'],
      de: ['Lässt Tokens, IP-Adressen und den Referrer weg', 'Erfordert Lese- und Exportrechte für die jeweilige Umfrage', 'Download von Anhängen aus Datei-Upload-Fragen'],
    },
    where: { pl: `LimeSurvey (sprawdzone na ${SUITE.testedOn})`, en: `LimeSurvey (tested on ${SUITE.testedOnEn})`, de: `LimeSurvey (getestet mit ${SUITE.testedOnDe})` },
  },
  {
    id: 'StrefaConverters',
    group: 'open',
    kind: 'cli',
    title: { pl: 'Konwertery LSS, JSON i CSV', en: 'LSS, JSON and CSV converters', de: 'Konverter für LSS, JSON und CSV' },
    lead: {
      pl: 'Niezależne narzędzia do konwersji kwestionariuszy i odpowiedzi — przydatne przy migracjach i archiwizacji.',
      en: 'Standalone tools for converting questionnaires and responses — useful for migrations and archiving.',
      de: 'Eigenständige Werkzeuge zum Konvertieren von Fragebögen und Antworten — nützlich für Migrationen und Archivierung.',
    },
    points: {
      pl: ['LSS ↔ JSON z kontrolą sumy SHA-256', 'Odpowiedzi z JSON, CSV i eksportu VV', 'Zachowuje kody z zerami wiodącymi (np. 001) jako tekst'],
      en: ['LSS ↔ JSON with a SHA-256 checksum', 'Responses from JSON, CSV and the VV export', 'Keeps codes with leading zeros (e.g. 001) as text'],
      de: ['LSS ↔ JSON mit SHA-256-Prüfsumme', 'Antworten aus JSON, CSV und dem VV-Export', 'Behält Codes mit führenden Nullen (z. B. 001) als Text'],
    },
    where: { pl: 'Wiersz poleceń, poza LimeSurvey', en: 'The command line, outside LimeSurvey', de: 'Kommandozeile, außerhalb von LimeSurvey' },
  },
  {
    id: 'LimeControlJsonQuestions',
    group: 'open',
    kind: 'plugin',
    release: jsonQuestionsRelease,
    title: { pl: 'Pytania zależne JSON', en: 'Dependent JSON questions', de: 'Abhängige JSON-Fragen' },
    lead: {
      pl: 'Buduj kolejne pytania z wcześniejszych odpowiedzi. Po wyborze miast i rodzajów prac ankieta może zebrać liczbę godzin dla każdej pary i poprosić o wyjaśnienie po przekroczeniu progu.',
      en: 'Build follow-up questions from earlier answers. After a respondent chooses cities and activities, ask how many hours they spent on each pair and request an explanation above a threshold.',
      de: 'Bauen Sie Folgefragen auf früheren Antworten auf. Nach der Auswahl von Städten und Tätigkeiten kann die Umfrage für jede Kombination die Stunden erfassen und bei Überschreitung eines Grenzwerts nach dem Grund fragen.',
    },
    points: {
      pl: ['Osobne motywy do wyboru dla każdej pozycji, tabel i pytań uzupełniających', 'Warunki widoczności, wymagalności i komentarza w edytorze wizualnym', 'Jeden blok zajmuje jedno pole odpowiedzi, także w dużych macierzach; eksport CSV w układzie długim ze słownikiem kodów'],
      en: ['Three question themes for per-item choices, tables and follow-ups', 'A visual editor for visibility, required answers and comment rules', 'Each block uses one response field, including large matrices; long-format CSV export with a codebook'],
      de: ['Drei Fragendesigns für die Auswahl je Eintrag, Tabellen und Anschlussfragen', 'Visueller Editor für Sichtbarkeit, Pflichtangaben und Kommentarregeln', 'Jeder Block belegt ein Antwortfeld, auch bei großen Matrizen; CSV-Export im Langformat mit Codebuch'],
    },
    where: {
      pl: `LimeSurvey CE (sprawdzone na ${jsonQuestionsRelease.qualifiedOn.join(', ')})`,
      en: `LimeSurvey CE (tested on ${jsonQuestionsRelease.qualifiedOn.join(', ')})`,
      de: `LimeSurvey CE (getestet mit ${jsonQuestionsRelease.qualifiedOn.join(', ')})`,
    },
  },
  {
    id: 'LimeControlCrm',
    group: 'open',
    kind: 'plugin',
    suite: {
      main: 'crm',
      guide: 'limesurvey-plugins/limecontrol-crm/README.md',
      install: {
        pl: 'Wgraj ZIP w menedżerze wtyczek i aktywuj. Aktywacja tworzy tabele CRM w bazie tej instalacji, a wyłączenie wtyczki zachowuje dane.',
        en: 'Upload the ZIP in Plugin Manager and activate it. Activation creates the CRM tables in this installation’s database; deactivating the plugin keeps the data.',
        de: 'Laden Sie die ZIP-Datei im Plugin-Manager hoch und aktivieren Sie sie. Die Aktivierung legt die CRM-Tabellen in der Datenbank dieser Installation an; beim Deaktivieren bleiben die Daten erhalten.',
      },
    },
    title: { pl: 'CRM: firmy, kontakty i sprawy', en: 'CRM: companies, contacts and cases', de: 'CRM: Firmen, Kontakte und Fälle' },
    lead: {
      pl: 'Dodaje do panelu LimeSurvey pozycję CRM: firmy, kontakty, szanse sprzedaży, zadania i sprawy klientów. Po wypełnieniu formularza zapytanie z prośbą o kontakt trafia do wskazanego zespołu jako szansa sprzedaży lub sprawa obsługi.',
      en: 'Adds a CRM item to the LimeSurvey admin panel: companies, contacts, sales opportunities, tasks and customer cases. Once the inquiry form is submitted, a request to be contacted reaches the assigned team as a sales opportunity or a service case.',
      de: 'Ergänzt das LimeSurvey-Admin-Panel um den Menüpunkt CRM: Firmen, Kontakte, Verkaufschancen, Aufgaben und Kundenfälle. Nach dem Absenden des Anfrageformulars landet ein Kontaktwunsch beim zugewiesenen Team als Verkaufschance oder Servicefall.',
    },
    points: {
      pl: ['Zespoły oparte na grupach użytkowników LimeSurvey: kierownik widzi zespół, pracownik własne rekordy', 'Lejek sprzedaży, historia zmian i raport kwot osobno dla każdej waluty', 'Import kontaktów z CSV z podglądem duplikatów przed zapisem'],
      en: ['Teams built on LimeSurvey user groups: the manager sees the team, staff see their own records', 'A sales pipeline, change history and a report of amounts per currency', 'Contact import from CSV with a duplicate preview before saving'],
      de: ['Teams auf Basis von LimeSurvey-Benutzergruppen: die Leitung sieht das Team, Mitarbeitende ihre eigenen Datensätze', 'Vertriebstrichter, Änderungsverlauf und Betragsbericht je Währung', 'Kontaktimport aus CSV mit Dublettenvorschau vor dem Speichern'],
    },
    where: {
      pl: `LimeSurvey CE (sprawdzone na ${surveySuiteRelease.qualifiedOn.join(', ')})`,
      en: `LimeSurvey CE (tested on ${surveySuiteRelease.qualifiedOn.join(', ')})`,
      de: `LimeSurvey CE (getestet mit ${surveySuiteRelease.qualifiedOn.join(', ')})`,
    },
  },
  {
    id: 'LimeControlCrmDesk',
    group: 'open',
    kind: 'plugin',
    suite: {
      main: 'crmDesk',
      guide: 'limesurvey-plugins/limecontrol-crm-desk/README.md',
      install: {
        pl: 'Najpierw zainstaluj i aktywuj CRM, potem wgraj ten ZIP. Pocztę pobiera cykliczne polecenie konsoli LimeSurvey.',
        en: 'Install and activate the CRM first, then upload this ZIP. Mail is fetched by a scheduled LimeSurvey console command.',
        de: 'Installieren und aktivieren Sie zuerst das CRM, dann laden Sie diese ZIP-Datei hoch. E-Mails holt ein regelmäßig ausgeführter LimeSurvey-Konsolenbefehl ab.',
      },
    },
    title: { pl: 'Oferty, skrzynka zespołu i kalendarz', en: 'Quotes, team inbox and calendar', de: 'Angebote, Team-Postfach und Kalender' },
    lead: {
      pl: 'Rozszerzenie CRM dla handlowców i obsługi klienta: oferty w kolejnych wersjach z PDF, korespondencja ze wspólnej skrzynki przypisywana do spraw i terminy zadań w prywatnym kalendarzu.',
      en: 'A CRM extension for sales and customer service: quotes in successive versions with a PDF, mail from a shared inbox assigned to cases, and task deadlines in a private calendar feed.',
      de: 'Eine CRM-Erweiterung für Vertrieb und Kundenservice: Angebote in aufeinanderfolgenden Versionen mit PDF, E-Mails aus einem gemeinsamen Postfach, die Fällen zugeordnet werden, und Aufgabentermine in einem privaten Kalender-Feed.',
    },
    points: {
      pl: ['Wersje oferty z pozycjami, walutą, PDF i zapisaną decyzją klienta', 'Poczta z IMAP przez TLS (tylko odczyt) lub z katalogu Maildir, bez załączników', 'Subskrypcja ICS własnych zadań; nowy adres unieważnia poprzedni'],
      en: ['Quote versions with line items, currency, a PDF and the customer’s recorded decision', 'Mail from IMAP over TLS (read-only) or a Maildir folder, without attachments', 'An ICS subscription to your own tasks; a new address revokes the previous one'],
      de: ['Angebotsversionen mit Positionen, Währung, PDF und erfasster Kundenentscheidung', 'E-Mails per IMAP über TLS (nur lesend) oder aus einem Maildir-Ordner, ohne Anhänge', 'ICS-Abonnement der eigenen Aufgaben; eine neue Adresse macht die vorherige ungültig'],
    },
    where: {
      pl: `LimeSurvey CE z wtyczką CRM (sprawdzone na ${surveySuiteRelease.qualifiedOn.join(', ')})`,
      en: `LimeSurvey CE with the CRM plugin (tested on ${surveySuiteRelease.qualifiedOn.join(', ')})`,
      de: `LimeSurvey CE mit dem CRM-Plugin (getestet mit ${surveySuiteRelease.qualifiedOn.join(', ')})`,
    },
  },
  {
    id: 'LimeControlFeedback',
    group: 'open',
    kind: 'plugin',
    suite: {
      main: 'feedback',
      extras: ['surveys', 'woocommerce', 'prestashop', 'opencart', 'shopify', 'shoper'],
      guide: 'limesurvey-plugins/limecontrol-feedback/README.md',
      install: {
        pl: 'Wgraj ZIP w menedżerze wtyczek, zaimportuj szablony ankiet i zainstaluj konektor swojego sklepu. Kolejkę zaproszeń obsługuje cron LimeSurvey.',
        en: 'Upload the ZIP in Plugin Manager, import the survey templates and install your shop’s connector. The invitation queue runs from the LimeSurvey cron.',
        de: 'Laden Sie die ZIP-Datei im Plugin-Manager hoch, importieren Sie die Umfragevorlagen und installieren Sie den Konnektor Ihres Shops. Die Einladungswarteschlange läuft über den LimeSurvey-Cron.',
      },
      note: {
        pl: 'WooCommerce 8.0, PrestaShop 8.1 i OpenCart 4.1 sprawdzono na lokalnych sklepach. Konektory Shopify i Shoper sprawdzono na odtworzonych odpowiedziach API — próba na koncie sprzedawcy jest jeszcze przed nami.',
        en: 'WooCommerce 8.0, PrestaShop 8.1 and OpenCart 4.1 were tested on local shops. The Shopify and Shoper connectors were tested against replayed API responses — a trial on a merchant account is still to come.',
        de: 'WooCommerce 8.0, PrestaShop 8.1 und OpenCart 4.1 wurden mit lokalen Shops getestet. Die Konnektoren für Shopify und Shoper wurden mit nachgestellten API-Antworten getestet — ein Test mit einem Händlerkonto steht noch aus.',
      },
    },
    title: { pl: 'Opinie klientów sklepu', en: 'Customer feedback for online shops', de: 'Kundenfeedback für Onlineshops' },
    lead: {
      pl: 'Wysyła ankiety po zakupie, po doręczeniu, po czasie użytkowania produktu i po zwrocie — na podstawie zamówień ze sklepu. Raport pokazuje CSAT, NPS i oceny wariantów obok przyczyn zwrotów. Działa samodzielnie albo razem z CRM.',
      en: 'Sends surveys after a purchase, after delivery, after a period of product use and after a return — based on the shop’s orders. The report shows CSAT, NPS and variant ratings next to return reasons. It works on its own or together with the CRM.',
      de: 'Versendet Umfragen nach dem Kauf, nach der Zustellung, nach einer Nutzungsdauer des Produkts und nach einer Rücksendung — auf Basis der Shop-Bestellungen. Der Bericht zeigt CSAT, NPS und Variantenbewertungen neben den Rücksendegründen. Funktioniert eigenständig oder zusammen mit dem CRM.',
    },
    points: {
      pl: ['Konektory WooCommerce, PrestaShop, OpenCart, Shopify i Shoper z podpisanymi zdarzeniami zamówień', 'Jedno zaproszenie na zamówienie i kampanię, minimalny odstęp między kampaniami i rezygnacja z potwierdzeniem', 'Jeśli klient zgodzi się na kontakt, zgłoszenie zwrotu lub niska ocena w ankiecie imiennej tworzy sprawę obsługi — w samej wtyczce albo w CRM'],
      en: ['WooCommerce, PrestaShop, OpenCart, Shopify and Shoper connectors with signed order events', 'One invitation per order and campaign, a minimum gap between campaigns and a confirmed opt-out', 'If the customer agrees to be contacted, a return request or a low rating in a named survey opens a service case — in the plugin itself or in the CRM'],
      de: ['Konnektoren für WooCommerce, PrestaShop, OpenCart, Shopify und Shoper mit signierten Bestellereignissen', 'Eine Einladung pro Bestellung und Kampagne, ein Mindestabstand zwischen Kampagnen und eine bestätigte Abmeldung', 'Stimmt der Kunde einer Kontaktaufnahme zu, eröffnet ein Rücksendewunsch oder eine niedrige Bewertung in einer namentlichen Umfrage einen Servicefall — im Plugin selbst oder im CRM'],
    },
    where: {
      pl: `LimeSurvey CE (sprawdzone na ${surveySuiteRelease.qualifiedOn.join(', ')}) i Twój sklep`,
      en: `LimeSurvey CE (tested on ${surveySuiteRelease.qualifiedOn.join(', ')}) and your shop`,
      de: `LimeSurvey CE (getestet mit ${surveySuiteRelease.qualifiedOn.join(', ')}) und Ihr Shop`,
    },
  },
  {
    id: 'StrefaWorkspace',
    group: 'strefa',
    kind: 'plugin',
    title: { pl: 'Menu badania', en: 'Study menu', de: 'Studienmenü' },
    lead: {
      pl: 'Łączy ankietę LimeSurvey z badaniem w StrefieAnkiet i dodaje do menu ankiety skróty do całego warsztatu.',
      en: 'Links a LimeSurvey survey to a study in StrefaAnkiet and adds shortcuts to the whole workspace to the survey menu.',
      de: 'Verknüpft eine LimeSurvey-Umfrage mit einer Studie in StrefaAnkiet und ergänzt das Umfragemenü um Verknüpfungen zum gesamten Arbeitsbereich.',
    },
    points: {
      pl: ['Realizacja CAWI, CATI i CAPI, wyniki, analizy, respondenci i zespół — z poziomu ankiety', 'Jawne mapowanie numeru ankiety (SID) na badanie', 'Linki nie nadają uprawnień — obowiązują role z platformy'],
      en: ['CAWI, CATI and CAPI fieldwork, results, analyses, respondents and team — from within the survey', 'An explicit mapping of the survey ID (SID) to a study', 'Links grant no permissions — the platform roles still apply'],
      de: ['CAWI-, CATI- und CAPI-Feldarbeit, Ergebnisse, Analysen, Befragte und Team — direkt aus der Umfrage', 'Eine explizite Zuordnung der Umfrage-ID (SID) zu einer Studie', 'Links vergeben keine Rechte — es gelten die Rollen der Plattform'],
    },
    where: { pl: 'Przestrzeń zespołu w StrefieAnkiet', en: 'The team workspace in StrefaAnkiet', de: 'Team-Arbeitsbereich in StrefaAnkiet' },
  },
  {
    id: 'StrefaInvitationRelay',
    group: 'strefa',
    kind: 'plugin',
    title: { pl: 'Wysyłki przez Amazon SES', en: 'Mailing through Amazon SES', de: 'Versand über Amazon SES' },
    lead: {
      pl: 'Zaproszenia i przypomnienia LimeSurvey wysyłane kanałem Amazon SES Twojej firmy w StrefieAnkiet — bez zmiany sposobu pracy z uczestnikami.',
      en: 'LimeSurvey invitations and reminders sent through your company’s Amazon SES channel in StrefaAnkiet — without changing how you work with participants.',
      de: 'Einladungen und Erinnerungen aus LimeSurvey, verschickt über den Amazon-SES-Kanal Ihres Unternehmens in StrefaAnkiet — ohne die Arbeit mit Teilnehmern zu ändern.',
    },
    points: {
      pl: ['Odbiorcy, tokeny i treści zostają w LimeSurvey', 'Potwierdzenia doręczeń, odbicia i skargi w historii wysyłek; ochrona przed podwójną wysyłką', 'Klucze AWS pozostają po stronie platformy'],
      en: ['Recipients, tokens and content stay in LimeSurvey', 'Delivery confirmations, bounces and complaints in the mailing history; protection against duplicate sending', 'AWS keys stay on the platform side'],
      de: ['Empfänger, Tokens und Inhalte bleiben in LimeSurvey', 'Zustellbestätigungen, Bounces und Beschwerden im Versandverlauf; Schutz vor doppeltem Versand', 'AWS-Schlüssel bleiben auf der Plattformseite'],
    },
    where: { pl: 'Zarządzany Amazon SES', en: 'Managed Amazon SES', de: 'Verwaltetes Amazon SES' },
  },
  {
    id: 'StrefaResearch',
    group: 'strefa',
    kind: 'plugin',
    title: { pl: 'Realizacja CATI i CAPI, analizy', en: 'CATI and CAPI fieldwork, analysis', de: 'CATI- und CAPI-Feldarbeit, Analyse' },
    lead: {
      pl: 'Panel pracy badawczej osadzony w LimeSurvey: przydziały ankieterów, koordynacja rozmów telefonicznych i analiza odpowiedzi.',
      en: 'A research workspace embedded in LimeSurvey: interviewer assignments, telephone fieldwork coordination and response analysis.',
      de: 'Ein in LimeSurvey eingebetteter Forschungsarbeitsplatz: Interviewer-Zuteilungen, Koordination der Telefonfeldarbeit und Antwortanalyse.',
    },
    points: {
      pl: ['CAPI: przydziały, cele i terminy dla ankieterów; wywiad w natywnej ankiecie LimeSurvey', 'CATI: próba, kolejka spraw, przydziały, oddzwonienia i kwoty próby w jednym widoku', 'Analiza: wersje zbiorów danych, słownik zmiennych, analizy w R, raporty'],
      en: ['CAPI: assignments, targets and deadlines for interviewers; the interview runs in the native LimeSurvey survey', 'CATI: sample, case queue, assignments, callbacks and sample quotas in one view', 'Analysis: dataset versions, variable dictionary, analyses in R, reports'],
      de: ['CAPI: Zuteilungen, Ziele und Fristen für Interviewer; das Interview läuft in der nativen LimeSurvey-Umfrage', 'CATI: Stichprobe, Fallwarteschlange, Zuteilungen, Rückrufe und Stichprobenquoten in einer Ansicht', 'Analyse: Datensatzversionen, Variablenverzeichnis, Analysen in R, Berichte'],
    },
    where: { pl: 'Telefonia VoIP (CATI), praca w terenie (CAPI), analizy', en: 'VoIP telephony (CATI), fieldwork (CAPI), analysis', de: 'VoIP-Telefonie (CATI), Feldarbeit (CAPI), Analyse' },
  },
];

const jsonQuestions = PLUGINS.find((plugin) => plugin.release === jsonQuestionsRelease);

const S = {
  pl: {
    title: 'Wtyczki StrefaAnkiet dla LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'Darmowe, otwarte wtyczki StrefaAnkiet dla LimeSurvey: wysyłka przez Amazon SES, VoIP do CATI, ankieterzy CAPI i analiza wyników. Płatne jest tylko konto.',
    ogDescription: 'Wtyczki StrefaAnkiet dla LimeSurvey są bezpłatne i mają otwarty kod. Łączą ankietę z platformą StrefaAnkiet: zarządzana wysyłka przez Amazon SES, telefonia VoIP do wywiadów CATI, praca ankieterów CAPI i analiza wyników. Płatne jest konto i usługi platformy.',
    ogTitle: 'Darmowe wtyczki łączące LimeSurvey ze StrefąAnkiet',
    eyebrow: 'Darmowe wtyczki dla LimeSurvey',
    h1: 'Wtyczki dla LimeSurvey. <span class="lime">Darmowe, z otwartym kodem</span>.',
    lead: 'Dwie grupy do wyboru. <strong>Otwarte wtyczki</strong> działają w Twoim LimeSurvey bez konta i bez rejestracji. <strong>Wtyczki StrefaAnkiet</strong> łączą ankietę z usługami platformy: zarządzaną wysyłką przez Amazon SES, telefonią VoIP do wywiadów CATI, pracą ankieterów w terenie i analizą wyników. Kod obu grup jest bezpłatny — płacisz tylko za konto i usługi StrefaAnkiet, z których korzystasz.',
    ctaDownload: 'Pobierz wtyczki',
    ctaAsk: 'Poproś o wtyczki',
    ctaPricing: 'Cennik StrefaAnkiet',
    meta: ['Wtyczki: 0 zł, otwarty kod', `Sprawdzone na LimeSurvey ${SUITE.testedOn}`, `PHP ${SUITE.php}+`, 'Dane zostają w Twoim LimeSurvey'],
    ids: { model: 'darmowe-i-platne', modes: 'tryby', plugins: 'wtyczki', strefa: 'strefaankiet', compare: 'porownanie', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'Jak to działa',
    modelH: 'Darmowe oprogramowanie, płatne usługi',
    modelP: 'Oprogramowanie instalujesz u siebie za darmo. Płatne jest to, czego nie da się rozdać jako kodu: infrastruktura wysyłkowa, telefonia i konto zespołu na platformie.',
    freeTag: 'Bezpłatnie',
    freeH: 'Wtyczki i narzędzia',
    freeP: 'Instalujesz je w swoim LimeSurvey i używasz bez ograniczeń czasowych.',
    freeList: [
      'Sześć wtyczek i narzędzi StrefaAnkiet oraz cztery wtyczki LimeControl dla LimeSurvey — z kodem źródłowym',
      'Wymiana kwestionariuszy, eksport odpowiedzi i konwertery działają bez konta',
      `Aplikacja LimeControl (iOS, Android, web), <a href="${ROUTES.themes.pl}">motywy</a> i <a href="${ROUTES.templates.pl}">szablony ankiet</a>`,
      `Zestawy wdrożeniowe Docker dla LimeSurvey i LimeControl`,
    ],
    paidTag: 'Konto StrefaAnkiet',
    paidH: 'Usługi platformy',
    paidP: 'Abonament platformy oraz usługi dodatkowe rozliczane według użycia. Zakres dobierasz do badania.',
    paidList: [
      '<strong>Zarządzany Amazon SES</strong> — podajesz nadawcę i dodajesz trzy rekordy DNS; bez własnego konta AWS i bez kluczy',
      '<strong>Telefonia VoIP do CATI</strong> — telefon w przeglądarce ankietera, serwer VoIP StrefyAnkiet, numer, połączenia i nagrania',
      '<strong>Praca w terenie (CAPI)</strong> — przydziały i cele ankieterów, aplikacja ankietera do pracy bez sieci',
      '<strong>Przestrzeń zespołu</strong> — projekty, role, kwoty między trybami, analizy w R i raporty PDF/DOCX',
    ],
    paidNote: 'Telefonia, masowe wysyłki, transkrypcja i AI wymagają osobnej konfiguracji i mają własne warunki rozliczenia.',
    ctaTalk: 'Porozmawiajmy',
    modesEyebrow: 'Tryby realizacji',
    modesH: 'Jedna ankieta, trzy sposoby zbierania odpowiedzi',
    modesP: 'Kwestionariusz i odpowiedzi pozostają w LimeSurvey. Zmienia się tylko to, kto i jak prowadzi wywiad.',
    modes: [
      ['CAWI', 'Ankieta internetowa', 'Respondent wypełnia ankietę sam, z linku lub zaproszenia e-mail. To natywny tryb LimeSurvey — w LimeControl aktywujesz ankietę, wysyłasz zaproszenia i śledzisz wyniki.', 'Darmowe w LimeControl'],
      ['CATI', 'Wywiad telefoniczny', 'Ankieter dzwoni i zapisuje odpowiedzi. Platforma dodaje próbę, kolejkę spraw, przydziały, oddzwonienia, telefon w przeglądarce i nagrania rozmów.', 'Darmowa wtyczka + telefonia StrefaAnkiet'],
      ['CAPI', 'Wywiad bezpośredni', 'Ankieter prowadzi wywiad na tablecie lub telefonie. Platforma dodaje przydziały z celami i terminami, potwierdzanie wywiadów oraz aplikację ankietera do pracy bez sieci.', 'Darmowa wtyczka + konto StrefaAnkiet'],
      ['Mixed-mode', 'Łączenie trybów', 'Jedno badanie realizowane kilkoma kanałami, ze wspólnymi kwotami, jednym zbiorem danych i analizą w R.', 'Konto StrefaAnkiet'],
    ],
    openEyebrow: 'Otwarte wtyczki',
    openH: 'Otwarte wtyczki do własnej instalacji LimeSurvey',
    openP: 'Instalujesz je w swoim LimeSurvey i używasz bez rejestracji i bez limitu czasu. Każdą instalujesz osobno — tylko te, których potrzebujesz. Pytania zależne JSON, CRM i opinie klientów sklepu to osobne wtyczki LimeControl z własnymi paczkami do pobrania.',
    strefaEyebrow: 'Wtyczki StrefaAnkiet',
    strefaH: 'Łączą LimeSurvey z usługami StrefyAnkiet',
    strefaP: 'Wtyczki są darmowe i mają otwarty kod, ale do działania potrzebują konta StrefaAnkiet. Respondent nadal wypełnia tę samą ankietę LimeSurvey — platforma dokłada wysyłkę, realizację wywiadów i analizy.',
    groupTag: { open: 'Bez konta', strefa: 'Konto StrefaAnkiet' },
    kind: { plugin: 'Wtyczka LimeSurvey', cli: 'Narzędzie wiersza poleceń' },
    whereLabel: { open: 'Działa w', strefa: 'Łączy z' },
    sharedNote: 'Wtyczki z pakietu nie dodają własnych tabel do bazy LimeSurvey.',
    releaseReady: (url) => `<strong>Pakiet StrefaAnkiet.</strong> Aktualne wydanie pakietu (${SUITE.version}) wraz z instrukcją instalacji jest dostępne w <a href="${url}" target="_blank" rel="noopener">publicznym repozytorium wtyczek</a>. Sprawdzone na LimeSurvey ${SUITE.testedOn}.`,
    releasePending: (mailto) => `<strong>Pakiet StrefaAnkiet.</strong> Pakiet jest w wersji kandydującej ${SUITE.version} (pilotaż), sprawdzony na LimeSurvey ${SUITE.testedOn}. Publiczne repozytorium z paczkami instalacyjnymi jest w przygotowaniu — do tego czasu <a href="${mailto}">napisz do nas</a>, a prześlemy wtyczki bezpłatnie razem z instrukcją.`,
    compareEyebrow: 'Co jest darmowe, a co płatne',
    compareH: 'Od darmowych narzędzi do usług platformy',
    compareP: 'Zacznij od tego, co darmowe. Konto StrefaAnkiet dołączasz, gdy badanie potrzebuje infrastruktury i zespołu.',
    compareHead: ['Potrzeba', 'Bezpłatnie — LimeControl i wtyczki', 'Płatnie — konto i usługi StrefaAnkiet'],
    compare: [
      ['Zarządzanie ankietami z telefonu', 'Aplikacja na iOS, Androida i web: aktywacja, harmonogram, uczestnicy, eksport', '—'],
      ['Wygląd ankiety', 'Osiem motywów WCAG 2.2 AA, w tym CATI i CAPI', '—'],
      ['Gotowe kwestionariusze', 'Dwanaście szablonów PL/EN, w tym szkielety CATI i CAPI', 'Biblioteka szablonów badań i raportów'],
      ['Połączenie LimeSurvey z platformą', 'Wtyczki: instalacja, aktualizacje i kod źródłowy', 'Konto organizacji z rolami zespołu'],
      ['Wysyłka zaproszeń', 'Poczta LimeSurvey, harmonogram zaproszeń i przypomnień w LimeControl', 'Zarządzany Amazon SES: nadawca we własnej domenie, potwierdzenia doręczeń, odbicia i skargi'],
      ['Wywiady telefoniczne', 'Motyw CATI ze skrótami klawiszowymi, szkielet wywiadu z wynikiem kontaktu', 'Kolejka spraw, przydziały, oddzwonienia, telefon VoIP w przeglądarce, serwer VoIP, nagrania'],
      ['Wywiady terenowe', 'Motyw CAPI i pętla wywiadów na tablecie (online)', 'Przydziały i cele ankieterów, potwierdzanie wywiadów, aplikacja do pracy bez sieci'],
      ['Kwoty i kontrola jakości', 'Natywne kwoty LimeSurvey', 'Kwoty łączone między trybami, kontrola jakości wywiadów'],
      ['Analiza wyników', 'Podsumowania i wykresy, eksport CSV / Excel / JSON, konwertery', 'Wersjonowane zbiory, analizy w R, raporty PDF i DOCX'],
      ['Serwer ankiet', 'Zestawy Docker do samodzielnej instalacji', `<a href="${homeUrl('pl', 'hosting')}">Wdrożenie i utrzymanie serwera ankietowego</a> przez strefabadan.pl`],
    ],
    connectEyebrow: 'Połączenie z LimeControl',
    connectH: 'Postęp realizacji w aplikacji',
    connectP: 'Jeśli ankieta jest powiązana z badaniem w StrefieAnkiet, LimeControl pokaże przy niej stan realizacji — bez otwierania panelu.',
    connectList: [
      '<strong>CAPI</strong> — ukończone wywiady, przydziały ankieterów i ich postęp względem celu.',
      '<strong>CATI</strong> — liczba spraw w kolejce, sprawy bez przydziału i sprawy wymagające uwagi.',
      '<strong>Tylko odczyt</strong> — aplikacja niczego nie zmienia w badaniu; potrzebuje klucza dostępu z zakresami <code>fieldwork.read</code> i <code>cati.read</code>.',
      '<strong>Klucz zostaje u Ciebie</strong> — jest trzymany wyłącznie w pamięci otwartej karty, tak jak hasła do LimeSurvey.',
    ],
    connectCta: 'Jak połączyć konto',
    startEyebrow: 'Jak zacząć',
    startH: 'Cztery kroki — trzy pierwsze są darmowe',
    start: [
      ['Przygotuj serwer ankiet', `Użyj własnej instancji LimeSurvey, darmowego zestawu Docker albo zleć nam <a href="${homeUrl('pl', 'hosting')}">wdrożenie i utrzymanie serwera</a>.`],
      ['Dodaj motyw i szablon', `Zainstaluj <a href="${ROUTES.themes.pl}#cati">motyw CATI lub CAPI</a> i zaimportuj <a href="${ROUTES.templates.pl}#wywiad-cati">szkielet wywiadu</a>.`],
      ['Zainstaluj darmowe wtyczki', 'Wgraj paczki w menedżerze wtyczek LimeSurvey i wskaż, która ankieta odpowiada któremu badaniu.'],
      ['Włącz usługi, gdy ich potrzebujesz', `Załóż konto StrefaAnkiet, skonfiguruj wysyłkę lub telefonię i śledź postęp w <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Planujesz badanie CATI lub CAPI?',
    ctaP: 'Opisz badanie — liczbę wywiadów, tryby i terminy. Odpowiemy, co zrobisz darmowymi narzędziami, a gdzie przyda się konto StrefaAnkiet.',
    mailSubject: 'Wtyczki StrefaAnkiet dla LimeSurvey',
    footerNote: 'StrefaAnkiet i LimeControl są rozwijane przez <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a>.',
  },
  en: {
    title: 'Free StrefaAnkiet plugins for LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'Free, open-source StrefaAnkiet plugins for LimeSurvey: Amazon SES mailing, VoIP for CATI, CAPI fieldwork and analysis. Only the platform account is paid.',
    ogDescription: 'The StrefaAnkiet plugins for LimeSurvey are free and open source. They connect a survey to the StrefaAnkiet platform: managed mailing through Amazon SES, VoIP telephony for CATI interviews, CAPI fieldwork and response analysis. The platform account and services are paid.',
    ogTitle: 'Free plugins that connect LimeSurvey with StrefaAnkiet',
    eyebrow: 'Free plugins for LimeSurvey',
    h1: 'Plugins for LimeSurvey. <span class="lime">Free and open source</span>.',
    lead: 'Two groups to choose from. <strong>Open plugins</strong> run in your LimeSurvey with no account and no sign-up. <strong>StrefaAnkiet plugins</strong> connect the survey to the platform’s services: managed mailing through Amazon SES, VoIP telephony for CATI interviews, interviewers in the field and analysis of the results. The code of both groups is free — you pay only for the StrefaAnkiet account and the services you use.',
    ctaDownload: 'Download the plugins',
    ctaAsk: 'Request the plugins',
    ctaPricing: 'StrefaAnkiet pricing',
    meta: ['Plugins: free, open source', `Tested on LimeSurvey ${SUITE.testedOnEn}`, `PHP ${SUITE.php}+`, 'Data stays in your LimeSurvey'],
    ids: { model: 'free-and-paid', modes: 'modes', plugins: 'plugins', strefa: 'strefaankiet', compare: 'compare', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'How it works',
    modelH: 'Free software, paid services',
    modelP: 'You install the software on your own server for free. What is paid is what cannot be handed out as code: mailing infrastructure, telephony and a team account on the platform.',
    freeTag: 'Free of charge',
    freeH: 'Plugins and tools',
    freeP: 'You install them in your LimeSurvey and use them with no time limit.',
    freeList: [
      'Six StrefaAnkiet plugins and tools plus four LimeControl plugins for LimeSurvey — with source code',
      'Questionnaire exchange, response export and the converters work without an account',
      `The LimeControl app (iOS, Android, web), <a href="${ROUTES.themes.en}">themes</a> and <a href="${ROUTES.templates.en}">survey templates</a>`,
      'Docker deployment kits for LimeSurvey and LimeControl',
    ],
    paidTag: 'StrefaAnkiet account',
    paidH: 'Platform services',
    paidP: 'A platform subscription plus add-on services billed by usage. You match the scope to your study.',
    paidList: [
      '<strong>Managed Amazon SES</strong> — you enter the sender and add three DNS records; no AWS account of your own and no keys',
      '<strong>VoIP telephony for CATI</strong> — a phone in the interviewer’s browser, the StrefaAnkiet VoIP server, a number, calls and recordings',
      '<strong>Fieldwork (CAPI)</strong> — interviewer assignments and targets, an interviewer app that works offline',
      '<strong>Team workspace</strong> — projects, roles, quotas across modes, analyses in R and PDF/DOCX reports',
    ],
    paidNote: 'Telephony, bulk mailing, transcription and AI need separate configuration and have their own billing terms.',
    ctaTalk: 'Let’s talk',
    modesEyebrow: 'Fieldwork modes',
    modesH: 'One survey, three ways to collect responses',
    modesP: 'The questionnaire and the responses stay in LimeSurvey. Only who conducts the interview, and how, changes.',
    modes: [
      ['CAWI', 'Web survey', 'Respondents complete the survey themselves, from a link or an email invitation. This is the native LimeSurvey mode — in LimeControl you activate the survey, send invitations and follow the results.', 'Free in LimeControl'],
      ['CATI', 'Telephone interview', 'An interviewer calls and records the answers. The platform adds a sample, a case queue, assignments, callbacks, an in-browser phone and call recordings.', 'Free plugin + StrefaAnkiet telephony'],
      ['CAPI', 'Face-to-face interview', 'An interviewer conducts the interview on a tablet or phone. The platform adds assignments with targets and deadlines, interview confirmation and an interviewer app that works offline.', 'Free plugin + StrefaAnkiet account'],
      ['Mixed-mode', 'Combining modes', 'One study run through several channels, with shared quotas, one dataset and analysis in R.', 'StrefaAnkiet account'],
    ],
    openEyebrow: 'Open plugins',
    openH: 'Open plugins for your own LimeSurvey installation',
    openP: 'You install them in your LimeSurvey and use them without signing up and with no time limit. Each one installs separately — only the ones you need. Dependent JSON questions, the CRM and shop customer feedback are separate LimeControl plugins with their own download packages.',
    strefaEyebrow: 'StrefaAnkiet plugins',
    strefaH: 'They connect LimeSurvey to StrefaAnkiet services',
    strefaP: 'The plugins are free and open source, but they need a StrefaAnkiet account to work. Respondents still complete the same LimeSurvey survey — the platform adds mailing, interview fieldwork and analysis.',
    groupTag: { open: 'No account', strefa: 'StrefaAnkiet account' },
    kind: { plugin: 'LimeSurvey plugin', cli: 'Command-line tool' },
    whereLabel: { open: 'Runs in', strefa: 'Connects to' },
    sharedNote: 'The suite’s plugins do not add their own tables to the LimeSurvey database.',
    releaseReady: (url) => `<strong>StrefaAnkiet suite.</strong> The current release of the suite (${SUITE.version}) and the installation guide are available in the <a href="${url}" target="_blank" rel="noopener">public plugin repository</a>. Tested on LimeSurvey ${SUITE.testedOnEn}.`,
    releasePending: (mailto) => `<strong>StrefaAnkiet suite.</strong> The suite is at release-candidate stage ${SUITE.version} (pilot), tested on LimeSurvey ${SUITE.testedOnEn}. A public repository with the installation packages is being prepared — until then <a href="${mailto}">write to us</a> and we will send you the plugins free of charge together with the guide.`,
    compareEyebrow: 'What is free and what is paid',
    compareH: 'From free tools to platform services',
    compareP: 'Start with what is free. Add a StrefaAnkiet account when a study needs infrastructure and a team.',
    compareHead: ['Need', 'Free — LimeControl and the plugins', 'Paid — StrefaAnkiet account and services'],
    compare: [
      ['Managing surveys from a phone', 'The iOS, Android and web app: activation, scheduling, participants, export', '—'],
      ['Survey look', 'Eight WCAG 2.2 AA themes, including CATI and CAPI', '—'],
      ['Ready-made questionnaires', 'Twelve EN/PL templates, including CATI and CAPI skeletons', 'A library of study and report templates'],
      ['Connecting LimeSurvey to the platform', 'The plugins: installation, updates and source code', 'An organisation account with team roles'],
      ['Sending invitations', 'LimeSurvey mail, scheduled invitations and reminders in LimeControl', 'Managed Amazon SES: a sender on your own domain, delivery confirmations, bounces and complaints'],
      ['Telephone interviews', 'The CATI theme with keyboard shortcuts, an interview skeleton with call outcome', 'Case queue, assignments, callbacks, in-browser VoIP phone, VoIP server, recordings'],
      ['Field interviews', 'The CAPI theme and the interview loop on a tablet (online)', 'Interviewer assignments and targets, interview confirmation, an offline app'],
      ['Quotas and quality control', 'Native LimeSurvey quotas', 'Quotas shared across modes, interview quality control'],
      ['Analysing results', 'Summaries and charts, CSV / Excel / JSON export, converters', 'Versioned datasets, analyses in R, PDF and DOCX reports'],
      ['Survey server', 'Docker kits for installing it yourself', `<a href="${homeUrl('en', 'hosting')}">Survey server deployment and maintenance</a> by strefabadan.pl`],
    ],
    connectEyebrow: 'Connecting with LimeControl',
    connectH: 'Fieldwork progress in the app',
    connectP: 'If a survey is linked to a study in StrefaAnkiet, LimeControl shows its fieldwork status — without opening the panel.',
    connectList: [
      '<strong>CAPI</strong> — completed interviews, interviewer assignments and their progress against the target.',
      '<strong>CATI</strong> — the number of cases in the queue, unassigned cases and cases that need attention.',
      '<strong>Read-only</strong> — the app changes nothing in the study; it needs an access key with the <code>fieldwork.read</code> and <code>cati.read</code> scopes.',
      '<strong>The key stays with you</strong> — it is kept only in the memory of the open tab, just like LimeSurvey passwords.',
    ],
    connectCta: 'How to connect your account',
    startEyebrow: 'Getting started',
    startH: 'Four steps — the first three are free',
    start: [
      ['Set up a survey server', `Use your own LimeSurvey instance, the free Docker kit, or let us handle <a href="${homeUrl('en', 'hosting')}">deployment and maintenance</a>.`],
      ['Add a theme and a template', `Install the <a href="${ROUTES.themes.en}#cati">CATI or CAPI theme</a> and import an <a href="${ROUTES.templates.en}#wywiad-cati">interview skeleton</a>.`],
      ['Install the free plugins', 'Upload the packages in the LimeSurvey plugin manager and state which survey belongs to which study.'],
      ['Switch services on when you need them', `Create a StrefaAnkiet account, set up mailing or telephony and follow the progress in <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Planning a CATI or CAPI study?',
    ctaP: 'Describe the study — the number of interviews, the modes and the dates. We will tell you what the free tools can do and where a StrefaAnkiet account helps.',
    mailSubject: 'StrefaAnkiet plugins for LimeSurvey',
    footerNote: 'StrefaAnkiet and LimeControl are developed by <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a>.',
  },
  de: {
    title: 'StrefaAnkiet-Plugins für LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'Kostenlose Open-Source-Plugins von StrefaAnkiet für LimeSurvey: Amazon-SES-Versand, VoIP für CATI, CAPI-Feldarbeit und Analyse. Nur das Plattformkonto kostet.',
    ogDescription: 'Die StrefaAnkiet-Plugins für LimeSurvey sind kostenlos und Open Source. Sie verbinden eine Umfrage mit der Plattform StrefaAnkiet: verwalteter Versand über Amazon SES, VoIP-Telefonie für CATI-Interviews, CAPI-Feldarbeit und Antwortanalyse. Kostenpflichtig sind das Plattformkonto und die Dienste.',
    ogTitle: 'Kostenlose Plugins, die LimeSurvey mit StrefaAnkiet verbinden',
    eyebrow: 'Kostenlose Plugins für LimeSurvey',
    h1: 'Plugins für LimeSurvey. <span class="lime">Kostenlos und Open Source</span>.',
    lead: 'Zwei Gruppen zur Auswahl. <strong>Offene Plugins</strong> laufen in Ihrem LimeSurvey ohne Konto und ohne Registrierung. <strong>StrefaAnkiet-Plugins</strong> verbinden die Umfrage mit den Diensten der Plattform: verwalteter Versand über Amazon SES, VoIP-Telefonie für CATI-Interviews, Interviewer im Feld und die Analyse der Ergebnisse. Der Code beider Gruppen ist kostenlos — bezahlt werden nur das StrefaAnkiet-Konto und die Dienste, die Sie nutzen.',
    ctaDownload: 'Plugins herunterladen',
    ctaAsk: 'Plugins anfordern',
    ctaPricing: 'Preise von StrefaAnkiet',
    meta: ['Plugins: kostenlos, Open Source', `Getestet mit LimeSurvey ${SUITE.testedOnDe}`, `PHP ${SUITE.php}+`, 'Daten bleiben in Ihrem LimeSurvey'],
    ids: { model: 'kostenlos-und-kostenpflichtig', modes: 'modi', plugins: 'plugins', strefa: 'strefaankiet', compare: 'vergleich', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'So funktioniert’s',
    modelH: 'Kostenlose Software, kostenpflichtige Dienste',
    modelP: 'Die Software installieren Sie kostenlos bei sich. Kostenpflichtig ist, was sich nicht als Code verschenken lässt: Versandinfrastruktur, Telefonie und ein Teamkonto auf der Plattform.',
    freeTag: 'Kostenlos',
    freeH: 'Plugins und Werkzeuge',
    freeP: 'Sie installieren sie in Ihrem LimeSurvey und nutzen sie ohne zeitliche Begrenzung.',
    freeList: [
      'Sechs StrefaAnkiet-Plugins und -Werkzeuge sowie vier LimeControl-Plugins für LimeSurvey — mit Quellcode',
      'Fragebogenaustausch, Antwortexport und Konverter funktionieren ohne Konto',
      `Die App LimeControl (iOS, Android, Web), <a href="${ROUTES.themes.de}">Designs</a> und <a href="${ROUTES.templates.de}">Umfragevorlagen</a>`,
      'Docker-Deployment-Kits für LimeSurvey und LimeControl',
    ],
    paidTag: 'StrefaAnkiet-Konto',
    paidH: 'Dienste der Plattform',
    paidP: 'Ein Plattform-Abonnement plus nutzungsabhängig abgerechnete Zusatzdienste. Den Umfang wählen Sie passend zur Studie.',
    paidList: [
      '<strong>Verwaltetes Amazon SES</strong> — Sie geben den Absender an und ergänzen drei DNS-Einträge; ohne eigenes AWS-Konto und ohne Schlüssel',
      '<strong>VoIP-Telefonie für CATI</strong> — ein Telefon im Browser des Interviewers, der VoIP-Server von StrefaAnkiet, eine Rufnummer, Anrufe und Aufzeichnungen',
      '<strong>Feldarbeit (CAPI)</strong> — Zuteilungen und Ziele für Interviewer, eine Interviewer-App, die offline funktioniert',
      '<strong>Team-Arbeitsbereich</strong> — Projekte, Rollen, modusübergreifende Quoten, Analysen in R und Berichte als PDF/DOCX',
    ],
    paidNote: 'Telefonie, Massenversand, Transkription und KI erfordern eine eigene Konfiguration und haben eigene Abrechnungsbedingungen.',
    ctaTalk: 'Sprechen wir darüber',
    modesEyebrow: 'Erhebungsmodi',
    modesH: 'Eine Umfrage, drei Wege zu Antworten',
    modesP: 'Fragebogen und Antworten bleiben in LimeSurvey. Es ändert sich nur, wer das Interview führt und wie.',
    modes: [
      ['CAWI', 'Online-Umfrage', 'Befragte füllen die Umfrage selbst aus, über einen Link oder eine E-Mail-Einladung. Das ist der native Modus von LimeSurvey — in LimeControl aktivieren Sie die Umfrage, versenden Einladungen und verfolgen die Ergebnisse.', 'Kostenlos in LimeControl'],
      ['CATI', 'Telefoninterview', 'Ein Interviewer ruft an und erfasst die Antworten. Die Plattform ergänzt Stichprobe, Fallwarteschlange, Zuteilungen, Rückrufe, ein Telefon im Browser und Gesprächsaufzeichnungen.', 'Kostenloses Plugin + Telefonie von StrefaAnkiet'],
      ['CAPI', 'Persönliches Interview', 'Ein Interviewer führt das Interview auf Tablet oder Smartphone. Die Plattform ergänzt Zuteilungen mit Zielen und Fristen, die Bestätigung von Interviews und eine Interviewer-App, die offline funktioniert.', 'Kostenloses Plugin + StrefaAnkiet-Konto'],
      ['Mixed-Mode', 'Modi kombinieren', 'Eine Studie über mehrere Kanäle, mit gemeinsamen Quoten, einem Datensatz und Analyse in R.', 'StrefaAnkiet-Konto'],
    ],
    openEyebrow: 'Offene Plugins',
    openH: 'Offene Plugins für Ihre eigene LimeSurvey-Installation',
    openP: 'Sie installieren sie in Ihrem LimeSurvey und nutzen sie ohne Registrierung und ohne zeitliche Begrenzung. Jedes wird einzeln installiert — nur die, die Sie brauchen. Abhängige JSON-Fragen, das CRM und das Shop-Kundenfeedback sind separate LimeControl-Plugins mit eigenen Download-Paketen.',
    strefaEyebrow: 'StrefaAnkiet-Plugins',
    strefaH: 'Sie verbinden LimeSurvey mit den Diensten von StrefaAnkiet',
    strefaP: 'Die Plugins sind kostenlos und Open Source, benötigen aber ein StrefaAnkiet-Konto. Befragte füllen weiterhin dieselbe LimeSurvey-Umfrage aus — die Plattform ergänzt Versand, Feldarbeit und Analysen.',
    groupTag: { open: 'Ohne Konto', strefa: 'StrefaAnkiet-Konto' },
    kind: { plugin: 'LimeSurvey-Plugin', cli: 'Kommandozeilen-Werkzeug' },
    whereLabel: { open: 'Läuft in', strefa: 'Verbindet mit' },
    sharedNote: 'Die Plugins des Pakets legen keine eigenen Tabellen in der LimeSurvey-Datenbank an.',
    releaseReady: (url) => `<strong>StrefaAnkiet-Paket.</strong> Die aktuelle Version des Pakets (${SUITE.version}) samt Installationsanleitung finden Sie im <a href="${url}" target="_blank" rel="noopener">öffentlichen Plugin-Repository</a>. Getestet mit LimeSurvey ${SUITE.testedOnDe}.`,
    releasePending: (mailto) => `<strong>StrefaAnkiet-Paket.</strong> Das Paket liegt als Release Candidate ${SUITE.version} vor (Pilotphase), getestet mit LimeSurvey ${SUITE.testedOnDe}. Ein öffentliches Repository mit den Installationspaketen ist in Vorbereitung — bis dahin <a href="${mailto}">schreiben Sie uns</a>, und wir senden Ihnen die Plugins kostenlos samt Anleitung.`,
    compareEyebrow: 'Was kostenlos ist und was nicht',
    compareH: 'Von kostenlosen Werkzeugen zu Plattformdiensten',
    compareP: 'Beginnen Sie mit dem, was kostenlos ist. Ein StrefaAnkiet-Konto kommt dazu, wenn eine Studie Infrastruktur und ein Team braucht.',
    compareHead: ['Bedarf', 'Kostenlos — LimeControl und die Plugins', 'Kostenpflichtig — StrefaAnkiet-Konto und Dienste'],
    compare: [
      ['Umfragen vom Smartphone verwalten', 'Die App für iOS, Android und Web: Aktivierung, Zeitplan, Teilnehmer, Export', '—'],
      ['Aussehen der Umfrage', 'Acht Designs nach WCAG 2.2 AA, darunter CATI und CAPI', '—'],
      ['Fertige Fragebögen', 'Zwölf Vorlagen (EN/PL), darunter Gerüste für CATI und CAPI', 'Eine Bibliothek mit Studien- und Berichtsvorlagen'],
      ['LimeSurvey mit der Plattform verbinden', 'Die Plugins: Installation, Updates und Quellcode', 'Ein Organisationskonto mit Teamrollen'],
      ['Einladungen versenden', 'LimeSurvey-Mail, geplante Einladungen und Erinnerungen in LimeControl', 'Verwaltetes Amazon SES: Absender in der eigenen Domain, Zustellbestätigungen, Bounces und Beschwerden'],
      ['Telefoninterviews', 'Das CATI-Design mit Tastenkürzeln, ein Interviewgerüst mit Kontaktergebnis', 'Fallwarteschlange, Zuteilungen, Rückrufe, VoIP-Telefon im Browser, VoIP-Server, Aufzeichnungen'],
      ['Feldinterviews', 'Das CAPI-Design und die Interview-Schleife auf dem Tablet (online)', 'Zuteilungen und Ziele für Interviewer, Bestätigung von Interviews, eine Offline-App'],
      ['Quoten und Qualitätskontrolle', 'Native LimeSurvey-Quoten', 'Modusübergreifende Quoten, Qualitätskontrolle der Interviews'],
      ['Ergebnisse analysieren', 'Übersichten und Diagramme, Export als CSV / Excel / JSON, Konverter', 'Versionierte Datensätze, Analysen in R, Berichte als PDF und DOCX'],
      ['Umfrageserver', 'Docker-Kits zur eigenen Installation', `<a href="${homeUrl('de', 'hosting')}">Einrichtung und Betreuung eines Umfrageservers</a> durch strefabadan.pl`],
    ],
    connectEyebrow: 'Verbindung mit LimeControl',
    connectH: 'Feldfortschritt in der App',
    connectP: 'Ist eine Umfrage mit einer Studie in StrefaAnkiet verknüpft, zeigt LimeControl deren Feldstatus — ohne das Panel zu öffnen.',
    connectList: [
      '<strong>CAPI</strong> — abgeschlossene Interviews, Interviewer-Zuteilungen und ihr Fortschritt gegenüber dem Ziel.',
      '<strong>CATI</strong> — die Zahl der Fälle in der Warteschlange, nicht zugeteilte Fälle und Fälle, die Aufmerksamkeit brauchen.',
      '<strong>Nur lesend</strong> — die App ändert nichts an der Studie; sie braucht einen Zugangsschlüssel mit den Scopes <code>fieldwork.read</code> und <code>cati.read</code>.',
      '<strong>Der Schlüssel bleibt bei Ihnen</strong> — er liegt nur im Speicher des geöffneten Tabs, genau wie LimeSurvey-Passwörter.',
    ],
    connectCta: 'So verbinden Sie Ihr Konto',
    startEyebrow: 'Erste Schritte',
    startH: 'Vier Schritte — die ersten drei sind kostenlos',
    start: [
      ['Umfrageserver bereitstellen', `Nutzen Sie Ihre eigene LimeSurvey-Instanz, das kostenlose Docker-Kit oder überlassen Sie uns <a href="${homeUrl('de', 'hosting')}">Einrichtung und Betreuung</a>.`],
      ['Design und Vorlage hinzufügen', `Installieren Sie das <a href="${ROUTES.themes.de}#cati">CATI- oder CAPI-Design</a> und importieren Sie ein <a href="${ROUTES.templates.de}#wywiad-cati">Interviewgerüst</a>.`],
      ['Kostenlose Plugins installieren', 'Laden Sie die Pakete im Plugin-Manager von LimeSurvey hoch und legen Sie fest, welche Umfrage zu welcher Studie gehört.'],
      ['Dienste bei Bedarf einschalten', `Legen Sie ein StrefaAnkiet-Konto an, richten Sie Versand oder Telefonie ein und verfolgen Sie den Fortschritt in <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Sie planen eine CATI- oder CAPI-Studie?',
    ctaP: 'Beschreiben Sie die Studie — Zahl der Interviews, Modi und Termine. Wir sagen Ihnen, was die kostenlosen Werkzeuge leisten und wo ein StrefaAnkiet-Konto hilft.',
    mailSubject: 'StrefaAnkiet-Plugins für LimeSurvey',
    footerNote: 'StrefaAnkiet und LimeControl werden von <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a> entwickelt.',
  },
};

export function renderPluginsPage(lang) {
  const s = S[lang];
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(s.mailSubject)}`;
  const primaryCta = PLUGINS_URL
    ? `<a class="btn btn-primary" href="${PLUGINS_URL}" target="_blank" rel="noopener">${s.ctaDownload}</a>`
    : `<a class="btn btn-primary" href="${mailto}">${s.ctaAsk}</a>`;
  const panel = (p) => (p.release ? downloadPanel(p.release, lang) : p.suite ? suitePanel(p.suite, lang) : '');
  const card = (p) => {
    if (p.page) return `<a class="card pcard is-open pcard-product" id="${p.id}" href="${ROUTES[p.page][lang]}" aria-labelledby="${p.id}-title">
            <span class="status is-free">${s.kind[p.kind]}</span>
            <h3 class="card-title" id="${p.id}-title">${esc(p.title)}</h3>
            <p>${esc(p.lead[lang])}</p>
            <strong class="pcard-foot">${esc(p.action[lang])} <b aria-hidden="true">→</b></strong>
          </a>`;
    return `<article class="card pcard is-${p.group}${panel(p) ? ' pcard-with-download' : ''}" id="${p.id}">${panel(p) ? '<div class="pcard-description">' : ''}
            <span class="status${p.group === 'open' ? ' is-free' : ''}">${s.kind[p.kind]}</span>
            <h3>${esc(p.title[lang])}</h3>
            <code class="pname">${p.id}</code>
            <p>${esc(p.lead[lang])}</p>
            <ul>
              ${p.points[lang].map((x) => `<li>${esc(x)}</li>`).join('\n              ')}
            </ul>
            <p class="pcard-foot"><span>${s.whereLabel[p.group]}</span> ${esc(p.where[lang])}</p>${panel(p) ? `</div>\n            ${panel(p)}` : ''}
          </article>`;
  };
  const pluginGroup = (group, id, eyebrow, h, p, cls, after = '') => `<section id="${id}"${cls ? ` class="${cls}"` : ''} aria-labelledby="${id}-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${eyebrow} <span class="group-tag is-${group}">${s.groupTag[group]}</span></span>
          <h2 id="${id}-h">${h}</h2>
          <p>${p}</p>
        </div>
        <div class="pgrid">
          ${PLUGINS.filter((x) => x.group === group).map(card).join('\n          ')}
        </div>
        ${after}
      </div>
    </section>`;
  const body = `
  <main id="main">
    <section class="hero hero-themes">
      <div class="container">
        <div>
          <span class="eyebrow">${s.eyebrow}</span>
          <h1>${s.h1}</h1>
          <p class="lead">${s.lead}</p>
          <div class="hero-cta">
            ${primaryCta}
            <a class="btn btn-ghost" href="#${jsonQuestions.id}">${esc(jsonQuestions.title[lang])}</a>
            <a class="btn btn-ghost" href="${STREFAANKIET_PRICING_URL}" rel="noopener">${s.ctaPricing}</a>
          </div>
          <ul class="hero-meta">
            ${s.meta.map((m) => `<li>${m}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

    ${pluginGroup('open', s.ids.plugins, s.openEyebrow, s.openH, s.openP, '')}

    ${pluginGroup('strefa', s.ids.strefa, s.strefaEyebrow, s.strefaH, s.strefaP, 'section-soft', `<div class="callout" style="margin-top:32px">
          <p>${PLUGINS_URL ? s.releaseReady(PLUGINS_URL) : s.releasePending(mailto)} ${s.sharedNote}</p>
        </div>`)}

    <section id="${s.ids.model}" aria-labelledby="model-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.modelEyebrow}</span>
          <h2 id="model-h">${s.modelH}</h2>
          <p>${s.modelP}</p>
        </div>
        <div class="grid grid-2">
          <article class="card host-card">
            <span class="tag">${s.freeTag}</span>
            <h3>${s.freeH}</h3>
            <p>${s.freeP}</p>
            <ul>
              ${s.freeList.map((li) => `<li>${li}</li>`).join('\n              ')}
            </ul>
            <div class="actions">
              ${primaryCta.replace('btn-primary', 'btn-ghost')}
            </div>
          </article>
          <article class="card host-card featured">
            <span class="tag">${s.paidTag}</span>
            <h3>${s.paidH}</h3>
            <p>${s.paidP}</p>
            <ul>
              ${s.paidList.map((li) => `<li>${li}</li>`).join('\n              ')}
            </ul>
            <p class="fineprint">${s.paidNote}</p>
            <div class="actions">
              <a class="btn btn-primary" href="${STREFAANKIET_PRICING_URL}" rel="noopener">${s.ctaPricing}</a>
              <a class="btn btn-ghost" href="${mailto}">${s.ctaTalk}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="${s.ids.modes}" class="section-soft" aria-labelledby="modes-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.modesEyebrow}</span>
          <h2 id="modes-h">${s.modesH}</h2>
          <p>${s.modesP}</p>
        </div>
        <div class="modes">
          ${s.modes.map(([abbr, h, p, more]) => `<article class="card">
            <div class="abbr">${abbr}</div>
            <h3>${h}</h3>
            <p>${p}</p>
            <p class="more">${more}</p>
          </article>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section id="${s.ids.compare}" aria-labelledby="compare-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.compareEyebrow}</span>
          <h2 id="compare-h">${s.compareH}</h2>
          <p>${s.compareP}</p>
        </div>
        <div class="table-scroll">
          <table class="compare">
            <thead>
              <tr>${s.compareHead.map((h) => `<th scope="col">${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${s.compare.map(([need, free, pro]) => `<tr><th scope="row">${need}</th><td>${free}</td><td>${pro}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section id="${s.ids.connect}" class="section-soft" aria-labelledby="connect-h">
      <div class="container split">
        <div>
          <span class="eyebrow">${s.connectEyebrow}</span>
          <h2 id="connect-h">${s.connectH}</h2>
          <p class="muted">${s.connectP}</p>
          <a class="btn btn-ghost" href="${ROUTES.docs[lang]}#strefaankiet">${s.connectCta}</a>
        </div>
        <ul class="checklist">
          ${s.connectList.map((li) => `<li><span>${li}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section id="${s.ids.start}" aria-labelledby="start-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.startEyebrow}</span>
          <h2 id="start-h">${s.startH}</h2>
        </div>
        <ol class="steps">
          ${s.start.map(([h, p]) => `<li>
            <h3>${h}</h3>
            <p>${p}</p>
          </li>`).join('\n          ')}
        </ol>
      </div>
    </section>

    <section style="padding-top:0">
      <div class="container">
        <div class="cta">
          <h2>${s.ctaH}</h2>
          <p>${s.ctaP}</p>
          <div class="cta-actions">
            <a class="btn btn-primary" href="${mailto}">${CONTACT_EMAIL}</a>
            <a class="btn btn-ghost" href="${STREFAANKIET_URL}" rel="noopener">strefaankiet.pl</a>
          </div>
        </div>
      </div>
    </section>
  </main>`;

  const html = layout({
    lang,
    page: 'plugins',
    title: s.title,
    description: s.description,
    ogTitle: s.ogTitle,
    ogDescription: s.ogDescription,
    extraHead: '<link rel="stylesheet" href="/assets/plugin-catalog.css?v=1" />',
    body,
    footerNote: s.footerNote,
  });
  return { path: outputPath('plugins', lang), html };
}
