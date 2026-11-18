import React from 'react';
import { Heart } from 'lucide-react';
import { BRAND } from '../config/brand';
import { isNativeApp } from '../platform';
import { getLang, t } from '../i18n';

/**
 * Stopka: kredyt autora, polityka prywatności, „Postaw mi kawę” i informacja o niezależności
 * od LimeSurvey GmbH. W aplikacji mobilnej link wsparcia jest ukryty — App Store i Google Play
 * nie dopuszczają zewnętrznych linków do wpłat na rzecz autora aplikacji. Link do polityki
 * prywatności musi być dostępny w samej aplikacji (wymóg obu sklepów).
 */
export const AppFooter: React.FC<{ className?: string }> = ({ className = '' }) => (
  <footer className={`space-y-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}>
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
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

      <a
        href={BRAND.privacyUrl[getLang()]}
        target="_blank"
        rel="noopener"
        className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline underline-offset-2"
      >
        {t('Polityka prywatności')}
      </a>

      {BRAND.supportUrl && !isNativeApp() && (
        <a
          href={BRAND.supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline underline-offset-2"
        >
          {t('Postaw mi kawę')}
        </a>
      )}
    </div>
    <p className="mx-auto max-w-xl text-center text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
      {t('LimeSurvey jest zastrzeżonym znakiem towarowym LimeSurvey GmbH. LimeControl jest niezależnym projektem i nie jest powiązany z LimeSurvey GmbH.')}
    </p>
  </footer>
);
