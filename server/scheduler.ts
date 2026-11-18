/**
 * Harmonogram po stronie serwera: zaplanowane operacje na ankietach LimeSurvey.
 *
 * Akcje:
 *   activate — activate_survey (+ opcjonalnie activate_tokens i daty startdate/expires)
 *   expire   — zamknięcie ankiety: set_survey_properties { expires: teraz }
 *   invite   — invite_participants do wszystkich, którzy nie dostali zaproszenia
 *   remind   — remind_participants (z opcjonalnym odstępem dni i limitem przypomnień),
 *              z możliwością powtarzania co N dni
 *
 * Kolejka jest trwała (data/schedules.json). Hasła do LimeSurvey są zapisywane w postaci
 * zaszyfrowanej (secretbox.ts) i usuwane po wykonaniu zadania.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callLimeSurveyRpc, formatLimeSurveyDate, parseMailBatch, statusError } from './limesurvey.ts';
import { LocalizedError, errorText, msg, normalizeLang, type Lang } from './messages.ts';
import { decryptSecret, encryptSecret } from './secretbox.ts';

export type ScheduleAction = 'activate' | 'expire' | 'invite' | 'remind';
export const SCHEDULE_ACTIONS: ScheduleAction[] = ['activate', 'expire', 'invite', 'remind'];
export type JobStatus = 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScheduleStepLog {
  step: string;
  ok: boolean;
  detail: string;
  timestamp: string;
}

export interface StoredScheduleJob {
  id: string;
  ownerUid?: string;
  action?: ScheduleAction;
  /** Język komunikatów zapisywanych w zadaniu (język aplikacji w chwili planowania). */
  lang?: Lang;
  surveyId: number;
  surveyTitle: string;
  instanceName: string;
  rpcEndpoint: string;
  username: string;
  /** Zaszyfrowane hasło (enc:v1:…); puste po wykonaniu lub anulowaniu. */
  password: string;
  authPlugin: string;
  limeVersion?: 'auto' | 'v7' | 'legacy';
  /** Przesunięcie strefy czasowej użytkownika w minutach (Date#getTimezoneOffset) — dla dat w LimeSurvey 3–6. */
  tzOffsetMinutes?: number;
  scheduledAt: string;
  activateTokens: boolean;
  startdateAt: string | null;
  expiresAt: string | null;
  /** remind: minimalna liczba dni od poprzedniej wiadomości. */
  minDaysBetween?: number | null;
  /** remind: maksymalna liczba przypomnień na uczestnika. */
  maxReminders?: number | null;
  /** remind: powtarzaj co N dni… */
  repeatEveryDays?: number | null;
  /** …jeszcze tyle razy po tym wykonaniu. */
  repeatRemaining?: number | null;
  clearCredentialsAfterRun: boolean;
  status: JobStatus;
  resultMessage: string;
  steps: ScheduleStepLog[];
  createdAt: string;
  executedAt: string | null;
}

export const MAX_JOBS_PER_USER = 200;
const MAX_MAIL_BATCHES = 200;

/** Zadanie w postaci bezpiecznej dla klienta (bez hasła). */
export function sanitizeJobForClient(job: StoredScheduleJob) {
  return {
    id: job.id,
    ownerUid: job.ownerUid,
    action: job.action || 'activate',
    surveyId: job.surveyId,
    surveyTitle: job.surveyTitle,
    instanceName: job.instanceName,
    rpcEndpoint: job.rpcEndpoint,
    username: job.username,
    authPlugin: job.authPlugin,
    limeVersion: job.limeVersion || 'auto',
    hasPassword: Boolean(job.password),
    scheduledAt: job.scheduledAt,
    activateTokens: job.activateTokens,
    startdateAt: job.startdateAt,
    expiresAt: job.expiresAt,
    minDaysBetween: job.minDaysBetween ?? null,
    maxReminders: job.maxReminders ?? null,
    repeatEveryDays: job.repeatEveryDays ?? null,
    repeatRemaining: job.repeatRemaining ?? null,
    clearCredentialsAfterRun: job.clearCredentialsAfterRun,
    status: job.status,
    resultMessage: job.resultMessage,
    steps: job.steps,
    createdAt: job.createdAt,
    executedAt: job.executedAt,
  };
}

const intInRange = (value: unknown, min: number, max: number): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
};

/**
 * Buduje zadanie z danych przesłanych przez klienta. Rzuca Error z czytelnym komunikatem.
 */
export function buildJob(body: Record<string, unknown>, uid: string, encrypt: (plain: string) => string, now = new Date()): StoredScheduleJob {
  const lang = normalizeLang(body.lang);
  const action = (body.action ?? 'activate') as ScheduleAction;
  if (!SCHEDULE_ACTIONS.includes(action)) throw new LocalizedError('job_action_unknown', [String(body.action)]);
  const surveyId = Number(body.surveyId);
  if (!Number.isInteger(surveyId) || surveyId <= 0) throw new LocalizedError('job_sid_invalid');
  for (const key of ['rpcEndpoint', 'username', 'password', 'scheduledAt'] as const) {
    if (typeof body[key] !== 'string' || !body[key]) throw new LocalizedError('job_required');
  }
  const rpcEndpoint = String(body.rpcEndpoint);
  let parsed: URL;
  try {
    parsed = new URL(rpcEndpoint);
  } catch {
    throw new LocalizedError('job_endpoint_invalid');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new LocalizedError('job_endpoint_protocol');
  if (rpcEndpoint.length > 500 || String(body.username).length > 190 || String(body.password).length > 1000) {
    throw new LocalizedError('job_too_long');
  }
  const scheduledDate = new Date(String(body.scheduledAt));
  if (Number.isNaN(scheduledDate.getTime())) throw new LocalizedError('job_date_invalid', ['scheduledAt']);
  const optionalDate = (value: unknown, name: string): string | null => {
    if (!value) return null;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) throw new LocalizedError('job_date_invalid', [name]);
    return d.toISOString();
  };

  const minDaysBetween = intInRange(body.minDaysBetween, 0, 365);
  const maxReminders = intInRange(body.maxReminders, 1, 50);
  const repeatEveryDays = intInRange(body.repeatEveryDays, 1, 60);
  const repeatRemaining = intInRange(body.repeatRemaining, 1, 24);
  const tzOffsetMinutes = intInRange(body.tzOffsetMinutes, -900, 900);
  if ([minDaysBetween, maxReminders, repeatEveryDays, repeatRemaining, tzOffsetMinutes].some((v) => Number.isNaN(v))) {
    throw new LocalizedError('job_number_invalid');
  }
  if ((repeatEveryDays || repeatRemaining) && action !== 'remind') throw new LocalizedError('job_repeat_remind_only');
  if (Boolean(repeatEveryDays) !== Boolean(repeatRemaining)) throw new LocalizedError('job_repeat_pair');

  const limeVersion = body.limeVersion === 'v7' || body.limeVersion === 'legacy' ? body.limeVersion : 'auto';
  return {
    id: `job_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
    ownerUid: uid,
    action,
    lang,
    surveyId,
    surveyTitle: String(body.surveyTitle || msg('job_survey_fallback', lang, surveyId)).slice(0, 300),
    instanceName: String(body.instanceName || rpcEndpoint).slice(0, 300),
    rpcEndpoint,
    username: String(body.username),
    password: encrypt(String(body.password)),
    authPlugin: String(body.authPlugin || 'Authdb').slice(0, 80),
    limeVersion,
    tzOffsetMinutes: tzOffsetMinutes ?? 0,
    scheduledAt: scheduledDate.toISOString(),
    activateTokens: action === 'activate' && Boolean(body.activateTokens),
    startdateAt: action === 'activate' ? optionalDate(body.startdateAt, 'startdateAt') : null,
    expiresAt: action === 'activate' ? optionalDate(body.expiresAt, 'expiresAt') : null,
    minDaysBetween: action === 'remind' ? minDaysBetween : null,
    maxReminders: action === 'remind' ? maxReminders : null,
    repeatEveryDays: action === 'remind' ? repeatEveryDays : null,
    repeatRemaining: action === 'remind' ? repeatRemaining : null,
    clearCredentialsAfterRun: body.clearCredentialsAfterRun !== undefined ? Boolean(body.clearCredentialsAfterRun) : true,
    status: 'scheduled',
    resultMessage: msg('job_waiting', lang),
    steps: [],
    createdAt: now.toISOString(),
    executedAt: null,
  };
}

export interface SchedulerOptions {
  dataDir: string;
  secretKey: Buffer;
  allowPrivate: boolean;
  /** Do testów: zamiennik wywołania RPC. */
  rpc?: (endpoint: string, method: string, params: unknown[]) => Promise<unknown>;
  now?: () => Date;
}

export class Scheduler {
  private readonly file: string;
  private readonly running = new Set<string>();
  private readonly rpc: (endpoint: string, method: string, params: unknown[]) => Promise<unknown>;
  private readonly now: () => Date;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly options: SchedulerOptions) {
    this.file = path.join(options.dataDir, 'schedules.json');
    this.rpc = options.rpc || ((endpoint, method, params) => callLimeSurveyRpc(endpoint, method, params, { allowPrivate: options.allowPrivate }));
    this.now = options.now || (() => new Date());
  }

  encrypt = (plain: string): string => encryptSecret(plain, this.options.secretKey);

  readJobs(): StoredScheduleJob[] {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  writeJobs(jobs: StoredScheduleJob[]): void {
    fs.mkdirSync(this.options.dataDir, { recursive: true });
    // Zapis atomowy: awaria w trakcie zapisu nie uszkodzi kolejki.
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(jobs, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmp, this.file);
  }

  /** Szyfruje hasła zapisane jawnym tekstem przez starsze wersje aplikacji. */
  migratePlaintextPasswords(): number {
    const jobs = this.readJobs();
    let changed = 0;
    for (const job of jobs) {
      if (job.password && !job.password.startsWith('enc:v1:')) {
        job.password = this.encrypt(job.password);
        changed += 1;
      }
    }
    if (changed) this.writeJobs(jobs);
    return changed;
  }

  isRunning(id: string): boolean {
    return this.running.has(id);
  }

  add(job: StoredScheduleJob): void {
    const jobs = this.readJobs();
    if (jobs.filter((j) => j.ownerUid === job.ownerUid).length >= MAX_JOBS_PER_USER) {
      throw new LocalizedError('job_limit', [MAX_JOBS_PER_USER]);
    }
    jobs.unshift(job);
    this.writeJobs(jobs);
  }

  start(intervalMs = 15_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(): Promise<void> {
    const now = this.now().getTime();
    const due = this.readJobs().filter((j) => j.status === 'scheduled' && !this.running.has(j.id) && new Date(j.scheduledAt).getTime() <= now);
    for (const job of due) await this.execute(job.id);
  }

  async execute(jobId: string): Promise<StoredScheduleJob | null> {
    if (this.running.has(jobId)) return null;
    const jobs = this.readJobs();
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return null;
    const nowIso = () => this.now().toISOString();
    const lang: Lang = job.lang === 'en' ? 'en' : 'pl';
    const m = (key: string, ...args: unknown[]) => msg(key, lang, ...args);

    let password = '';
    try {
      password = decryptSecret(job.password, this.options.secretKey);
    } catch {
      password = '';
    }
    if (!password) {
      job.status = 'failed';
      job.executedAt = nowIso();
      job.resultMessage = m('job_no_password');
      this.writeJobs(jobs);
      return job;
    }

    this.running.add(jobId);
    job.status = 'running';
    job.steps = [];
    this.writeJobs(jobs);

    const action: ScheduleAction = job.action || 'activate';
    const sid = Number(job.surveyId);
    const step = (name: string, ok: boolean, detail: string) => job.steps.push({ step: name, ok, detail, timestamp: nowIso() });
    const dateOptions = { utc: job.limeVersion === 'v7', tzOffsetMinutes: job.tzOffsetMinutes ?? 0 };
    let sessionKey: string | null = null;

    try {
      const authParams: unknown[] = job.authPlugin ? [job.username, password, job.authPlugin] : [job.username, password];
      const keyResult = await this.rpc(job.rpcEndpoint, 'get_session_key', authParams);
      if (typeof keyResult !== 'string' || !keyResult) {
        throw new Error(statusError(keyResult) || m('job_session_failed', JSON.stringify(keyResult)));
      }
      sessionKey = keyResult;
      step('get_session_key', true, m('job_session_ok'));

      if (action === 'activate') {
        const result = await this.rpc(job.rpcEndpoint, 'activate_survey', [sessionKey, sid]);
        const err = statusError(result);
        if (err && !/already active/i.test(err)) throw new Error(`activate_survey: ${err}`);
        step('activate_survey', true, err ? m('job_already_active') : m('job_activated', sid));

        if (job.activateTokens) {
          const tokenErr = statusError(await this.rpc(job.rpcEndpoint, 'activate_tokens', [sessionKey, sid]));
          if (tokenErr && !/already/i.test(tokenErr)) step('activate_tokens', false, m('job_warning', tokenErr));
          else step('activate_tokens', true, m('job_tokens_ok'));
        }

        const props: Record<string, string> = {};
        if (job.startdateAt) props.startdate = formatLimeSurveyDate(job.startdateAt, dateOptions);
        if (job.expiresAt) props.expires = formatLimeSurveyDate(job.expiresAt, dateOptions);
        if (Object.keys(props).length) {
          const propsErr = statusError(await this.rpc(job.rpcEndpoint, 'set_survey_properties', [sessionKey, sid, props]));
          if (propsErr) step('set_survey_properties', false, m('job_props_failed', propsErr));
          else step('set_survey_properties', true, m('job_props_ok', Object.entries(props).map(([k, v]) => `${k}=${v}`).join(', ')));
        }
        job.resultMessage = m('job_result_activated', sid);
      } else if (action === 'expire') {
        const expires = formatLimeSurveyDate(nowIso(), dateOptions);
        const err = statusError(await this.rpc(job.rpcEndpoint, 'set_survey_properties', [sessionKey, sid, { expires }]));
        if (err) throw new Error(`set_survey_properties: ${err}`);
        step('set_survey_properties', true, m('job_expired_step', expires, dateOptions.utc));
        job.resultMessage = m('job_result_expired', sid);
      } else {
        const method = action === 'invite' ? 'invite_participants' : 'remind_participants';
        const params: unknown[] = action === 'invite' ? [sessionKey, sid] : [sessionKey, sid, job.minDaysBetween ?? null, job.maxReminders ?? null];
        let sent = 0;
        let failed = 0;
        let batches = 0;
        let left = 0;
        let firstFailure: string | null = null;
        for (; batches < MAX_MAIL_BATCHES; batches++) {
          const batch = parseMailBatch(await this.rpc(job.rpcEndpoint, method, params));
          if (batch.error) throw new Error(`${method}: ${batch.error}`);
          if (batch.none) break;
          sent += batch.sent;
          failed += batch.failed;
          left = batch.left;
          firstFailure = firstFailure || batch.firstFailure;
          // Brak postępu (same błędy) — nie zapętlamy się na tej samej partii.
          if (batch.left === 0 || batch.sent === 0) break;
        }
        // Żadna wiadomość nie wyszła (np. błędna konfiguracja SMTP) — to nie jest „zakończone pomyślnie”.
        if (sent === 0 && failed > 0) {
          throw new Error(m('job_mail_all_failed', method, failed, firstFailure));
        }
        step(method, failed === 0, sent + failed === 0 ? m('job_mail_none_step', action) : m('job_mail_step', action, sent, failed, left));
        job.resultMessage = sent + failed === 0 ? m('job_result_mail_none', sid, action) : m('job_result_mail', sid, action, sent, failed);
      }

      job.status = 'completed';
      job.executedAt = nowIso();
    } catch (err) {
      const message = errorText(err, lang);
      job.status = 'failed';
      job.executedAt = nowIso();
      job.resultMessage = message;
      step('error', false, message);
    } finally {
      if (sessionKey) {
        try {
          await this.rpc(job.rpcEndpoint, 'release_session_key', [sessionKey]);
          step('release_session_key', true, m('job_session_closed'));
        } catch {
          // zamknięcie sesji jest uprzejmością — klucz i tak wygaśnie
        }
      }

      const latest = this.readJobs();
      // Powtarzane przypomnienie: kolejne wykonanie dziedziczy zaszyfrowane hasło.
      let next: StoredScheduleJob | null = null;
      if (job.status === 'completed' && action === 'remind' && job.repeatEveryDays && job.repeatRemaining && job.repeatRemaining > 0) {
        const when = new Date(new Date(job.scheduledAt).getTime() + job.repeatEveryDays * 86_400_000);
        next = {
          ...job,
          id: `job_${this.now().getTime()}_${Math.random().toString(36).slice(2, 8)}`,
          scheduledAt: when.toISOString(),
          repeatRemaining: job.repeatRemaining - 1 > 0 ? job.repeatRemaining - 1 : null,
          repeatEveryDays: job.repeatRemaining - 1 > 0 ? job.repeatEveryDays : null,
          status: 'scheduled',
          resultMessage: m('job_next_in_series'),
          steps: [],
          createdAt: nowIso(),
          executedAt: null,
        };
      }
      if (job.clearCredentialsAfterRun) job.password = '';
      const idx = latest.findIndex((j) => j.id === jobId);
      if (idx !== -1) latest[idx] = job;
      if (next) latest.unshift(next);
      this.writeJobs(latest);
      this.running.delete(jobId);
    }
    return job;
  }
}
