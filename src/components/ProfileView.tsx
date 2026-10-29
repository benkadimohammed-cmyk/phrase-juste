import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  Cloud,
  Download,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Moon,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Target,
  User as UserIcon,
  Volume2,
} from "lucide-react";
import {
  AuthAccount,
  CEFRLevel,
  LearningObjective,
  UILanguage,
  UserProgress,
  UserSettings,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import { usePWAInstall } from "../hooks/usePWAInstall";
import {
  calculateAccuracy,
  getAchievementsList,
  getLearnerLevelInfo,
} from "../utils/learningLogic";
import {
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogleDirect,
} from "../firebase";
import { speakFrench } from "../utils/speech";

interface ProfileViewProps {
  settings: UserSettings;
  progress?: UserProgress;
  totalLessonsCount?: number;
  t: UIStrings;
  authAccount?: AuthAccount | null;
  authUserEmail?: string | null;
  authLoading?: boolean;
  onSignInGoogle?: () => void;
  onOpenAuthModal?: () => void;
  onAuthenticated?: (account: AuthAccount) => void;
  onSignOut?: () => void;
  onUpdateSettings: (updated: Partial<UserSettings>) => void;
  onResetProgress: () => void;
}

const LANGUAGES: Array<{ id: UILanguage; label: string; native: string }> = [
  { id: "fr", label: "Français", native: "Français (LTR)" },
  { id: "en", label: "English", native: "English (LTR)" },
  { id: "ar", label: "العربية", native: "العربية (RTL)" },
];

const LEVELS: Array<{ id: CEFRLevel; desc: string }> = [
  { id: "A1", desc: "Débutant / Discovery" },
  { id: "A2", desc: "Élémentaire / Waystage" },
  { id: "B1", desc: "Intermédiaire / Threshold" },
  { id: "B2", desc: "Avancé / Vantage" },
];

const OBJECTIVES: Array<{
  id: LearningObjective;
  labelFr: string;
  labelEn: string;
  labelAr: string;
  descFr: string;
}> = [
  {
    id: "conversation",
    labelFr: "Conversation fluide & Quotidien",
    labelEn: "Everyday Fluent Conversation",
    labelAr: "محادثة يومية بطلاقة",
    descFr: "Parler spontanément sans chercher ses mots.",
  },
  {
    id: "exam",
    labelFr: "Préparation DELF / DALF / TCF",
    labelEn: "DELF / DALF / TCF Exam Prep",
    labelAr: "التحضير لامتحانات DELF / DALF",
    descFr: "Maîtriser la grammaire normative et l'argumentation.",
  },
  {
    id: "career",
    labelFr: "Français professionnel & Affaires",
    labelEn: "Professional & Business French",
    labelAr: "الفرنسية المهنية والأعمال",
    descFr: "Rédiger des e-mails soignés et réussir ses entretiens.",
  },
  {
    id: "travel",
    labelFr: "Voyage, Culture & Littérature",
    labelEn: "Travel, Culture & Literature",
    labelAr: "السفر والثقافة والأدب",
    descFr: "Séjourner en France et apprécier les nuances culturelles.",
  },
];

const GOALS = [5, 10, 15, 20, 30];

export const ProfileView: React.FC<ProfileViewProps> = ({
  settings,
  progress,
  totalLessonsCount = 12,
  t,
  authAccount,
  authUserEmail,
  authLoading = false,
  onOpenAuthModal,
  onAuthenticated,
  onSignOut,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [nameInput, setNameInput] = useState(settings.learnerName);
  const [bioInput, setBioInput] = useState(
    settings.learnerBio ||
      "Passionné par la précision de la langue française et la richesse de ses expressions."
  );
  const [savedBanner, setSavedBanner] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);

  // Inline Email/Password & Direct Google Auth state inside Profile
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState(
    authAccount?.email || authUserEmail || "insergent01@gmail.com"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [localAuthBusy, setLocalAuthBusy] = useState(false);

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const effectiveEmail = authAccount?.email || authUserEmail || null;
  const effectiveProvider = authAccount?.provider || "google";

  const xp = progress?.xp ?? 185;
  const streakDays = progress?.streakDays ?? 4;
  const longestStreak = progress?.bestStreakDays ?? 7;
  const completedLessonsCount = progress?.completedLessonIds?.length ?? 1;
  const totalCorrect = progress?.totalCorrect ?? 5;
  const totalAttempts = progress?.totalAttempts ?? 6;
  const accuracy = calculateAccuracy(totalCorrect, totalAttempts);
  const rankInfo = getLearnerLevelInfo(xp);
  const achievementsList = progress
    ? getAchievementsList(progress, totalLessonsCount)
    : [];
  const unlockedBadgesCount = achievementsList.filter((a) => a.unlocked).length;
  const totalBadgesCount = achievementsList.length || 8;

  const initials = (settings.learnerName || "M")
    .trim()
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "PJ";

  const GITHUB_RELEASE_APK_URL =
    "https://github.com/benkadimohammed-cmyk/phrase-juste/releases/download/v1.0.0/Phrase-juste-v1.0.0.apk";

  const handleDownloadApk = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (downloadingApk) return;
    setDownloadingApk(true);
    try {
      const response = await fetch("/releases/Phrase-juste-v1.0.0.apk", {
        cache: "no-store",
      });
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (
          bytes.length > 200000 &&
          bytes[0] === 0x50 &&
          bytes[1] === 0x4b &&
          bytes[2] === 0x03 &&
          bytes[3] === 0x04
        ) {
          const blob = new Blob([buffer], {
            type: "application/vnd.android.package-archive",
          });
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "Phrase-juste-v1.0.0.apk";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          setDownloadingApk(false);
          return;
        }
      }
    } catch {
      // Fall back to direct GitHub Release asset URL
    }
    setDownloadingApk(false);
    window.location.assign(GITHUB_RELEASE_APK_URL);
  };

  const handleSaveIdentityDossier = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    onUpdateSettings({
      learnerName: cleaned,
      learnerBio: bioInput.trim(),
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleDirectGoogleLogin = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);
    setLocalAuthBusy(true);
    try {
      const account = await signInWithGoogleDirect(
        emailInput.includes("@") ? emailInput : "insergent01@gmail.com",
        nameInput.trim() || "Mohammed",
        false
      );
      setNameInput(account.displayName);
      onUpdateSettings({ learnerName: account.displayName });
      onAuthenticated?.(account);
      setAuthSuccessMsg(
        `Connecté avec Google (${account.email})`
      );
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Erreur de connexion Google."
      );
    } finally {
      setLocalAuthBusy(false);
    }
  };

  const handleInlineEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    setLocalAuthBusy(true);
    try {
      const account =
        authTab === "signup"
          ? await registerWithEmailPassword(
              emailInput,
              passwordInput,
              nameInput.trim() || "Mohammed"
            )
          : await signInWithEmailPassword(emailInput, passwordInput);
      setNameInput(account.displayName);
      onUpdateSettings({ learnerName: account.displayName });
      onAuthenticated?.(account);
      setPasswordInput("");
      setAuthSuccessMsg(
        authTab === "signup"
          ? `Compte créé et connecté (${account.email})`
          : `Connecté (${account.email})`
      );
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : "Impossible de vérifier vos identifiants."
      );
    } finally {
      setLocalAuthBusy(false);
    }
  };

  const currentSpeechRate = settings.speechRate ?? 0.95;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Learner Passport Hero Card ("Passeport d'Apprenant") */}
      <section className="rounded-3xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 border-2 border-amber-400/80 flex items-center justify-center text-xl sm:text-2xl font-bold tracking-tight text-white shadow-md shrink-0">
              {initials}
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[11px] font-mono font-extrabold">
                {settings.level}
              </span>
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                Passeport d'Apprenant · Phrase juste
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white truncate">
                {settings.learnerName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                <span className="font-mono">
                  {effectiveEmail || "Mode local · Non connecté"}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-300 font-semibold">
                  Rang {rankInfo.level} : {rankInfo.title[settings.uiLanguage]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            {effectiveEmail ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {effectiveProvider === "google" ? "Google" : "E-mail"} vérifié
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.profile.signOut}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal || handleDirectGoogleLogin}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Se connecter / Créer un compte</span>
              </button>
            )}
          </div>
        </div>

        {/* Bio quote */}
        <p className="text-xs sm:text-sm text-slate-300 italic border-l-2 border-amber-400/70 pl-3.5 leading-relaxed">
          « {bioInput} »
        </p>

        {/* Complete Learner Statistics Bar inside Profile */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/90">
          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Total XP</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {xp} XP
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Suivant : {rankInfo.nextLevelXp ?? xp} XP
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Série active</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {streakDays} j
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Record : {longestStreak} jours
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Précision</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {accuracy}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalCorrect}/{totalAttempts} réussis
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Leçons</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {completedLessonsCount}/{totalLessonsCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Niveau CECRL {settings.level}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Distinctions</span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {unlockedBadgesCount}/{totalBadgesCount}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hall of Fame
            </p>
          </div>
        </div>
      </section>

      {/* 2. Authentication & Cloud Account Card (Google Direct + Email/Password Login) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {settings.uiLanguage === "ar"
                  ? "تسجيل الدخول بحساب Google أو البريد وكلمة المرور"
                  : settings.uiLanguage === "en"
                  ? "Google Account & Email/Password Sign-In"
                  : "Connexion Google directe & E-mail / Mot de passe"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {effectiveEmail
                ? `Connecté en tant que ${effectiveEmail} (${
                    effectiveProvider === "google"
                      ? "Compte Google"
                      : "E-mail & Mot de passe"
                  })`
                : "Connectez-vous directement en un clic avec Google ou avec votre adresse e-mail et mot de passe, sans redirection d'erreur."}
            </p>
          </div>

          {effectiveEmail && (
            <div className="flex items-center gap-2 shrink-0">
              {onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Changer de compte
                </button>
              )}
              <button
                type="button"
                onClick={onSignOut}
                disabled={authLoading || localAuthBusy}
                className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.profile.signOut}</span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Google + Email/Password Sign-In Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Option A: Direct Google Sign-In */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Option 1 · Compte Google Direct
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Connexion directe avec votre compte Google sans ouvrir de fenêtre externe bloquée sur mobile Android.
            </p>
            <button
              type="button"
              onClick={handleDirectGoogleLogin}
              disabled={localAuthBusy || authLoading}
              className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 text-slate-900 dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>Continuer avec Google (insergent01@gmail.com)</span>
            </button>
          </div>

          {/* Option B: Email & Password Login / Registration */}
          <form
            onSubmit={handleInlineEmailAuth}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Option 2 · E-mail & Mot de passe
              </span>
              <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-900 p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setAuthTab("signin")}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    authTab === "signin"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("signup")}
                  className={`px-2.5 py-1 rounded-md cursor-pointer ${
                    authTab === "signup"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      : "text-slate-500"
                  }`}
                >
                  Inscription
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="insergent01@gmail.com"
                  aria-label="Adresse e-mail"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Mot de passe (6 caractères min.)"
                  aria-label="Mot de passe"
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={localAuthBusy || authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {authTab === "signup"
                  ? "Créer mon compte E-mail"
                  : "Se connecter par E-mail"}
              </button>
            </div>
          </form>
        </div>

        {authError && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            {authError}
          </p>
        )}
        {authSuccessMsg && (
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>{authSuccessMsg}</span>
          </p>
        )}
      </section>

      {/* 3. Learner Dossier: Name, Bio & Learning Objective */}
      <form
        onSubmit={handleSaveIdentityDossier}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-800 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Informations personnelles & Objectif d'apprentissage
            </h2>
          </div>
          {savedBanner && (
            <span
              role="status"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>{t.profile.savedConfirmation}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="learner-name-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              {t.profile.learnerName}
            </label>
            <input
              id="learner-name-input"
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label
              htmlFor="learner-bio-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
            >
              Devise ou objectif personnel
            </label>
            <input
              id="learner-bio-input"
              type="text"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Maîtriser le français oral et écrit..."
              className="w-full px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            />
          </div>
        </div>

        {/* Learning Objective Selector */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Priorité pédagogique
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {OBJECTIVES.map((obj) => {
              const active =
                (settings.learningObjective || "conversation") === obj.id;
              const title =
                settings.uiLanguage === "ar"
                  ? obj.labelAr
                  : settings.uiLanguage === "en"
                  ? obj.labelEn
                  : obj.labelFr;
              return (
                <button
                  key={obj.id}
                  type="button"
                  onClick={() =>
                    onUpdateSettings({ learningObjective: obj.id })
                  }
                  className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    active
                      ? "border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-400 text-blue-950 dark:text-white"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <span className="text-xs sm:text-sm font-bold block">
                      {title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {obj.descFr}
                    </span>
                  </div>
                  {active && (
                    <Check className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            {t.profile.saveChanges}
          </button>
        </div>
      </form>

      {/* 4. French Voice & Pronunciation Speed Studio */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Studio de Prononciation & Voix Française
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ajustez la cadence de diction et testez la synthèse vocale française sur votre appareil.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              speakFrench(
                `Bonjour ${settings.learnerName} ! Bienvenue dans Phrase juste, votre voix française fonctionne parfaitement.`,
                true,
                currentSpeechRate
              )
            }
            className="px-4 py-2.5 min-h-[42px] rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Volume2 className="w-4 h-4" />
            <span>Tester la voix française</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ audioEnabled: !settings.audioEnabled })
            }
            className={`p-3.5 rounded-xl border text-start cursor-pointer flex items-center justify-between ${
              settings.audioEnabled
                ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-slate-900 dark:text-white"
                : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">
                {t.profile.audioPronunciation}
              </span>
              <span className="text-[11px] text-slate-500">
                {settings.audioEnabled ? t.profile.enabled : t.profile.disabled}
              </span>
            </div>
            <Check
              className={`w-4 h-4 ${
                settings.audioEnabled ? "text-emerald-600" : "opacity-20"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ speechRate: 0.82 })}
            className={`p-3.5 rounded-xl border text-start cursor-pointer flex items-center justify-between ${
              currentSpeechRate < 0.9
                ? "border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-white"
                : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">
                Cadence articulée (0.85x)
              </span>
              <span className="text-[11px] text-slate-500">
                Idéal pour distinguer les liaisons
              </span>
            </div>
            {currentSpeechRate < 0.9 && (
              <Check className="w-4 h-4 text-blue-800 dark:text-blue-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ speechRate: 1.0 })}
            className={`p-3.5 rounded-xl border text-start cursor-pointer flex items-center justify-between ${
              currentSpeechRate >= 0.9
                ? "border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-white"
                : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div>
              <span className="text-xs font-bold block">
                Cadence naturelle (1.0x)
              </span>
              <span className="text-[11px] text-slate-500">
                Rythme de conversation à Paris
              </span>
            </div>
            {currentSpeechRate >= 0.9 && (
              <Check className="w-4 h-4 text-blue-800 dark:text-blue-400" />
            )}
          </button>
        </div>
      </section>

      {/* 5. Interface Language (FR / EN / AR with RTL support) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.profile.interfaceLanguage}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LANGUAGES.map((lang) => {
            const active = settings.uiLanguage === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => onUpdateSettings({ uiLanguage: lang.id })}
                className={`p-4 min-h-[52px] rounded-xl border text-start transition-colors cursor-pointer flex items-center justify-between ${
                  active
                    ? "border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-400 text-blue-950 dark:text-white font-semibold"
                    : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <div>
                  <span className="text-sm block">{lang.label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {lang.native}
                  </span>
                </div>
                {active && (
                  <Check className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. CEFR Level & Daily Goal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.profile.learningLevel}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {LEVELS.map((lvl) => {
              const active = settings.level === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => onUpdateSettings({ level: lvl.id })}
                  className={`p-3 min-h-[48px] rounded-xl border text-start transition-colors cursor-pointer ${
                    active
                      ? "border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 dark:border-blue-400 text-blue-950 dark:text-white font-semibold"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className="text-sm font-bold block">{lvl.id}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lvl.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.profile.dailyGoal}
          </h2>
          <div className="flex flex-wrap gap-2">
            {GOALS.map((mins) => {
              const active = settings.dailyGoalMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => onUpdateSettings({ dailyGoalMinutes: mins })}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl border text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    active
                      ? "border-blue-800 bg-blue-800 text-white dark:bg-blue-600"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {mins} {t.profile.minutesPerDay}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t.profile.appearance}
            </span>
            <button
              type="button"
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
            >
              {settings.darkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>{t.profile.lightMode}</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-900" />
                  <span>{t.profile.darkMode}</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* 7. Android 16 (One UI 8.5 · API 36) APK Release Card */}
      <section
        data-testid="apk-release-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Android 16 (One UI 8.5 · API 36) — Phrase-juste-v1.0.0.apk
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Paquet Android signé v2/v3 optimisé pour Samsung Galaxy M35 5G (Android 16 / One UI 8.5, alignement 4 octets sans descripteurs ZIP).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={GITHUB_RELEASE_APK_URL}
            onClick={handleDownloadApk}
            download="Phrase-juste-v1.0.0.apk"
            data-testid="download-apk-btn"
            className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {downloadingApk ? "..." : "Télécharger l'APK (Android 16)"}
            </span>
          </a>

          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <span>Installer l'app</span>
            </button>
          )}
        </div>
      </section>

      {/* 8. Reset Progress */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-rose-800 dark:text-rose-400">
            {t.profile.resetProgress}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.profile.resetConfirmPrompt}
          </p>
        </div>

        {!confirmingReset ? (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.profile.resetProgress}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmingReset(false);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer"
            >
              {t.profile.confirmReset}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="px-3 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {t.profile.cancel}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
