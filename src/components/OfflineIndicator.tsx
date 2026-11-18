import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { t } from '../i18n';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed above-bottom-nav left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/95 px-4 py-2.5 text-xs font-semibold text-amber-900 dark:text-amber-100 shadow-lg"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <span>{t('Tryb offline — zapytania JSON-RPC wymagają połączenia z siecią.')}</span>
    </div>
  );
};
