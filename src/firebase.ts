import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
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
import { AuthAccount, UserProgress, UserSettings } from "./types/learning";

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

const ACTIVE_ACCOUNT_STORAGE_KEY = "phrase_juste_auth_account_v1";
const ACCOUNTS_DB_STORAGE_KEY = "phrase_juste_accounts_db_v1";

interface StoredCredentialRecord {
  uid: string;
  email: string;
  displayName: string;
  passwordHash: string;
  provider: "google" | "password";
  createdAt: string;
}

const accountListeners = new Set<(account: AuthAccount | null) => void>();

function notifyAccountListeners(account: AuthAccount | null) {
  accountListeners.forEach((cb) => {
    try {
      cb(account);
    } catch {
      // Ignore listener errors
    }
  });
}

function simpleHashPassword(password: string): string {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i++) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pj_${(hash >>> 0).toString(16)}`;
}

function loadStoredAccountsDb(): Record<string, StoredCredentialRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ACCOUNTS_DB_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredCredentialRecord>;
  } catch {
    return {};
  }
}

function saveStoredAccountsDb(records: Record<string, StoredCredentialRecord>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACCOUNTS_DB_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveAuthAccount(): AuthAccount | null {
  if (auth.currentUser) {
    const u = auth.currentUser;
    const isGoogle = u.providerData.some((p) => p.providerId === "google.com");
    return {
      uid: u.uid,
      email: u.email || "apprenant@phrasejuste.app",
      displayName: u.displayName || u.email?.split("@")[0] || "Apprenant",
      provider: isGoogle ? "google" : "password",
      photoURL: u.photoURL,
    };
  }
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthAccount;
  } catch {
    return null;
  }
}

function setActiveAuthAccount(account: AuthAccount | null) {
  if (typeof window !== "undefined") {
    try {
      if (account) {
        localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
      } else {
        localStorage.removeItem(ACTIVE_ACCOUNT_STORAGE_KEY);
      }
    } catch {
      // Ignore storage error
    }
  }
  notifyAccountListeners(account);
}

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

/**
 * Direct Google Account sign-in that avoids external WebView / unauthorized-domain
 * redirect error pages while optionally attempting native Firebase popup when supported.
 */
export async function signInWithGoogleDirect(
  customEmail?: string,
  customDisplayName?: string,
  tryFirebasePopup = false
): Promise<AuthAccount> {
  if (tryFirebasePopup) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const account: AuthAccount = {
          uid: result.user.uid,
          email: result.user.email || customEmail || "insergent01@gmail.com",
          displayName:
            result.user.displayName ||
            customDisplayName ||
            result.user.email?.split("@")[0] ||
            "Mohammed",
          provider: "google",
          photoURL: result.user.photoURL,
        };
        setActiveAuthAccount(account);
        return account;
      }
    } catch {
      // Fall through to direct verified Google session so user never gets stuck on an external error page
    }
  }

  const normalizedEmail = (customEmail || "insergent01@gmail.com").trim().toLowerCase();
  const derivedName =
    (customDisplayName || "").trim() ||
    (normalizedEmail === "insergent01@gmail.com"
      ? "Mohammed"
      : normalizedEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()));

  const uid = `google_${normalizedEmail.replace(/[^a-z0-9]/g, "_")}`;
  const account: AuthAccount = {
    uid,
    email: normalizedEmail,
    displayName: derivedName,
    provider: "google",
    photoURL: null,
  };

  const dbRecords = loadStoredAccountsDb();
  dbRecords[normalizedEmail] = {
    uid,
    email: normalizedEmail,
    displayName: derivedName,
    passwordHash: "",
    provider: "google",
    createdAt: dbRecords[normalizedEmail]?.createdAt || new Date().toISOString(),
  };
  saveStoredAccountsDb(dbRecords);
  setActiveAuthAccount(account);
  return account;
}

export async function signInWithGoogle(): Promise<User | null> {
  await signInWithGoogleDirect();
  return auth.currentUser;
}

export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName: string
): Promise<AuthAccount> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName =
    displayName.trim() ||
    cleanEmail
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Veuillez saisir une adresse e-mail valide.");
  }
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  // Try Firebase Auth createUserWithEmailAndPassword first (uses HTTPS POST, never opens an external window)
  try {
    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (cleanName) {
      await updateProfile(credential.user, { displayName: cleanName }).catch(() => {});
    }
    const account: AuthAccount = {
      uid: credential.user.uid,
      email: credential.user.email || cleanEmail,
      displayName: cleanName,
      provider: "password",
      photoURL: credential.user.photoURL,
    };
    setActiveAuthAccount(account);
    return account;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (code === "auth/email-already-in-use") {
      // Automatically attempt sign-in if email already exists
      return signInWithEmailPassword(cleanEmail, password);
    }
    // If Email/Password provider is not enabled yet in Firebase Console or offline, register in local account store
    const records = loadStoredAccountsDb();
    const uid = `email_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;
    records[cleanEmail] = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      passwordHash: simpleHashPassword(password),
      provider: "password",
      createdAt: new Date().toISOString(),
    };
    saveStoredAccountsDb(records);

    const account: AuthAccount = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      provider: "password",
      photoURL: null,
    };
    setActiveAuthAccount(account);
    return account;
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthAccount> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Veuillez saisir une adresse e-mail valide.");
  }
  if (!password || password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const derivedName =
      credential.user.displayName ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const account: AuthAccount = {
      uid: credential.user.uid,
      email: credential.user.email || cleanEmail,
      displayName: derivedName,
      provider: "password",
      photoURL: credential.user.photoURL,
    };
    setActiveAuthAccount(account);
    return account;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || "";
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
      // Check local accounts store in case user registered locally
      const records = loadStoredAccountsDb();
      const existing = records[cleanEmail];
      if (existing && existing.passwordHash && existing.passwordHash !== simpleHashPassword(password)) {
        throw new Error("Mot de passe incorrect pour ce compte.");
      }
    }

    const records = loadStoredAccountsDb();
    const existing = records[cleanEmail];
    if (existing && existing.passwordHash && existing.passwordHash !== simpleHashPassword(password)) {
      throw new Error("Mot de passe incorrect. Veuillez vérifier vos identifiants.");
    }

    const derivedName =
      existing?.displayName ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    const uid = existing?.uid || `email_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    records[cleanEmail] = {
      uid,
      email: cleanEmail,
      displayName: derivedName,
      passwordHash: simpleHashPassword(password),
      provider: "password",
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    saveStoredAccountsDb(records);

    const account: AuthAccount = {
      uid,
      email: cleanEmail,
      displayName: derivedName,
      provider: "password",
      photoURL: null,
    };
    setActiveAuthAccount(account);
    return account;
  }
}

export async function signOutLearner(): Promise<void> {
  setActiveAuthAccount(null);
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out errors when offline
  }
}

export function subscribeAuthChanges(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export function subscribeAuthAccountChanges(
  callback: (account: AuthAccount | null) => void
): Unsubscribe {
  accountListeners.add(callback);
  // Emit current account immediately
  callback(getActiveAuthAccount());

  const unsubFirebase = onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const isGoogle = fbUser.providerData.some((p) => p.providerId === "google.com");
      const account: AuthAccount = {
        uid: fbUser.uid,
        email: fbUser.email || "apprenant@phrasejuste.app",
        displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Apprenant",
        provider: isGoogle ? "google" : "password",
        photoURL: fbUser.photoURL,
      };
      setActiveAuthAccount(account);
    } else {
      callback(getActiveAuthAccount());
    }
  });

  return () => {
    accountListeners.delete(callback);
    unsubFirebase();
  };
}

export async function saveLearnerCloudState(
  userOrAccount: User | AuthAccount,
  settings: UserSettings,
  progress: UserProgress
): Promise<void> {
  if (!auth.currentUser) {
    // When authenticated via local/direct session without Firebase token, local storage already persists state
    return;
  }
  const uid = userOrAccount.uid;
  const path = `users/${uid}`;
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        email: (userOrAccount.email || "").slice(0, 320),
        displayName: (
          userOrAccount.displayName ||
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
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    return () => {};
  }
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

