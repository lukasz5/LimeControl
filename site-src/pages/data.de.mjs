// Deutsche Texte zu Motiven, Vorlagen und Kategorien — nur für die Website (site/de/).
// Die Daten in limesurvey-themes/themes.json und survey-templates/ (auch vom App-Katalog genutzt)
// bleiben zweisprachig PL/EN; hier stehen die Übersetzungen, die die deutsche Seite braucht.
// Fehlt ein Eintrag für ein neues Motiv/eine neue Vorlage, bricht der Build mit einer Meldung ab.

export const THEMES_DE = {
  medical: {
    summary: 'Ruhiges Petrol, größere Schrift und klare Felder — für Patientenbefragungen, Praxen und klinische Forschung.',
    description: 'Ein Design für Umfragen im Gesundheitswesen: ruhige Palette aus Petrol und Blau, 18 px Grundschrift und große Auswahlfelder. Konform mit WCAG 2.2 AA.',
    useCases: ['Patientenzufriedenheit', 'Fragebogen vor dem Termin', 'Klinische Forschung (PROM)'],
  },
  professional: {
    summary: 'Marineblau, Serifen-Überschriften und ein zurückhaltendes Layout — für B2B-Forschung, HR und Evaluationen in Organisationen.',
    description: 'Ein Business-Design: marineblaue Palette, Serifen-Überschriften und knappe Eckenradien. Konform mit WCAG 2.2 AA.',
    useCases: ['Mitarbeiterbefragungen (eNPS)', 'B2B-Umfragen', 'Schulungsevaluation'],
  },
  social: {
    summary: 'Warmes Violett, weiche Formen und Pillen-Buttons — für Communitys, NGOs und Meinungsforschung.',
    description: 'Ein Community-Design: warmes Violett, große Eckenradien und eine freundliche Anmutung. Konform mit WCAG 2.2 AA.',
    useCases: ['Bürgerbeteiligung', 'Umfragen für NGOs und Ehrenamtliche', 'Community-Feedback'],
  },
  marketing: {
    summary: 'Kräftiges Magenta, fette Überschriften und kontrastreiche Handlungsaufrufe — für Marken-, Produkt- und NPS-Forschung.',
    description: 'Ein Marketing-Design: leuchtendes Magenta, starke Typografie und kontrastreiche Buttons. Konform mit WCAG 2.2 AA.',
    useCases: ['NPS und Kundenzufriedenheit', 'Produktkonzepttests', 'Markenforschung'],
  },
  eco: {
    summary: 'Waldgrün auf Papierhintergrund — für Umweltforschung, ESG, Landwirtschaft und Tourismus.',
    description: 'Ein Öko-Design: Waldgrün, ein warmer Papierhintergrund und natürliche Eckenradien. Konform mit WCAG 2.2 AA.',
    useCases: ['ESG- und CSR-Forschung', 'Umweltkonsultationen', 'Tourismus und Landwirtschaft'],
  },
  minimalist: {
    summary: 'Schwarz, Weiß und viel Raum — ohne Schatten und Dekoration. Neutral für jede Studie.',
    description: 'Ein minimalistisches Design: Schwarz und Weiß, feine Linien, keine Schatten, maximaler Kontrast. Konform mit WCAG 2.2 AA (Text AAA).',
    useCases: ['Akademische Forschung', 'Interne Umfragen', 'Formulare ohne Branding'],
  },
  cati: {
    summary: 'Ein Bildschirm für Telefoninterviewer: breites, kompaktes Layout, hervorgehobene Skripte, feste Navigationsleiste und Tastenkürzel (1–9, Strg+Enter).',
    description: 'Ein Design für Telefoninterviews (CATI): kompaktes Desktop-Layout, hervorgehobene Interviewer-Hinweise, feste Navigation und Tastenkürzel. Konform mit WCAG 2.2 AA.',
    useCases: ['CATI-Telefoninterviews', 'Callcenter und Helpdesk', 'Erfassung von Papierfragebögen'],
  },
  capi: {
    summary: 'Tablets und Smartphones im Feld: 20 px Text, 56 px Touch-Flächen, maximaler Kontrast bei Sonnenlicht und feste Zurück/Weiter-Buttons.',
    description: 'Ein Design für persönliche Interviews (CAPI) und Kiosk-Stationen: große Schrift, 56 px Touch-Flächen, hoher Kontrast und feste Navigation. Konform mit WCAG 2.2 AA.',
    useCases: ['CAPI-Feldinterviews', 'Umfragen auf Tablet und Kiosk', 'Forschung im Geschäft'],
  },
};

export const TEMPLATES_DE = {
  'nps-klienta': {
    title: 'NPS — Kundenloyalität',
    summary: 'Klassische Net-Promoter-Score-Umfrage: Bewertung 0–10, eine zur Bewertung passende Nachfrage, ein berechnetes Segment (Promotor, Passiver, Kritiker) und die Einwilligung zur Kontaktaufnahme.',
  },
  'satysfakcja-klienta-csat': {
    title: 'Zufriedenheit mit dem Kundenservice (CSAT)',
    summary: 'Eine Umfrage nach dem Kontakt: CSAT 1–5, Kundenaufwand (CES), Lösung beim ersten Kontakt und eine Bewertung von vier Serviceaspekten.',
  },
  'zaangazowanie-pracownikow': {
    title: 'Mitarbeiterengagement und eNPS',
    summary: 'Eine Engagement-Umfrage: 17 Aussagen in drei Bereichen (die Arbeit, Führungskraft und Team, die Organisation), eNPS, zwei offene Fragen und optionale Demografie.',
  },
  'exit-interview': {
    title: 'Austrittsbefragung (Exit-Interview)',
    summary: 'Eine Umfrage für ausscheidende Mitarbeitende: Gründe für die Kündigung, was die Entscheidung hätte ändern können, eine Bewertung von sechs Arbeitsbereichen sowie Bereitschaft zu Weiterempfehlung und Rückkehr.',
  },
  'ewaluacja-szkolenia': {
    title: 'Schulungsevaluation',
    summary: 'Eine Umfrage nach der Schulung: Gesamtbewertung, Ziele, Trainer, Organisation, Weiterempfehlungsbereitschaft (NPS) und Vorschläge für künftige Themen.',
  },
  'ocena-wydarzenia': {
    title: 'Feedback zu Veranstaltung oder Konferenz',
    summary: 'Eine Umfrage für Teilnehmende einer Veranstaltung: Zufriedenheit, Erwartungen, eine Bewertung von sechs Elementen, wie sie von der Veranstaltung erfahren haben, und die Absicht, wiederzukommen.',
  },
  'ocena-zajec': {
    title: 'Lehrveranstaltungsevaluation',
    summary: 'Eine Evaluation durch Studierende: Organisation der Lehrveranstaltung, Lehrperson, Arbeitsaufwand und Anwesenheit sowie zwei offene Fragen.',
  },
  'satysfakcja-pacjenta': {
    title: 'Patientenzufriedenheit nach dem Besuch',
    summary: 'Eine Umfrage für Gesundheitseinrichtungen nach dem Besuch: Anmeldung und Wartezeit, Kommunikation mit der Ärztin oder dem Arzt, die Einrichtung, Gesamtbewertung und Weiterempfehlungsbereitschaft. Es werden keine Gesundheitsdaten erhoben.',
  },
  'sus-uzytecznosc': {
    title: 'SUS — System Usability Scale',
    summary: 'Der Standardfragebogen System Usability Scale (10 Aussagen, Skala 1–5). Der Wert 0–100 wird automatisch im Feld SUSSCORE berechnet.',
  },
  'test-koncepcji-produktu': {
    title: 'Produktkonzepttest',
    summary: 'Eine Studie zu einem neuen Konzept: Attraktivität, Einzigartigkeit, Relevanz, Kaufabsicht und vier Preisfragen nach der Van-Westendorp-Methode (PSM).',
  },
  'wywiad-cati': {
    title: 'CATI-Telefoninterview — Skript mit Kontaktergebnis',
    summary: 'Ein Gerüst für Telefoninterviews: Einleitungsskript, Kontaktergebnis (Interview, Rückruf, Verweigerung), Einwilligung, ein Frageblock, Demografie und Interviewernotizen. Mit Teilnehmerfeldern: Telefon, Kontaktstatus, Rückrufzeit, Notiz.',
  },
  'wywiad-capi': {
    title: 'CAPI-Interview — Feldstudie',
    summary: 'Ein Gerüst für Feldinterviews am Tablet: Interviewdaten (Interviewer, Sampling Point, Ort), Einwilligung, Screening, ein Frageblock mit Vorlagekarten und Ranking, Demografie und Beobachtungen nach dem Interview.',
  },
};

export const CATEGORIES_DE = {
  'customer-satisfaction': 'Kundenzufriedenheit',
  hr: 'HR und Mitarbeitende',
  events: 'Veranstaltungen und Schulungen',
  education: 'Bildung',
  health: 'Gesundheit',
  research: 'Forschung und UX',
  fieldwork: 'CATI und CAPI',
};

/** Übersetzung eines Datensatzes: PL/EN aus den Quelldaten, DE aus den Tabellen oben. */
export function localized(record, field, lang, table, kind) {
  if (lang !== 'de') return record[field][lang];
  const value = table[record.id]?.[field];
  if (value === undefined) throw new Error(`site-src/pages/data.de.mjs: keine deutsche Übersetzung für ${kind} „${record.id}“ (${field})`);
  return value;
}

export function categoryLabel(category, lang) {
  if (lang !== 'de') return category.label[lang];
  const value = CATEGORIES_DE[category.id];
  if (!value) throw new Error(`site-src/pages/data.de.mjs: keine deutsche Bezeichnung für die Kategorie „${category.id}“`);
  return value;
}
