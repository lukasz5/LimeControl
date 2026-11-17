import { auth } from '../firebase';
import type { LimeSurveyVersion, ScheduleJob } from '../types/limesurvey';

export interface CreateSchedulePayload {
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
}

async function getAuthHeaders(includeJson = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchSchedules(): Promise<ScheduleJob[]> {
  const res = await fetch('/api/schedules', {
    headers: await getAuthHeaders(false),
  });
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
    headers: await getAuthHeaders(true),
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
    headers: await getAuthHeaders(false),
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
    headers: await getAuthHeaders(false),
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
    headers: await getAuthHeaders(false),
  });
  if (!res.ok) {
    throw new Error(`Nie udało się usunąć zadania (HTTP ${res.status})`);
  }
}
