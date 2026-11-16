import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  GitCompareArrows,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getSummary } from '../services/limeSurveyRpc';
import type {
  ActiveSession,
  LimeSurveyItem,
  SurveySummary,
} from '../types/limesurvey';

interface SurveyComparisonChartProps {
  activeSession: ActiveSession;
  surveys: LimeSurveyItem[];
  initialSurveyAId?: number;
  onClose?: () => void;
}

type MetricScope = 'all' | 'responses' | 'tokens';

interface ComparisonRow {
  metric: string;
  fullLabel: string;
  a: number;
  b: number;
}

function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function truncateLabel(text: string, max = 32): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

interface ComparisonTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    payload?: ComparisonRow;
  }>;
  surveyAId: number;
  surveyBId: number;
}

const ComparisonTooltip: React.FC<ComparisonTooltipProps> = ({
  active,
  payload,
  surveyAId,
  surveyBId,
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  const diff = row.a - row.b;
  const diffText = diff > 0 ? `+${diff}` : String(diff);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg space-y-1.5 min-w-[170px]">
      <div className="text-xs font-bold text-slate-900 dark:text-white">
        {row.fullLabel}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 inline-block" />
            <span>Ankieta A (#{surveyAId})</span>
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {row.a}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-600 inline-block" />
            <span>Ankieta B (#{surveyBId})</span>
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {row.b}
          </span>
        </div>
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Różnica (A − B)</span>
          <span className="font-mono font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
            {diffText}
          </span>
        </div>
      </div>
    </div>
  );
};

export const SurveyComparisonChart: React.FC<SurveyComparisonChartProps> = ({
  activeSession,
  surveys,
  initialSurveyAId,
  onClose,
}) => {
  const defaultPair = useMemo(() => {
    const activeSurveys = surveys.filter((s) => s.active === 'Y');
    const candidateA =
      surveys.find((s) => s.sid === initialSurveyAId)?.sid ??
      activeSurveys[0]?.sid ??
      surveys[0]?.sid ??
      0;
    const candidateB =
      activeSurveys.find((s) => s.sid !== candidateA)?.sid ??
      surveys.find((s) => s.sid !== candidateA)?.sid ??
      candidateA;
    return { a: candidateA, b: candidateB };
  }, [surveys, initialSurveyAId]);

  const [surveyAId, setSurveyAId] = useState<number>(defaultPair.a);
  const [surveyBId, setSurveyBId] = useState<number>(defaultPair.b);
  const [metricScope, setMetricScope] = useState<MetricScope>('all');
  const [refreshTick, setRefreshTick] = useState(0);

  const [summaryA, setSummaryA] = useState<SurveySummary | null>(null);
  const [summaryB, setSummaryB] = useState<SurveySummary | null>(null);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync if survey list changes and selected IDs are no longer present
  useEffect(() => {
    if (surveys.length < 2) return;
    const hasA = surveys.some((s) => s.sid === surveyAId);
    const hasB = surveys.some((s) => s.sid === surveyBId);
    if (!hasA || !hasB || surveyAId === surveyBId) {
      setSurveyAId(defaultPair.a);
      setSurveyBId(defaultPair.b);
    }
  }, [surveys, surveyAId, surveyBId, defaultPair.a, defaultPair.b]);

  // If caller changes initialSurveyAId explicitly, adopt it cleanly
  useEffect(() => {
    if (!initialSurveyAId) return;
    if (!surveys.some((s) => s.sid === initialSurveyAId)) return;
    setSurveyAId(initialSurveyAId);
    setSurveyBId((prevB) => {
      if (prevB !== initialSurveyAId) return prevB;
      return (
        surveys.find((s) => s.active === 'Y' && s.sid !== initialSurveyAId)?.sid ??
        surveys.find((s) => s.sid !== initialSurveyAId)?.sid ??
        prevB
      );
    });
  }, [initialSurveyAId, surveys]);

  const surveyA = useMemo(
    () => surveys.find((s) => s.sid === surveyAId) ?? null,
    [surveys, surveyAId]
  );
  const surveyB = useMemo(
    () => surveys.find((s) => s.sid === surveyBId) ?? null,
    [surveys, surveyBId]
  );

  useEffect(() => {
    if (!activeSession || !surveyA || !surveyB) {
      setSummaryA(null);
      setSummaryB(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorA(null);
    setErrorB(null);

    const fetchOne = async (
      survey: LimeSurveyItem
    ): Promise<{ summary: SurveySummary | null; error: string | null }> => {
      if (survey.active !== 'Y') {
        return {
          summary: null,
          error: `Ankieta #${survey.sid} jest nieaktywna — metoda get_summary działa wyłącznie dla aktywnych ankiet.`,
        };
      }
      try {
        const res = await getSummary(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          survey.sid,
          'all',
          activeSession.connectionMode
        );
        return { summary: res, error: null };
      } catch (err) {
        return {
          summary: null,
          error:
            err instanceof Error
              ? err.message
              : `Nie udało się pobrać statystyk ankiety #${survey.sid}.`,
        };
      }
    };

    Promise.all([fetchOne(surveyA), fetchOne(surveyB)]).then(([resA, resB]) => {
      if (cancelled) return;
      setSummaryA(resA.summary);
      setErrorA(resA.error);
      setSummaryB(resB.summary);
      setErrorB(resB.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeSession, surveyA, surveyB, refreshTick]);

  const handleSelectA = (nextId: number) => {
    if (nextId === surveyBId) {
      setSurveyBId(surveyAId);
    }
    setSurveyAId(nextId);
  };

  const handleSelectB = (nextId: number) => {
    if (nextId === surveyAId) {
      setSurveyAId(surveyBId);
    }
    setSurveyBId(nextId);
  };

  const handleSwap = () => {
    setSurveyAId(surveyBId);
    setSurveyBId(surveyAId);
  };

  const hasAnyTokens =
    summaryA?.token_count !== undefined || summaryB?.token_count !== undefined;

  const { chartRows, completionRateA, completionRateB } = useMemo(() => {
    const compA = toNum(summaryA?.completed_responses);
    const incA = toNum(summaryA?.incomplete_responses);
    const fullA = toNum(summaryA?.full_responses) || compA + incA;

    const compB = toNum(summaryB?.completed_responses);
    const incB = toNum(summaryB?.incomplete_responses);
    const fullB = toNum(summaryB?.full_responses) || compB + incB;

    const tokCountA = toNum(summaryA?.token_count);
    const tokSentA = toNum(summaryA?.token_sent);
    const tokCompA = toNum(summaryA?.token_completed);
    const tokOptA = toNum(summaryA?.token_opted_out);
    const tokInvA = toNum(summaryA?.token_invalid);
    const tokPendA = Math.max(0, tokCountA - tokCompA - tokOptA - tokInvA);

    const tokCountB = toNum(summaryB?.token_count);
    const tokSentB = toNum(summaryB?.token_sent);
    const tokCompB = toNum(summaryB?.token_completed);
    const tokOptB = toNum(summaryB?.token_opted_out);
    const tokInvB = toNum(summaryB?.token_invalid);
    const tokPendB = Math.max(0, tokCountB - tokCompB - tokOptB - tokInvB);

    const responseRows: ComparisonRow[] = [
      { metric: 'Pełne', fullLabel: 'Pełne odpowiedzi', a: compA, b: compB },
      { metric: 'Niepełne', fullLabel: 'Niepełne odpowiedzi', a: incA, b: incB },
      { metric: 'Łącznie', fullLabel: 'Łącznie odpowiedzi', a: fullA, b: fullB },
    ];

    const tokenRows: ComparisonRow[] = [
      { metric: 'Tokeny', fullLabel: 'Tokeny łącznie', a: tokCountA, b: tokCountB },
      { metric: 'Wysłane', fullLabel: 'Zaproszenia wysłane', a: tokSentA, b: tokSentB },
      { metric: 'Ukończ. tok.', fullLabel: 'Ukończone przez token', a: tokCompA, b: tokCompB },
      { metric: 'Oczekujące', fullLabel: 'Oczekujące tokeny', a: tokPendA, b: tokPendB },
      { metric: 'Wypisane', fullLabel: 'Wypisani uczestnicy', a: tokOptA, b: tokOptB },
    ];

    let rows: ComparisonRow[] = [];
    if (metricScope === 'responses') {
      rows = responseRows;
    } else if (metricScope === 'tokens') {
      rows = hasAnyTokens ? tokenRows : [];
    } else {
      rows = hasAnyTokens ? [...responseRows, ...tokenRows] : responseRows;
    }

    return {
      chartRows: rows,
      completionRateA: fullA > 0 ? Math.round((compA / fullA) * 100) : null,
      completionRateB: fullB > 0 ? Math.round((compB / fullB) * 100) : null,
    };
  }, [summaryA, summaryB, metricScope, hasAnyTokens]);

  if (surveys.length < 2) {
    return null;
  }

  return (
    <section
      aria-label="Porównanie statystyk dwóch ankiet"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Porównanie statystyk dwóch ankiet
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Zestawienie danych z get_summary obok siebie na jednym wykresie zbiorczym
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => setRefreshTick((t) => t + 1)}
            className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Odśwież</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Zamknij porównanie ankiet"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Wybór dwóch ankiet */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2.5 items-end">
        <div>
          <label
            htmlFor="compare-survey-a"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 inline-block shrink-0" />
            <span>Ankieta A (seria zielona)</span>
          </label>
          <select
            id="compare-survey-a"
            value={surveyAId}
            onChange={(e) => handleSelectA(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
          >
            {surveys.map((s) => (
              <option key={s.sid} value={s.sid}>
                SID {s.sid} · {truncateLabel(s.surveyls_title || `Ankieta #${s.sid}`, 42)}{' '}
                ({s.active === 'Y' ? 'Aktywna' : 'Nieaktywna'})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          aria-label="Zamień wybrane ankiety miejscami"
          title="Zamień miejscami"
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 self-end justify-self-start md:justify-self-center"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>

        <div>
          <label
            htmlFor="compare-survey-b"
            className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-sky-600 inline-block shrink-0" />
            <span>Ankieta B (seria niebieska)</span>
          </label>
          <select
            id="compare-survey-b"
            value={surveyBId}
            onChange={(e) => handleSelectB(Number(e.target.value))}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
          >
            {surveys.map((s) => (
              <option key={s.sid} value={s.sid}>
                SID {s.sid} · {truncateLabel(s.surveyls_title || `Ankieta #${s.sid}`, 42)}{' '}
                ({s.active === 'Y' ? 'Aktywna' : 'Nieaktywna'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Zakres metryk + legenda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setMetricScope('all')}
            className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
              metricScope === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Wszystkie
          </button>
          <button
            type="button"
            onClick={() => setMetricScope('responses')}
            className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
              metricScope === 'responses'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Odpowiedzi
          </button>
          <button
            type="button"
            onClick={() => setMetricScope('tokens')}
            className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
              metricScope === 'tokens'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Uczestnicy
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
          {surveyA && (
            <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600 inline-block shrink-0" />
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                #{surveyA.sid}
              </span>
              <span className="font-medium truncate max-w-[180px]">
                {surveyA.surveyls_title || `Ankieta #${surveyA.sid}`}
              </span>
            </div>
          )}
          {surveyB && (
            <div className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-600 inline-block shrink-0" />
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                #{surveyB.sid}
              </span>
              <span className="font-medium truncate max-w-[180px]">
                {surveyB.surveyls_title || `Ankieta #${surveyB.sid}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Ostrzeżenia dla nieaktywnych ankiet lub błędów API */}
      {(errorA || errorB) && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-200 space-y-1">
          {errorA && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Ankieta A:</strong> {errorA}
              </span>
            </div>
          )}
          {errorB && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Ankieta B:</strong> {errorB}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Wykres zbiorczy */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-xs text-slate-500 dark:text-slate-400">
          Pobieranie statystyk z get_summary dla obu ankiet...
        </div>
      ) : chartRows.length === 0 ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Żadna z wybranych ankiet nie ma aktywowanej tabeli uczestników (tokenów). Przełącz widok na „Odpowiedzi” lub „Wszystkie”.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartRows}
                margin={{ top: 10, right: 8, left: -16, bottom: 4 }}
                barGap={4}
                barCategoryGap="22%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#94A3B8"
                  strokeOpacity={0.22}
                />
                <XAxis
                  dataKey="metric"
                  interval={0}
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
                  content={
                    <ComparisonTooltip
                      surveyAId={surveyAId}
                      surveyBId={surveyBId}
                    />
                  }
                />
                <Bar
                  name={`Ankieta A (#${surveyAId})`}
                  dataKey="a"
                  fill="#059669"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  name={`Ankieta B (#${surveyBId})`}
                  dataKey="b"
                  fill="#0284C7"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Zestawienie liczbowe A vs B */}
          <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/70 text-[11px] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Metryka</th>
                  <th className="px-3 py-2 font-semibold text-right font-mono">
                    A (#{surveyAId})
                  </th>
                  <th className="px-3 py-2 font-semibold text-right font-mono">
                    B (#{surveyBId})
                  </th>
                  <th className="px-3 py-2 font-semibold text-right font-mono">
                    Różnica
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {chartRows.map((row) => {
                  const diff = row.a - row.b;
                  const diffText = diff > 0 ? `+${diff}` : String(diff);
                  return (
                    <tr key={row.metric}>
                      <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                        {row.fullLabel}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {row.a}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                        {row.b}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                        {diffText}
                      </td>
                    </tr>
                  );
                })}
                {(completionRateA !== null || completionRateB !== null) && (
                  <tr className="bg-slate-50/60 dark:bg-slate-950/40">
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                      Udział pełnych odpowiedzi
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {completionRateA !== null ? `${completionRateA}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                      {completionRateB !== null ? `${completionRateB}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                      {completionRateA !== null && completionRateB !== null
                        ? `${completionRateA - completionRateB > 0 ? '+' : ''}${completionRateA - completionRateB} pp`
                        : '—'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
};
