import React from 'react';
import { Heart } from 'lucide-react';
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
        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline underline-offset-2"
      >
        {t('Postaw mi kawę')}
      </a>
    )}
  </footer>
);
