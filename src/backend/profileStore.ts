import type { ConnectionMode, InstanceProfile, LimeSurveyVersion } from '../types/limesurvey';
import { isNativeApp } from '../platform';
import { storageGet, storageSet } from './storage';
import type { BackendUser, InstancePatch } from './types';

/**
 * Profile instancji LimeSurvey przechowywane na urządzeniu — wspólne dla własnej instalacji
 * (tryb local) i aplikacji mobilnej (tryb device). Zapisywane są wyłącznie dane połączenia,
 * nigdy hasło.
 */
export const KEY_INSTANCES = 'limecontrol_local_instances_v1';

/** Jedyny użytkownik trybów bez kont (klucz dostępu lub aplikacja mobilna). */
export const LOCAL_USER: BackendUser = { uid: 'local', email: null, displayName: null, photoURL: null };

const listeners = new Set<(profiles: InstanceProfile[]) => void>();
let cache: InstanceProfile[] | null = null;

export function normalizeProfile(raw: Partial<InstanceProfile>): InstanceProfile {
  const connectionMode: ConnectionMode = raw.connectionMode === 'relay' ? 'relay' : 'direct';
  const limeVersion: LimeSurveyVersion = raw.limeVersion === 'v7' || raw.limeVersion === 'legacy' ? raw.limeVersion : 'auto';
  return {
    id: String(raw.id || `inst_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
    ownerUid: LOCAL_USER.uid,
    name: String(raw.name || 'LimeSurvey').trim().slice(0, 120),
    baseUrl: String(raw.baseUrl || '').trim().slice(0, 500),
    rpcEndpoint: String(raw.rpcEndpoint || '').trim().slice(0, 500),
    username: String(raw.username || '').trim().slice(0, 120),
    authPlugin: String(raw.authPlugin || 'Authdb').trim().slice(0, 80) || 'Authdb',
    connectionMode,
    limeVersion,
    siteName: raw.siteName ? String(raw.siteName).slice(0, 160) : undefined,
    lastConnectedAt: raw.lastConnectedAt ? String(raw.lastConnectedAt).slice(0, 64) : undefined,
  };
}

export function parseProfiles(raw: string | null): InstanceProfile[] {
  try {
    const parsed: unknown = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeProfile(item as Partial<InstanceProfile>)).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  } catch {
    return [];
  }
}

async function load(): Promise<InstanceProfile[]> {
  if (!cache) cache = parseProfiles(await storageGet(KEY_INSTANCES));
  return cache;
}

async function persist(list: InstanceProfile[]): Promise<void> {
  const safe = list.map((item) => normalizeProfile(item));
  cache = parseProfiles(JSON.stringify(safe));
  await storageSet(KEY_INSTANCES, JSON.stringify(cache));
  const snapshot = cache;
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeInstances(_uid: string, onData: (profiles: InstanceProfile[]) => void): () => void {
  listeners.add(onData);
  let active = true;
  void load().then((profiles) => {
    if (active) onData(profiles);
  });
  // Przeglądarka: zmiana w innej karcie odświeża listę także tutaj.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY_INSTANCES) return;
    cache = null;
    void load().then((profiles) => {
      if (active) onData(profiles);
    });
  };
  const watchStorage = !isNativeApp() && typeof window !== 'undefined';
  if (watchStorage) window.addEventListener('storage', onStorage);
  return () => {
    active = false;
    listeners.delete(onData);
    if (watchStorage) window.removeEventListener('storage', onStorage);
  };
}

export async function saveInstance(_uid: string, profile: InstanceProfile): Promise<InstanceProfile> {
  const clean = normalizeProfile(profile);
  const list = (await load()).filter((item) => item.id !== clean.id);
  await persist([...list, clean]);
  return { ...profile, id: clean.id, ownerUid: LOCAL_USER.uid };
}

export async function deleteInstance(_uid: string, instanceId: string): Promise<void> {
  await persist((await load()).filter((item) => item.id !== instanceId));
}

export async function updateInstance(_uid: string, instanceId: string, patch: InstancePatch): Promise<void> {
  const list = (await load()).map((item) => {
    if (item.id !== instanceId) return item;
    return normalizeProfile({
      ...item,
      ...(patch.connectionMode ? { connectionMode: patch.connectionMode } : {}),
      ...(patch.limeVersion ? { limeVersion: patch.limeVersion } : {}),
      ...(patch.lastConnectedAt ? { lastConnectedAt: patch.lastConnectedAt } : {}),
      ...(patch.siteName ? { siteName: patch.siteName } : {}),
    });
  });
  await persist(list);
}

/** Tylko dla testów: czyści pamięć podręczną modułu. */
export function resetProfileStoreForTests(): void {
  cache = null;
  listeners.clear();
}
