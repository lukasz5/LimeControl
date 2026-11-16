import type { ScheduleJob } from '../types/limesurvey';

export interface CreateSchedulePayload {
  surveyId: number;
  surveyTitle: string;
  instanceName: string;
  rpcEndpoint: string;
  username: string;
  password: string;
  authPlugin: string;
  scheduledAt: string;
  activateTokens: boolean;
  startdateAt: string | null;
  expiresAt: string | null;
  clearCredentialsAfterRun: boolean;
}

export async function fetchSchedules(): Promise<ScheduleJob[]> {
  const res = await fetch('/api/schedules');
  if (!res.ok) {
    throw new Error(`Błąd pobierania harmonogramu (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { jobs: ScheduleJob[] };
  return Array.isArray(data.jobs) ? data.jobs : [];
}

export async function createSchedule(
  payload: CreateSchedulePayload
): Promise<ScheduleJob> {
  const res = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || `Nie udało się zaplanować zadania (HTTP ${res.status})`);
  }
  return data.job;
}

export async function runScheduleNow(jobId: string): Promise<ScheduleJob> {
  const res = await fetch(`/api/schedules/${encodeURIComponent(jobId)}/run-now`, {
    method: 'POST',
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || `Błąd uruchamiania zadania (HTTP ${res.status})`);
  }
  return data.job;
}

export async function cancelSchedule(jobId: string): Promise<ScheduleJob> {
  const res = await fetch(`/api/schedules/${encodeURIComponent(jobId)}/cancel`, {
    method: 'PATCH',
  });
  const data = (await res.json()) as { job?: ScheduleJob; error?: string };
  if (!res.ok || !data.job) {
    throw new Error(data.error || `Błąd anulowania zadania (HTTP ${res.status})`);
  }
  return data.job;
}

export async function deleteSchedule(jobId: string): Promise<void> {
  const res = await fetch(`/api/schedules/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Nie udało się usunąć zadania (HTTP ${res.status})`);
  }
}
