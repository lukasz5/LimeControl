import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  ChevronRight,
  CopyPlus,
  Download,
  GitCompareArrows,
  Lock,
  MoreVertical,
  Play,
  RefreshCw,
  Search,
  Server,
  Users,
  X,
} from 'lucide-react';
import {
  activateSurvey,
  activateTokens,
  copySurvey,
  exportResponses,
  formatLimeSurveyDateTime,
  getSummary,
  getSurveyProperties,
  setSurveyProperties,
} from '../services/limeSurveyRpc';
import type {
  ActiveSession,
  LimeSurveyItem,
  SurveyProperties,
  SurveySummary,
} from '../types/limesurvey';
import { useNotifications } from './NotificationProvider';
import { SurveyComparisonChart } from './SurveyComparisonChart';
import { SurveySummaryCharts } from './SurveySummaryCharts';
import { SurveySummaryRing } from './SurveySummaryRing';

interface SurveysViewProps {
  activeSession: ActiveSession | null;
  surveys: LimeSurveyItem[];
  loadingSurveys: boolean;
  onRefreshSurveys: () => Promise<void>;
  onScheduleSurvey: (surveyId: number) => void;
  onOpenParticipants: (surveyId: number) => void;
  onGoToInstances: () => void;
}

type StatusFilter = 'all' | 'active' | 'inactive';

export const SurveysView: React.FC<SurveysViewProps> = ({
  activeSession,
  surveys,
  loadingSurveys,
  onRefreshSurveys,
  onScheduleSurvey,
  onOpenParticipants,
  onGoToInstances,
}) => {
  const { notify } = useNotifications();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedSurvey, setSelectedSurvey] = useState<LimeSurveyItem | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [openQuickMenuSid, setOpenQuickMenuSid] = useState<number | null>(null);
  const comparisonSectionRef = useRef<HTMLDivElement | null>(null);
  const statsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openQuickMenuSid === null) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-quick-actions-root="true"]')) {
        setOpenQuickMenuSid(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenQuickMenuSid(null);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openQuickMenuSid]);

  // Selected survey details
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [properties, setProperties] = useState<SurveyProperties | null>(null);

  // Action states
  const [busyAction, setBusyAction] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionErr, setActionErr] = useState<string | null>(null);

  // Activation & Schedule date inputs
  const [alsoActivateTokens, setAlsoActivateTokens] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [expiresDateInput, setExpiresDateInput] = useState('');

  // Export state
  const [exportFormat, setExportFormat] = useState<'csv' | 'xls' | 'json'>('csv');
  const [exportStatus, setExportStatus] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [exportPreview, setExportPreview] = useState<string | null>(null);

  // Copy survey state
  const [copyTitle, setCopyTitle] = useState('');

  const filteredSurveys = useMemo(() => {
    return surveys.filter((s) => {
      if (filter === 'active' && s.active !== 'Y') return false;
      if (filter === 'inactive' && s.active === 'Y') return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          s.surveyls_title.toLowerCase().includes(q) ||
          String(s.sid).includes(q)
        );
      }
      return true;
    });
  }, [surveys, filter, search]);

  useEffect(() => {
    if (!selectedSurvey && filteredSurveys.length > 0) {
      const firstActive = filteredSurveys.find((s) => s.active === 'Y');
      setSelectedSurvey(firstActive || filteredSurveys[0]);
    } else if (selectedSurvey) {
      const updated = surveys.find((s) => s.sid === selectedSurvey.sid);
      if (updated) {
        setSelectedSurvey(updated);
      }
    }
  }, [surveys, filteredSurveys, selectedSurvey]);

  useEffect(() => {
    if (!activeSession || !selectedSurvey) {
      setSummary(null);
      setProperties(null);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);
    setActionMsg(null);
    setActionErr(null);
    setExportPreview(null);
    setCopyTitle(`${selectedSurvey.surveyls_title} (Kopia)`);
    setStartDateInput(
      selectedSurvey.startdate
        ? selectedSurvey.startdate.replace(' ', 'T').slice(0, 16)
        : ''
    );
    setExpiresDateInput(
      selectedSurvey.expires
        ? selectedSurvey.expires.replace(' ', 'T').slice(0, 16)
        : ''
    );

    Promise.all([
      getSummary(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        'all',
        activeSession.connectionMode
      ).catch((err) => {
        if (!cancelled) {
          setSummaryError(
            err instanceof Error ? err.message : 'Brak podsumowania dla nieaktywnej ankiety.'
          );
        }
        return null;
      }),
      getSurveyProperties(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        activeSession.connectionMode
      ).catch(() => null),
    ]).then(([sum, props]) => {
      if (cancelled) return;
      setSummary(sum);
      setProperties(props);
      setSummaryLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSession, selectedSurvey?.sid]);

  async function handleActivateNow() {
    if (!activeSession || !selectedSurvey) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);

    try {
      await activateSurvey(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        activeSession.connectionMode
      );

      if (alsoActivateTokens) {
        await activateTokens(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          selectedSurvey.sid,
          activeSession.connectionMode
        ).catch(() => null);
      }

      const propsToSave: Record<string, string> = {};
      if (startDateInput) {
        propsToSave.startdate = formatLimeSurveyDateTime(startDateInput);
      }
      if (expiresDateInput) {
        propsToSave.expires = formatLimeSurveyDateTime(expiresDateInput);
      }
      if (Object.keys(propsToSave).length > 0) {
        await setSurveyProperties(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          selectedSurvey.sid,
          propsToSave,
          activeSession.connectionMode
        );
      }

      await onRefreshSurveys();
      const msg = `Ankieta #${selectedSurvey.sid} została pomyślnie aktywowana.`;
      setActionMsg(msg);
      notify({
        type: 'success',
        title: 'Ankieta aktywowana',
        message: `${selectedSurvey.surveyls_title} (SID ${selectedSurvey.sid})`,
      });
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  }

  async function handleUpdateWindow() {
    if (!activeSession || !selectedSurvey) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const propsToSave: Record<string, string | null> = {
        startdate: startDateInput ? formatLimeSurveyDateTime(startDateInput) : null,
        expires: expiresDateInput ? formatLimeSurveyDateTime(expiresDateInput) : null,
      };
      await setSurveyProperties(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        propsToSave,
        activeSession.connectionMode
      );
      await onRefreshSurveys();
      setActionMsg('Zaktualizowano daty startdate / expires w LimeSurvey.');
      notify({
        type: 'success',
        title: 'Zaktualizowano harmonogram dat',
        message: `Zapisano właściwości ankiety #${selectedSurvey.sid}.`,
      });
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCloseSurveyNow() {
    if (!activeSession || !selectedSurvey) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      const nowFormatted = formatLimeSurveyDateTime(new Date().toISOString());
      await setSurveyProperties(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        { expires: nowFormatted },
        activeSession.connectionMode
      );
      setExpiresDateInput(nowFormatted.replace(' ', 'T').slice(0, 16));
      await onRefreshSurveys();
      setActionMsg(
        `Zamknięto przyjmowanie odpowiedzi (ustawiono expires = ${nowFormatted}).`
      );
      notify({
        type: 'info',
        title: 'Zamknięto ankietę',
        message: `Ankieta #${selectedSurvey.sid} wygasła (${nowFormatted}).`,
      });
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  }

  async function handleExport() {
    if (!activeSession || !selectedSurvey) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    setExportPreview(null);

    try {
      const result = await exportResponses(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        exportFormat,
        exportStatus,
        'full',
        undefined,
        activeSession.connectionMode
      );

      const mimeMap = {
        csv: 'text/csv;charset=utf-8',
        xls: 'application/vnd.ms-excel',
        json: 'application/json;charset=utf-8',
      };
      const blob = new Blob([new Uint8Array(result.bytes)], {
        type: mimeMap[exportFormat],
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${selectedSurvey.sid}_responses.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      if (result.textPreview) {
        const lines = result.textPreview.split('\n').slice(0, 12).join('\n');
        setExportPreview(lines);
      }
      setActionMsg(`Pobrano plik odpowiedzi (${exportFormat.toUpperCase()}).`);
      notify({
        type: 'success',
        title: 'Eksport odpowiedzi zakończony',
        message: `Pobrano plik ${exportFormat.toUpperCase()} dla ankiety #${selectedSurvey.sid}.`,
      });
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCopySurvey() {
    if (!activeSession || !selectedSurvey || !copyTitle.trim()) return;
    setBusyAction(true);
    setActionErr(null);
    setActionMsg(null);
    try {
      await copySurvey(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        selectedSurvey.sid,
        copyTitle.trim(),
        activeSession.connectionMode
      );
      await onRefreshSurveys();
      setActionMsg(`Utworzono kopię ankiety: „${copyTitle.trim()}”.`);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyAction(false);
    }
  }

  if (!activeSession) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 text-center space-y-4">
        <Server className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
        <div className="space-y-1.5 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Połącz się z instancją LimeSurvey
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Dodaj adres swojego serwera i dane administratora w zakładce Instancje, aby przeglądać ankiety, uruchamiać je, planować harmonogram aktywacji i eksportować odpowiedzi.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToInstances}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Konfiguruj połączenie
        </button>
      </div>
    );
  }

  const activeCount = surveys.filter((s) => s.active === 'Y').length;
  const inactiveCount = surveys.length - activeCount;

  const detailContent = selectedSurvey ? (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            <span>SID {selectedSurvey.sid}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                selectedSurvey.active === 'Y'
                  ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                  : 'font-semibold text-amber-700 dark:text-amber-400'
              }
            >
              {selectedSurvey.active === 'Y' ? 'Aktywna' : 'Nieaktywna'}
            </span>
            {properties?.language && (
              <>
                <span aria-hidden="true">·</span>
                <span>Język: {String(properties.language)}</span>
              </>
            )}
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {selectedSurvey.surveyls_title}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setMobileDetailOpen(false)}
          aria-label="Zamknij szczegóły"
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {actionErr && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {actionErr}
        </div>
      )}

      {actionMsg && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {actionMsg}
        </div>
      )}

      <div ref={statsSectionRef} className="space-y-5 scroll-mt-4">
        <SurveySummaryRing
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
        />

        <SurveySummaryCharts
          surveyTitle={selectedSurvey.surveyls_title}
          surveyId={selectedSurvey.sid}
          isActive={selectedSurvey.active === 'Y'}
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          onCompareWithAnother={
            surveys.length >= 2
              ? () => {
                  setMobileDetailOpen(false);
                  setCompareOpen(true);
                  requestAnimationFrame(() => {
                    comparisonSectionRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  });
                }
              : undefined
          }
        />
      </div>

      {/* Aktywacja / Harmonogram / Zamknięcie */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Cykl życia ankiety
        </h4>

        {selectedSurvey.active !== 'Y' ? (
          <div className="space-y-3">
            <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoActivateTokens}
                onChange={(e) => setAlsoActivateTokens(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Jednocześnie utwórz tabelę uczestników (activate_tokens)</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busyAction}
                onClick={() => {
                  void handleActivateNow();
                }}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                <span>Aktywuj teraz (activate_survey)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileDetailOpen(false);
                  onScheduleSurvey(selectedSurvey.sid);
                }}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                <span>Zaplanuj na później</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileDetailOpen(false);
                onOpenParticipants(selectedSurvey.sid);
              }}
              className="min-h-[44px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Users className="h-4 w-4" />
              <span>Uczestnicy i tokeny</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={busyAction}
              onClick={() => {
                void handleCloseSurveyNow();
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 px-4 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              <span>Zamknij ankietę teraz (expires)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileDetailOpen(false);
                onOpenParticipants(selectedSurvey.sid);
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Users className="h-4 w-4" />
              <span>Uczestnicy i tokeny</span>
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Okno dostępności (set_survey_properties)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Data startu (startdate)
              </label>
              <input
                type="datetime-local"
                value={startDateInput}
                onChange={(e) => setStartDateInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                Data wygaśnięcia (expires)
              </label>
              <input
                type="datetime-local"
                value={expiresDateInput}
                onChange={(e) => setExpiresDateInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={busyAction}
            onClick={() => {
              void handleUpdateWindow();
            }}
            className="min-h-[44px] rounded-xl bg-slate-900 dark:bg-slate-800 px-4 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Zapisz daty w LimeSurvey
          </button>
        </div>
      </div>

      {/* Eksport odpowiedzi */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Eksport odpowiedzi (export_responses)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Format pliku
            </label>
            <select
              value={exportFormat}
              onChange={(e) =>
                setExportFormat(e.target.value as 'csv' | 'xls' | 'json')
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="csv">CSV (tekst rozdzielany przecinkami)</option>
              <option value="xls">Excel (.xls)</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Zakres odpowiedzi
            </label>
            <select
              value={exportStatus}
              onChange={(e) =>
                setExportStatus(
                  e.target.value as 'all' | 'complete' | 'incomplete'
                )
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white"
            >
              <option value="all">Wszystkie odpowiedzi</option>
              <option value="complete">Tylko ukończone</option>
              <option value="incomplete">Tylko nieukończone</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          disabled={busyAction || selectedSurvey.active !== 'Y'}
          onClick={() => {
            void handleExport();
          }}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          <span>Pobierz wyniki ({exportFormat.toUpperCase()})</span>
        </button>

        {exportPreview && (
          <pre className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-100 dark:border-slate-800">
            {exportPreview}
          </pre>
        )}
      </div>

      {/* Kopiowanie ankiety */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Duplikowanie ankiety (copy_survey)
        </h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={copyTitle}
            onChange={(e) => setCopyTitle(e.target.value)}
            placeholder="Nazwa nowej kopii"
            className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white"
          />
          <button
            type="button"
            disabled={busyAction || !copyTitle.trim()}
            onClick={() => {
              void handleCopySurvey();
            }}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <CopyPlus className="h-4 w-4" />
            <span>Kopiuj ankietę</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ankiety w instancji
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
            {activeSession.profileName} · Łącznie: {surveys.length} · Aktywne: {activeCount} · Nieaktywne: {inactiveCount}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          {surveys.length >= 2 && (
            <button
              type="button"
              aria-expanded={compareOpen}
              onClick={() => setCompareOpen((prev) => !prev)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                compareOpen
                  ? 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
              <span>{compareOpen ? 'Ukryj porównanie' : 'Porównaj ankiety'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              void onRefreshSurveys();
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loadingSurveys ? 'animate-spin' : ''}`} />
            <span>Odśwież listę</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po nazwie lub SID..."
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'active'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Aktywne
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filter === 'inactive'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Nieaktywne
          </button>
        </div>
      </div>

      {compareOpen && surveys.length >= 2 && (
        <div ref={comparisonSectionRef}>
          <SurveyComparisonChart
            activeSession={activeSession}
            surveys={surveys}
            initialSurveyAId={selectedSurvey?.sid}
            onClose={() => setCompareOpen(false)}
          />
        </div>
      )}

      {selectedSurvey && selectedSurvey.active === 'Y' && (
        <div className="lg:hidden">
          <SurveySummaryCharts
            surveyTitle={selectedSurvey.surveyls_title}
            surveyId={selectedSurvey.sid}
            isActive={true}
            summary={summary}
            loading={summaryLoading}
            error={summaryError}
            compact
            onCompareWithAnother={
              surveys.length >= 2
                ? () => {
                    setCompareOpen(true);
                    requestAnimationFrame(() => {
                      comparisonSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    });
                  }
                : undefined
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSurveys.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Brak ankiet pasujących do wybranych kryteriów.
            </div>
          ) : (
            filteredSurveys.map((survey) => {
              const isSelected = selectedSurvey?.sid === survey.sid;
              const isActive = survey.active === 'Y';
              const isMenuOpen = openQuickMenuSid === survey.sid;
              const titleText = survey.surveyls_title || `Ankieta #${survey.sid}`;

              return (
                <div
                  key={survey.sid}
                  className={`relative flex items-center justify-between gap-2 px-3 py-2.5 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenQuickMenuSid(null);
                      setSelectedSurvey(survey);
                      setMobileDetailOpen(true);
                    }}
                    className="min-w-0 flex-1 text-left px-1.5 py-1.5 flex items-center justify-between gap-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {titleText}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                        <span>SID {survey.sid}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                              : 'text-amber-700 dark:text-amber-400 font-semibold'
                          }
                        >
                          {isActive ? 'Aktywna' : 'Nieaktywna'}
                        </span>
                        {survey.expires && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Koniec: {survey.expires.slice(0, 10)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </button>

                  <div
                    className="relative shrink-0"
                    data-quick-actions-root="true"
                  >
                    <button
                      type="button"
                      aria-label={`Szybkie akcje dla ankiety ${titleText}`}
                      aria-haspopup="menu"
                      aria-expanded={isMenuOpen}
                      title="Szybkie akcje"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenQuickMenuSid((prev) =>
                          prev === survey.sid ? null : survey.sid
                        );
                      }}
                      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                        isMenuOpen
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <MoreVertical className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {isMenuOpen && (
                      <div
                        role="menu"
                        aria-label={`Szybkie akcje: ${titleText}`}
                        className="absolute right-0 top-full mt-1.5 z-30 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 shadow-xl space-y-0.5"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenQuickMenuSid(null);
                            onOpenParticipants(survey.sid);
                          }}
                          className="min-h-[44px] w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Users className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                          <span>Edycja tokenów i uczestników</span>
                        </button>

                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setOpenQuickMenuSid(null);
                            setSelectedSurvey(survey);
                            setMobileDetailOpen(true);
                            requestAnimationFrame(() => {
                              statsSectionRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            });
                          }}
                          className="min-h-[44px] w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <BarChart3 className="h-4 w-4 text-sky-600 shrink-0" aria-hidden="true" />
                          <span>Statystyki i wykresy</span>
                        </button>

                        {surveys.length >= 2 && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenQuickMenuSid(null);
                              setSelectedSurvey(survey);
                              setCompareOpen(true);
                              requestAnimationFrame(() => {
                                comparisonSectionRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              });
                            }}
                            className="min-h-[44px] w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <GitCompareArrows className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                            <span>Porównaj na wykresie</span>
                          </button>
                        )}

                        {!isActive && (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenQuickMenuSid(null);
                              onScheduleSurvey(survey.sid);
                            }}
                            className="min-h-[44px] w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <CalendarClock className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
                            <span>Zaplanuj aktywację</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden lg:block lg:col-span-7">
          {detailContent || (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Wybierz ankietę z listy po lewej stronie, aby zarządzać aktywacją, statystykami i eksportem.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Sheet / Drawer for selected survey */}
      {mobileDetailOpen && selectedSurvey && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl bg-slate-50 dark:bg-slate-950 p-5 pb-8 shadow-2xl border-t border-slate-200 dark:border-slate-800">
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
            {detailContent}
          </div>
        </div>
      )}
    </div>
  );
};
