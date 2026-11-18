// Podstrony z motywami ankiet: site/szablony.html (PL) i site/en/themes.html (EN).
// Dane (palety, rozmiary paczek, kontrasty) pochodzą z limesurvey-themes/build.mjs.
import { APP_URL, ROUTES, absolute, esc, homeUrl, layout, outputPath } from '../chrome.mjs';

const kb = (n) => `${Math.max(1, Math.round(n / 1024))} kB`;
const NUMBER_WORDS = {
  pl: { 6: 'Sześć', 7: 'Siedem', 8: 'Osiem', 9: 'Dziewięć', 10: 'Dziesięć', 11: 'Jedenaście', 12: 'Dwanaście' },
  en: { 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve' },
};

const S = {
  pl: {
    ratio: (r) => `${r.toFixed(1).replace('.', ',')}:1`,
    title: 'Darmowe motywy ankiet dla LimeSurvey zgodne z WCAG 2.2 — LimeControl',
    description: (n, names) => `${n} darmowych, responsywnych motywów ankiet dla LimeSurvey 6 i 7: ${names}. Zgodne z WCAG 2.2 AA, z trybem ankietera CATI/CAPI. Pobierz ZIP i zainstaluj w swojej instancji.`,
    ogTitle: 'Darmowe motywy ankiet dla LimeSurvey — WCAG 2.2 AA',
    ogDescription: (names) => `${names}. Responsywne, czytelne, gotowe do importu.`,
    listName: 'Motywy ankiet dla LimeSurvey od LimeControl',
    views: { desktop: 'Komputer', mobile: 'Telefon', errors: 'Błąd' },
    alts: {
      desktop: (l) => `Motyw ${l} na komputerze: pytanie jednokrotnego wyboru z zaznaczoną odpowiedzią`,
      mobile: (l) => `Motyw ${l} na telefonie (szerokość 390 px)`,
      errors: (l) => `Motyw ${l}: pytanie obowiązkowe bez odpowiedzi — czerwone obramowanie, ikona i komunikat`,
    },
    previewOf: (l) => `Podgląd motywu ${l}`,
    useCases: 'Zastosowania',
    palette: 'Paleta kolorów',
    swatch: { primary: 'Akcent', text: 'Tekst', bg: 'Tło' },
    contrast: (rep, r) => `<strong>Kontrast:</strong> tekst ${r(rep.body)} · przycisk ${r(rep.btn)} · minimum ${r(rep.minText)}`,
    downloadAria: (l, v, id, size) => `Pobierz ${l} dla LimeSurvey ${v} (lc_${id}.zip, ${size})`,
    eyebrow: 'Motywy ankiet dla LimeSurvey',
    h1: 'Ankiety, które <span class="lime">każdy przeczyta</span> — na telefonie i&nbsp;komputerze.',
    lead: (n, install) => `${n} darmowych motywów dla LimeSurvey&nbsp;6 i&nbsp;7 zbudowanych na jednym, przetestowanym wzorcu: duże pola odpowiedzi, wyraźny fokus, czytelne błędy i&nbsp;kontrast zgodny z&nbsp;WCAG&nbsp;2.2&nbsp;AA. Pobierz ZIP dla swojej wersji, zaimportuj w&nbsp;panelu i&nbsp;gotowe. <a href="#${install}">Instrukcja instalacji</a>.`,
    allFor: (v, size) => `Wszystkie dla LimeSurvey ${v} (${size})`,
    meta: (versions) => ['WCAG 2.2 AA', `LimeSurvey ${versions}`, 'Responsywne od 320 px', 'Tryb ankietera CATI/CAPI', 'Bez zewnętrznych fontów i skryptów', 'Licencja GPL'],
    and: ' i ',
    ids: { gallery: 'motywy', a11y: 'dostepnosc', interviewer: 'tryb-ankietera', install: 'instalacja' },
    galleryEyebrow: 'Galeria',
    galleryH: 'Wybierz motyw',
    galleryP: (tested) => `Zrzuty pochodzą z prawdziwej instalacji LimeSurvey. Każdy motyw sprawdziliśmy na LimeSurvey ${tested}. Przełącz podgląd, żeby zobaczyć widok na telefonie i komunikat o&nbsp;błędzie.`,
    a11yEyebrow: 'Dostępność',
    a11yH: 'Wspólny, sprawdzony wzorzec',
    a11yP: [
      'Wszystkie motywy dzielą jeden arkusz bazowy (<code>lc-base.css</code>) i skrypt <code>lc-a11y.js</code>. Różnią się tylko kolorami, typografią, zaokrągleniami i układem — dlatego zachowują się tak samo i są tak samo dostępne.',
      'Kontrast każdej palety jest sprawdzany automatycznie przy budowaniu paczek — motyw, który nie spełnia progów, nie zostanie wydany.',
    ],
    a11yList: [
      '<strong>Kontrast</strong> tekstu min. 4,5:1, obramowań pól i&nbsp;fokusu min. 3:1 (WCAG 1.4.3, 1.4.11).',
      '<strong>Widoczny fokus</strong> — 3&nbsp;px obrys z&nbsp;odstępem przy nawigacji klawiaturą (2.4.7, 2.4.13).',
      '<strong>Cele dotykowe ≥&nbsp;44&nbsp;px</strong>; cały kafelek odpowiedzi jest klikalny (2.5.8).',
      '<strong>Błędy nie tylko kolorem</strong> — obramowanie, ikona i&nbsp;tekst; fokus przenosi się na pierwsze pytanie z&nbsp;błędem, pole dostaje <code>aria-invalid</code> (1.4.1, 3.3.1).',
      '<strong>Natywne pola wyboru</strong> — działają w&nbsp;trybie wysokiego kontrastu Windows i&nbsp;z&nbsp;czytnikami ekranu.',
      '<strong>Reflow</strong> — brak przewijania w&nbsp;poziomie od 320&nbsp;px; szerokie tabele przewijają się w&nbsp;swoim kontenerze (1.4.10).',
      '<strong>Link „Przejdź do pytań”</strong>, opisane pytania obowiązkowe, nazwa przycisku menu (2.4.1, 4.1.2).',
      '<strong>Sześć języków interfejsu motywu</strong> — polski, angielski, niemiecki, francuski, hiszpański i&nbsp;ukraiński; wybierane według języka ankiety.',
      '<strong>Preferencje użytkownika</strong> — <code>prefers-reduced-motion</code>, <code>forced-colors</code>, druk.',
      '<strong>RODO-friendly</strong> — fonty systemowe, żadnych CDN ani skryptów śledzących.',
    ],
    ivEyebrow: 'CATI i CAPI',
    ivH: 'Tryb ankietera w każdym motywie',
    ivP: (templates, plugins) => `Motywy <strong>CATI</strong> i <strong>CAPI</strong> są zaprojektowane dla ankieterów, ale ich mechanizmy działają we wszystkich motywach LimeControl. Gotowe kwestionariusze znajdziesz w <a href="${templates}">szablonach ankiet</a>, a kolejkę rozmów, telefonię, przydziały i kwoty daje platforma StrefaAnkiet, którą łączą z LimeSurvey <a href="${plugins}">darmowe wtyczki</a>.`,
    ivCards: [
      ['Skrypty i pola ankietera', 'Nadaj pytaniu klasę CSS <code>lc-interviewer</code> (<em>Ustawienia pytania → Wyświetlanie → Klasa CSS</em>), a motyw wyróżni je przerywaną ramką jako tekst do odczytania lub pole wypełniane przez ankietera.'],
      ['Przyklejona nawigacja', 'W motywach CATI i CAPI przyciski <em>Wstecz</em> i <em>Dalej</em> zostają przy dolnej krawędzi ekranu — także na telefonie, gdzie mieszczą się w jednym rzędzie.'],
      ['Skróty klawiszowe (CATI)', 'Klawisze <kbd>1</kbd>–<kbd>9</kbd> wybierają odpowiedź, w tablicach fokus sam przechodzi do następnego wiersza. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to „Dalej”, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> — „Wstecz”. Skróty można wyłączyć w pasku nawigacji.'],
      ['Tablet w terenie (CAPI)', 'Tekst 20&nbsp;px, pola dotykowe 56&nbsp;px i czarno-biała paleta z jednym mocnym akcentem — czytelna także w ostrym słońcu.'],
    ],
    installEyebrow: 'Instalacja',
    installH: 'Zainstaluj motyw w swoim LimeSurvey',
    installP: 'Potrzebujesz konta superadministratora (lub uprawnienia do importu motywów) i&nbsp;LimeSurvey 6.x albo 7.x z&nbsp;wbudowanym motywem <em>Fruity TwentyThree</em>.',
    steps: [
      ['Pobierz ZIP dla swojej wersji', 'Wersję LimeSurvey widać w&nbsp;stopce panelu administracyjnego. Pobierz wariant <strong>7.x</strong> albo <strong>6.x</strong> i&nbsp;<strong>nie zmieniaj nazwy pliku</strong> — LimeSurvey nazywa katalog motywu tak jak plik (np. <code>lc_medical</code>).'],
      ['Prześlij do LimeSurvey', '<em>Konfiguracja → Motywy</em>, zakładka <em>Motywy ankiet</em>, przycisk <strong>Prześlij i&nbsp;zainstaluj</strong>. Wskaż plik ZIP i&nbsp;potwierdź.'],
      ['Wybierz w ankiecie', 'W&nbsp;ankiecie: <em>Ustawienia ankiety → Ogólne → Motyw</em>, wybierz np. „LimeControl Medical” i&nbsp;zapisz. W&nbsp;aplikacji LimeControl zrobisz to jednym dotknięciem.'],
      ['Dodaj logo', 'W&nbsp;ankiecie <em>Opcje motywu → Obrazy</em>: ustaw <em>Logo: Tak</em> i&nbsp;wgraj plik PNG lub JPG.'],
    ],
    callout: '<strong>Dlaczego dwa warianty?</strong> LimeSurvey&nbsp;7 dodał do motywu bazowego nowe opcje (kolory, zaokrąglenia, ikony, zawijanie tabel), a&nbsp;formularz <em>Opcje motywu</em> pokazuje tylko opcje opisane w&nbsp;paczce. Wygląd i&nbsp;dostępność są w&nbsp;obu wariantach identyczne — różni się tylko lista opcji w&nbsp;panelu. Wariant 6.x nie jest oznaczony jako zgodny z&nbsp;LimeSurvey&nbsp;7 i&nbsp;odwrotnie.',
    more: [
      ['Instalacja ręczna (FTP / SSH)', `<p>Gdy przesyłanie przez panel jest zablokowane (np. limit <code>upload_max_filesize</code> lub uprawnienia katalogu):</p>
            <pre><code><span class="c"># na serwerze, w katalogu głównym LimeSurvey</span>
mkdir -p upload/themes/survey/lc_medical
unzip lc_medical.zip -d upload/themes/survey/lc_medical</code></pre>
            <p>Plik <code>config.xml</code> musi leżeć bezpośrednio w&nbsp;<code>upload/themes/survey/lc_medical/</code>. Następnie w&nbsp;<em>Konfiguracja → Motywy</em> znajdź motyw na liście dostępnych i&nbsp;kliknij <strong>Zainstaluj</strong>.</p>`],
      ['Motyw domyślny dla nowych ankiet', `<p><em>Konfiguracja → Globalne → Ogólne → Domyślny motyw</em>. Istniejące ankiety zachowują swój motyw — zmień go w&nbsp;ustawieniach każdej z&nbsp;nich.</p>
            <h3>Własne kolory i fonty</h3>
            <p>Otwórz <em>Konfiguracja → Motywy → Edytor motywów</em> przy wybranym motywie i&nbsp;edytuj <code>css/lc-theme.css</code> — wszystkie kolory to zmienne <code>--lc-*</code> na początku pliku. Po zmianie sprawdź kontrast (tekst ≥&nbsp;4,5:1, obramowania ≥&nbsp;3:1).</p>`],
      ['Aktualizacja do nowej wersji', `<p>LimeSurvey nie nadpisze istniejącego motywu przy imporcie. Najprościej podmienić pliki przez FTP w&nbsp;katalogu <code>upload/themes/survey/lc_…</code>, a&nbsp;potem w&nbsp;<em>Konfiguracja → Globalne → Ogólne</em> kliknąć <strong>Wyczyść pamięć podręczną zasobów</strong>.</p>
            <p>Alternatywnie: <em>Odinstaluj</em> motyw, usuń jego katalog z&nbsp;serwera i&nbsp;zaimportuj nowy ZIP (ankiety trzeba potem ponownie przypisać do motywu).</p>`],
    ],
    faqTitle: 'Rozwiązywanie problemów',
    faq: (names) => [
      ['„Nie można zaimportować motywu, który już istnieje”', 'Motyw o&nbsp;tej nazwie jest już na serwerze (także po odinstalowaniu katalog zostaje). Usuń katalog <code>upload/themes/survey/lc_…</code> albo zaktualizuj pliki ręcznie — patrz „Aktualizacja do nowej wersji”.'],
      ['Motyw ma dziwną nazwę, np. <code>lc_medical_1</code>, albo nie działa po imporcie', `Przeglądarka dopisała do pobranego pliku „(1)”. Usuń taki motyw, zmień nazwę pliku z&nbsp;powrotem na <code>lc_medical.zip</code> i&nbsp;zaimportuj ponownie. Nazwa pliku musi być zgodna z&nbsp;nazwą w&nbsp;<code>config.xml</code> (${names}).`],
      ['Zaktualizowałem LimeSurvey z&nbsp;6 do 7 — co z&nbsp;motywem?', 'Podmień pliki motywu na wariant 7.x (przez FTP w&nbsp;<code>upload/themes/survey/lc_…</code>), a&nbsp;potem w&nbsp;<em>Konfiguracja → Motywy</em> użyj <strong>Resetuj</strong> przy motywie, żeby wczytać nową listę opcji, i&nbsp;wyczyść pamięć podręczną zasobów. Ustawienia logo trzeba wtedy wybrać ponownie.'],
      ['Błędy pokazują się w&nbsp;okienku zamiast przy pytaniu', 'Motywy domyślnie wyświetlają komunikaty na stronie. Jeśli w&nbsp;Twojej ankiecie jest inaczej, ustaw w&nbsp;<em>Opcje motywu → Opcje podstawowe</em> pole <em>Pokaż okna wyskakujące</em> na <strong>Na stronie</strong>.'],
      ['„Nie można zaimportować motywu, ponieważ fruity_twentythree nie jest zainstalowany”', 'Motywy dziedziczą po wbudowanym motywie <em>Fruity TwentyThree</em>, dostępnym w&nbsp;LimeSurvey 6 i&nbsp;7. Zainstaluj go w&nbsp;<em>Konfiguracja → Motywy</em> albo zaktualizuj LimeSurvey. Wersje 5.x i&nbsp;starsze nie są obsługiwane.'],
      ['Po zmianach w&nbsp;CSS ankieta wygląda tak samo', 'LimeSurvey buforuje pliki motywów. Kliknij <strong>Wyczyść pamięć podręczną zasobów</strong> w&nbsp;<em>Konfiguracja → Globalne → Ogólne</em> i&nbsp;odśwież stronę ankiety z&nbsp;pominięciem cache przeglądarki.'],
      ['Jak wyłączyć skróty klawiszowe w&nbsp;motywie CATI?', 'Ankieter wyłącza je przyciskiem „Skróty” w&nbsp;pasku nawigacji (wybór jest pamiętany w&nbsp;przeglądarce). Aby wyłączyć je na stałe, usuń linię <code>--lc-hotkeys: 1;</code> z&nbsp;<code>css/lc-theme.css</code>.'],
      ['Czy mogę używać motywów komercyjnie i&nbsp;je modyfikować?', 'Tak. Motywy są na licencji GPL-2.0-or-later (jak LimeSurvey) — możesz je zmieniać, rebrandować i&nbsp;używać w&nbsp;projektach komercyjnych.'],
      ['Czy motywy działają z&nbsp;LimeControl?', `Tak — motyw jest ustawieniem ankiety po stronie LimeSurvey. W&nbsp;aplikacji <a href="${APP_URL}">LimeControl</a> możesz przypisać zainstalowany motyw do ankiety bez logowania do panelu.`],
    ],
    ctaH: 'Zarządzaj ankietami z telefonu',
    ctaP: 'LimeControl aktywuje ankiety, planuje starty i&nbsp;pokazuje wyniki z&nbsp;wielu instancji LimeSurvey — za darmo.',
    ctaApp: 'Otwórz aplikację',
    ctaHome: 'Poznaj LimeControl',
    footerNote: (v) => `Motywy w wersji ${v}, licencja GPL-2.0-or-later, oparte na Fruity TwentyThree (LimeSurvey GmbH).`,
  },
  en: {
    ratio: (r) => `${r.toFixed(1)}:1`,
    title: 'Free WCAG 2.2 survey themes for LimeSurvey — LimeControl',
    description: (n, names) => `${n} free, responsive survey themes for LimeSurvey 6 and 7: ${names}. WCAG 2.2 AA compliant, with a CATI/CAPI interviewer mode. Download the ZIP and install it on your instance.`,
    ogTitle: 'Free survey themes for LimeSurvey — WCAG 2.2 AA',
    ogDescription: (names) => `${names}. Responsive, readable, ready to import.`,
    listName: 'Survey themes for LimeSurvey by LimeControl',
    views: { desktop: 'Desktop', mobile: 'Phone', errors: 'Error' },
    alts: {
      desktop: (l) => `The ${l} theme on a desktop: a single-choice question with a selected answer`,
      mobile: (l) => `The ${l} theme on a phone (390 px wide)`,
      errors: (l) => `The ${l} theme: an unanswered mandatory question — red border, icon and message`,
    },
    previewOf: (l) => `${l} theme preview`,
    useCases: 'Use cases',
    palette: 'Colour palette',
    swatch: { primary: 'Accent', text: 'Text', bg: 'Background' },
    contrast: (rep, r) => `<strong>Contrast:</strong> text ${r(rep.body)} · button ${r(rep.btn)} · minimum ${r(rep.minText)}`,
    downloadAria: (l, v, id, size) => `Download ${l} for LimeSurvey ${v} (lc_${id}.zip, ${size})`,
    eyebrow: 'Survey themes for LimeSurvey',
    h1: 'Surveys that <span class="lime">everyone can read</span> — on a phone and on a desktop.',
    lead: (n, install) => `${n} free themes for LimeSurvey&nbsp;6 and&nbsp;7 built on one tested pattern: large answer fields, a clear focus ring, readable errors and WCAG&nbsp;2.2&nbsp;AA contrast. Download the ZIP for your version, import it in the admin panel and you are done. <a href="#${install}">Installation guide</a>.`,
    allFor: (v, size) => `All themes for LimeSurvey ${v} (${size})`,
    meta: (versions) => ['WCAG 2.2 AA', `LimeSurvey ${versions}`, 'Responsive from 320 px', 'CATI/CAPI interviewer mode', 'No external fonts or scripts', 'GPL licence'],
    and: ' and ',
    ids: { gallery: 'themes', a11y: 'accessibility', interviewer: 'interviewer-mode', install: 'install' },
    galleryEyebrow: 'Gallery',
    galleryH: 'Choose a theme',
    galleryP: (tested) => `The screenshots come from a real LimeSurvey installation. Every theme was tested on LimeSurvey ${tested}. Switch the preview to see the phone view and an error message.`,
    a11yEyebrow: 'Accessibility',
    a11yH: 'One shared, tested pattern',
    a11yP: [
      'All themes share one base stylesheet (<code>lc-base.css</code>) and the <code>lc-a11y.js</code> script. They differ only in colours, typography, corner radii and layout — so they behave the same and are equally accessible.',
      'The contrast of every palette is checked automatically when the packages are built — a theme that misses the thresholds is not released.',
    ],
    a11yList: [
      '<strong>Contrast</strong> of at least 4.5:1 for text and 3:1 for field borders and focus (WCAG 1.4.3, 1.4.11).',
      '<strong>Visible focus</strong> — a 3&nbsp;px outline with an offset for keyboard navigation (2.4.7, 2.4.13).',
      '<strong>Touch targets ≥&nbsp;44&nbsp;px</strong>; the whole answer tile is clickable (2.5.8).',
      '<strong>Errors not by colour alone</strong> — border, icon and text; focus moves to the first question with an error and the field gets <code>aria-invalid</code> (1.4.1, 3.3.1).',
      '<strong>Native form controls</strong> — they work in Windows high-contrast mode and with screen readers.',
      '<strong>Reflow</strong> — no horizontal scrolling from 320&nbsp;px; wide tables scroll inside their own container (1.4.10).',
      '<strong>A “Skip to questions” link</strong>, labelled mandatory questions and a named menu button (2.4.1, 4.1.2).',
      '<strong>Six theme interface languages</strong> — English, Polish, German, French, Spanish and Ukrainian; picked from the survey language.',
      '<strong>User preferences</strong> — <code>prefers-reduced-motion</code>, <code>forced-colors</code>, print.',
      '<strong>GDPR-friendly</strong> — system fonts, no CDNs and no tracking scripts.',
    ],
    ivEyebrow: 'CATI and CAPI',
    ivH: 'Interviewer mode in every theme',
    ivP: (templates, plugins) => `The <strong>CATI</strong> and <strong>CAPI</strong> themes are designed for interviewers, but their mechanisms work in every LimeControl theme. Ready-made questionnaires are in the <a href="${templates}">survey templates</a>; call queues, telephony, assignments and quotas are provided by the StrefaAnkiet platform, which the <a href="${plugins}">free plugins</a> connect to LimeSurvey.`,
    ivCards: [
      ['Scripts and interviewer fields', 'Give a question the CSS class <code>lc-interviewer</code> (<em>Question settings → Display → CSS class</em>) and the theme marks it with a dashed frame as text to read out or a field completed by the interviewer.'],
      ['Sticky navigation', 'In the CATI and CAPI themes the <em>Back</em> and <em>Next</em> buttons stay at the bottom edge of the screen — also on a phone, where they fit in one row.'],
      ['Keyboard shortcuts (CATI)', 'Keys <kbd>1</kbd>–<kbd>9</kbd> select an answer; in arrays the focus moves to the next row by itself. <kbd>Ctrl</kbd>+<kbd>Enter</kbd> is “Next”, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> is “Back”. Shortcuts can be switched off in the navigation bar.'],
      ['A tablet in the field (CAPI)', '20&nbsp;px text, 56&nbsp;px touch targets and a black-and-white palette with one strong accent — readable even in bright sunlight.'],
    ],
    installEyebrow: 'Installation',
    installH: 'Install a theme on your LimeSurvey',
    installP: 'You need a superadministrator account (or the permission to import themes) and LimeSurvey 6.x or 7.x with the built-in <em>Fruity TwentyThree</em> theme.',
    steps: [
      ['Download the ZIP for your version', 'The LimeSurvey version is shown in the footer of the admin panel. Download the <strong>7.x</strong> or <strong>6.x</strong> variant and <strong>do not rename the file</strong> — LimeSurvey names the theme directory after the file (e.g. <code>lc_medical</code>).'],
      ['Upload it to LimeSurvey', '<em>Configuration → Themes</em>, the <em>Survey themes</em> tab, the <strong>Upload &amp; install</strong> button. Choose the ZIP file and confirm.'],
      ['Select it in a survey', 'In the survey: <em>Survey settings → General → Theme</em>, choose e.g. “LimeControl Medical” and save. In the LimeControl app it takes a single tap.'],
      ['Add your logo', 'In the survey, <em>Theme options → Images</em>: set <em>Logo: Yes</em> and upload a PNG or JPG file.'],
    ],
    callout: '<strong>Why two variants?</strong> LimeSurvey&nbsp;7 added new options to the parent theme (colours, corner radii, icons, table wrapping), and the <em>Theme options</em> form only shows the options described in the package. Look and accessibility are identical in both variants — only the list of options in the panel differs. The 6.x variant is not marked as compatible with LimeSurvey&nbsp;7 and vice versa.',
    more: [
      ['Manual installation (FTP / SSH)', `<p>When uploading through the panel is blocked (e.g. by the <code>upload_max_filesize</code> limit or directory permissions):</p>
            <pre><code><span class="c"># on the server, in the LimeSurvey root directory</span>
mkdir -p upload/themes/survey/lc_medical
unzip lc_medical.zip -d upload/themes/survey/lc_medical</code></pre>
            <p>The <code>config.xml</code> file must sit directly in <code>upload/themes/survey/lc_medical/</code>. Then find the theme in the list of available themes in <em>Configuration → Themes</em> and click <strong>Install</strong>.</p>`],
      ['Default theme for new surveys', `<p><em>Configuration → Global → General → Default theme</em>. Existing surveys keep their theme — change it in the settings of each survey.</p>
            <h3>Your own colours and fonts</h3>
            <p>Open <em>Configuration → Themes → Theme editor</em> for the theme and edit <code>css/lc-theme.css</code> — all colours are <code>--lc-*</code> variables at the top of the file. After changing them, check the contrast (text ≥&nbsp;4.5:1, borders ≥&nbsp;3:1).</p>`],
      ['Updating to a new version', `<p>LimeSurvey will not overwrite an existing theme on import. The simplest way is to replace the files over FTP in <code>upload/themes/survey/lc_…</code> and then click <strong>Clear assets cache</strong> in <em>Configuration → Global → General</em>.</p>
            <p>Alternatively: <em>Uninstall</em> the theme, delete its directory from the server and import the new ZIP (surveys then have to be assigned to the theme again).</p>`],
    ],
    faqTitle: 'Troubleshooting',
    faq: (names) => [
      ['“Cannot import a theme that already exists”', 'A theme with this name is already on the server (the directory stays even after uninstalling). Delete the <code>upload/themes/survey/lc_…</code> directory or update the files manually — see “Updating to a new version”.'],
      ['The theme has an odd name such as <code>lc_medical_1</code>, or does not work after import', `Your browser added “(1)” to the downloaded file. Remove that theme, rename the file back to <code>lc_medical.zip</code> and import it again. The file name must match the name in <code>config.xml</code> (${names}).`],
      ['I upgraded LimeSurvey from 6 to 7 — what about the theme?', 'Replace the theme files with the 7.x variant (over FTP in <code>upload/themes/survey/lc_…</code>), then use <strong>Reset</strong> next to the theme in <em>Configuration → Themes</em> to load the new list of options, and clear the assets cache. The logo settings then have to be chosen again.'],
      ['Errors appear in a popup instead of next to the question', 'The themes show messages on the page by default. If your survey behaves differently, set <em>Theme options → Simple options → Show popups</em> to <strong>On page</strong>.'],
      ['“Cannot import the theme because fruity_twentythree is not installed”', 'The themes extend the built-in <em>Fruity TwentyThree</em> theme available in LimeSurvey 6 and 7. Install it in <em>Configuration → Themes</em> or update LimeSurvey. Versions 5.x and older are not supported.'],
      ['The survey looks the same after CSS changes', 'LimeSurvey caches theme files. Click <strong>Clear assets cache</strong> in <em>Configuration → Global → General</em> and reload the survey page bypassing the browser cache.'],
      ['How do I switch off keyboard shortcuts in the CATI theme?', 'Interviewers switch them off with the “Shortcuts” button in the navigation bar (the choice is remembered in the browser). To disable them permanently, remove the line <code>--lc-hotkeys: 1;</code> from <code>css/lc-theme.css</code>.'],
      ['May I use the themes commercially and modify them?', 'Yes. The themes are licensed under GPL-2.0-or-later (like LimeSurvey) — you may change them, rebrand them and use them in commercial projects.'],
      ['Do the themes work with LimeControl?', `Yes — a theme is a survey setting on the LimeSurvey side. In the <a href="${APP_URL}">LimeControl</a> app you can assign an installed theme to a survey without logging in to the admin panel.`],
    ],
    ctaH: 'Manage your surveys from your phone',
    ctaP: 'LimeControl activates surveys, schedules launches and shows results from many LimeSurvey instances — for free.',
    ctaApp: 'Open the app',
    ctaHome: 'Discover LimeControl',
    footerNote: (v) => `Themes version ${v}, licensed under GPL-2.0-or-later, based on Fruity TwentyThree (LimeSurvey GmbH).`,
  },
};

const swatch = (hex, label) =>
  `<li><span class="sw" style="background:${hex}" aria-hidden="true"></span><span>${esc(label)}<code>${hex}</code></span></li>`;

const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';

function themeCard(t, rep, variants, lang) {
  const s = S[lang];
  const k = t.tokens;
  const views = ['desktop', 'mobile', 'errors'];
  const alts = Object.fromEntries(views.map((v) => [v, s.alts[v](t.label)]));
  return `
          <article class="tcard" id="${t.id}" aria-labelledby="${t.id}-title">
            <div class="tshot" data-theme="${t.id}">
              <img src="/szablony/img/${t.id}-desktop.jpg" width="960" height="720" loading="lazy" decoding="async"
                   alt="${esc(alts.desktop)}" data-alts='${esc(JSON.stringify(alts))}' />
            </div>
            <div class="tview" role="group" aria-label="${esc(s.previewOf(t.label))}">
              ${views.map((v, i) => `<button type="button" data-view="${v}" aria-pressed="${i === 0}">${s.views[v]}</button>`).join('')}
            </div>
            <div class="tbody">
              <h3 id="${t.id}-title">${esc(t.label)}</h3>
              <p>${esc(t.summary[lang])}</p>
              <ul class="tags" aria-label="${s.useCases}">${t.useCases[lang].map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
              <ul class="swatches" aria-label="${s.palette}">
                ${swatch(k.primary, s.swatch.primary)}${swatch(k.text, s.swatch.text)}${swatch(k.bg, s.swatch.bg)}
              </ul>
              <p class="contrast">${s.contrast(rep, s.ratio)}</p>
              <div class="tdl-group">
                ${variants.map((v, i) => `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'} tdl" href="/szablony/pobierz/${v.id}/lc_${t.id}.zip" download aria-label="${esc(s.downloadAria(t.label, v.label, t.id, kb(rep.sizes[v.id])))}">
                  ${DOWNLOAD_ICON}
                  LimeSurvey ${v.label} <span class="size">${kb(rep.sizes[v.id])}</span>
                </a>`).join('\n                ')}
              </div>
            </div>
          </article>`;
}

/**
 * @param {{ cfg: object, report: object[], bundles: Record<string, number>, lang: 'pl'|'en' }} o
 * @returns {{ path: string, html: string }} ścieżka względem site/ i gotowy HTML
 */
export function renderPage({ cfg, report, bundles, lang }) {
  const s = S[lang];
  const variants = cfg.variants;
  const tested = variants.map((v) => v.testedOn).join(s.and);
  const cards = cfg.themes.map((t) => themeCard(t, report.find((r) => r.id === t.id), variants, lang)).join('\n');
  const names = cfg.themes.map((t) => `<code>lc_${t.id}</code>`).join(', ');
  const labels = cfg.themes.map((t) => t.label).join(', ');
  const count = NUMBER_WORDS[lang][cfg.themes.length] || String(cfg.themes.length);

  const body = `
  <main id="main">
    <section class="hero hero-themes">
      <div class="container">
        <div>
          <span class="eyebrow">${s.eyebrow}</span>
          <h1>${s.h1}</h1>
          <p class="lead">${s.lead(count, s.ids.install)}</p>
          <div class="hero-cta">
            ${variants.map((v, i) => `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}" href="/szablony/pobierz/${v.id}/limecontrol-motywy-ankiet-${v.id}.zip" download>
              ${s.allFor(v.label, kb(bundles[v.id]))}
              ${DOWNLOAD_ICON}
            </a>`).join('\n            ')}
          </div>
          <ul class="hero-meta">
            ${s.meta(variants.map((v) => v.label).reverse().join(s.and)).map((m) => `<li>${m}</li>`).join('\n            ')}
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
        <div class="tgrid">
${cards}
        </div>
      </div>
    </section>

    <section id="${s.ids.a11y}" aria-labelledby="a11y-h">
      <div class="container split">
        <div>
          <span class="eyebrow">${s.a11yEyebrow}</span>
          <h2 id="a11y-h">${s.a11yH}</h2>
          ${s.a11yP.map((p) => `<p class="muted">${p}</p>`).join('\n          ')}
        </div>
        <ul class="checklist">
          ${s.a11yList.map((li) => `<li><span>${li}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section id="${s.ids.interviewer}" class="section-soft" aria-labelledby="iv-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.ivEyebrow}</span>
          <h2 id="iv-h">${s.ivH}</h2>
          <p>${s.ivP(ROUTES.templates[lang], ROUTES.plugins[lang])}</p>
        </div>
        <div class="grid grid-2">
          ${s.ivCards.map(([h, p]) => `<article class="card">
            <h3 style="margin-top:0">${h}</h3>
            <p>${p}</p>
          </article>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section id="${s.ids.install}" class="install-section" aria-labelledby="inst-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.installEyebrow}</span>
          <h2 id="inst-h">${s.installH}</h2>
          <p>${s.installP}</p>
        </div>

        <ol class="steps">
          ${s.steps.map(([h, p]) => `<li>
            <h3>${h}</h3>
            <p>${p}</p>
          </li>`).join('\n          ')}
        </ol>

        <div class="callout">
          <p>${s.callout}</p>
        </div>

        <div class="install-more">
          ${s.more.map(([h, html]) => `<div class="card">
            <h3>${h}</h3>
            ${html}
          </div>`).join('\n          ')}
        </div>

        <h3 class="faq-title">${s.faqTitle}</h3>
        <div class="faq">
          ${s.faq(names).map(([q, a]) => `<details>
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
            <a class="btn btn-ghost" href="${homeUrl(lang)}">${s.ctaHome}</a>
          </div>
        </div>
      </div>
    </section>
  </main>`;

  const html = layout({
    lang,
    page: 'themes',
    title: s.title,
    description: s.description(cfg.themes.length, labels),
    ogTitle: s.ogTitle,
    ogDescription: s.ogDescription(labels),
    ogImage: '/szablony/img/medical-desktop.jpg',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: s.listName,
      itemListElement: cfg.themes.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'SoftwareSourceCode',
          name: t.title,
          description: t.description[lang],
          license: 'https://www.gnu.org/licenses/gpl-2.0.html',
          downloadUrl: absolute(`/szablony/pobierz/${variants[0].id}/lc_${t.id}.zip`),
          programmingLanguage: 'CSS',
          version: cfg.version,
        },
      })),
    },
    body,
    footerNote: s.footerNote(cfg.version),
    scripts: `
  <script>
    // Przełącznik podglądu: komputer / telefon / błąd
    document.querySelectorAll('.tcard').forEach(function (card) {
      var img = card.querySelector('.tshot img');
      var alts = JSON.parse(img.getAttribute('data-alts'));
      var id = card.id;
      card.querySelectorAll('.tview button').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-view');
          card.querySelectorAll('.tview button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          card.querySelector('.tshot').classList.toggle('is-mobile', v === 'mobile');
          img.src = '/szablony/img/' + id + '-' + v + '.jpg';
          img.alt = alts[v];
          img.width = v === 'mobile' ? 390 : 960;
          img.height = v === 'mobile' ? 750 : 720;
        });
      });
    });
  </script>`,
  });
  return { path: outputPath('themes', lang), html };
}
