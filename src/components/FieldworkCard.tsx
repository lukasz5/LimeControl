import React, { useEffect, useId, useState } from 'react';
import { Headset, Link2, PhoneCall, RefreshCw, TabletSmartphone, Unplug } from 'lucide-react';
import {
  clearConnection,
  discoverStudy,
  getConnection,
  getStoredBaseUrl,
  getStoredLink,
  loadFieldwork,
  setConnection,
  storeLink,
  type FieldworkSnapshot,
  type StrefaLink,
} from '../services/strefaAnkiet';
import type { ActiveSession, InstanceProfile, LimeSurveyItem } from '../types/limesurvey';
import { isNativeApp } from '../platform';
import { t, useLang } from '../i18n';

interface FieldworkCardProps {
  activeSession: ActiveSession;
  activeProfile: InstanceProfile | null;
  survey: LimeSurveyItem;
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktywny',
  paused: 'Wstrzymany',
  completed: 'Zakończony',
  canceled: 'Anulowany',
};

/**
 * Realizacja CATI/CAPI z platformy StrefaAnkiet — podgląd tylko do odczytu.
 * Pokazuje postęp wywiadów, przydziały ankieterów i kolejkę rozmów dla badania powiązanego z ankietą.
 */
export const FieldworkCard: React.FC<FieldworkCardProps> = ({ activeSession, activeProfile, survey }) => {
  const lang = useLang();
  const uid = useId();
  const profileId = activeSession.profileId;
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(() => Boolean(getConnection()));
  const [baseUrl, setBaseUrl] = useState(() => getStoredBaseUrl());
  const [token, setToken] = useState('');
  const [link, setLink] = useState<StrefaLink | null>(() => getStoredLink(profileId, survey.sid));
  const [manualProject, setManualProject] = useState('');
  const [manualStudy, setManualStudy] = useState('');
  const [snapshot, setSnapshot] = useState<FieldworkSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLink(getStoredLink(profileId, survey.sid));
    setSnapshot(null);
    setError(null);
    setNotFound(false);
  }, [profileId, survey.sid]);

  async function refresh(currentLink: StrefaLink) {
    const connection = getConnection();
    if (!connection) return;
    setBusy(true);
    setError(null);
    try {
      setSnapshot(await loadFieldwork(connection, currentLink, survey.sid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // Po otwarciu karty (lub zmianie ankiety) wczytaj stan, jeśli znamy powiązanie.
  useEffect(() => {
    if (open && connected && link && !snapshot) void refresh(link);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connected, link, survey.sid]);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!/^https?:\/\//i.test(baseUrl.trim())) {
      setError(t('Podaj pełny adres platformy, np. https://app.example.com.'));
      return;
    }
    setBusy(true);
    setError(null);
    setNotFound(false);
    try {
      const connection = setConnection(baseUrl, token);
      setToken('');
      const known = getStoredLink(profileId, survey.sid);
      const found = known || (await discoverStudy(connection, survey.sid, activeProfile?.baseUrl || activeSession.rpcEndpoint));
      setConnected(true);
      if (found) {
        storeLink(profileId, survey.sid, found);
        setLink(found);
        setSnapshot(await loadFieldwork(connection, found, survey.sid));
      } else {
        setNotFound(true);
      }
    } catch (err) {
      clearConnection();
      setConnected(false);
      setError(t('Nie udało się połączyć ze StrefąAnkiet: {0}', err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  }

  async function handleFind() {
    const connection = getConnection();
    if (!connection) return;
    setBusy(true);
    setError(null);
    setNotFound(false);
    try {
      const found = await discoverStudy(connection, survey.sid, activeProfile?.baseUrl || activeSession.rpcEndpoint);
      if (found) {
        storeLink(profileId, survey.sid, found);
        setLink(found);
        setSnapshot(await loadFieldwork(connection, found, survey.sid));
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleManualLink(e: React.FormEvent) {
    e.preventDefault();
    const projectId = Number(manualProject);
    const studyId = Number(manualStudy);
    if (!Number.isInteger(projectId) || projectId <= 0 || !Number.isInteger(studyId) || studyId <= 0) {
      setError(t('Podaj numery projektu i badania ze StrefyAnkiet.'));
      return;
    }
    const next = { projectId, studyId };
    storeLink(profileId, survey.sid, next);
    setLink(next);
    setNotFound(false);
    await refresh(next);
  }

  function handleDisconnect() {
    clearConnection();
    setConnected(false);
    setSnapshot(null);
  }

  function handleUnlink() {
    storeLink(profileId, survey.sid, null);
    setLink(null);
    setSnapshot(null);
    setNotFound(false);
  }

  const input = 'w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none';
  const outline = 'min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50';
  const stat = 'rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-3 py-2.5';
  // Aplikacja mobilna odsyła do dokumentacji łącznika, przeglądarka — do strony wtyczek.
  const pluginsUrl = isNativeApp()
    ? lang === 'pl'
      ? 'https://limecontrol.eu/docs.html#strefaankiet'
      : 'https://limecontrol.eu/en/docs.html#strefaankiet'
    : lang === 'pl'
      ? 'https://limecontrol.eu/wtyczki.html'
      : 'https://limecontrol.eu/en/plugins.html';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Headset className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
            <span>{t('Realizacja CATI / CAPI')}</span>
            <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              StrefaAnkiet · beta
            </span>
          </h4>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {t('Postęp wywiadów, przydziały ankieterów i kolejka rozmów z platformy StrefaAnkiet — tylko do odczytu.')}
          </p>
        </div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`${outline} shrink-0`}>
          {open ? t('Zwiń') : connected && link ? t('Pokaż') : t('Połącz')}
        </button>
      </div>

      {open && (
        <div className="space-y-3.5">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}

          {!connected && (
            <form onSubmit={handleConnect} className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('Jeśli ta ankieta jest powiązana z badaniem w StrefieAnkiet, podaj adres platformy i klucz dostępu z zakresami fieldwork.read oraz cati.read (Ustawienia → Centrum integracji → Dostęp zewnętrznych aplikacji).')}{' '}
                <a href={pluginsUrl} target="_blank" rel="noopener" className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline underline-offset-2">
                  {t('Więcej o wtyczkach CATI/CAPI')}
                </a>
              </p>
              <div>
                <label htmlFor={`strefa-url-${uid}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Adres platformy StrefaAnkiet')}
                </label>
                <input id={`strefa-url-${uid}`} type="url" required inputMode="url" placeholder="https://" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor={`strefa-token-${uid}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Klucz dostępu')}
                </label>
                <input id={`strefa-token-${uid}`} type="password" required autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className={`${input} font-mono`} />
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {isNativeApp()
                    ? t('Klucz jest trzymany wyłącznie w pamięci aplikacji i znika po jej zamknięciu.')
                    : t('Klucz jest trzymany wyłącznie w pamięci tej karty i znika po jej zamknięciu.')}
                </p>
              </div>
              <button type="submit" disabled={busy || !token.trim()} className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                <Link2 className="h-4 w-4" aria-hidden="true" />
                <span>{busy ? t('Łączenie...') : t('Połącz i znajdź badanie')}</span>
              </button>
            </form>
          )}

          {connected && !link && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {notFound
                  ? t('Nie znaleziono badania powiązanego z ankietą #{0}. Sprawdź połączenie ankiety w StrefieAnkiet albo wpisz numery ręcznie.', survey.sid)
                  : t('Połączono ze StrefąAnkiet. Wyszukaj badanie powiązane z ankietą #{0}.', survey.sid)}
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void handleFind()} className={outline}>
                  <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{t('Znajdź badanie')}</span>
                </button>
                <button type="button" onClick={handleDisconnect} className={outline}>
                  <Unplug className="h-4 w-4" aria-hidden="true" />
                  <span>{t('Rozłącz')}</span>
                </button>
              </div>
              <form onSubmit={handleManualLink} className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label htmlFor={`strefa-project-${uid}`} className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t('Nr projektu')}</label>
                  <input id={`strefa-project-${uid}`} type="number" min={1} value={manualProject} onChange={(e) => setManualProject(e.target.value)} className={`${input} font-mono`} />
                </div>
                <div>
                  <label htmlFor={`strefa-study-${uid}`} className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">{t('Nr badania')}</label>
                  <input id={`strefa-study-${uid}`} type="number" min={1} value={manualStudy} onChange={(e) => setManualStudy(e.target.value)} className={`${input} font-mono`} />
                </div>
                <button type="submit" disabled={busy} className={`${outline} col-span-2 sm:col-span-1`}>{t('Zapisz powiązanie')}</button>
              </form>
            </div>
          )}

          {connected && link && (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{snapshot?.studyTitle || link.studyTitle || t('Badanie #{0}', link.studyId)}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400"> · {t('projekt')} {link.projectId} · {t('badanie')} {link.studyId}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={busy} onClick={() => void refresh(link)} className={outline}>
                    <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
                    <span>{t('Odśwież')}</span>
                  </button>
                  <button type="button" onClick={handleUnlink} className={outline}>{t('Zmień badanie')}</button>
                </div>
              </div>

              {!snapshot && busy && <p className="text-xs text-slate-500 dark:text-slate-400">{t('Wczytywanie stanu realizacji...')}</p>}

              {snapshot && (
                <>
                  {/* CAPI */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <TabletSmartphone className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span>{t('CAPI — wywiady bezpośrednie')}</span>
                    </div>
                    {snapshot.capi.available ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className={stat}>
                            <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">{snapshot.capi.confirmedCompleted}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('potwierdzone wywiady w LimeSurvey')}</div>
                          </div>
                          <div className={stat}>
                            <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">{snapshot.capi.nativeCompleted}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('wywiady z aplikacji ankietera')}</div>
                          </div>
                        </div>
                        {snapshot.capi.assignments.length > 0 ? (
                          <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-100 dark:border-slate-800">
                            {snapshot.capi.assignments.map((a) => (
                              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-xs">
                                <span className="font-semibold text-slate-900 dark:text-white">{a.worker}</span>
                                <span className="font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                                  {a.completed}{a.target !== null ? ` / ${a.target}` : ''} · {a.modes.map((m) => m.toUpperCase()).join(', ') || '—'} · {t(STATUS_LABEL[a.status] || a.status)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Brak przydziałów do wyświetlenia (lub klucz nie ma roli koordynatora).')}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Niedostępne: {0}', snapshot.capi.reason)}</p>
                    )}
                  </div>

                  {/* CATI */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <PhoneCall className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      <span>{t('CATI — wywiady telefoniczne')}</span>
                    </div>
                    {snapshot.cati.available ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className={stat}>
                            <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">{snapshot.cati.total}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('spraw w kolejce')}</div>
                          </div>
                          <div className={stat}>
                            <div className="font-mono text-lg font-bold tabular-nums text-slate-900 dark:text-white">{snapshot.cati.needsAssignment}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('bez przydziału')}</div>
                          </div>
                          <div className={stat}>
                            <div className={`font-mono text-lg font-bold tabular-nums ${snapshot.cati.attention > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>{snapshot.cati.attention}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('wymaga uwagi')}</div>
                          </div>
                        </div>
                        {snapshot.cati.blockingReasons.length > 0 && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">{t('Blokady:')} {snapshot.cati.blockingReasons.join(', ')}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('Niedostępne: {0}', snapshot.cati.reason)}</p>
                    )}
                  </div>
                </>
              )}

              <button type="button" onClick={handleDisconnect} className={outline}>
                <Unplug className="h-4 w-4" aria-hidden="true" />
                <span>{t('Rozłącz ze StrefąAnkiet')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
