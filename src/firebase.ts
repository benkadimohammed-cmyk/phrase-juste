import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { UserProgress, UserSettings } from "./types/learning";

// Suppress noisy internal WebChannel timeout console.error logs when Firestore switches to long-polling or offline cache
setLogLevel("silent");

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initFirestoreInstance(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initFirestoreInstance();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const message = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  if (
    message.toLowerCase().includes("missing or insufficient permissions") ||
    message.toLowerCase().includes("permission-denied")
  ) {
    console.error("Firestore Error: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  return errInfo;
}

export async function testFirebaseConnection(): Promise<void> {
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.warn("Firebase configuration is incomplete; operating in local mode.");
    return;
  }
  try {
    await getDoc(doc(db, "test", "connection"));
  } catch {
    // Operate seamlessly in local/offline cache mode when Firestore backend is unreachable
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutLearner(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuthChanges(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function saveLearnerCloudState(
  user: User,
  settings: UserSettings,
  progress: UserProgress
): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: (user.email || "").slice(0, 320),
        displayName: (
          user.displayName ||
          settings.learnerName ||
          "Apprenant"
        ).slice(0, 120),
        settingsJson: JSON.stringify(settings).slice(0, 10000),
        progressJson: JSON.stringify(progress).slice(0, 100000),
        xp: Math.max(0, Math.min(1000000, Math.floor(progress.xp || 0))),
        streakDays: Math.max(
          0,
          Math.min(3650, Math.floor(progress.streakDays || 0))
        ),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeLearnerCloudState(
  uid: string,
  onData: (payload: {
    settings?: UserSettings;
    progress?: UserProgress;
    updatedAt?: string;
  }) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      try {
        const parsedSettings = data.settingsJson
          ? (JSON.parse(data.settingsJson) as UserSettings)
          : undefined;
        const parsedProgress = data.progressJson
          ? (JSON.parse(data.progressJson) as UserProgress)
          : undefined;
        onData({
          settings: parsedSettings,
          progress: parsedProgress,
          updatedAt: data.updatedAt,
        });
      } catch (e) {
        console.warn("Failed to parse cloud learner state:", e);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
