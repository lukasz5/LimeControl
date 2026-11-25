import React, { useEffect, useId, useMemo, useState } from 'react';
import { Copy, ExternalLink, Palette, QrCode, Repeat, Share2, TabletSmartphone } from 'lucide-react';
import {
  getLanguageProperties,
  getSurveyProperties,
  setLanguageProperties,
  setSurveyProperties,
} from '../services/limeSurveyRpc';
import { canShare, shareLink } from '../services/nativeBridge';
import { QrSvg } from './QrSvg';
import { surveyLanguages, surveyPublicUrl } from '../services/surveyLinks';
import { loadTemplateCatalog, type TemplateTheme } from '../services/templateLibrary';
import type { ActiveSession, LimeSurveyItem, SurveyProperties } from '../types/limesurvey';
import { t, useLang } from '../i18n';

interface SurveyToolsCardProps {
  activeSession: ActiveSession;
  survey: LimeSurveyItem;
  properties: SurveyProperties | null;
  /** Po zmianie właściwości — rodzic odświeża dane ankiety. */
  onPropertiesChanged: (next: SurveyProperties) => void;
}

const DEFAULT_THEME = 'fruity_twentythree';
/** Opis linku końcowego widziany przez respondenta — w języku ankiety, nie interfejsu aplikacji. */
const NEXT_INTERVIEW_LABEL: Record<string, string> = { pl: 'Następny wywiad', en: 'Next interview', de: 'Nächstes Interview', fr: 'Entretien suivant', es: 'Siguiente entrevista', uk: 'Наступне інтерв’ю' };

/** Link do ankiety, kod QR, tryb CAPI (wywiad za wywiadem) i wybór motywu. */
export const SurveyToolsCard: React.FC<SurveyToolsCardProps> = ({ activeSession, survey, properties, onPropertiesChanged }) => {
  const uiLang = useLang();
  // Karta bywa w DOM dwukrotnie (kolumna na komputerze i szuflada na telefonie) — identyfikatory muszą być unikalne.
  const uid = useId();
  const languages = useMemo(() => surveyLanguages(properties), [properties]);
  const [lang, setLang] = useState<string>('');
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [themes, setThemes] = useState<TemplateTheme[]>([]);
  const [themeChoice, setThemeChoice] = useState<string>('');
  const [loopUrl, setLoopUrl] = useState<string | null>(null);

  const currentTheme = typeof properties?.template === 'string' ? properties.template : '';
  const activeLang = lang && languages.includes(lang) ? lang : languages[0] || '';
  const url = surveyPublicUrl(activeSession, survey.sid, { lang: languages.length > 1 ? activeLang : undefined });
  const capiUrl = surveyPublicUrl(activeSession, survey.sid, { lang: activeLang || undefined, newTest: true });
  const loopActive = properties?.autoredirect === 'Y' && Boolean(loopUrl && /newtest=Y/i.test(loopUrl));
  const isActive = survey.active === 'Y';

  useEffect(() => {
    setShowQr(false);
    setMessage(null);
    setError(null);
    setCopied(false);
  }, [survey.sid]);

  useEffect(() => {
    setThemeChoice(currentTheme);
  }, [currentTheme, survey.sid]);

  useEffect(() => {
    let cancelled = false;
    loadTemplateCatalog()
      .then((catalog) => {
        if (!cancelled) setThemes(catalog.themes);
      })
      .catch(() => {
        // lista motywów jest podpowiedzią — nazwę można też wpisać ręcznie
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Adres końcowy ankiety (język bazowy) — po nim poznajemy, czy pętla wywiadów jest włączona.
  useEffect(() => {
    let cancelled = false;
    setLoopUrl(null);
    if (!languages[0]) return;
    getLanguageProperties(activeSession.rpcEndpoint, activeSession.sessionKey, survey.sid, ['surveyls_url'], languages[0], activeSession.connectionMode)
      .then((props) => {
        if (!cancelled) setLoopUrl(typeof props.surveyls_url === 'string' ? props.surveyls_url : '');
      })
      .catch(() => {
        if (!cancelled) setLoopUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [activeSession.rpcEndpoint, activeSession.sessionKey, activeSession.connectionMode, survey.sid, languages]);

  async function refreshProperties(): Promise<SurveyProperties> {
    const next = await getSurveyProperties(activeSession.rpcEndpoint, activeSession.sessionKey, survey.sid, activeSession.connectionMode);
    onPropertiesChanged(next);
    return next;
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('Nie udało się skopiować linku — zaznacz go i skopiuj ręcznie.'));
    }
  }

  async function handleShare() {
    await shareLink(survey.surveyls_title, url);
  }

  async function handleSaveTheme() {
    const wanted = themeChoice.trim();
    if (!wanted) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await setSurveyProperties(activeSession.rpcEndpoint, activeSession.sessionKey, survey.sid, { template: wanted }, activeSession.connectionMode);
      // LimeSurvey potwierdza zapis także dla nieistniejącego motywu i po cichu wraca do domyślnego —
      // dlatego sprawdzamy, jaki motyw faktycznie został ustawiony.
      const next = await refreshProperties();
      if (next.template === wanted) {
        setMessage(t('Ustawiono motyw „{0}”.', wanted));
      } else {
        setError(t('Motyw „{0}” nie jest zainstalowany na tym serwerze — ankieta używa motywu „{1}”. Zainstaluj motyw w LimeSurvey (Konfiguracja → Motywy) i spróbuj ponownie.', wanted, String(next.template || DEFAULT_THEME)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleLoop(enable: boolean) {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      // Po zakończeniu wywiadu LimeSurvey przekierowuje na początek ankiety z nową, pustą odpowiedzią.
      for (const code of languages) {
        const target = enable ? surveyPublicUrl(activeSession, survey.sid, { lang: code, newTest: true }) : '';
        await setLanguageProperties(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          survey.sid,
          { surveyls_url: target, surveyls_urldescription: enable ? NEXT_INTERVIEW_LABEL[code] || NEXT_INTERVIEW_LABEL.en : '' },
          code,
          activeSession.connectionMode
        );
      }
      await setSurveyProperties(activeSession.rpcEndpoint, activeSession.sessionKey, survey.sid, { autoredirect: enable ? 'Y' : 'N' }, activeSession.connectionMode);
      setLoopUrl(enable ? surveyPublicUrl(activeSession, survey.sid, { lang: languages[0], newTest: true }) : '');
      await refreshProperties();
      setMessage(enable ? t('Włączono pętlę wywiadów: po zakończeniu ankieta zacznie się od nowa.') : t('Wyłączono pętlę wywiadów.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const themeOptions = useMemo(() => {
    const list = [{ id: DEFAULT_THEME, label: 'Fruity TwentyThree' }, ...themes.map((x) => ({ id: x.id, label: `LimeControl ${x.label}` }))];
    if (currentTheme && !list.some((x) => x.id === currentTheme)) list.unshift({ id: currentTheme, label: currentTheme });
    return list;
  }, [themes, currentTheme]);

  const outline = 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t('Link, tryb CAPI i motyw')}</h4>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {message}
        </div>
      )}

      {/* Link do ankiety */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-0 flex-1">
            <label htmlFor={`survey-url-${uid}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('Link dla respondentów')}
            </label>
            <input
              id={`survey-url-${uid}`}
              type="text"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white"
            />
          </div>
          {languages.length > 1 && (
            <div>
              <label htmlFor={`survey-lang-${uid}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Język')}
              </label>
              <select
                id={`survey-lang-${uid}`}
                value={activeLang}
                onChange={(e) => setLang(e.target.value)}
                className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white"
              >
                {languages.map((code) => (
                  <option key={code} value={code}>
                    {code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleCopy()} className={outline}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            <span>{copied ? t('Skopiowano') : t('Kopiuj link')}</span>
          </button>
          {canShare() && (
            <button type="button" onClick={() => void handleShare()} className={outline}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              <span>{t('Udostępnij')}</span>
            </button>
          )}
          <button type="button" aria-expanded={showQr} onClick={() => setShowQr((v) => !v)} className={outline}>
            <QrCode className="h-4 w-4" aria-hidden="true" />
            <span>{showQr ? t('Ukryj kod QR') : t('Kod QR')}</span>
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className={outline}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span>{t('Otwórz')}</span>
          </a>
        </div>
        {showQr && (
          <div className="flex flex-col items-start gap-2">
            <QrSvg value={url} label={t('Kod QR z linkiem do ankiety #{0}', survey.sid)} />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Zeskanuj telefonem albo zrób zrzut ekranu i wstaw kod do plakatu lub prezentacji.')}</p>
          </div>
        )}
        {!isActive && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">{t('Ankieta jest nieaktywna — link zacznie działać po aktywacji.')}</p>
        )}
      </div>

      {/* Tryb CAPI */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('Tryb CAPI — wywiady na tablecie lub telefonie')}</div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('Każde otwarcie zaczyna nowy, pusty wywiad. Z pętlą wywiadów ankieta po zakończeniu sama wraca na początek — wygodne dla ankietera i w kiosku.')}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={capiUrl} target="_blank" rel="noopener noreferrer" className={outline}>
            <TabletSmartphone className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>{t('Rozpocznij wywiad')}</span>
          </a>
          <button
            type="button"
            disabled={busy || loopUrl === null || languages.length === 0}
            aria-pressed={loopActive}
            onClick={() => void handleToggleLoop(!loopActive)}
            className={loopActive ? `${outline} border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300` : outline}
          >
            <Repeat className="h-4 w-4" aria-hidden="true" />
            <span>{loopActive ? t('Pętla wywiadów: włączona') : t('Włącz pętlę wywiadów')}</span>
          </button>
        </div>
      </div>

      {/* Motyw */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
        <label htmlFor={`survey-theme-${uid}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {t('Motyw ankiety')}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id={`survey-theme-${uid}`}
            value={themeChoice}
            onChange={(e) => setThemeChoice(e.target.value)}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white"
          >
            {themeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} ({opt.id})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !themeChoice || themeChoice === currentTheme}
            onClick={() => void handleSaveTheme()}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Palette className="h-4 w-4" aria-hidden="true" />
            <span>{t('Zapisz motyw')}</span>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('Motywy LimeControl trzeba najpierw zainstalować w LimeSurvey.')}{' '}
          <a href={{ pl: 'https://limecontrol.eu/szablony.html', en: 'https://limecontrol.eu/en/themes.html', de: 'https://limecontrol.eu/de/designs.html' }[uiLang]} target="_blank" rel="noopener" className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline underline-offset-2">
            {t('Pobierz motywy')}
          </a>
        </p>
      </div>
    </div>
  );
};
