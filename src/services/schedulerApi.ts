import { authHeaders } from '../backend';
import { apiUrl } from '../backend/apiBase';
import type { LimeSurveyVersion, ScheduleAction, ScheduleJob } from '../types/limesurvey';
import { t } from '../i18n';

export interface CreateSchedulePayload {
  /** activate (domyślnie), expire, invite albo remind. */
  action?: ScheduleAction;
  /** Język komunikatów zadania zapisywanych przez serwer (pl / en). */
  lang?: string;
  surveyId: number;
  surveyTitle: string;
  instanceName: string;
  rpcEndpoint: string;
  username: string;
  password: string;
  authPlugin: string;
  limeVersion: LimeSurveyVersion;
  scheduledAt: string;
  activateTokens: boolean;
  startdateAt: string | null;
  expiresAt: string | null;
  clearCredentialsAfterRun: boolean;
  /** Strefa czasowa użytkownika (Date#getTimezoneOffset) — serwer przelicza daty dla LimeSurvey 3–6. */
  tzOffsetMinutes?: number;
  /** remind: minimalna liczba dni od poprzedniej wiadomości. */
  minDaysBetween?: number | null;
  /** remind: maksymalna liczba przypomnień na uczestnika. */
  maxReminders?: number | null;
  /** remind: powtarzaj co N dni, jeszcze repeatRemaining razy. */
  repeatEveryDays?: number | null;
  repeatRemaining?: number | null;
}

async function getAuthHeaders(includeJson = false): Promise<HeadersInit> {
  const headers: Record<string, string> = await authHeaders();
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export async function fetchSchedules(): Promise<ScheduleJob[]> {
  const res = await fetch(apiUrl('/api/schedules'), {
    headers: await getAuthHeaders(false),
  });
  if (!res.ok) {
    throw new Error(t('Błąd pobierania harmonogramu (HTTP {0})', res.status));
  }
  const data = (await res.json()) as { jobs: ScheduleJob[] };
  return Array.isArray(data.jobs) ? data.jobs : [];
}

export async function createSchedule(
  payload: CreateSchedulePayload
): Promise<ScheduleJob> {
  const res = await fetch(apiUrl('/api/schedules'), {
    method: 'POST',
    headers: await getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || t('Nie udało się zaplanować zadania (HTTP {0})', res.status));
  }
  return data.job;
}

export async function runScheduleNow(jobId: string): Promise<ScheduleJob> {
  const res = await fetch(apiUrl(`/api/schedules/${encodeURIComponent(jobId)}/run-now`), {
    method: 'POST',
    headers: await getAuthHeaders(false),
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || t('Błąd uruchamiania zadania (HTTP {0})', res.status));
  }
  return data.job;
}

export async function cancelSchedule(jobId: string): Promise<ScheduleJob> {
  const res = await fetch(apiUrl(`/api/schedules/${encodeURIComponent(jobId)}/cancel`), {
    method: 'PATCH',
    headers: await getAuthHeaders(false),
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || t('Błąd anulowania zadania (HTTP {0})', res.status));
  }
  return data.job;
}

export async function deleteSchedule(jobId: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/schedules/${encodeURIComponent(jobId)}`), {
    method: 'DELETE',
    headers: await getAuthHeaders(false),
  });
  if (!res.ok) {
    throw new Error(t('Nie udało się usunąć zadania (HTTP {0})', res.status));
  }
}
