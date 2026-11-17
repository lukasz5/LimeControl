import React from 'react';
import { Coffee, Heart } from 'lucide-react';
import { BRAND } from '../config/brand';
import { t } from '../i18n';

/** Stopka: kredyt autora i „Postaw mi kawę”. */
export const AppFooter: React.FC<{ className?: string }> = ({ className = '' }) => (
  <footer
    className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
  >
    <p className="inline-flex items-center gap-1.5">
      Made with
      <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" aria-label={t('miłością')} />
      by
      <a
        href={BRAND.authorUrl}
        target="_blank"
        rel="noopener"
        className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline underline-offset-2"
      >
        {BRAND.author}
      </a>
    </p>

    {BRAND.supportUrl && (
      <a
        href={BRAND.supportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-amber-300/70 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-1.5 font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
      >
        <Coffee className="h-3.5 w-3.5" aria-hidden="true" />
        {t('Postaw mi kawę')}
      </a>
    )}
  </footer>
);
