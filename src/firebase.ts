import { initializeApp } from "firebase/app";
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
  doc,
  setDoc,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { UserProgress, UserSettings } from "./types/learning";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirebaseConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, "_connection_test_", "ping"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    }
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
        email: user.email || "",
        displayName: user.displayName || settings.learnerName || "Apprenant",
        settingsJson: JSON.stringify(settings),
        progressJson: JSON.stringify(progress),
        xp: Math.max(0, Math.floor(progress.xp || 0)),
        streakDays: Math.max(0, Math.floor(progress.streakDays || 0)),
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
        console.error("Failed to parse cloud learner state:", e);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
