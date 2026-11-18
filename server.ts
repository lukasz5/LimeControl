import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCAL_UID, authenticate, safeEqual } from './server/auth.ts';
import { loadConfig } from './server/config.ts';
import { errorText, msg, requestLang } from './server/messages.ts';
import { OutboundRequestError, guardedRequest } from './server/netguard.ts';
import { RateLimiter } from './server/rateLimit.ts';
import { Scheduler, buildJob, sanitizeJobForClient } from './server/scheduler.ts';
import { loadSecretKey } from './server/secretbox.ts';
import { forwardStrefaRequest } from './server/strefaankiet.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Opcjonalny plik .env obok serwera (patrz .env.example). Zmienne ustawione już w środowisku
// — np. przez Dockera — mają pierwszeństwo przed wartościami z pliku.
try {
  process.loadEnvFile(path.resolve(__dirname, '.env'));
} catch {
  // brak pliku .env: konfiguracja pochodzi wyłącznie ze środowiska
}

const config = loadConfig(__dirname);
const scheduler = new Scheduler({
  dataDir: config.dataDir,
  secretKey: loadSecretKey(config.dataDir),
  allowPrivate: config.relayAllowPrivate,
});

const AUTH_REQUIRED_KEY = config.authMode === 'local' ? 'auth_required_local' : 'auth_required_firebase';

/** Limity na użytkownika: przekaźnik RPC, łącznik StrefaAnkiet i próby logowania kluczem. */
const relayLimiter = new RateLimiter(600, 60_000);
const strefaLimiter = new RateLimiter(240, 60_000);
const loginLimiter = new RateLimiter(20, 60_000);

function clientIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/** Zwraca uid albo wysyła 401 i zwraca null. */
async function requireUser(req: express.Request, res: express.Response): Promise<string | null> {
  const uid = await authenticate(req, config);
  if (!uid) {
    res.status(401).json({ error: msg(AUTH_REQUIRED_KEY, requestLang(req)) });
    return null;
  }
  return uid;
}

/** Błąd zapytania wychodzącego w języku aplikacji; `prefixKey` opisuje, co się nie udało. */
function sendOutboundError(req: express.Request, res: express.Response, err: unknown, prefixKey: string): void {
  const lang = requestLang(req);
  if (err instanceof OutboundRequestError) {
    res.status(err.status).json({ error: err.localized(lang) });
    return;
  }
  res.status(502).json({ error: msg(prefixKey, lang, errorText(err, lang)) });
}

async function startServer(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');
  // Za odwrotnym proxy (Traefik, nginx) adres klienta jest w X-Forwarded-For.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
  app.use(express.json({ limit: '16mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
  });

  // Publiczna konfiguracja potrzebna aplikacji przed zalogowaniem (bez sekretów).
  app.get('/api/config', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ authMode: config.authMode, relayAllowPrivate: config.relayAllowPrivate, version: config.version });
  });

  // Tryb lokalny: sprawdzenie klucza dostępu przy logowaniu.
  app.post('/api/session', async (req, res) => {
    const ip = clientIp(req);
    if (!loginLimiter.take(ip)) {
      res.setHeader('Retry-After', String(loginLimiter.retryAfterSeconds(ip)));
      res.status(429).json({ error: msg('too_many_attempts', requestLang(req)) });
      return;
    }
    if (config.authMode !== 'local') {
      const uid = await authenticate(req, config);
      res.status(uid ? 200 : 401).json(uid ? { ok: true, uid } : { error: msg(AUTH_REQUIRED_KEY, requestLang(req)) });
      return;
    }
    const key = typeof req.body?.accessKey === 'string' ? req.body.accessKey.trim() : '';
    if (!key || !safeEqual(key, config.accessKey)) {
      res.status(401).json({ error: msg('access_key_invalid', requestLang(req)) });
      return;
    }
    res.json({ ok: true, uid: LOCAL_UID });
  });

  // ----- Harmonogram -----
  app.get('/api/schedules', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    const jobs = scheduler
      .readJobs()
      .filter((j) => j.ownerUid === uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ jobs: jobs.map(sanitizeJobForClient) });
  });

  app.post('/api/schedules', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    try {
      const job = buildJob((req.body || {}) as Record<string, unknown>, uid, scheduler.encrypt);
      scheduler.add(job);
      res.status(201).json({ job: sanitizeJobForClient(job) });
    } catch (err) {
      res.status(400).json({ error: errorText(err, requestLang(req)) });
    }
  });

  app.post('/api/schedules/:id/run-now', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    const { id } = req.params;
    const existing = scheduler.readJobs().find((j) => j.id === id && j.ownerUid === uid);
    if (!existing) {
      res.status(404).json({ error: msg('job_not_found', requestLang(req)) });
      return;
    }
    if (existing.status === 'running' || scheduler.isRunning(id)) {
      res.status(409).json({ error: msg('job_running', requestLang(req)) });
      return;
    }
    const updated = await scheduler.execute(id);
    if (!updated) {
      res.status(500).json({ error: msg('job_run_failed', requestLang(req)) });
      return;
    }
    res.json({ job: sanitizeJobForClient(updated) });
  });

  app.patch('/api/schedules/:id/cancel', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    const jobs = scheduler.readJobs();
    const job = jobs.find((j) => j.id === req.params.id && j.ownerUid === uid);
    if (!job) {
      res.status(404).json({ error: msg('job_not_found', requestLang(req)) });
      return;
    }
    if (job.status !== 'scheduled') {
      res.status(400).json({ error: msg('job_cancel_only_scheduled', requestLang(req)) });
      return;
    }
    job.status = 'cancelled';
    job.password = '';
    job.resultMessage = msg('job_cancelled', job.lang === 'en' ? 'en' : 'pl');
    scheduler.writeJobs(jobs);
    res.json({ job: sanitizeJobForClient(job) });
  });

  app.delete('/api/schedules/:id', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    const jobs = scheduler.readJobs();
    if (!jobs.some((j) => j.id === req.params.id && j.ownerUid === uid)) {
      res.status(404).json({ error: msg('job_not_found', requestLang(req)) });
      return;
    }
    if (scheduler.isRunning(req.params.id)) {
      res.status(409).json({ error: msg('job_running', requestLang(req)) });
      return;
    }
    scheduler.writeJobs(jobs.filter((j) => j.id !== req.params.id));
    res.json({ ok: true });
  });

  // ----- Przekaźnik JSON-RPC -----
  // Dla serwerów LimeSurvey bez nagłówków CORS. Wymaga zalogowania; łączy się tylko z adresami
  // publicznymi (patrz server/netguard.ts), chyba że administrator ustawi RELAY_ALLOW_PRIVATE=1.
  app.post('/api/rpc-relay', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    if (!relayLimiter.take(uid)) {
      res.setHeader('Retry-After', String(relayLimiter.retryAfterSeconds(uid)));
      res.status(429).json({ error: msg('relay_rate', requestLang(req)) });
      return;
    }
    const { endpoint, method, params, id } = (req.body || {}) as { endpoint?: unknown; method?: unknown; params?: unknown; id?: unknown };
    if (typeof endpoint !== 'string' || !endpoint || typeof method !== 'string' || !method) {
      res.status(400).json({ error: msg('relay_missing', requestLang(req)) });
      return;
    }
    if (!/^[a-z][a-z0-9_]{0,63}$/.test(method)) {
      res.status(400).json({ error: msg('relay_method_invalid', requestLang(req)) });
      return;
    }
    try {
      const upstream = await guardedRequest(
        endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params: Array.isArray(params) ? params : [],
            id: typeof id === 'number' || typeof id === 'string' ? id : 1,
          }),
          timeoutMs: 120_000,
          maxBytes: 64 * 1024 * 1024,
        },
        { allowPrivate: config.relayAllowPrivate }
      );
      res.status(upstream.status);
      // Odpowiedź upstreamu zawsze jako JSON — nigdy jako HTML wykonywany w domenie aplikacji.
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.send(upstream.body);
    } catch (err) {
      sendOutboundError(req, res, err, 'relay_error');
    }
  });

  // ----- Łącznik StrefaAnkiet (tylko odczyt stanu realizacji CATI/CAPI) -----
  app.post('/api/strefaankiet', async (req, res) => {
    const uid = await requireUser(req, res);
    if (!uid) return;
    if (!strefaLimiter.take(uid)) {
      res.setHeader('Retry-After', String(strefaLimiter.retryAfterSeconds(uid)));
      res.status(429).json({ error: msg('strefa_rate', requestLang(req)) });
      return;
    }
    try {
      const upstream = await forwardStrefaRequest(req.body || {}, { allowPrivate: config.relayAllowPrivate });
      res.status(upstream.status);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.send(upstream.body);
    } catch (err) {
      sendOutboundError(req, res, err, 'strefa_error');
    }
  });

  app.use('/api', (req, res) => {
    res.status(404).json({ error: msg('not_found', requestLang(req)) });
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

  const migrated = scheduler.migratePlaintextPasswords();
  if (migrated) console.log(`Harmonogram: zaszyfrowano ${migrated} haseł zapisanych wcześniej jawnym tekstem.`);
  scheduler.start();

  httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`LimeControl ${config.version} — http://0.0.0.0:${config.port} (logowanie: ${config.authMode})`);
    if (config.authMode === 'local') {
      if (config.accessKeyGenerated) {
        console.log('──────────────────────────────────────────────────────────────');
        console.log(' Tryb lokalny: wygenerowano klucz dostępu do tej instancji.');
        console.log(` Klucz: ${config.accessKey}`);
        console.log(' Zapisano go w pliku data/access-key. Własny klucz ustawisz zmienną LIMECONTROL_ACCESS_KEY.');
        console.log('──────────────────────────────────────────────────────────────');
      } else {
        console.log('Tryb lokalny: zaloguj się kluczem dostępu (LIMECONTROL_ACCESS_KEY lub plik data/access-key).');
      }
    }
  });
}

void startServer();
