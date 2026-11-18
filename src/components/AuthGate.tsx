import React, { useState } from 'react';
import { Database, KeyRound, Lock, Server } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import { AppFooter } from './AppFooter';
import { LanguageSwitch } from './LanguageSwitch';
import { getBackend, type AuthMode } from '../backend';
import { BRAND } from '../config/brand';
import { getApiBase } from '../backend/apiBase';
import { isNativeApp } from '../platform';
import { disconnectServer } from './ServerConnection';
import { t } from '../i18n';

interface AuthGateProps {
  loading: boolean;
  authError?: string | null;
  /** firebase: logowanie Google; local: klucz dostępu własnej instalacji. */
  mode: AuthMode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ loading, authError, mode }) => {
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [accessKey, setAccessKey] = useState('');
  const [remember, setRemember] = useState(false);
  const native = isNativeApp();

  async function handleGoogleLogin() {
    setSigningIn(true);
    setLocalError(null);
    try {
      await getBackend().signIn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/popup-closed-by-user|cancelled-popup-request/i.test(msg)) {
        setLocalError(t('Logowanie zostało anulowane przed ukończeniem.'));
      } else if (/popup-blocked/i.test(msg)) {
        setLocalError(
          t('Przeglądarka zablokowała okno logowania Google. Zezwól na wyskakujące okna dla tej strony i spróbuj ponownie.')
        );
      } else {
        setLocalError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  }

  async function handleKeyLogin(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setLocalError(null);
    try {
      await getBackend().signIn(accessKey, remember);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setSigningIn(false);
    }
  }

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 px-4 py-10 pt-safe-screen">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <BrandMark className="mx-auto h-16 w-16" />
          <h1 className="font-display text-3xl tracking-tight">
            <span className="font-medium text-emerald-600 dark:text-emerald-300">lime</span>
            <span className="font-extrabold text-brand-ink dark:text-white">Control</span>
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            {BRAND.tagline}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {mode === 'local' && native
              ? t('Podaj klucz dostępu do swojego serwera LimeControl, aby korzystać z harmonogramu i przekaźnika.')
              : mode === 'local'
              ? t('Podaj klucz dostępu do tej instalacji LimeControl, aby zarządzać swoimi instancjami LimeSurvey 3–7.')
              : t('Zaloguj się kontem Google, aby bezpiecznie zarządzać instancjami LimeSurvey 3–7 oraz harmonogramami w bazie chmurowej.')}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          {mode === 'local' ? (
            <div className="flex items-start gap-2.5">
              <Server className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {native
                  ? t('Profile serwerów są zapisywane tylko na tym urządzeniu, bez usług zewnętrznych.')
                  : t('Instalacja własna: profile serwerów są zapisywane tylko w tej przeglądarce, bez usług zewnętrznych.')}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <Database className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {t('Profile serwerów zapisywane są w bazie')}{' '}<strong>Cloud Firestore</strong>{' '}{t('przypisanej wyłącznie do Twojego konta — bez zostawiania danych w przeglądarce.')}
              </span>
            </div>
          )}
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {native
                ? t('Hasła do panelu LimeSurvey nie są zapisywane na tym urządzeniu.')
                : t('Hasła do panelu LimeSurvey nie są zapisywane w bazie ani w pamięci lokalnej przeglądarki.')}
            </span>
          </div>
        </div>

        {displayError && (
          <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
            {displayError}
          </div>
        )}

        {mode === 'local' ? (
          <form onSubmit={handleKeyLogin} className="space-y-3">
            <div>
              <label htmlFor="access-key" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Klucz dostępu')}
              </label>
              <input
                id="access-key"
                type="password"
                required
                autoComplete="current-password"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {t('Klucz ustawia administrator serwera (zmienna LIMECONTROL_ACCESS_KEY) albo jest wypisywany w logu przy pierwszym uruchomieniu.')}
              </p>
            </div>
            <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t('Zapamiętaj klucz na tym urządzeniu')}</span>
            </label>
            <button
              type="submit"
              disabled={loading || signingIn || !accessKey.trim()}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <KeyRound className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{loading ? t('Sprawdzanie sesji...') : signingIn ? t('Logowanie...') : t('Zaloguj się')}</span>
            </button>
            {native && (
              <div className="pt-1 text-center space-y-1.5">
                {getApiBase() && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 break-all">
                    {t('Serwer:')}{' '}<span className="font-mono">{getApiBase()}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    void disconnectServer();
                  }}
                  className="min-h-[44px] px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline"
                >
                  {t('Używaj bez serwera')}
                </button>
              </div>
            )}
          </form>
        ) : (
          <button
            type="button"
            disabled={loading || signingIn}
            onClick={() => {
              void handleGoogleLogin();
            }}
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-3 rounded-xl bg-slate-900 dark:bg-white px-5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1H12v2.98h5.37c-.23 1.5-1.78 4.4-5.37 4.4-3.23 0-5.87-2.68-5.87-5.98s2.64-5.98 5.87-5.98c1.84 0 3.07.79 3.78 1.47l2.58-2.48C16.71 3.96 14.56 3 12 3 6.99 3 2.93 7.06 2.93 12.07S6.99 21.14 12 21.14c6.93 0 8.64-4.86 8.64-7.37 0-.5-.05-.88-.12-1.26Z"
              />
            </svg>
            <span>
              {loading
                ? t('Sprawdzanie sesji...')
                : signingIn
                  ? t('Logowanie przez Google...')
                  : t('Zaloguj się przez Google')}
            </span>
          </button>
        )}
      </div>
      <AppFooter />
      <LanguageSwitch />
    </div>
  );
};
