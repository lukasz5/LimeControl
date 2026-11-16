import React, { useEffect, useState } from 'react';
import {
  BellRing,
  Check,
  Mail,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  activateTokens,
  addParticipants,
  deleteParticipants,
  getSummary,
  inviteParticipants,
  listParticipants,
  remindParticipants,
} from '../services/limeSurveyRpc';
import type {
  ActiveSession,
  LimeSurveyItem,
  ParticipantItem,
  SurveySummary,
} from '../types/limesurvey';

interface ParticipantsViewProps {
  activeSession: ActiveSession | null;
  surveys: LimeSurveyItem[];
  preselectedSurveyId: number | null;
  onGoToInstances: () => void;
}

export const ParticipantsView: React.FC<ParticipantsViewProps> = ({
  activeSession,
  surveys,
  preselectedSurveyId,
  onGoToInstances,
}) => {
  const [selectedSid, setSelectedSid] = useState<string>(
    preselectedSurveyId ? String(preselectedSurveyId) : ''
  );
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [tokensMissing, setTokensMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [selectedTids, setSelectedTids] = useState<number[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedSurveyId) {
      setSelectedSid(String(preselectedSurveyId));
    } else if (!selectedSid && surveys.length > 0) {
      const activeFirst = surveys.find((s) => s.active === 'Y') || surveys[0];
      setSelectedSid(String(activeFirst.sid));
    }
  }, [preselectedSurveyId, surveys, selectedSid]);

  async function loadParticipantsData(sidNum: number) {
    if (!activeSession) return;
    setLoading(true);
    setError(null);
    setTokensMissing(false);
    setSelectedTids([]);

    try {
      const [list, sum] = await Promise.all([
        listParticipants(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          sidNum,
          0,
          100,
          unusedOnly,
          activeSession.connectionMode
        ),
        getSummary(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          sidNum,
          'all',
          activeSession.connectionMode
        ).catch(() => null),
      ]);
      setParticipants(list);
      setSummary(sum);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/no token table|no data|fault/i.test(msg)) {
        setTokensMissing(/token table|not exist/i.test(msg));
        if (/no data/i.test(msg)) {
          setParticipants([]);
        } else {
          setError(msg);
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const sidNum = Number(selectedSid);
    if (activeSession && sidNum > 0) {
      void loadParticipantsData(sidNum);
    } else {
      setParticipants([]);
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSid, unusedOnly, activeSession?.sessionKey]);

  async function handleActivateTokenTable() {
    if (!activeSession || !selectedSid) return;
    setSubmitting(true);
    setError(null);
    try {
      await activateTokens(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        activeSession.connectionMode
      );
      setTokensMissing(false);
      setFeedback('Tabela uczestników (tokenów) została pomyślnie aktywowana.');
      await loadParticipantsData(Number(selectedSid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession || !selectedSid || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await addParticipants(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        [
          {
            firstname: firstName.trim(),
            lastname: lastName.trim(),
            email: email.trim(),
          },
        ],
        true,
        activeSession.connectionMode
      );
      setFirstName('');
      setLastName('');
      setEmail('');
      setFeedback('Dodano uczestnika i wygenerowano token.');
      await loadParticipantsData(Number(selectedSid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvite(tids: number[]) {
    if (!activeSession || !selectedSid) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await inviteParticipants(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        tids,
        activeSession.connectionMode
      );
      setFeedback(`Wysłano zaproszenia: ${JSON.stringify(result)}`);
      await loadParticipantsData(Number(selectedSid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemind(tids: number[]) {
    if (!activeSession || !selectedSid) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await remindParticipants(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        tids,
        activeSession.connectionMode
      );
      setFeedback(`Wysłano przypomnienia: ${JSON.stringify(result)}`);
      await loadParticipantsData(Number(selectedSid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteParticipants(tids: number[]) {
    if (!activeSession || !selectedSid || tids.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteParticipants(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        tids,
        activeSession.connectionMode
      );
      setFeedback(`Usunięto ${tids.length} uczestników.`);
      await loadParticipantsData(Number(selectedSid));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function toggleSelectTid(tid: number) {
    setSelectedTids((prev) =>
      prev.includes(tid) ? prev.filter((id) => id !== tid) : [...prev, tid]
    );
  }

  if (!activeSession) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
        <Users className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Zarządzanie uczestnikami wymaga aktywnej sesji
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Połącz się z instancją LimeSurvey, aby przeglądać tokeny, dodawać respondentów i wysyłać zaproszenia.
        </p>
        <button
          type="button"
          onClick={onGoToInstances}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Przejdź do połączeń
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Uczestnicy i tokeny
          </h2>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ankieta docelowa
            </label>
            <select
              value={selectedSid}
              onChange={(e) => setSelectedSid(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-sm font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              {surveys.map((s) => (
                <option key={s.sid} value={String(s.sid)}>
                  #{s.sid} · {s.surveyls_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setUnusedOnly(false)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                !unusedOnly
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Wszyscy
            </button>
            <button
              type="button"
              onClick={() => setUnusedOnly(true)}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                unusedOnly
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Niewykorzystane
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (selectedSid) void loadParticipantsData(Number(selectedSid));
            }}
            aria-label="Odśwież uczestników"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {summary && summary.token_count !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Tokeny łącznie</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {summary.token_count ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Wysłane</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {summary.token_sent ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Ukończone</div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {summary.token_completed ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">Wypisane</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {summary.token_opted_out ?? 0}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {feedback && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {feedback}
        </div>
      )}

      {tokensMissing ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tabela uczestników nie jest jeszcze aktywna
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
            Wybrana ankieta nie ma zainicjalizowanej tabeli tokenów w LimeSurvey. Możesz utworzyć ją jednym kliknięciem poprzez <code className="font-mono">activate_tokens</code>.
          </p>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void handleActivateTokenTable();
            }}
            className="min-h-[44px] rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Aktywowanie...' : 'Aktywuj tabelę uczestników (activate_tokens)'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <form
            onSubmit={handleAddParticipant}
            className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dodaj uczestnika (add_participants)
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Adres e-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jan.kowalski@firma.pl"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Imię
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jan"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nazwisko
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Kowalski"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSid}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Dodaj i wygeneruj token
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Akcje zbiorcze ({selectedTids.length > 0 ? `zaznaczono ${selectedTids.length}` : 'wszyscy kwalifikujący się'})
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={submitting || participants.length === 0}
                  onClick={() => {
                    void handleInvite(selectedTids);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Zaproś</span>
                </button>
                <button
                  type="button"
                  disabled={submitting || participants.length === 0}
                  onClick={() => {
                    void handleRemind(selectedTids);
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  <span>Przypomnij</span>
                </button>
              </div>
              {selectedTids.length > 0 && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    void handleDeleteParticipants(selectedTids);
                  }}
                  className="w-full inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Usuń zaznaczonych ({selectedTids.length})</span>
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lista uczestników ({participants.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Limit strony: 100 rekordów
              </span>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                Brak uczestników na liście. Dodaj pierwszego uczestnika w formularzu obok.
              </div>
            ) : (
              participants.map((p) => {
                const tidNum = Number(p.tid);
                const checked = selectedTids.includes(tidNum);
                const fullName =
                  [
                    p.participant_info?.firstname || p.firstname,
                    p.participant_info?.lastname || p.lastname,
                  ]
                    .filter(Boolean)
                    .join(' ') || 'Bez nazwy';
                const mail = p.participant_info?.email || p.email || '—';
                const isCompleted = p.completed && p.completed !== 'N';
                const isSent = p.sent && p.sent !== 'N';

                return (
                  <button
                    key={String(p.tid)}
                    type="button"
                    onClick={() => toggleSelectTid(tidNum)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${
                          checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {fullName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {mail}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>TID {p.tid}</span>
                          <span aria-hidden="true">·</span>
                          <span>Token: {p.token || '—'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{isSent ? `Wysłano: ${p.sent}` : 'Niewysłano'}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                            {isCompleted ? `Ukończono: ${p.completed}` : 'Oczekuje'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
