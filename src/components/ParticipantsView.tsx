import React, { useEffect, useRef, useState } from 'react';
import {
  BellRing,
  Check,
  FileEdit,
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
  getSurveyProperties,
  inviteParticipants,
  isEmptyParticipantList,
  isMissingParticipantTable,
  listParticipants,
  remindParticipants,
  summarizeMailResult,
  tokenAttributeNumbers,
} from '../services/limeSurveyRpc';
import type {
  ActiveSession,
  LimeSurveyItem,
  ParticipantItem,
  SurveySummary,
} from '../types/limesurvey';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { t } from '../i18n';

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
  /** Dodatkowe pola uczestnika zdefiniowane w ankiecie (np. z szablonu CATI): numery i opisy. */
  const [templateFields, setTemplateFields] = useState<Array<{ number: number; label: string }>>([]);
  const [createTemplateFields, setCreateTemplateFields] = useState(true);
  const [subTab, setSubTab] = useState<'list' | 'email-template'>('list');

  useEffect(() => {
    if (preselectedSurveyId) {
      setSelectedSid(String(preselectedSurveyId));
    } else if (!selectedSid && surveys.length > 0) {
      const activeFirst = surveys.find((s) => s.active === 'Y') || surveys[0];
      setSelectedSid(String(activeFirst.sid));
    }
  }, [preselectedSurveyId, surveys, selectedSid]);

  /**
   * Numer ostatniego wczytywania. Po szybkiej zmianie ankiety odpowiedź dla poprzedniej może
   * wrócić później niż dla bieżącej — taka spóźniona odpowiedź nie może nadpisać widoku.
   */
  const loadSeq = useRef(0);

  async function loadParticipantsData(sidNum: number) {
    if (!activeSession) return;
    const seq = ++loadSeq.current;
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
      if (seq !== loadSeq.current) return;
      setParticipants(list);
      setSummary(sum);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      const msg = err instanceof Error ? err.message : String(err);
      // Komunikaty różnią się między wersjami: LimeSurvey 3 — „No token table” / „No Tokens found”,
      // LimeSurvey 6–7 — „No survey participant list” (ERR_NO_PARTICIPANT_TABLE) / „No survey participants found.”
      if (isMissingParticipantTable(msg)) {
        setTokensMissing(true);
        setParticipants([]);
      } else if (isEmptyParticipantList(msg)) {
        setParticipants([]);
      } else {
        setError(msg);
      }
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }

  useEffect(() => {
    const sidNum = Number(selectedSid);
    if (activeSession && sidNum > 0) {
      void loadParticipantsData(sidNum);
    } else {
      loadSeq.current += 1; // unieważnia wczytywanie, które jeszcze trwa
      setParticipants([]);
      setSummary(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSid, unusedOnly, activeSession?.sessionKey]);

  // Gdy ankieta nie ma jeszcze tabeli uczestników, sprawdź, czy definiuje dodatkowe pola (atrybuty).
  useEffect(() => {
    setTemplateFields([]);
    setCreateTemplateFields(true);
    const sidNum = Number(selectedSid);
    if (!activeSession || !tokensMissing || !sidNum) return;
    let cancelled = false;
    getSurveyProperties(activeSession.rpcEndpoint, activeSession.sessionKey, sidNum, activeSession.connectionMode)
      .then((props) => {
        if (cancelled) return;
        let descriptions: Record<string, { description?: string }> = {};
        try {
          const raw = props.attributedescriptions;
          descriptions = (typeof raw === 'string' ? JSON.parse(raw || '{}') : raw || {}) as typeof descriptions;
        } catch {
          descriptions = {};
        }
        setTemplateFields(
          tokenAttributeNumbers(props.attributedescriptions).map((number) => ({
            number,
            label: String(descriptions[`attribute_${number}`]?.description || `attribute_${number}`),
          }))
        );
      })
      .catch(() => {
        // brak uprawnień do właściwości ankiety — tabela powstanie bez pól dodatkowych
      });
    return () => {
      cancelled = true;
    };
  }, [activeSession, selectedSid, tokensMissing]);

  /** Czytelne podsumowanie wyniku wysyłki; rzuca błąd, gdy nie wyszła żadna wiadomość. */
  function describeMailResult(result: unknown, kind: 'invite' | 'remind'): string {
    const summary = summarizeMailResult(result);
    if (summary.sent === 0 && summary.failed > 0) {
      throw new Error(t('Nie udało się wysłać żadnej z {0} wiadomości. {1}', summary.failed, summary.errors[0] || ''));
    }
    const base = kind === 'invite' ? t('Wysłano zaproszenia: {0}.', summary.sent) : t('Wysłano przypomnienia: {0}.', summary.sent);
    const failed = summary.failed ? ` ${t('Nieudane: {0}.', summary.failed)}` : '';
    const left = summary.left ? ` ${t('Pozostało do wysłania: {0} — powtórz operację.', summary.left)}` : '';
    return `${base}${failed}${left}`;
  }

  async function handleActivateTokenTable() {
    if (!activeSession || !selectedSid) return;
    setSubmitting(true);
    setError(null);
    try {
      await activateTokens(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        Number(selectedSid),
        activeSession.connectionMode,
        createTemplateFields ? templateFields.map((f) => f.number) : []
      );
      setTokensMissing(false);
      setFeedback(t('Tabela uczestników (tokenów) została pomyślnie aktywowana.'));
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
      setFeedback(t('Dodano uczestnika i wygenerowano token.'));
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
      setFeedback(describeMailResult(result, 'invite'));
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
      setFeedback(describeMailResult(result, 'remind'));
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
      setFeedback(t('Usunięto {0} uczestników.', tids.length));
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
          {t('Zarządzanie uczestnikami wymaga aktywnej sesji')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {t('Połącz się z instancją LimeSurvey, aby przeglądać tokeny, dodawać respondentów i wysyłać zaproszenia.')}
        </p>
        <button
          type="button"
          onClick={onGoToInstances}
          className="inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          {t('Przejdź do połączeń')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1 max-w-xl">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('Uczestnicy i tokeny')}
          </h2>
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('Ankieta docelowa')}
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setSubTab('list')}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${subTab === 'list'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'}`}
            >
              {t('Lista (')}{participants.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('email-template')}
              className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${subTab === 'email-template'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'}`}
            >
              {t('Szablon e-mail')}
            </button>
          </div>

          {subTab === 'list' && (
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUnusedOnly(false)}
                className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${!unusedOnly
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'}`}
              >
                {t('Wszyscy')}
              </button>
              <button
                type="button"
                onClick={() => setUnusedOnly(true)}
                className={`min-h-[38px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${unusedOnly
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'}`}
              >
                {t('Niewykorzystane')}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (selectedSid) void loadParticipantsData(Number(selectedSid));
            }}
            aria-label={t('Odśwież uczestników')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {summary && summary.token_count !== undefined && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('Tokeny łącznie')}</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {summary.token_count ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('Wysłane')}</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {summary.token_sent ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('Ukończone')}</div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {summary.token_completed ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('Wypisane')}</div>
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

      {subTab === 'email-template' && selectedSid ? (
        <EmailTemplateEditor
          activeSession={activeSession}
          surveyId={Number(selectedSid)}
          survey={surveys.find((s) => String(s.sid) === selectedSid)}
          sampleParticipant={participants[0]}
          selectedTidsCount={selectedTids.length}
          hasParticipants={participants.length > 0}
          onSaveAndSendInvite={async () => {
            await handleInvite(selectedTids);
          }}
          onSaveAndSendRemind={async () => {
            await handleRemind(selectedTids);
          }}
        />
      ) : tokensMissing ? (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-6 space-y-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('Tabela uczestników nie jest jeszcze aktywna')}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
            {t('Wybrana ankieta nie ma zainicjalizowanej tabeli tokenów w LimeSurvey. Możesz utworzyć ją jednym kliknięciem poprzez')}{' '}<code className="font-mono">activate_tokens</code>.
          </p>
          {templateFields.length > 0 && (
            <label className="flex min-h-[44px] items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer max-w-xl">
              <input
                type="checkbox"
                checked={createTemplateFields}
                onChange={(e) => setCreateTemplateFields(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                {t('Utwórz pola z szablonu')}{' '}
                <span className="text-slate-500 dark:text-slate-400">({templateFields.map((f) => f.label).join(', ')})</span>
              </span>
            </label>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              void handleActivateTokenTable();
            }}
            className="min-h-[44px] rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? t('Aktywowanie...') : t('Aktywuj tabelę uczestników (activate_tokens)')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-start">
          <form
            onSubmit={handleAddParticipant}
            className="md:col-span-5 lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3.5"
          >
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('Dodaj uczestnika (add_participants)')}
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('Adres e-mail')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('jan.kowalski@firma.pl')}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Imię')}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('Jan')}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Nazwisko')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('Kowalski')}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSid}
              className="w-full min-h-[44px] rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t('Dodaj i wygeneruj token')}
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('Akcje zbiorcze (')}{selectedTids.length > 0 ? t('zaznaczono {0}', selectedTids.length) : t('wszyscy kwalifikujący się')})
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
                  <span>{t('Zaproś')}</span>
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
                  <span>{t('Przypomnij')}</span>
                </button>
              </div>
              <button
                type="button"
                disabled={!selectedSid}
                onClick={() => setSubTab('email-template')}
                className="w-full inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 disabled:opacity-50"
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>{t('Edytuj i podejrzyj szablon e-mail')}</span>
              </button>
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
                  <span>{t('Usuń zaznaczonych (')}{selectedTids.length})</span>
                </button>
              )}
            </div>
          </form>

          <div className="md:col-span-7 lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('Lista uczestników (')}{participants.length})
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {t('Limit strony: 100 rekordów')}
              </span>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                {t('Brak uczestników na liście. Dodaj pierwszego uczestnika w formularzu obok.')}
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
                    .join(' ') || t('Bez nazwy');
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
                        className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 ${checked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-700'}`}
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
                          <span>{t('Token:')}{' '}{p.token || '—'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{isSent ? t('Wysłano: {0}', p.sent) : t('Niewysłano')}</span>
                          <span aria-hidden="true">·</span>
                          <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                            {isCompleted ? t('Ukończono: {0}', p.completed) : t('Oczekuje')}
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
