import { storageGet, storageRemove, storageSet } from '../backend/storage';
import { isNativeApp } from '../platform';
import type { LimeSurveyItem } from '../types/limesurvey';

/**
 * Ostatnio pobrana lista ankiet — tylko w aplikacji mobilnej. Pozwala zobaczyć tytuły, stan
 * i daty ankiet bez sieci albo przed połączeniem (hasło jest potrzebne dopiero do zmian).
 * Zapisywana jest jedna, najnowsza lista: tytuł, SID, stan i daty. Bez odpowiedzi i uczestników.
 */
export const KEY_SURVEY_SNAPSHOT = 'limecontrol_survey_snapshot_v1';
const MAX_SURVEYS = 500;

export interface SurveySnapshot {
  profileId: string;
  profileName: string;
  savedAt: string;
  surveys: LimeSurveyItem[];
}

function pick(item: LimeSurveyItem): LimeSurveyItem {
  return {
    sid: Number(item.sid),
    surveyls_title: String(item.surveyls_title ?? '').slice(0, 300),
    startdate: item.startdate ? String(item.startdate).slice(0, 32) : null,
    expires: item.expires ? String(item.expires).slice(0, 32) : null,
    active: item.active === 'Y' ? 'Y' : 'N',
  };
}

export function parseSnapshot(raw: string | null): SurveySnapshot | null {
  try {
    const value = JSON.parse(raw || 'null') as Partial<SurveySnapshot> | null;
    if (!value || typeof value.profileId !== 'string' || !Array.isArray(value.surveys)) return null;
    return {
      profileId: value.profileId,
      profileName: String(value.profileName || ''),
      savedAt: String(value.savedAt || ''),
      surveys: value.surveys.filter((s) => s && Number.isFinite(Number(s.sid))).slice(0, MAX_SURVEYS).map(pick),
    };
  } catch {
    return null;
  }
}

export async function loadSurveySnapshot(): Promise<SurveySnapshot | null> {
  if (!isNativeApp()) return null;
  return parseSnapshot(await storageGet(KEY_SURVEY_SNAPSHOT));
}

export async function saveSurveySnapshot(profileId: string, profileName: string, surveys: LimeSurveyItem[]): Promise<SurveySnapshot | null> {
  if (!isNativeApp()) return null;
  const snapshot: SurveySnapshot = {
    profileId,
    profileName,
    savedAt: new Date().toISOString(),
    surveys: surveys.slice(0, MAX_SURVEYS).map(pick),
  };
  try {
    await storageSet(KEY_SURVEY_SNAPSHOT, JSON.stringify(snapshot));
  } catch {
    // brak miejsca — lista po prostu nie zostanie zapamiętana
  }
  return snapshot;
}

/** Usuwa zapamiętaną listę, jeśli należy do podanego profilu (np. po usunięciu profilu). */
export async function clearSurveySnapshot(profileId: string): Promise<void> {
  if (!isNativeApp()) return;
  const current = parseSnapshot(await storageGet(KEY_SURVEY_SNAPSHOT));
  if (current?.profileId === profileId) await storageRemove(KEY_SURVEY_SNAPSHOT);
}
