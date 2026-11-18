import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initBackend } from './backend';
import { t } from './i18n';
import './index.css';

const root = createRoot(document.getElementById('root')!);

// Tryb logowania (Google albo klucz dostępu własnej instalacji) wybiera serwer — /api/config.
initBackend()
  .then(() => root.render(<App />))
  .catch(() => {
    root.render(
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center space-y-4">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('Nie udało się połączyć z serwerem LimeControl')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('Sprawdź połączenie z internetem i spróbuj ponownie.')}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[48px] w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('Spróbuj ponownie')}
          </button>
        </div>
      </div>
    );
  });
