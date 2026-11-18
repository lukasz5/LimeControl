export type ConnectionMode = 'direct' | 'relay';

export type LimeSurveyVersion = 'auto' | 'v7' | 'legacy';

export interface InstanceProfile {
  id: string;
  ownerUid?: string;
  name: string;
  baseUrl: string;
  rpcEndpoint: string;
  username: string;
  /** Runtime-only memory password (never stored in localStorage or Firestore). */
  password?: string;
  savePassword?: boolean;
  authPlugin: string;
  connectionMode: ConnectionMode;
  limeVersion: LimeSurveyVersion;
  lastConnectedAt?: string;
  siteName?: string;
}

export interface ActiveSession {
  profileId: string;
  profileName: string;
  rpcEndpoint: string;
  username: string;
  authPlugin: string;
  connectionMode: ConnectionMode;
  limeVersion: LimeSurveyVersion;
  sessionKey: string;
  connectedAt: string;
  siteSettings?: Record<string, unknown>;
}

export interface LimeSurveyItem {
  sid: number;
  surveyls_title: string;
  startdate: string | null;
  expires: string | null;
  active: 'Y' | 'N' | string;
}

export interface SurveyProperties {
  sid?: number;
  owner_id?: number;
  admin?: string;
  adminemail?: string;
  active?: 'Y' | 'N' | string;
  expires?: string | null;
  startdate?: string | null;
  anonymized?: 'Y' | 'N' | string;
  format?: string;
  template?: string;
  language?: string;
  additional_languages?: string;
  /** Definicje dodatkowych pól uczestnika (JSON): {"attribute_1": {"description": "Telefon", …}}. */
  attributedescriptions?: string | Record<string, unknown> | null;
  allowregister?: 'Y' | 'N' | string;
  autoredirect?: 'Y' | 'N' | string;
  datestamp?: 'Y' | 'N' | string;
  usecookie?: 'Y' | 'N' | string;
  [key: string]: unknown;
}

export interface SurveyLanguageProperties {
  surveyls_survey_id?: number | string;
  surveyls_language?: string;
  surveyls_title?: string;
  surveyls_email_invite_subj?: string;
  surveyls_email_invite?: string;
  surveyls_email_remind_subj?: string;
  surveyls_email_remind?: string;
  surveyls_email_register_subj?: string;
  surveyls_email_register?: string;
  [key: string]: unknown;
}

export interface SurveySummary {
  completed_responses?: number | string;
  incomplete_responses?: number | string;
  full_responses?: number | string;
  token_count?: number | string;
  token_invalid?: number | string;
  token_sent?: number | string;
  token_opted_out?: number | string;
  token_completed?: number | string;
  token_screenout?: number | string;
  [key: string]: unknown;
}

export interface FieldmapEntry {
  fieldname: string;
  type?: string;
  title?: string;
  question?: string;
  gid?: number | string;
  qid?: number | string;
  [key: string]: unknown;
}

export interface ParticipantItem {
  tid: number | string;
  token: string;
  usesleft?: number | string;
  completed?: string;
  validfrom?: string | null;
  validuntil?: string | null;
  sent?: string;
  remindersent?: string;
  remindercount?: number | string;
  participant_info?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  firstname?: string;
  lastname?: string;
  email?: string;
}

export interface ScheduleStepLog {
  step: string;
  ok: boolean;
  detail: string;
  timestamp: string;
}

export type ScheduleAction = 'activate' | 'expire' | 'invite' | 'remind';

export interface ScheduleJob {
  id: string;
  ownerUid?: string;
  /** Rodzaj operacji; starsze wpisy bez pola to aktywacja. */
  action?: ScheduleAction;
  surveyId: number;
  surveyTitle: string;
  instanceName: string;
  rpcEndpoint: string;
  username: string;
  authPlugin: string;
  limeVersion?: LimeSurveyVersion;
  hasPassword: boolean;
  scheduledAt: string;
  activateTokens: boolean;
  startdateAt: string | null;
  expiresAt: string | null;
  minDaysBetween?: number | null;
  maxReminders?: number | null;
  repeatEveryDays?: number | null;
  repeatRemaining?: number | null;
  clearCredentialsAfterRun: boolean;
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  resultMessage: string;
  steps: ScheduleStepLog[];
  createdAt: string;
  executedAt: string | null;
}

export interface RpcTraceEntry {
  id: string;
  method: string;
  endpoint: string;
  mode: ConnectionMode;
  ok: boolean;
  durationMs: number;
  summary: string;
  timestamp: string;
}

export type AppTab = 'surveys' | 'schedule' | 'participants' | 'instances';
