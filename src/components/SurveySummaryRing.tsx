import React from 'react';
import type { SurveySummary } from '../types/limesurvey';

interface SurveySummaryRingProps {
  summary: SurveySummary | null;
  loading?: boolean;
  error?: string | null;
}

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export const SurveySummaryRing: React.FC<SurveySummaryRingProps> = ({
  summary,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Pobieranie statystyk (get_summary)...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
        {error}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const completed = toNum(summary.completed_responses);
  const incomplete = toNum(summary.incomplete_responses);
  const fullTotal = toNum(summary.full_responses) || completed + incomplete;
  const completionPct =
    fullTotal > 0 ? Math.round((completed / fullTotal) * 100) : 0;

  const tokenCount = toNum(summary.token_count);
  const tokenSent = toNum(summary.token_sent);
  const tokenCompleted = toNum(summary.token_completed);
  const tokenOptedOut = toNum(summary.token_opted_out);

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (completionPct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Podsumowanie odpowiedzi
          </h4>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Dane na żywo z metody get_summary
          </p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-slate-200 dark:stroke-slate-800"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="stroke-emerald-600 dark:stroke-emerald-500 transition-all duration-300"
            />
          </svg>
          <span className="absolute font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {completionPct}%
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Pełne</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {completed}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Niepełne</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {incomplete}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Łącznie</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {fullTotal}
          </div>
        </div>
      </div>

      {(summary.token_count !== undefined || tokenCount > 0) && (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tokeny uczestników
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 dark:text-slate-300 font-mono tabular-nums">
            <span>Wszystkie: {tokenCount}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>Wysłane: {tokenSent}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>Ukończone: {tokenCompleted}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>Wypisane: {tokenOptedOut}</span>
          </div>
        </div>
      )}
    </div>
  );
};
