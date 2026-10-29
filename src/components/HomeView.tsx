import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  LogIn,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Volume2,
} from "lucide-react";
import {
  ActiveTab,
  AuthAccount,
  DailyMission,
  Lesson,
  UILanguage,
  UserProgress,
  UserSettings,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import {
  calculateAccuracy,
  getDailyMissions,
  getLearnerLevelInfo,
} from "../utils/learningLogic";
import { speakFrench } from "../utils/speech";
import { DailyMissionsCard } from "./DailyMissionsCard";

interface HomeViewProps {
  settings: UserSettings;
  progress: UserProgress;
  recommendedLesson: Lesson;
  todayDateStr: string;
  todayMinutes: number;
  authAccount?: AuthAccount | null;
  t: UIStrings;
  onNavigate: (tab: ActiveTab) => void;
  onOpenAuthModal?: () => void;
  onOpenLesson: (lesson: Lesson) => void;
  onStartLessonExercises: (lessonId: string) => void;
  onStartFilteredExercise: (mode: "all" | "mistakes" | "correction") => void;
  onUpdateGoalMinutes?: (minutes: number) => void;
  onLogQuickStudyMinutes?: (minutes: number) => void;
}

const QUICK_GOALS = [5, 10, 15, 20, 30];

const REGISTER_STUDIO_ITEMS = [
  {
    id: "ask-help",
    topicFr: "Demander un service",
    topicEn: "Asking for a favor",
    topicAr: "طلب خدمة بلطف",
    registers: {
      familier: {
        label: "Familier (Oral spontané)",
        french: "Tu peux me donner un coup de main deux minutes ?",
        note: "Question par intonation directe + expression idiomatique « coup de main ».",
      },
      courant: {
        label: "Courant (Quotidien soigné)",
        french: "Est-ce que vous pourriez m'aider un instant, s'il vous plaît ?",
        note: "Conditionnel de politesse (« pourriez ») + structure « Est-ce que ».",
      },
      soutenu: {
        label: "Soutenu (Professionnel / Écrit)",
        french: "Auriez-vous l'amabilité de m'accorder quelques instants ?",
        note: "Inversion du sujet au conditionnel + lexique choisi (« accorder »).",
      },
    },
  },
  {
    id: "apologize-delay",
    topicFr: "S'excuser d'un retard",
    topicEn: "Apologizing for a delay",
    topicAr: "الاعتذار عن تأخير",
    registers: {
      familier: {
        label: "Familier (Entre proches)",
        french: "Désolé pour le retard, j'ai raté mon métro !",
        note: "Ellipse du « Je suis » + verbe « rater » (registre familier).",
      },
      courant: {
        label: "Courant (Standard)",
        french: "Excusez-moi d'être en retard, les transports étaient bloqués.",
        note: "S'excuser de + infinitif + concordance à l'imparfait.",
      },
      soutenu: {
        label: "Soutenu (Formel)",
        french: "Je vous prie de bien vouloir excuser ce contretemps indépendant de ma volonté.",
        note: "Formule de politesse classique (« Je vous prie de bien vouloir »).",
      },
    },
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  settings,
  progress,
  recommendedLesson,
  todayDateStr,
  todayMinutes,
  authAccount,
  t,
  onNavigate,
  onOpenAuthModal,
  onOpenLesson,
  onStartLessonExercises,
  onStartFilteredExercise,
  onUpdateGoalMinutes,
  onLogQuickStudyMinutes,
}) => {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [selectedRegister, setSelectedRegister] = useState<
    "familier" | "courant" | "soutenu"
  >("courant");

  const lang: UILanguage = settings.uiLanguage;
  const accuracy = calculateAccuracy(
    progress.totalCorrect,
    progress.totalAttempts
  );

  const safeGoal = Math.max(5, settings.dailyGoalMinutes);
  const goalPct = Math.min(100, Math.round((todayMinutes / safeGoal) * 100));
  const remainingMinutes = Math.max(0, safeGoal - todayMinutes);
  const isGoalComplete = goalPct >= 100;

  // Circular Progress Ring Geometry (132x132 viewBox)
  const center = 66;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (goalPct / 100) * circumference;

  // Compute active endpoint dot coordinates on the ring (starting from -90 deg top)
  const angleRad = ((goalPct / 100) * 360 - 90) * (Math.PI / 180);
  const dotX = center + radius * Math.cos(angleRad);
  const dotY = center + radius * Math.sin(angleRad);

  const levelInfo = getLearnerLevelInfo(progress.xp);
  const dailyMissions: DailyMission[] = getDailyMissions(
    todayDateStr,
    progress,
    settings.dailyGoalMinutes
  );
  const latestXpEvent = progress.xpHistory?.[0] || null;
  const activeScenario =
    REGISTER_STUDIO_ITEMS[selectedScenarioIdx] || REGISTER_STUDIO_ITEMS[0];
  const activeRegisterCard = activeScenario.registers[selectedRegister];

  return (
    <div className="space-y-8">
      {/* Top Hero & Daily Goal Circular Ring Strip */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Welcome & Primary Recommended Lesson */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="whitespace-nowrap font-semibold text-blue-800 dark:text-blue-400">
                  CECRL {settings.level}
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.tagline}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {authAccount ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("profile")}
                    className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[160px]">
                      {authAccount.email}
                    </span>
                  </button>
                ) : (
                  onOpenAuthModal && (
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="inline-flex items-center gap-1 font-bold text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Connexion (Google / E-mail)</span>
                    </button>
                  )
                )}
                <span aria-hidden="true">·</span>
                <a
                  href="/releases/Phrase-juste-v1.0.0.apk"
                  download="Phrase-juste-v1.0.0.apk"
                  data-testid="home-apk-download-link"
                  className="inline-flex items-center gap-1 font-semibold text-blue-800 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
                >
                  <span>APK Android 16</span>
                </a>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight">
              {t.home.welcomeBack}, {settings.learnerName}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {recommendedLesson.summary[lang]}
            </p>

            {/* Recommended Lesson Action Box */}
            <div className="pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-blue-800 dark:text-blue-300 font-medium">
                    <span>{t.home.recommendedForYou}</span>
                    <span aria-hidden="true">·</span>
                    <span className="whitespace-nowrap">
                      {recommendedLesson.level}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums whitespace-nowrap">
                      {recommendedLesson.durationMinutes} {t.lessons.minutes}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    {recommendedLesson.title[lang]}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {recommendedLesson.FrenchSubtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenLesson(recommendedLesson)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t.home.startLesson}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartLessonExercises(recommendedLesson.id)
                    }
                    className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.home.practiceNow}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Daily Goal Circular Progress Ring & Core Metrics */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 border-t lg:border-t-0 lg:border-s border-slate-200 dark:border-slate-800 pt-5 lg:pt-0 lg:ps-6">
            <div
              data-testid="daily-goal-ring-card"
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5"
            >
              <div className="flex items-center gap-4">
                {/* Circular Progress Ring SVG */}
                <div
                  data-testid="daily-goal-ring"
                  role="progressbar"
                  aria-valuenow={todayMinutes}
                  aria-valuemin={0}
                  aria-valuemax={safeGoal}
                  aria-label={`${t.home.dailyGoal}: ${todayMinutes} / ${safeGoal} min (${goalPct}%)`}
                  className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shrink-0"
                >
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 132 132"
                  >
                    {/* Subtle outer 12-segment dial ticks */}
                    {Array.from({ length: 12 }).map((_, i) => {
                      const tickAngle = (i * 30 - 90) * (Math.PI / 180);
                      const x1 = center + 58 * Math.cos(tickAngle);
                      const y1 = center + 58 * Math.sin(tickAngle);
                      const x2 = center + 61 * Math.cos(tickAngle);
                      const y2 = center + 61 * Math.sin(tickAngle);
                      const isPassed = (i / 12) * 100 <= goalPct;
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className={
                            isPassed
                              ? isGoalComplete
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-blue-700 dark:text-blue-400"
                              : "text-slate-200 dark:text-slate-700"
                          }
                        />
                      );
                    })}

                    {/* Background Ring Track */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="9"
                      className="text-slate-200/90 dark:text-slate-800"
                    />

                    {/* Foreground Animated Progress Arc */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform={`rotate(-90 ${center} ${center})`}
                      className={`transition-all duration-500 ease-out ${
                        isGoalComplete
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-blue-800 dark:text-blue-400"
                      }`}
                    />

                    {/* Active Progress Endpoint Indicator Dot */}
                    {goalPct > 0 && (
                      <circle
                        cx={dotX}
                        cy={dotY}
                        r="4.5"
                        fill="currentColor"
                        className={
                          isGoalComplete
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-blue-950 dark:text-white"
                        }
                      />
                    )}
                  </svg>

                  {/* Center Ring Readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
                    <span className="text-[11px] font-mono font-semibold text-blue-800 dark:text-blue-300 tabular-nums">
                      {goalPct}%
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tabular-nums leading-none mt-0.5">
                      {todayMinutes}
                      <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                        /{safeGoal}
                      </span>
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {t.lessons.minutes}
                    </span>
                  </div>
                </div>

                {/* Goal Details & Quick Actions */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400 shrink-0" />
                    <span>{t.home.dailyGoal}</span>
                  </div>

                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {todayMinutes} / {safeGoal}{" "}
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      {t.home.minutesToday}
                    </span>
                  </div>

                  <p
                    className={`text-xs font-medium leading-snug ${
                      isGoalComplete
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {isGoalComplete
                      ? `✓ ${t.home.goalReached}`
                      : `${remainingMinutes} ${t.home.goalRemainingMinutes}`}
                  </p>

                  {onLogQuickStudyMinutes && (
                    <button
                      type="button"
                      onClick={() => onLogQuickStudyMinutes(5)}
                      className="mt-1 inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-blue-800/10 hover:bg-blue-800/15 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-900 dark:text-blue-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>{t.home.logQuickStudy}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Daily Goal Target Selector */}
              {onUpdateGoalMinutes && (
                <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {t.home.quickGoalTarget}
                  </span>
                  <div className="flex items-center gap-1">
                    {QUICK_GOALS.map((mins) => {
                      const active = settings.dailyGoalMinutes === mins;
                      return (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onUpdateGoalMinutes(mins)}
                          aria-label={`${t.home.dailyGoal} ${mins} min`}
                          className={`px-2 py-1 min-h-[28px] rounded-md text-[11px] font-mono font-semibold tabular-nums transition-colors cursor-pointer ${
                            active
                              ? "bg-blue-800 text-white dark:bg-blue-600"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-600"
                          }`}
                        >
                          {mins}m
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3-Metric Summary Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <Flame className="w-4 h-4 shrink-0" />
                    <span className="text-lg font-bold tabular-nums">
                      {progress.streakDays}
                    </span>
                  </div>
                  <span
                    title={t.gamification.streakShieldLabel}
                    className="inline-flex items-center gap-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    {progress.streakFreezes}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.home.streakDays}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-400">
                  <Target className="w-4 h-4 shrink-0" />
                  <span className="text-lg font-bold tabular-nums">
                    {accuracy}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.home.accuracy}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="text-lg font-bold tabular-nums">
                    {progress.completedLessonIds.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.home.completedLessons}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Learner Level & XP Progress Strip */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {t.gamification.levelLabel} {levelInfo.level} —{" "}
                  {levelInfo.title[lang]}
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <span className="font-mono font-semibold text-blue-800 dark:text-blue-400 tabular-nums">
                  {progress.xp} XP
                </span>
              </div>

              <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                {levelInfo.nextLevelXp
                  ? `${levelInfo.xpForNextLevel} ${t.gamification.xpToNextLevel}`
                  : t.gamification.maxLevelReached}
              </span>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-800 dark:bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {latestXpEvent && (
            <button
              type="button"
              onClick={() => onNavigate("progress")}
              className="px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/70 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <span className="truncate max-w-[220px]">
                {t.gamification.recentXpEarned}:{" "}
                <strong className="text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{latestXpEvent.amount} XP
                </strong>{" "}
                ({latestXpEvent.label[lang]})
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Daily Missions Visual Component (3 Daily Challenges with Animated Checkboxes & Progress Bars) */}
      <DailyMissionsCard
        missions={dailyMissions}
        uiLanguage={lang}
        t={t}
        onViewAllProgress={() => onNavigate("progress")}
        onSelectMissionAction={(missionId) => {
          if (missionId.includes("lesson")) {
            onNavigate("lessons");
          } else if (missionId.includes("review")) {
            onStartFilteredExercise("correction");
          } else {
            onStartFilteredExercise("all");
          }
        }}
      />

      {/* Two-Column Content: Quick Actions & Usage Focus of the Day */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Quick Actions Grid */}
        <section className="lg:col-span-7 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.home.quickActions}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => onStartFilteredExercise("all")}
              className="text-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-h-[116px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">
                  01 · {t.categories.grammar} & {t.categories.conjugation}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.home.actionDailyMix}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.home.actionDailyMixDesc}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onStartFilteredExercise("correction")}
              className="text-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-h-[116px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">
                  02 · {t.categories.construction}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.home.actionCorrection}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.home.actionCorrectionDesc}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onStartFilteredExercise("mistakes")}
              className="text-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-h-[116px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">
                  03 · {t.categories.mistakes} (
                  <span className="tabular-nums">
                    {progress.recentMistakes.length}
                  </span>
                  )
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.home.actionMistakes}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.home.actionMistakesDesc}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("coach")}
              className="text-start p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-700 dark:hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-h-[116px]"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>04 · {t.nav.coach}</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.home.actionCoach}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.home.actionCoachDesc}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Usage Nuance of the Day ("Ne dites pas / Dites plutôt") */}
        <section className="lg:col-span-5 flex flex-col space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t.home.mistakeOfTheDay}
          </h2>
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/60">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block mb-1">
                  ✗ {t.home.dontSay}
                </span>
                <p className="text-sm font-medium text-rose-950 dark:text-rose-200 line-through">
                  « J'ai visité mon ami Paul à Paris. »
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    ✓ {t.home.sayInstead}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speakFrench(
                        "J'ai rendu visite à mon ami Paul à Paris.",
                        true,
                        settings.speechRate ?? 0.95
                      )
                    }
                    aria-label="Écouter la prononciation : J'ai rendu visite à mon ami Paul à Paris"
                    className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.lessons.listenPronunciation}</span>
                  </button>
                </div>
                <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                  « J'ai rendu visite à mon ami Paul à Paris. »
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === "ar"
                ? "القاعدة: الفعل visiter يُستخدم للأماكن والمدن والمتاحف فقط، أما مع الأشخاص فنستخدم دائماً rendre visite à."
                : lang === "en"
                ? "Rule: In French, you 'visiter' a place or museum, but you always 'rendre visite à' a person."
                : "Règle : On visite un lieu ou un monument, mais on rend toujours visite à une personne."}
            </p>
          </div>
        </section>
      </div>

      {/* Creative Interactive Studio: Atelier des Registres (Familier / Courant / Soutenu) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Atelier d'Expression · Les 3 Registres du Français</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
              Choisir le ton juste selon votre interlocuteur
            </h2>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {REGISTER_STUDIO_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedScenarioIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  selectedScenarioIdx === idx
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {lang === "ar"
                  ? item.topicAr
                  : lang === "en"
                  ? item.topicEn
                  : item.topicFr}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(["familier", "courant", "soutenu"] as const).map((regKey) => {
            const item = activeScenario.registers[regKey];
            const isSelected = selectedRegister === regKey;
            return (
              <div
                key={regKey}
                onClick={() => setSelectedRegister(regKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedRegister(regKey);
                  }
                }}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "border-blue-800 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegister(regKey);
                        speakFrench(
                          item.french,
                          true,
                          settings.speechRate ?? 0.95
                        );
                      }}
                      aria-label={`Écouter : ${item.french}`}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-800 dark:text-blue-300 inline-flex items-center gap-1 hover:border-blue-600 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Écouter</span>
                    </button>
                  </div>
                  <p
                    dir="ltr"
                    className="text-sm font-bold text-slate-900 dark:text-white leading-snug"
                  >
                    « {item.french} »
                  </p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  {item.note}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span>
            Registre sélectionné :{" "}
            <strong className="text-slate-900 dark:text-white">
              {activeRegisterCard.label}
            </strong>
          </span>
          <button
            type="button"
            onClick={() => onNavigate("coach")}
            className="font-semibold text-blue-800 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Pratiquer ce registre à l'oral avec le Coach</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

