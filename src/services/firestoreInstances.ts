import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  ConnectionMode,
  InstanceProfile,
  LimeSurveyVersion,
} from '../types/limesurvey';

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function clampString(val: string | undefined, maxLen: number): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function sanitizeId(rawId: string, fallbackPrefix: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  if (cleaned && ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}`;
}

export async function ensureUserProfile(user: User): Promise<void> {
  const uid = sanitizeId(user.uid, 'user');
  const userPath = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  const email = clampString(user.email || `${uid}@google.local`, 180);
  const displayName = clampString(user.displayName || '', 120);
  const photoURL = clampString(user.photoURL || '', 500);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        email,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }
}

export function subscribeUserInstances(
  uid: string,
  onData: (profiles: InstanceProfile[]) => void,
  onError?: (err: Error) => void
): () => void {
  const cleanUid = sanitizeId(uid, 'user');
  const instancesPath = `users/${cleanUid}/instances`;
  const q = query(
    collection(db, 'users', cleanUid, 'instances'),
    where('ownerUid', '==', cleanUid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InstanceProfile[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const connMode: ConnectionMode =
          data.connectionMode === 'relay' ? 'relay' : 'direct';
        const limeVer: LimeSurveyVersion =
          data.limeVersion === 'v7' || data.limeVersion === 'legacy'
            ? data.limeVersion
            : 'auto';

        return {
          id: String(data.id || docSnap.id),
          ownerUid: String(data.ownerUid || cleanUid),
          name: String(data.name || ''),
          baseUrl: String(data.baseUrl || ''),
          rpcEndpoint: String(data.rpcEndpoint || ''),
          username: String(data.username || ''),
          authPlugin: String(data.authPlugin || 'Authdb'),
          connectionMode: connMode,
          limeVersion: limeVer,
          siteName:
            typeof data.siteName === 'string' && data.siteName
              ? data.siteName
              : undefined,
          lastConnectedAt:
            typeof data.lastConnectedAt === 'string' && data.lastConnectedAt
              ? data.lastConnectedAt
              : undefined,
        };
      });

      items.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
      onData(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, instancesPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function saveInstanceToFirestore(
  uid: string,
  profile: InstanceProfile
): Promise<InstanceProfile> {
  const cleanUid = sanitizeId(uid, 'user');
  const cleanId = sanitizeId(profile.id, 'inst');
  const docPath = `users/${cleanUid}/instances/${cleanId}`;
  const ref = doc(db, 'users', cleanUid, 'instances', cleanId);

  const payload: Record<string, unknown> = {
    id: cleanId,
    ownerUid: cleanUid,
    name: clampString(profile.name, 120) || 'LimeSurvey',
    baseUrl: clampString(profile.baseUrl, 500),
    rpcEndpoint: clampString(profile.rpcEndpoint, 500),
    username: clampString(profile.username, 120),
    authPlugin: clampString(profile.authPlugin || 'Authdb', 80) || 'Authdb',
    connectionMode: profile.connectionMode === 'relay' ? 'relay' : 'direct',
    limeVersion:
      profile.limeVersion === 'v7' || profile.limeVersion === 'legacy'
        ? profile.limeVersion
        : 'auto',
    updatedAt: serverTimestamp(),
  };

  if (profile.siteName) {
    payload.siteName = clampString(profile.siteName, 160);
  }
  if (profile.lastConnectedAt) {
    payload.lastConnectedAt = clampString(profile.lastConnectedAt, 64);
  }

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, docPath);
  }

  return {
    ...profile,
    id: cleanId,
    ownerUid: cleanUid,
  };
}

export async function updateInstanceConnectionModeInFirestore(
  uid: string,
  instanceId: string,
  connectionMode: ConnectionMode
): Promise<void> {
  const cleanUid = sanitizeId(uid, 'user');
  const cleanId = sanitizeId(instanceId, 'inst');
  const docPath = `users/${cleanUid}/instances/${cleanId}`;
  try {
    await updateDoc(doc(db, 'users', cleanUid, 'instances', cleanId), {
      connectionMode: connectionMode === 'relay' ? 'relay' : 'direct',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

export async function updateInstanceLimeVersionInFirestore(
  uid: string,
  instanceId: string,
  limeVersion: LimeSurveyVersion
): Promise<void> {
  const cleanUid = sanitizeId(uid, 'user');
  const cleanId = sanitizeId(instanceId, 'inst');
  const docPath = `users/${cleanUid}/instances/${cleanId}`;
  const validVersion: LimeSurveyVersion =
    limeVersion === 'v7' || limeVersion === 'legacy' ? limeVersion : 'auto';
  try {
    await updateDoc(doc(db, 'users', cleanUid, 'instances', cleanId), {
      limeVersion: validVersion,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

export async function updateInstanceLastConnectedInFirestore(
  uid: string,
  instanceId: string,
  siteName?: string
): Promise<void> {
  const cleanUid = sanitizeId(uid, 'user');
  const cleanId = sanitizeId(instanceId, 'inst');
  const docPath = `users/${cleanUid}/instances/${cleanId}`;
  try {
    const updatePayload: Record<string, unknown> = {
      lastConnectedAt: clampString(new Date().toISOString(), 64),
      updatedAt: serverTimestamp(),
    };
    if (siteName) {
      updatePayload.siteName = clampString(siteName, 160);
    }
    await updateDoc(
      doc(db, 'users', cleanUid, 'instances', cleanId),
      updatePayload
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, docPath);
  }
}

export async function deleteInstanceFromFirestore(
  uid: string,
  instanceId: string
): Promise<void> {
  const cleanUid = sanitizeId(uid, 'user');
  const cleanId = sanitizeId(instanceId, 'inst');
  const docPath = `users/${cleanUid}/instances/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid, 'instances', cleanId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, docPath);
  }
}
