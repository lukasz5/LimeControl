import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { t } from '../i18n';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  componentDidCatch(error: unknown) {
    console.error('Uncaught application error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-lg">
            <AlertTriangle className="mx-auto h-10 w-10 text-rose-600" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('Wystąpił nieoczekiwany błąd aplikacji')}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 break-words">
              {this.state.errorMessage || t('Spróbuj odświeżyć aplikację.')}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t('Odśwież aplikację')}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
