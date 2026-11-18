import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Download, Languages, LibraryBig, ListChecks, Palette, X } from 'lucide-react';
import { importSurvey, utf8ToBase64 } from '../services/limeSurveyRpc';
import {
  fetchTemplateLss,
  loadTemplateCatalog,
  pick,
  type TemplateCatalog,
  type TemplateEntry,
} from '../services/templateLibrary';
import type { ActiveSession } from '../types/limesurvey';
import { useNotifications } from './NotificationProvider';
import { plural, t, useLang } from '../i18n';

interface TemplateLibraryProps {
  activeSession: ActiveSession;
  /** Wywoływane po udanym imporcie — odświeża listę ankiet i zaznacza nową. */
  onImported: (surveyId: number) => Promise<void> | void;
  onClose: () => void;
}

const MODE_LABEL: Record<string, string> = { cawi: 'CAWI', cati: 'CATI', capi: 'CAPI' };

/** Biblioteka szablonów ankiet: import gotowego kwestionariusza do połączonej instancji LimeSurvey. */
export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ activeSession, onImported, onClose }) => {
  const lang = useLang();
  const { notify } = useNotifications();
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    loadTemplateCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => (catalog ? catalog.categories.filter((c) => catalog.templates.some((tpl) => tpl.category === c.id)) : []),
    [catalog]
  );
  const visible = useMemo(
    () => (catalog ? catalog.templates.filter((tpl) => !category || tpl.category === category) : []),
    [catalog, category]
  );

  async function handleImport(entry: TemplateEntry) {
    setBusyId(entry.id);
    setError(null);
    try {
      const xml = await fetchTemplateLss(entry);
      const sid = await importSurvey(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        utf8ToBase64(xml),
        'lss',
        null,
        activeSession.connectionMode
      );
      setImported((prev) => ({ ...prev, [entry.id]: sid }));
      notify({
        type: 'success',
        title: t('Zaimportowano szablon'),
        message: t('„{0}” — nowa ankieta #{1} (nieaktywna).', pick(entry.title, lang), sid),
        dedupeKey: `template:${entry.id}:${sid}`,
      });
      await onImported(sid);
    } catch (err) {
      setError(t('Nie udało się zaimportować szablonu: {0}', err instanceof Error ? err.message : String(err)));
    } finally {
      setBusyId(null);
    }
  }

  const chip = (active: boolean) =>
    `min-h-[38px] rounded-full border px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500'
    }`;

  return (
    <section
      aria-labelledby="template-library-title"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="template-library-title" className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <LibraryBig className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{t('Biblioteka szablonów ankiet')}</span>
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {t('Gotowe kwestionariusze po polsku i angielsku. Import tworzy nieaktywną ankietę w instancji {0} — możesz ją potem dowolnie zmienić.', activeSession.profileName)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('Zamknij bibliotekę szablonów')}
          data-back-close
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {t('Nie udało się wczytać biblioteki szablonów: {0}', loadError)}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {!catalog && !loadError && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('Wczytywanie biblioteki...')}</p>
      )}

      {catalog && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('Filtruj szablony według kategorii')}>
            <button type="button" aria-pressed={category === ''} onClick={() => setCategory('')} className={chip(category === '')}>
              {t('Wszystkie')}
            </button>
            {categories.map((c) => (
              <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => setCategory(c.id)} className={chip(category === c.id)}>
                {pick(c.label, lang)}
              </button>
            ))}
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.map((entry) => {
              const sid = imported[entry.id];
              const theme = entry.theme ? catalog.themes.find((x) => x.id === entry.theme) : null;
              const busy = busyId === entry.id;
              return (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {entry.modes.map((m) => (
                      <span key={m} className="rounded-full bg-slate-900 dark:bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-white dark:text-slate-900">
                        {MODE_LABEL[m] || m}
                      </span>
                    ))}
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 dark:text-emerald-200">
                      {pick(catalog.categories.find((c) => c.id === entry.category)?.label, lang)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pick(entry.title, lang)}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{pick(entry.summary, lang)}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                      {plural(entry.questions, ['pytanie', 'pytania', 'pytań'], ['question', 'questions'])}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {t('ok. {0} min', entry.minutes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                      {entry.languages.map((l) => l.toUpperCase()).join(' + ')}
                    </span>
                    {theme && (
                      <span className="inline-flex items-center gap-1">
                        <Palette className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('motyw {0}', theme.label)}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId !== null}
                      onClick={() => {
                        void handleImport(entry);
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>{busy ? t('Importowanie...') : sid ? t('Importuj ponownie') : t('Importuj')}</span>
                    </button>
                    {sid && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        {t('Ankieta #{0}', sid)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t('Szablony w wersji {0}, sprawdzone na LimeSurvey {1}. Licencja CC0 — bez ograniczeń.', catalog.version, catalog.testedOn.join(', '))}
          </p>
        </>
      )}
    </section>
  );
};
