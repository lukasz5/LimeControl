import React, { useState } from 'react';
import { Database, Lock, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../firebase';

interface AuthGateProps {
  loading: boolean;
  authError?: string | null;
}

export const AuthGate: React.FC<AuthGateProps> = ({ loading, authError }) => {
  const [signingIn, setSigningIn] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setSigningIn(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/popup-closed-by-user|cancelled-popup-request/i.test(msg)) {
        setLocalError('Logowanie zostało anulowane przed ukończeniem.');
      } else if (/popup-blocked/i.test(msg)) {
        setLocalError(
          'Przeglądarka zablokowała okno logowania Google. Zezwól na wyskakujące okna dla tej strony i spróbuj ponownie.'
        );
      } else {
        setLocalError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  }

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 shadow-xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            LimeControl
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Zaloguj się kontem Google, aby bezpiecznie zarządzać instancjami LimeSurvey 3–7 oraz harmonogramami w bazie chmurowej.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2.5">
            <Database className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Profile serwerów zapisywane są w bazie <strong>Cloud Firestore</strong> przypisanej wyłącznie do Twojego konta — bez zostawiania danych w przeglądarce.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Hasła do panelu LimeSurvey nie są zapisywane w bazie ani w pamięci lokalnej przeglądarki.
            </span>
          </div>
        </div>

        {displayError && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
            {displayError}
          </div>
        )}

        <button
          type="button"
          disabled={loading || signingIn}
          onClick={() => {
            void handleGoogleLogin();
          }}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-3 rounded-xl bg-slate-900 dark:bg-white px-5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M21.35 11.1H12v2.98h5.37c-.23 1.5-1.78 4.4-5.37 4.4-3.23 0-5.87-2.68-5.87-5.98s2.64-5.98 5.87-5.98c1.84 0 3.07.79 3.78 1.47l2.58-2.48C16.71 3.96 14.56 3 12 3 6.99 3 2.93 7.06 2.93 12.07S6.99 21.14 12 21.14c6.93 0 8.64-4.86 8.64-7.37 0-.5-.05-.88-.12-1.26Z"
            />
          </svg>
          <span>
            {loading
              ? 'Sprawdzanie sesji...'
              : signingIn
                ? 'Logowanie przez Google...'
                : 'Zaloguj się przez Google'}
          </span>
        </button>
      </div>
    </div>
  );
};
