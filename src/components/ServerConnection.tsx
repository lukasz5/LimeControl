import React, { useEffect, useState } from 'react';
import { CalendarClock, Server, Unplug } from 'lucide-react';
import { getBackend } from '../backend';
import { getServerUrl, normalizeServerUrl, probeServer, setServerUrl } from '../backend/serverConnection';
import { getLang, t } from '../i18n';

const DOCS_URL = {
  pl: 'https://limecontrol.eu/docs.html#wlasny-serwer',
  en: 'https://limecontrol.eu/en/docs.html#self-hosting',
  de: 'https://limecontrol.eu/de/docs.html#self-hosting',
} as const;
const docsUrl = () => DOCS_URL[getLang()];

/** Odłącza aplikację mobilną od serwera LimeControl i wraca do trybu „na urządzeniu”. */
export async function disconnectServer(): Promise<void> {
  try {
    await getBackend().signOut();
  } catch {
    // klucz i tak przestaje być używany po odłączeniu
  }
  await setServerUrl(null);
  window.location.reload();
}

/**
 * Aplikacja mobilna: opcjonalne połączenie z serwerem LimeControl. Serwer dodaje harmonogram
 * (zadania wykonywane pod nieobecność użytkownika) i przekaźnik; reszta działa bez niego.
 */
export const ServerConnectionCard: React.FC = () => {
  const mode = getBackend().mode;
  const [current, setCurrent] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getServerUrl().then((url) => {
      if (!cancelled) setCurrent(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const url = normalizeServerUrl(input);
    if (!url) {
      setError(t('Podaj adres serwera, np. https://control.example.com.'));
      return;
    }
    setBusy(true);
    try {
      const info = await probeServer(url);
      if (info.authMode !== 'local') {
        setError(t('Ten serwer używa logowania kontem Google, którego aplikacja mobilna jeszcze nie obsługuje. Połącz własną instalację LimeControl z kluczem dostępu.'));
        return;
      }
      await setServerUrl(url);
      window.location.reload();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(
        detail === 'not-limecontrol'
          ? t('Pod tym adresem nie odpowiada serwer LimeControl.')
          : t('Nie udało się połączyć z serwerem: {0}', detail)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="server-connection-title"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Server className="h-4 w-4" aria-hidden="true" />
          <span>{t('Opcjonalnie')}</span>
        </div>
        <h3 id="server-connection-title" className="mt-1 text-base font-bold text-slate-900 dark:text-white">
          {t('Serwer LimeControl')}
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          {t('Aplikacja działa bez serwera. Połączenie z własnym serwerem LimeControl dodaje harmonogram — zadania wykonują się nawet wtedy, gdy telefon jest wyłączony — oraz przekaźnik.')}
        </p>
      </div>

      {mode === 'local' && current ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t('Połączono z serwerem:')}{' '}
            <span className="font-mono text-xs break-all">{current}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              void disconnectServer();
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Unplug className="h-4 w-4" aria-hidden="true" />
            <span>{t('Odłącz serwer')}</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="space-y-3 max-w-xl">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="server-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('Adres serwera LimeControl')}
            </label>
            <input
              id="server-url"
              type="url"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://control.example.com"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="min-h-[44px] rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? t('Łączenie...') : t('Połącz z serwerem')}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('Po połączeniu aplikacja poprosi o klucz dostępu do serwera. Profile instancji zostają na tym urządzeniu.')}{' '}
            <a href={docsUrl()} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 dark:text-emerald-400 underline">
              {t('Jak uruchomić własny serwer')}
            </a>
          </p>
        </form>
      )}
    </section>
  );
};

/** Zakładka Harmonogram w aplikacji mobilnej bez serwera. */
export const ScheduleNeedsServer: React.FC<{ onConnect: () => void }> = ({ onConnect }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Harmonogram ankiet')}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t('Serwer o wybranej godzinie aktywuje lub zamknie ankietę albo wyśle zaproszenia i przypomnienia — nawet po zamknięciu aplikacji na telefonie.')}
      </p>
    </div>
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3 max-w-2xl">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
        <CalendarClock className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('Harmonogram wymaga serwera LimeControl')}</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t('Zaplanowane zadania wykonuje serwer, dlatego działają także wtedy, gdy telefon jest wyłączony. Aplikacja mobilna nie ma własnego serwera — połącz ją ze swoim serwerem LimeControl, aby planować aktywacje, zaproszenia i przypomnienia.')}
      </p>
      <p className="text-sm text-slate-600 dark:text-slate-400">{t('Pozostałe funkcje działają bez serwera.')}</p>
      <button
        type="button"
        onClick={onConnect}
        className="min-h-[44px] rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        {t('Połącz z serwerem')}
      </button>
    </div>
  </div>
);
