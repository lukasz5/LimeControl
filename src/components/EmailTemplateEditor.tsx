import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Eye,
  Mail,
  Pencil,
  RotateCcw,
  Save,
  Send,
} from 'lucide-react';
import {
  getLanguageProperties,
  getSurveyProperties,
  setLanguageProperties,
} from '../services/limeSurveyRpc';
import type {
  ActiveSession,
  LimeSurveyItem,
  ParticipantItem,
} from '../types/limesurvey';

interface EmailTemplateEditorProps {
  activeSession: ActiveSession;
  surveyId: number;
  survey?: LimeSurveyItem;
  sampleParticipant?: ParticipantItem;
  selectedTidsCount: number;
  hasParticipants: boolean;
  onSaveAndSendInvite: () => Promise<void>;
  onSaveAndSendRemind: () => Promise<void>;
}

type TemplateKind = 'invite' | 'remind';
type EditorMode = 'edit' | 'preview';

const PLACEHOLDERS = [
  { token: '{FIRSTNAME}', label: 'Imię' },
  { token: '{LASTNAME}', label: 'Nazwisko' },
  { token: '{EMAIL}', label: 'E-mail' },
  { token: '{TOKEN}', label: 'Token' },
  { token: '{SURVEYURL}', label: 'Link do ankiety' },
  { token: '{OPTOUTURL}', label: 'Link rezygnacji' },
  { token: '{SURVEYNAME}', label: 'Nazwa ankiety' },
];

function sanitizeEmailHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '#');
}

function formatPreviewBody(rawBody: string): string {
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(rawBody);
  if (hasHtmlTags) {
    return sanitizeEmailHtml(rawBody);
  }
  const escaped = rawBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br />');
}

export const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  activeSession,
  surveyId,
  survey,
  sampleParticipant,
  selectedTidsCount,
  hasParticipants,
  onSaveAndSendInvite,
  onSaveAndSendRemind,
}) => {
  const [templateKind, setTemplateKind] = useState<TemplateKind>('invite');
  const [mode, setMode] = useState<EditorMode>('edit');
  const [languages, setLanguages] = useState<string[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('');

  const [inviteSubj, setInviteSubj] = useState('');
  const [inviteBody, setInviteBody] = useState('');
  const [remindSubj, setRemindSubj] = useState('');
  const [remindBody, setRemindBody] = useState('');
  const [surveyTitle, setSurveyTitle] = useState(survey?.surveyls_title || '');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadTemplates(langOverride?: string) {
    setLoading(true);
    setError(null);
    setStatusMsg(null);

    try {
      let targetLang = langOverride || selectedLang;
      if (!targetLang) {
        const props = await getSurveyProperties(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          surveyId,
          activeSession.connectionMode
        ).catch(() => null);

        const baseLang = props?.language ? String(props.language) : '';
        const extra = props?.additional_languages
          ? String(props.additional_languages)
              .split(/\s+/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
        const allLangs = Array.from(
          new Set([baseLang, ...extra].filter(Boolean))
        );
        setLanguages(allLangs);
        targetLang = allLangs[0] || '';
        setSelectedLang(targetLang);
      }

      const langProps = await getLanguageProperties(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        surveyId,
        [
          'surveyls_language',
          'surveyls_title',
          'surveyls_email_invite_subj',
          'surveyls_email_invite',
          'surveyls_email_remind_subj',
          'surveyls_email_remind',
        ],
        targetLang || null,
        activeSession.connectionMode
      );

      setSurveyTitle(
        String(langProps.surveyls_title || survey?.surveyls_title || `Ankieta #${surveyId}`)
      );
      setInviteSubj(String(langProps.surveyls_email_invite_subj ?? ''));
      setInviteBody(String(langProps.surveyls_email_invite ?? ''));
      setRemindSubj(String(langProps.surveyls_email_remind_subj ?? ''));
      setRemindBody(String(langProps.surveyls_email_remind ?? ''));
      if (!targetLang && langProps.surveyls_language) {
        setSelectedLang(String(langProps.surveyls_language));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się pobrać szablonów wiadomości e-mail z LimeSurvey.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedLang('');
    void loadTemplates('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyId, activeSession.sessionKey]);

  const currentSubj = templateKind === 'invite' ? inviteSubj : remindSubj;
  const currentBody = templateKind === 'invite' ? inviteBody : remindBody;

  function setCurrentSubj(val: string) {
    if (templateKind === 'invite') setInviteSubj(val);
    else setRemindSubj(val);
  }

  function setCurrentBody(val: string) {
    if (templateKind === 'invite') setInviteBody(val);
    else setRemindBody(val);
  }

  function insertPlaceholder(token: string) {
    const el = bodyTextareaRef.current;
    if (!el) {
      setCurrentBody(`${currentBody}${currentBody ? ' ' : ''}${token}`);
      return;
    }
    const start = el.selectionStart ?? currentBody.length;
    const end = el.selectionEnd ?? currentBody.length;
    const next =
      currentBody.slice(0, start) + token + currentBody.slice(end);
    setCurrentBody(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const previewData = useMemo(() => {
    const first =
      sampleParticipant?.participant_info?.firstname ||
      sampleParticipant?.firstname ||
      'Jan';
    const last =
      sampleParticipant?.participant_info?.lastname ||
      sampleParticipant?.lastname ||
      'Kowalski';
    const email =
      sampleParticipant?.participant_info?.email ||
      sampleParticipant?.email ||
      'jan.kowalski@firma.pl';
    const token = sampleParticipant?.token || 'AbC123xYz9';
    const base = activeSession.rpcEndpoint
      .replace(/\/index\.php\/admin\/remotecontrol$/i, '')
      .replace(/\/admin\/remotecontrol$/i, '')
      .replace(/\/index\.php\?r=admin\/remotecontrol$/i, '');
    const surveyUrl = `${base}/index.php/${surveyId}?token=${token}`;
    const optoutUrl = `${base}/index.php/optout/tokens/${surveyId}?token=${token}`;

    const replaceTokens = (txt: string) =>
      txt
        .replace(/\{FIRSTNAME\}/gi, first)
        .replace(/\{LASTNAME\}/gi, last)
        .replace(/\{EMAIL\}/gi, email)
        .replace(/\{TOKEN\}/gi, token)
        .replace(/\{SURVEYNAME\}/gi, surveyTitle || `Ankieta #${surveyId}`)
        .replace(/\{SURVEYURL\}/gi, surveyUrl)
        .replace(/\{OPTOUTURL\}/gi, optoutUrl)
        .replace(/\{ADMINNAME\}/gi, activeSession.username);

    return {
      recipientLabel: `${first} ${last} <${email}>`,
      subject: replaceTokens(currentSubj || '(brak tematu)'),
      htmlBody: formatPreviewBody(replaceTokens(currentBody || '(pusta treść)')),
    };
  }, [
    sampleParticipant,
    activeSession.rpcEndpoint,
    activeSession.username,
    surveyId,
    surveyTitle,
    currentSubj,
    currentBody,
  ]);

  async function saveTemplateOnly(): Promise<boolean> {
    setSaving(true);
    setError(null);
    setStatusMsg(null);
    try {
      const payload =
        templateKind === 'invite'
          ? {
              surveyls_email_invite_subj: inviteSubj,
              surveyls_email_invite: inviteBody,
            }
          : {
              surveyls_email_remind_subj: remindSubj,
              surveyls_email_remind: remindBody,
            };

      await setLanguageProperties(
        activeSession.rpcEndpoint,
        activeSession.sessionKey,
        surveyId,
        payload,
        selectedLang || null,
        activeSession.connectionMode
      );
      setStatusMsg(
        `Zapisano szablon ${
          templateKind === 'invite' ? 'zaproszenia' : 'przypomnienia'
        } w LimeSurvey (${selectedLang || 'język bazowy'}).`
      );
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Nie udało się zapisać szablonu w LimeSurvey.'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndSend() {
    const saved = await saveTemplateOnly();
    if (!saved) return;
    if (templateKind === 'invite') {
      await onSaveAndSendInvite();
    } else {
      await onSaveAndSendRemind();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Edytor szablonów wiadomości e-mail
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Pobierz, edytuj i podejrzyj treść przed wysyłką (metody{' '}
            <code className="font-mono">get_language_properties</code> /{' '}
            <code className="font-mono">set_language_properties</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {languages.length > 1 && (
            <select
              value={selectedLang}
              onChange={(e) => {
                const nextLang = e.target.value;
                setSelectedLang(nextLang);
                void loadTemplates(nextLang);
              }}
              aria-label="Język szablonu"
              className="min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 font-mono text-xs font-semibold text-slate-900 dark:text-white"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  Język: {lang}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              void loadTemplates(selectedLang);
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Pobierz z serwera</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setTemplateKind('invite')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              templateKind === 'invite'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Zaproszenie (invite)
          </button>
          <button
            type="button"
            onClick={() => setTemplateKind('remind')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              templateKind === 'remind'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Przypomnienie (remind)
          </button>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`inline-flex items-center gap-1.5 min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'edit'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edycja</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`inline-flex items-center gap-1.5 min-h-[38px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              mode === 'preview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Podgląd wiadomości</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-xs text-rose-800 dark:text-rose-200">
          {error}
        </div>
      )}

      {statusMsg && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 text-xs font-medium text-emerald-800 dark:text-emerald-200">
          {statusMsg}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          Wczytywanie szablonów z instancji LimeSurvey...
        </div>
      ) : mode === 'edit' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Temat wiadomości ({templateKind === 'invite' ? 'surveyls_email_invite_subj' : 'surveyls_email_remind_subj'})
            </label>
            <input
              type="text"
              value={currentSubj}
              onChange={(e) => setCurrentSubj(e.target.value)}
              placeholder="Zaproszenie do udziału w badaniu: {SURVEYNAME}"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Wstaw zmienne LimeSurvey
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Dotknij, aby wstawić w miejscu kursora
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  onClick={() => insertPlaceholder(p.token)}
                  className="min-h-[36px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  {p.token} · {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Treść wiadomości ({templateKind === 'invite' ? 'surveyls_email_invite' : 'surveyls_email_remind'})
            </label>
            <textarea
              ref={bodyTextareaRef}
              rows={9}
              value={currentBody}
              onChange={(e) => setCurrentBody(e.target.value)}
              placeholder="Szanowny/a {FIRSTNAME} {LASTNAME}, zapraszamy do wypełnienia ankiety: {SURVEYURL}"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3.5 font-mono text-xs leading-relaxed text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Przykładowy odbiorca:{' '}
              <span className="font-mono text-slate-800 dark:text-slate-200">
                {previewData.recipientLabel}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              Temat: {previewData.subject}
            </div>
          </div>
          <div
            className="p-5 text-sm leading-relaxed text-slate-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none break-words"
            dangerouslySetInnerHTML={{ __html: previewData.htmlBody }}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          disabled={saving || loading}
          onClick={() => {
            void saveTemplateOnly();
          }}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Zapisywanie...' : 'Zapisz szablon w LimeSurvey'}</span>
        </button>

        <button
          type="button"
          disabled={saving || loading || !hasParticipants}
          onClick={() => {
            void handleSaveAndSend();
          }}
          className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>
            {templateKind === 'invite'
              ? `Zapisz i wyślij zaproszenia (${
                  selectedTidsCount > 0
                    ? `zaznaczeni: ${selectedTidsCount}`
                    : 'kwalifikujący się'
                })`
              : `Zapisz i wyślij przypomnienia (${
                  selectedTidsCount > 0
                    ? `zaznaczeni: ${selectedTidsCount}`
                    : 'oczekujący'
                })`}
          </span>
        </button>
      </div>
    </div>
  );
};
