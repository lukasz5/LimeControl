import React from 'react';
import { LANGS, setLang, t, useLang } from '../i18n';

/** Przełącznik języka PL / EN. */
export const LanguageSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const lang = useLang();
  return (
    <div
      role="group"
      aria-label={t('Język interfejsu')}
      className={`inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-0.5 text-[11px] font-bold ${className}`}
    >
      {LANGS.map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => setLang(code)}
            className={`min-h-[32px] min-w-[34px] rounded-[10px] px-2 uppercase tracking-wide transition-colors ${
              active
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
};
