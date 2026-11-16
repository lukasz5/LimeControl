import express from 'express';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, 'data');
const SCHEDULES_FILE = path.join(DATA_DIR, 'schedules.json');

interface ScheduleStepLog {
  step: string;
  ok: boolean;
  detail: string;
  timestamp: string;
}

interface StoredScheduleJob {
  id: string;
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
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  resultMessage: string;
  steps: ScheduleStepLog[];
  createdAt: string;
  executedAt: string | null;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJobs(): StoredScheduleJob[] {
  ensureDataDir();
  if (!fs.existsSync(SCHEDULES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(SCHEDULES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: StoredScheduleJob[]): void {
  ensureDataDir();
  fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(jobs, null, 2), 'utf-8');
}

function sanitizeJobForClient(job: StoredScheduleJob) {
  return {
    id: job.id,
    surveyId: job.surveyId,
    surveyTitle: job.surveyTitle,
    instanceName: job.instanceName,
    rpcEndpoint: job.rpcEndpoint,
    username: job.username,
    authPlugin: job.authPlugin,
    hasPassword: Boolean(job.password),
    scheduledAt: job.scheduledAt,
    activateTokens: job.activateTokens,
    startdateAt: job.startdateAt,
    expiresAt: job.expiresAt,
    clearCredentialsAfterRun: job.clearCredentialsAfterRun,
    status: job.status,
    resultMessage: job.resultMessage,
    steps: job.steps,
    createdAt: job.createdAt,
    executedAt: job.executedAt,
  };
}

function formatLimeSurveyDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function callLimeSurveyRpc(
  endpoint: string,
  method: string,
  params: unknown[]
): Promise<unknown> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    result?: unknown;
    error?: { message?: string; code?: number } | string | null;
  };

  if (data.error) {
    const errText =
      typeof data.error === 'string'
        ? data.error
        : data.error.message || JSON.stringify(data.error);
    throw new Error(`RPC Error: ${errText}`);
  }

  return data.result;
}

function isLimeSurveyStatusError(result: unknown): string | null {
  if (
    result &&
    typeof result === 'object' &&
    'status' in result &&
    typeof (result as { status: unknown }).status === 'string'
  ) {
    const statusText = (result as { status: string }).status;
    if (statusText.toUpperCase() !== 'OK') {
      return statusText;
    }
  }
  return null;
}

const runningJobIds = new Set<string>();

async function executeScheduleJob(jobId: string): Promise<StoredScheduleJob | null> {
  if (runningJobIds.has(jobId)) {
    return null;
  }

  const jobs = readJobs();
  const jobIndex = jobs.findIndex((j) => j.id === jobId);
  if (jobIndex === -1) {
    return null;
  }

  const job = jobs[jobIndex];
  if (!job.password) {
    job.status = 'failed';
    job.executedAt = new Date().toISOString();
    job.resultMessage = 'Brak zapisanego hasła do uwierzytelnienia sesji LimeSurvey.';
    writeJobs(jobs);
    return job;
  }

  runningJobIds.add(jobId);
  job.status = 'running';
  job.steps = [];
  writeJobs(jobs);

  let sessionKey: string | null = null;
  const nowIso = () => new Date().toISOString();

  try {
    const authParams: unknown[] = job.authPlugin
      ? [job.username, job.password, job.authPlugin]
      : [job.username, job.password];
    const keyResult = await callLimeSurveyRpc(
      job.rpcEndpoint,
      'get_session_key',
      authParams
    );

    if (typeof keyResult !== 'string' || !keyResult) {
      const statusErr = isLimeSurveyStatusError(keyResult);
      throw new Error(
        statusErr || `Nie udało się uzyskać klucza sesji: ${JSON.stringify(keyResult)}`
      );
    }

    sessionKey = keyResult;
    job.steps.push({
      step: 'get_session_key',
      ok: true,
      detail: 'Uzyskano klucz sesji administratora.',
      timestamp: nowIso(),
    });

    const activateResult = await callLimeSurveyRpc(
      job.rpcEndpoint,
      'activate_survey',
      [sessionKey, Number(job.surveyId)]
    );

    const activateErr = isLimeSurveyStatusError(activateResult);
    if (activateErr) {
      // If survey is already active, record note and continue optional steps if requested
      if (activateErr.toLowerCase().includes('already active')) {
        job.steps.push({
          step: 'activate_survey',
          ok: true,
          detail: 'Ankieta była już aktywna w LimeSurvey.',
          timestamp: nowIso(),
        });
      } else {
        throw new Error(`activate_survey: ${activateErr}`);
      }
    } else {
      job.steps.push({
        step: 'activate_survey',
        ok: true,
        detail: `Ankieta #${job.surveyId} została aktywowana (${JSON.stringify(activateResult)}).`,
        timestamp: nowIso(),
      });
    }

    if (job.activateTokens) {
      const tokenResult = await callLimeSurveyRpc(
        job.rpcEndpoint,
        'activate_tokens',
        [sessionKey, Number(job.surveyId)]
      );
      const tokenErr = isLimeSurveyStatusError(tokenResult);
      if (tokenErr && !tokenErr.toLowerCase().includes('already')) {
        job.steps.push({
          step: 'activate_tokens',
          ok: false,
          detail: `Ostrzeżenie: ${tokenErr}`,
          timestamp: nowIso(),
        });
      } else {
        job.steps.push({
          step: 'activate_tokens',
          ok: true,
          detail: 'Tabela uczestników (tokenów) została aktywowana.',
          timestamp: nowIso(),
        });
      }
    }

    const propsToUpdate: Record<string, string> = {};
    if (job.startdateAt) {
      propsToUpdate.startdate = formatLimeSurveyDate(job.startdateAt);
    }
    if (job.expiresAt) {
      propsToUpdate.expires = formatLimeSurveyDate(job.expiresAt);
    }

    if (Object.keys(propsToUpdate).length > 0) {
      const propsResult = await callLimeSurveyRpc(
        job.rpcEndpoint,
        'set_survey_properties',
        [sessionKey, Number(job.surveyId), propsToUpdate]
      );
      const propsErr = isLimeSurveyStatusError(propsResult);
      if (propsErr) {
        job.steps.push({
          step: 'set_survey_properties',
          ok: false,
          detail: `Nie udało się zapisać dat ankiety: ${propsErr}`,
          timestamp: nowIso(),
        });
      } else {
        job.steps.push({
          step: 'set_survey_properties',
          ok: true,
          detail: `Zaktualizowano właściwości: ${Object.entries(propsToUpdate)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}`,
          timestamp: nowIso(),
        });
      }
    }

    job.status = 'completed';
    job.executedAt = nowIso();
    job.resultMessage = `Ankieta #${job.surveyId} została pomyślnie aktywowana przez harmonogram.`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    job.status = 'failed';
    job.executedAt = nowIso();
    job.resultMessage = message;
    job.steps.push({
      step: 'error',
      ok: false,
      detail: message,
      timestamp: nowIso(),
    });
  } finally {
    if (sessionKey) {
      try {
        await callLimeSurveyRpc(job.rpcEndpoint, 'release_session_key', [
          sessionKey,
        ]);
        job.steps.push({
          step: 'release_session_key',
          ok: true,
          detail: 'Sesja RPC została poprawnie zamknięta.',
          timestamp: nowIso(),
        });
      } catch {
        // Ignore release errors
      }
    }

    if (job.clearCredentialsAfterRun) {
      job.password = '';
    }

    const latestJobs = readJobs();
    const idx = latestJobs.findIndex((j) => j.id === jobId);
    if (idx !== -1) {
      latestJobs[idx] = job;
      writeJobs(latestJobs);
    }
    runningJobIds.delete(jobId);
  }

  return job;
}

function startSchedulerLoop(): void {
  const tick = async () => {
    const jobs = readJobs();
    const now = Date.now();
    const dueJobs = jobs.filter(
      (j) =>
        j.status === 'scheduled' &&
        !runningJobIds.has(j.id) &&
        new Date(j.scheduledAt).getTime() <= now
    );

    for (const job of dueJobs) {
      await executeScheduleJob(job.id);
    }
  };

  setInterval(() => {
    void tick();
  }, 15_000);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
  });

  // Schedule CRUD endpoints for automated activate_survey execution
  app.get('/api/schedules', (_req, res) => {
    const jobs = readJobs().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ jobs: jobs.map(sanitizeJobForClient) });
  });

  app.post('/api/schedules', (req, res) => {
    const body = req.body as Partial<StoredScheduleJob>;
    if (
      !body.surveyId ||
      !body.rpcEndpoint ||
      !body.username ||
      !body.password ||
      !body.scheduledAt
    ) {
      res.status(400).json({
        error:
          'Wymagane pola: surveyId, rpcEndpoint, username, password oraz scheduledAt.',
      });
      return;
    }

    const scheduledDate = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      res.status(400).json({ error: 'Nieprawidłowy format daty scheduledAt.' });
      return;
    }

    const newJob: StoredScheduleJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      surveyId: Number(body.surveyId),
      surveyTitle: String(body.surveyTitle || `Ankieta #${body.surveyId}`),
      instanceName: String(body.instanceName || body.rpcEndpoint),
      rpcEndpoint: String(body.rpcEndpoint),
      username: String(body.username),
      password: String(body.password),
      authPlugin: String(body.authPlugin || 'Authdb'),
      scheduledAt: scheduledDate.toISOString(),
      activateTokens: Boolean(body.activateTokens),
      startdateAt: body.startdateAt ? String(body.startdateAt) : null,
      expiresAt: body.expiresAt ? String(body.expiresAt) : null,
      clearCredentialsAfterRun:
        body.clearCredentialsAfterRun !== undefined
          ? Boolean(body.clearCredentialsAfterRun)
          : true,
      status: 'scheduled',
      resultMessage: 'Oczekuje na zaplanowaną godzinę uruchomienia.',
      steps: [],
      createdAt: new Date().toISOString(),
      executedAt: null,
    };

    const jobs = readJobs();
    jobs.unshift(newJob);
    writeJobs(jobs);

    res.status(201).json({ job: sanitizeJobForClient(newJob) });
  });

  app.post('/api/schedules/:id/run-now', async (req, res) => {
    const { id } = req.params;
    const jobs = readJobs();
    const existing = jobs.find((j) => j.id === id);
    if (!existing) {
      res.status(404).json({ error: 'Nie znaleziono zadania harmonogramu.' });
      return;
    }
    if (existing.status === 'running') {
      res.status(409).json({ error: 'Zadanie jest już w trakcie wykonywania.' });
      return;
    }
    const updated = await executeScheduleJob(id);
    if (!updated) {
      res.status(500).json({ error: 'Nie udało się uruchomić zadania.' });
      return;
    }
    res.json({ job: sanitizeJobForClient(updated) });
  });

  app.patch('/api/schedules/:id/cancel', (req, res) => {
    const { id } = req.params;
    const jobs = readJobs();
    const job = jobs.find((j) => j.id === id);
    if (!job) {
      res.status(404).json({ error: 'Nie znaleziono zadania harmonogramu.' });
      return;
    }
    if (job.status !== 'scheduled') {
      res.status(400).json({
        error: 'Można anulować wyłącznie zadania o statusie „Zaplanowane”.',
      });
      return;
    }
    job.status = 'cancelled';
    job.password = '';
    job.resultMessage = 'Anulowane przez użytkownika.';
    writeJobs(jobs);
    res.json({ job: sanitizeJobForClient(job) });
  });

  app.delete('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const jobs = readJobs();
    const filtered = jobs.filter((j) => j.id !== id);
    if (filtered.length === jobs.length) {
      res.status(404).json({ error: 'Nie znaleziono zadania.' });
      return;
    }
    writeJobs(filtered);
    res.json({ ok: true });
  });

  // Optional CORS-fallback relay endpoint (disabled by default on client; used only if user explicitly enables relay mode when target server blocks browser CORS)
  app.post('/api/rpc-relay', async (req, res) => {
    const { endpoint, method, params, id } = req.body as {
      endpoint?: string;
      method?: string;
      params?: unknown[];
      id?: number | string;
    };

    if (!endpoint || !method) {
      res.status(400).json({ error: 'Brak adresu endpoint lub nazwy metody RPC.' });
      return;
    }

    try {
      const parsedUrl = new URL(endpoint);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        res.status(400).json({ error: 'Dozwolone są wyłącznie protokoły HTTP/HTTPS.' });
        return;
      }

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params: Array.isArray(params) ? params : [],
          id: id ?? 1,
        }),
      });

      const text = await upstream.text();
      res.status(upstream.status);
      res.setHeader(
        'Content-Type',
        upstream.headers.get('content-type') || 'application/json'
      );
      res.send(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({
        error: `Błąd połączenia przekaźnika z serwerem LimeSurvey: ${message}`,
      });
    }
  });

  const httpServer = http.createServer(app);
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: false,
        watch: null,
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  startSchedulerLoop();

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`LimeControl server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
