import React, { useEffect, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Play,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  cancelSchedule,
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  runScheduleNow,
} from '../services/schedulerApi';
import type {
  ActiveSession,
  InstanceProfile,
  LimeSurveyItem,
  ScheduleJob,
} from '../types/limesurvey';

interface ScheduleViewProps {
  activeSession: ActiveSession | null;
  activeProfile: InstanceProfile | null;
  surveys: LimeSurveyItem[];
  preselectedSurveyId: number | null;
  onJobExecuted?: () => void;
}

function defaultFutureLocalInput(minutesAhead = 60): string {
  const d = new Date(Date.now() + minutesAhead * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  activeSession,
  activeProfile,
  surveys,
  preselectedSurveyId,
  onJobExecuted,
}) => {
  const [jobs, setJobs] = useState<ScheduleJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [surveyIdInput, setSurveyIdInput] = useState<string>(
    preselectedSurveyId ? String(preselectedSurveyId) : ''
  );
  const [scheduledAt, setScheduledAt] = useState<string>(() =>
    defaultFutureLocalInput(30)
  );
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [activateTokens, setActivateTokens] = useState<boolean>(false);
  const [clearCreds, setClearCreds] = useState<boolean>(true);
  const [password, setPassword] = useState<string>(
    activeProfile?.password || ''
  );

  useEffect(() => {
    if (preselectedSurveyId) {
      setSurveyIdInput(String(preselectedSurveyId));
    }
  }, [preselectedSurveyId]);

  useEffect(() => {
    if (activeProfile?.password && !password) {
      setPassword(activeProfile.password);
    }
  }, [activeProfile, password]);

  async function loadJobs(silent = false) {
    if (!silent) setLoadingJobs(true);
    try {
      const list = await fetchSchedules();
      setJobs(list);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!silent) setLoadingJobs(false);
    }
  }

  useEffect(() => {
    void loadJobs(false);
    const interval = setInterval(() => {
      void loadJobs(true);
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const inactiveSurveys = surveys.filter((s) => s.active !== 'Y');
  const selectedSurvey = surveys.find((s) => String(s.sid) === surveyIdInput);

  async function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!activeSession) {
      setError('Najpierw połącz się z instancją LimeSurvey w zakładce Instancje.');
      return;
    }

    const sid = Number(surveyIdInput);
    if (!sid || Number.isNaN(sid)) {
      setError('Wybierz ankietę lub wpisz prawidłowe ID ankiety (SID).');
      return;
    }

    if (!password) {
      setError(
        'Podaj hasło administratora — harmonogram serwera potrzebuje go, aby uwierzytelnić sesję o zaplanowanej godzinie.'
      );
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setError('Podaj prawidłową datę i godzinę aktywacji.');
      return;
    }

    setSubmitting(true);
    try {
      const job = await createSchedule({
        surveyId: sid,
        surveyTitle: selectedSurvey?.surveyls_title || `Ankieta #${sid}`,
        instanceName: activeSession.profileName,
        rpcEndpoint: activeSession.rpcEndpoint,
        username: activeSession.username,
        password,
        authPlugin: activeSession.authPlugin || 'Authdb',
        scheduledAt: scheduledDate.toISOString(),
        activateTokens,
        startdateAt: null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        clearCredentialsAfterRun: clearCreds,
      });

      setJobs((prev) => [job, ...prev]);
      setSuccessMsg(
        `Zaplanowano automatyczne wywołanie activate_survey dla ankiety #${sid}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRunNow(jobId: string) {
    setActionId(jobId);
    setError(null);
    try {
      const updated = await runScheduleNow(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
      onJobExecuted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(jobId: string) {
    setActionId(jobId);
    setError(null);
    try {
      const updated = await cancelSchedule(jobId);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? updated : j)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(jobId: string) {
    setActionId(jobId);
    try {
      await deleteSchedule(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionId(null);
    }
  }

  function formatStatusLabel(status: ScheduleJob['status']): {
    label: string;
    className: string;
  } {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Zaplanowane',
          className: 'text-amber-700 dark:text-amber-400',
        };
      case 'running':
        return {
          label: 'Wykonywanie...',
          className: 'text-sky-700 dark:text-sky-400',
        };
      case 'completed':
        return {
          label: 'Zakończone',
          className: 'text-emerald-700 dark:text-emerald-400',
        };
      case 'failed':
        return {
          label: 'Błąd',
          className: 'text-rose-700 dark:text-rose-400',
        };
      case 'cancelled':
        return {
          label: 'Anulowane',
          className: 'text-slate-500 dark:text-slate-400',
        };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Harmonogram aktywowania ankiet
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Serwer automatycznie wywoła <code className="font-mono">activate_survey</code> o wybranej godzinie — nawet po zamknięciu aplikacji na telefonie.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadJobs(false);
          }}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loadingJobs ? 'animate-spin' : ''}`} />
          <span>Odśwież listę</span>
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        <form
          onSubmit={handleCreateSchedule}
          className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Nowe zadanie aktywacji
            </h3>
          </div>

          {!activeSession && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              Połącz się z instancją LimeSurvey, aby wybrać ankietę z listy i zaplanować zadanie.
            </div>
          )}

          {surveys.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wybierz ankietę ({inactiveSurveys.length} nieaktywnych)
              </label>
              <select
                value={surveyIdInput}
                onChange={(e) => setSurveyIdInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Wybierz ankietę --</option>
                {surveys.map((s) => (
                  <option key={s.sid} value={String(s.sid)}>
                    #{s.sid} · {s.surveyls_title} ({s.active === 'Y' ? 'Aktywna' : 'Nieaktywna'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              ID ankiety (SID)
            </label>
            <input
              type="number"
              required
              value={surveyIdInput}
              onChange={(e) => setSurveyIdInput(e.target.value)}
              placeholder="np. 482910"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data i godzina aktywacji
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Auto-wygaśnięcie (opcjonalne)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Hasło konta LimeSurvey dla zadania
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Hasło sesji RPC"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={activateTokens}
                onChange={(e) => setActivateTokens(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Uruchom także tabelę uczestników (activate_tokens)</span>
            </label>

            <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={clearCreds}
                onChange={(e) => setClearCreds(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Usuń hasło z kolejki natychmiast po wykonaniu zadania</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !activeSession}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Zapisywanie...' : 'Zaplanuj aktywację na serwerze'}
          </button>
        </form>

        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Kolejka zadań serwera ({jobs.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Cykl sprawdzania: co 15 s
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Brak zaplanowanych zadań aktywacji. Utwórz pierwsze zadanie w formularzu obok.
            </div>
          ) : (
            jobs.map((job) => {
              const st = formatStatusLabel(job.status);
              const busy = actionId === job.id;
              return (
                <div key={job.id} className="p-5 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className={`font-semibold ${st.className}`}>
                          {st.label}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          SID {job.surveyId}
                        </span>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">
                          {job.instanceName}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {job.surveyTitle}
                      </h4>
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                        Start: {new Date(job.scheduledAt).toLocaleString('pl-PL')}
                        {job.expiresAt
                          ? ` · Koniec: ${new Date(job.expiresAt).toLocaleString('pl-PL')}`
                          : ''}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {job.resultMessage}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {job.status === 'scheduled' && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              void handleRunNow(job.id);
                            }}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Uruchom teraz</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              void handleCancel(job.id);
                            }}
                            className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                          >
                            Anuluj
                          </button>
                        </>
                      )}
                      {job.status !== 'running' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            void handleDelete(job.id);
                          }}
                          aria-label="Usuń zadanie z historii"
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {job.steps.length > 0 && (
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5 border border-slate-100 dark:border-slate-800">
                      {job.steps.map((step, idx) => (
                        <div
                          key={`${job.id}_step_${idx}`}
                          className="flex items-start gap-2 text-xs"
                        >
                          {step.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                          )}
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {step.step}:
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 break-words">
                            {step.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
