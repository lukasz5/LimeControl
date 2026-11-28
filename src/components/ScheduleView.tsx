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
  ScheduleAction,
  ScheduleJob,
} from '../types/limesurvey';
import { useNotifications } from './NotificationProvider';
import { getLang, locale, t } from '../i18n';

/** Nazwy operacji harmonogramu (klucze tłumaczeń). */
export function scheduleActionLabel(action: ScheduleAction | undefined): string {
  switch (action) {
    case 'expire':
      return t('Zamknięcie ankiety');
    case 'invite':
      return t('Wysyłka zaproszeń');
    case 'remind':
      return t('Wysyłka przypomnień');
    default:
      return t('Aktywacja ankiety');
  }
}

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
  const { notify } = useNotifications();
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
  const [action, setAction] = useState<ScheduleAction>('activate');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [minDaysBetween, setMinDaysBetween] = useState<string>('');
  const [maxReminders, setMaxReminders] = useState<string>('');
  const [repeatEveryDays, setRepeatEveryDays] = useState<string>('');
  const [repeatCount, setRepeatCount] = useState<string>('');
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
      setError(t('Najpierw połącz się z instancją LimeSurvey w zakładce Instancje.'));
      return;
    }

    const sid = Number(surveyIdInput);
    if (!sid || Number.isNaN(sid)) {
      setError(t('Wybierz ankietę lub wpisz prawidłowe ID ankiety (SID).'));
      return;
    }

    if (!password) {
      setError(
        t('Podaj hasło administratora — harmonogram serwera potrzebuje go, aby uwierzytelnić sesję o zaplanowanej godzinie.')
      );
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      setError(t('Podaj prawidłową datę i godzinę wykonania.'));
      return;
    }

    const repeatEvery = action === 'remind' && repeatEveryDays ? Number(repeatEveryDays) : null;
    const repeatTimes = action === 'remind' && repeatCount ? Number(repeatCount) : null;
    if (Boolean(repeatEvery) !== Boolean(repeatTimes)) {
      setError(t('Aby powtarzać przypomnienia, podaj odstęp w dniach i liczbę powtórzeń.'));
      return;
    }

    setSubmitting(true);
    try {
      const job = await createSchedule({
        action,
        lang: getLang(),
        tzOffsetMinutes: new Date().getTimezoneOffset(),
        minDaysBetween: action === 'remind' && minDaysBetween ? Number(minDaysBetween) : null,
        maxReminders: action === 'remind' && maxReminders ? Number(maxReminders) : null,
        repeatEveryDays: repeatEvery,
        repeatRemaining: repeatTimes,
        surveyId: sid,
        surveyTitle: selectedSurvey?.surveyls_title || t('Ankieta #{0}', sid),
        instanceName: activeSession.profileName,
        rpcEndpoint: activeSession.rpcEndpoint,
        username: activeSession.username,
        password,
        authPlugin: activeSession.authPlugin || 'Authdb',
        limeVersion: activeSession.limeVersion || 'auto',
        scheduledAt: scheduledDate.toISOString(),
        activateTokens: action === 'activate' && activateTokens,
        startdateAt: null,
        expiresAt: action === 'activate' && expiresAt ? new Date(expiresAt).toISOString() : null,
        clearCredentialsAfterRun: clearCreds,
      });

      setJobs((prev) => [job, ...prev]);
      const summary = t('{0}: ankieta #{1}, {2}.', scheduleActionLabel(action), sid, scheduledDate.toLocaleString(locale()));
      setSuccessMsg(t('Zaplanowano zadanie. {0}', summary));
      notify({
        type: 'info',
        title: t('Dodano zadanie do harmonogramu'),
        message: summary,
        dedupeKey: `schedule:create:${job.id}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify({
        type: 'error',
        title: t('Błąd planowania harmonogramu'),
        message: msg,
      });
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
      if (updated.status === 'completed') {
        notify({
          type: 'success',
          title: t('Zadanie wykonane pomyślnie'),
          message: updated.resultMessage || `${scheduleActionLabel(updated.action)} · #${updated.surveyId}`,
          dedupeKey: `job:${updated.id}:completed`,
        });
      } else if (updated.status === 'failed') {
        notify({
          type: 'error',
          title: t('Błąd wykonania zadania (#{0})', updated.surveyId),
          message: updated.resultMessage,
          dedupeKey: `job:${updated.id}:failed`,
        });
      }
      onJobExecuted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify({
        type: 'error',
        title: t('Błąd uruchamiania zadania'),
        message: msg,
      });
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
      notify({
        type: 'info',
        title: t('Anulowano zadanie harmonogramu'),
        message: t('{0} dla ankiety #{1} nie zostanie wykonane.', scheduleActionLabel(updated.action), updated.surveyId),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      notify({
        type: 'error',
        title: t('Błąd anulowania zadania'),
        message: msg,
      });
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
          label: t('Zaplanowane'),
          className: 'text-amber-700 dark:text-amber-400',
        };
      case 'running':
        return {
          label: t('Wykonywanie...'),
          className: 'text-sky-700 dark:text-sky-400',
        };
      case 'completed':
        return {
          label: t('Zakończone'),
          className: 'text-emerald-700 dark:text-emerald-400',
        };
      case 'failed':
        return {
          label: t('Błąd'),
          className: 'text-rose-700 dark:text-rose-400',
        };
      case 'cancelled':
        return {
          label: t('Anulowane'),
          className: 'text-slate-500 dark:text-slate-400',
        };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('Harmonogram ankiet')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t('Serwer o wybranej godzinie aktywuje lub zamknie ankietę albo wyśle zaproszenia i przypomnienia — nawet po zamknięciu aplikacji na telefonie.')}
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
          <span>{t('Odśwież listę')}</span>
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
        <form
          onSubmit={handleCreateSchedule}
          className="md:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('Nowe zadanie')}
            </h3>
          </div>

          <div>
            <label htmlFor="schedule-action" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('Operacja')}
            </label>
            <select
              id="schedule-action"
              value={action}
              onChange={(e) => setAction(e.target.value as ScheduleAction)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="activate">{t('Aktywuj ankietę (activate_survey)')}</option>
              <option value="expire">{t('Zamknij ankietę (expires)')}</option>
              <option value="invite">{t('Wyślij zaproszenia (invite_participants)')}</option>
              <option value="remind">{t('Wyślij przypomnienia (remind_participants)')}</option>
            </select>
          </div>

          {!activeSession && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              {t('Połącz się z instancją LimeSurvey, aby wybrać ankietę z listy i zaplanować zadanie.')}
            </div>
          )}

          {surveys.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {action === 'activate' ? (
                  <>
                    {t('Wybierz ankietę (')}{inactiveSurveys.length}{' '}{t('nieaktywnych)')}
                  </>
                ) : (
                  t('Wybierz ankietę')
                )}
              </label>
              <select
                value={surveyIdInput}
                onChange={(e) => setSurveyIdInput(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="">{t('-- Wybierz ankietę --')}</option>
                {surveys.map((s) => (
                  <option key={s.sid} value={String(s.sid)}>
                    #{s.sid} · {s.surveyls_title} ({s.active === 'Y' ? t('Aktywna') : t('Nieaktywna')})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('ID ankiety (SID)')}
            </label>
            <input
              type="number"
              required
              value={surveyIdInput}
              onChange={(e) => setSurveyIdInput(e.target.value)}
              placeholder={t('np. 482910')}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Data i godzina wykonania')}
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {action === 'activate' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Auto-wygaśnięcie (opcjonalne)')}
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {(action === 'invite' || action === 'remind') && (
            <p className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-3 text-[11px] text-slate-600 dark:text-slate-400">
              {action === 'invite'
                ? t('Zaproszenia trafią do uczestników, którzy jeszcze ich nie dostali. Ankieta musi być aktywna i mieć tabelę uczestników.')
                : t('Przypomnienia trafią do uczestników, którzy dostali zaproszenie i nie ukończyli ankiety.')}
            </p>
          )}

          {action === 'remind' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="schedule-min-days" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Min. dni od ostatniej wiadomości')}
                </label>
                <input id="schedule-min-days" type="number" min={0} max={365} value={minDaysBetween} onChange={(e) => setMinDaysBetween(e.target.value)} placeholder="—"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="schedule-max-reminders" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Maks. przypomnień na osobę')}
                </label>
                <input id="schedule-max-reminders" type="number" min={1} max={50} value={maxReminders} onChange={(e) => setMaxReminders(e.target.value)} placeholder="—"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="schedule-repeat-every" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Powtarzaj co (dni)')}
                </label>
                <input id="schedule-repeat-every" type="number" min={1} max={60} value={repeatEveryDays} onChange={(e) => setRepeatEveryDays(e.target.value)} placeholder="—"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="schedule-repeat-count" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Liczba powtórzeń')}
                </label>
                <input id="schedule-repeat-count" type="number" min={1} max={24} value={repeatCount} onChange={(e) => setRepeatCount(e.target.value)} placeholder="—"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('Hasło konta LimeSurvey dla zadania')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Hasło sesji RPC')}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            {action === 'activate' && (
              <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateTokens}
                  onChange={(e) => setActivateTokens(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{t('Uruchom także tabelę uczestników (activate_tokens)')}</span>
              </label>
            )}

            <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={clearCreds}
                onChange={(e) => setClearCreds(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t('Usuń hasło z kolejki natychmiast po wykonaniu zadania')}</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || !activeSession}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? t('Zapisywanie...') : t('Zaplanuj na serwerze')}
          </button>
        </form>

        <div className="md:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('Kolejka zadań serwera (')}{jobs.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t('Cykl sprawdzania: co 15 s')}
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('Brak zaplanowanych zadań. Utwórz pierwsze zadanie w formularzu obok.')}
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
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {scheduleActionLabel(job.action)}
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
                        {t('Start:')}{' '}{new Date(job.scheduledAt).toLocaleString(locale())}
                        {job.expiresAt
                          ? ` · ${t('Koniec:')} ${new Date(job.expiresAt).toLocaleString(locale())}`
                          : ''}
                        {job.repeatEveryDays && job.repeatRemaining
                          ? ` · ${t('powtórzy się jeszcze {0}× co {1} dni', job.repeatRemaining, job.repeatEveryDays)}`
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
                            <span>{t('Uruchom teraz')}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              void handleCancel(job.id);
                            }}
                            className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                          >
                            {t('Anuluj')}
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
                          aria-label={t('Usuń zadanie z historii')}
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
