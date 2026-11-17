import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, GitCompareArrows } from 'lucide-react';
import type { SurveySummary } from '../types/limesurvey';
import { t } from '../i18n';

interface SurveySummaryChartsProps {
  surveyTitle?: string;
  surveyId?: number;
  isActive: boolean;
  summary: SurveySummary | null;
  loading?: boolean;
  error?: string | null;
  compact?: boolean;
  onCompareWithAnother?: () => void;
}

interface ChartDatum {
  name: string;
  value: number;
  color: string;
}

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: ChartDatum }>;
  label?: string;
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label || item.payload?.name}
      </div>
      <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
        {item.value ?? 0}
      </div>
    </div>
  );
};

export const SurveySummaryCharts: React.FC<SurveySummaryChartsProps> = ({
  surveyTitle,
  surveyId,
  isActive,
  summary,
  loading,
  error,
  compact = false,
  onCompareWithAnother,
}) => {
  if (!isActive) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <BarChart3 className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <h4 className="text-sm font-bold">{t('Wizualizacja statystyk (get_summary)')}</h4>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('Wykresy odpowiedzi i statusów uczestników są dostępne po aktywowaniu ankiety w LimeSurvey.')}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h4 className="text-sm font-bold">{t('Wizualizacja statystyk (get_summary)')}</h4>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('Ładowanie danych do wykresu...')}
        </p>
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  const completed = toNum(summary.completed_responses);
  const incomplete = toNum(summary.incomplete_responses);
  const fullResponses = toNum(summary.full_responses) || completed + incomplete;

  const responseData: ChartDatum[] = [
    { name: t('Pełne'), value: completed, color: '#1F7A3E' },
    { name: t('Niepełne'), value: incomplete, color: '#D97706' },
    { name: t('Łącznie'), value: fullResponses, color: '#475569' },
  ];

  const hasTokens = summary.token_count !== undefined;
  const tokenCount = toNum(summary.token_count);
  const tokenSent = toNum(summary.token_sent);
  const tokenCompleted = toNum(summary.token_completed);
  const tokenOptedOut = toNum(summary.token_opted_out);
  const tokenInvalid = toNum(summary.token_invalid);
  const tokenPending = Math.max(
    0,
    tokenCount - tokenCompleted - tokenOptedOut - tokenInvalid
  );

  const participantData: ChartDatum[] = hasTokens
    ? [
        { name: t('Łącznie'), value: tokenCount, color: '#334155' },
        { name: t('Wysłane'), value: tokenSent, color: '#0284C7' },
        { name: t('Ukończone'), value: tokenCompleted, color: '#1F7A3E' },
        { name: t('Oczekujące'), value: tokenPending, color: '#D97706' },
        { name: t('Wypisane'), value: tokenOptedOut, color: '#E11D48' },
      ]
    : [];

  return (
    <section
      aria-label={t('Wizualizacja statystyk ankiety')}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('Wizualizacja statystyk')}
            </h4>
          </div>
          {surveyTitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
              {surveyId ? `SID ${surveyId} · ` : ''}
              {surveyTitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            {t('Źródło: get_summary')}
          </span>
          {onCompareWithAnother && (
            <button
              type="button"
              onClick={onCompareWithAnother}
              className="min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('Porównaj')}</span>
            </button>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2'} gap-5`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('Liczba odpowiedzi')}
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
              {t('Suma:')}{' '}{fullResponses}
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={responseData}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#94A3B8"
                  strokeOpacity={0.22}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={44}>
                  {responseData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {t('Status uczestników')}
            </span>
            {hasTokens && (
              <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {t('Tokeny:')}{' '}{tokenCount}
              </span>
            )}
          </div>

          {hasTokens ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={participantData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#94A3B8"
                    strokeOpacity={0.22}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={76}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                    content={<ChartTooltip />}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                    {participantData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('Ankieta jest otwarta — tabela uczestników (tokenów) nie została aktywowana.')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
