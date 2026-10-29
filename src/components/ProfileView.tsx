import React, { useState } from "react";
import {
  Check,
  Cloud,
  Download,
  Globe,
  LogIn,
  LogOut,
  Moon,
  RotateCcw,
  Smartphone,
  Sun,
  Volume2,
} from "lucide-react";
import {
  CEFRLevel,
  UILanguage,
  UserSettings,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface ProfileViewProps {
  settings: UserSettings;
  t: UIStrings;
  authUserEmail?: string | null;
  authLoading?: boolean;
  onSignInGoogle?: () => void;
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

const GOALS = [5, 10, 15, 20, 30];

export const ProfileView: React.FC<ProfileViewProps> = ({
  settings,
  t,
  authUserEmail,
  authLoading = false,
  onSignInGoogle,
  onSignOut,
  onUpdateSettings,
  onResetProgress,
}) => {
  const [nameInput, setNameInput] = useState(settings.learnerName);
  const [savedBanner, setSavedBanner] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

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
        // Verify PK\x03\x04 ZIP/APK magic header and minimum size (> 200 KB)
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

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (!cleaned) return;
    onUpdateSettings({ learnerName: cleaned });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
          {t.profile.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t.profile.subtitle}
        </p>
      </div>

      {/* Android APK Release (v1.0.0) & Mobile App Launcher */}
      <section
        data-testid="apk-release-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {settings.uiLanguage === "ar"
                ? "إصدار تطبيق أندرويد (Phrase-juste-v1.0.0.apk)"
                : settings.uiLanguage === "en"
                ? "Android APK Release (Phrase-juste-v1.0.0.apk)"
                : "Application Android & APK (Phrase-juste-v1.0.0.apk)"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            {settings.uiLanguage === "ar"
              ? "قم بتنزيل حزمة APK الرسمية للإصدار v1.0.0 أو تثبيت التطبيق مباشرة على هاتفك."
              : settings.uiLanguage === "en"
              ? "Download the standalone v1.0.0 Android APK package or install the mobile app directly."
              : "Téléchargez le paquet APK autonome (v1.0.0) ou installez l'application mobile sur votre appareil."}
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
              {downloadingApk
                ? "..."
                : settings.uiLanguage === "ar"
                ? "تنزيل APK (v1.0.0)"
                : settings.uiLanguage === "en"
                ? "Download APK (v1.0.0)"
                : "Télécharger l'APK (v1.0.0)"}
            </span>
          </a>

          {isInstallable && !isInstalled && (
            <button
              type="button"
              onClick={install}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Smartphone className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <span>
                {settings.uiLanguage === "ar"
                  ? "تثبيت التطبيق"
                  : settings.uiLanguage === "en"
                  ? "Install App"
                  : "Installer l'app"}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Firebase Cloud Account & Google Sign-In Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.profile.cloudAccountTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            {authUserEmail
              ? `${t.profile.cloudSyncedAs} : ${authUserEmail}`
              : t.profile.cloudAccountSubtitle}
          </p>
        </div>

        <div className="shrink-0">
          {authUserEmail ? (
            <button
              type="button"
              onClick={onSignOut}
              disabled={authLoading}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.profile.signOut}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignInGoogle}
              disabled={authLoading}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.profile.signInGoogle}</span>
            </button>
          )}
        </div>
      </section>

      {/* Learner Name Form */}
      <form
        onSubmit={handleSaveName}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <label
          htmlFor="learner-name-input"
          className="block text-sm font-bold text-slate-900 dark:text-white"
        >
          {t.profile.learnerName}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="learner-name-input"
            type="text"
            required
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
          />
          <button
            type="submit"
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0"
          >
            {t.profile.saveChanges}
          </button>
        </div>
        {savedBanner && (
          <p
            role="status"
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>{t.profile.savedConfirmation}</span>
          </p>
        )}
      </form>

      {/* Interface Language (FR / EN / AR with RTL support) */}
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

      {/* CEFR Level & Daily Goal */}
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
        </section>
      </div>

      {/* Theme & Audio Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.profile.appearance}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.darkMode ? t.profile.darkMode : t.profile.lightMode}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
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
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.profile.audioPronunciation}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.audioEnabled ? t.profile.enabled : t.profile.disabled}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ audioEnabled: !settings.audioEnabled })
            }
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-blue-800 dark:text-blue-400" />
            <span>
              {settings.audioEnabled ? t.profile.enabled : t.profile.disabled}
            </span>
          </button>
        </section>
      </div>

      {/* Reset Progress */}
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
