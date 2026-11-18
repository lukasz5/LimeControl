import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '../firebase';
import {
  deleteInstanceFromFirestore,
  ensureUserProfile,
  saveInstanceToFirestore,
  subscribeUserInstances,
  updateInstanceConnectionModeInFirestore,
  updateInstanceLastConnectedInFirestore,
  updateInstanceLimeVersionInFirestore,
} from '../services/firestoreInstances';
import type { Backend, BackendUser } from './types';

/** Logowanie Google + profile instancji w Cloud Firestore. */
export const firebaseBackend: Backend = {
  mode: 'firebase',

  onAuthChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL } : null);
    });
  },

  async signIn() {
    await signInWithGoogle();
  },

  async signOut() {
    await signOutUser();
  },

  async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) return {};
    return { Authorization: `Bearer ${await user.getIdToken()}` };
  },

  async ensureUserProfile(_user: BackendUser) {
    if (auth.currentUser) await ensureUserProfile(auth.currentUser);
  },

  subscribeInstances: subscribeUserInstances,
  saveInstance: saveInstanceToFirestore,
  deleteInstance: deleteInstanceFromFirestore,

  async updateInstance(uid, instanceId, patch) {
    if (patch.connectionMode) await updateInstanceConnectionModeInFirestore(uid, instanceId, patch.connectionMode);
    if (patch.limeVersion) await updateInstanceLimeVersionInFirestore(uid, instanceId, patch.limeVersion);
    if (patch.lastConnectedAt) await updateInstanceLastConnectedInFirestore(uid, instanceId, patch.siteName);
  },
};
