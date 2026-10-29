import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Flame,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  AchievementDefinition,
  DailyMission,
  Exercise,
  Lesson,
  LessonCategory,
  UILanguage,
  UserProgress,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import {
  calculateAccuracy,
  getAchievementsList,
  getDailyMissions,
  getLearnerLevelInfo,
  LEARNER_LEVEL_TIERS,
} from "../utils/learningLogic";

interface ProgressViewProps {
  progress: UserProgress;
  lessons: Lesson[];
  exercises: Exercise[];
  todayDateStr: string;
  dailyGoalMinutes: number;
  uiLanguage: UILanguage;
  t: UIStrings;
  onPracticeMistakes: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  lessons,
  exercises,
  todayDateStr,
  dailyGoalMinutes,
  uiLanguage,
  t,
  onPracticeMistakes,
}) => {
  const [hallFilter, setHallFilter] = useState<"all" | "earned" | "locked">(
    "all"
  );

  const accuracy = calculateAccuracy(
    progress.totalCorrect,
    progress.totalAttempts
  );
  const levelInfo = getLearnerLevelInfo(progress.xp);
  const dailyMissions: DailyMission[] = getDailyMissions(
    todayDateStr,
    progress,
    dailyGoalMinutes
  );
  const achievements: AchievementDefinition[] = getAchievementsList(
    progress,
    lessons.length
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const lockedCount = achievements.length - unlockedCount;
  const hallCompletionPct = Math.round(
    (unlockedCount / Math.max(1, achievements.length)) * 100
  );

  const filteredAchievements = achievements.filter((ach) => {
    if (hallFilter === "earned") return ach.unlocked;
    if (hallFilter === "locked") return !ach.unlocked;
    return true;
  });

  // Build 28-day local calendar grid ending on todayDateStr
  const [y, m, d] = todayDateStr.split("-").map(Number);
  const calendarDays: Array<{
    dateStr: string;
    dayNumber: number;
    shortMonthDay: string;
    isActive: boolean;
    isShielded: boolean;
    isToday: boolean;
    minutes: number;
  }> = [];

  for (let offset = 27; offset >= 0; offset--) {
    const dt = new Date(y, m - 1, d - offset);
    const yr = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const dy = String(dt.getDate()).padStart(2, "0");
    const ds = `${yr}-${mo}-${dy}`;
    const hist = progress.dailyHistory[ds];
    const isActive = Boolean(
      hist &&
        (hist.minutesCompleted > 0 ||
          hist.exercisesCompleted > 0 ||
          (hist.lessonsCompletedCount || 0) > 0)
    );
    const isShielded = (progress.streakFreezeUsedDates || []).includes(ds);

    calendarDays.push({
      dateStr: ds,
      dayNumber: dt.getDate(),
      shortMonthDay: `${mo}-${dy}`,
      isActive,
      isShielded,
      isToday: offset === 0,
      minutes: hist?.minutesCompleted || 0,
    });
  }

  // Last 7 days for bar chart
  const last7Days = calendarDays.slice(-7);
  const maxMinutes = Math.max(20, ...last7Days.map((day) => day.minutes));

  const categories: LessonCategory[] = [
    "grammar",
    "vocabulary",
    "conjugation",
    "construction",
    "mistakes",
  ];

  const renderAchievementIcon = (
    iconName: AchievementDefinition["iconName"],
    unlocked: boolean
  ) => {
    const cls = `w-5 h-5 ${
      unlocked
        ? "text-blue-800 dark:text-blue-300"
        : "text-slate-400 dark:text-slate-500"
    }`;
    switch (iconName) {
      case "book":
        return <BookOpen className={cls} />;
      case "sparkles":
        return <Sparkles className={cls} />;
      case "flame":
        return <Flame className={cls} />;
      case "target":
        return <Target className={cls} />;
      case "rotate":
        return <RotateCcw className={cls} />;
      case "trending":
        return <TrendingUp className={cls} />;
      case "check":
        return <CheckCircle2 className={cls} />;
      default:
        return <Award className={cls} />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
          {t.progress.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t.progress.subtitle}
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.progress.totalXp}</span>
            <TrendingUp className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
            {progress.xp} XP
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-400 font-medium">
            {t.gamification.levelLabel} {levelInfo.level} ·{" "}
            {levelInfo.title[uiLanguage]}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.gamification.currentStreakLabel}</span>
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
            {progress.streakDays}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {t.gamification.longestStreakLabel}: {progress.bestStreakDays}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.home.accuracy}</span>
            <Target className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
            {accuracy}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {progress.totalCorrect} / {progress.totalAttempts}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{t.progress.exercisesSolved}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
            {progress.completedExerciseIds.length} / {exercises.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {progress.completedLessonIds.length} / {lessons.length}{" "}
            {t.nav.lessons}
          </p>
        </div>
      </div>

      {/* Dedicated Hall of Fame Section (All Achievements, Unlock Conditions & Earned Indicators) */}
      <section
        data-testid="hall-of-fame-section"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-800 dark:text-blue-400 shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
                {t.progress.hallOfFameTitle}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.progress.hallOfFameSubtitle}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Overall Hall of Fame Completion Summary */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 flex items-center gap-3 shrink-0">
              <div className="text-xs whitespace-nowrap">
                <span className="text-slate-500 dark:text-slate-400 block">
                  {t.gamification.unlockedLabel}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {unlockedCount} / {achievements.length} ({hallCompletionPct}%)
                </span>
              </div>
              <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${hallCompletionPct}%` }}
                />
              </div>
            </div>

            {/* Filter Tabs: All | Earned | Locked */}
            <div
              role="group"
              aria-label="Hall of Fame Filter"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto shrink-0"
            >
              <button
                type="button"
                onClick={() => setHallFilter("all")}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
                  hallFilter === "all"
                    ? "bg-white dark:bg-slate-900 text-blue-900 dark:text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.progress.filterAllAchievements} ({achievements.length})
              </button>
              <button
                type="button"
                onClick={() => setHallFilter("earned")}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
                  hallFilter === "earned"
                    ? "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.progress.filterEarnedAchievements} ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setHallFilter("locked")}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-medium transition-colors cursor-pointer tabular-nums whitespace-nowrap shrink-0 ${
                  hallFilter === "locked"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.progress.filterLockedAchievements} ({lockedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Hall of Fame Grid */}
        <div
          data-testid="hall-of-fame-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {filteredAchievements.map((ach) => {
            const pct = Math.min(
              100,
              Math.round(
                (ach.currentValue / Math.max(1, ach.targetValue)) * 100
              )
            );
            const earnedDateShort = ach.unlockedAt
              ? ach.unlockedAt.slice(0, 10)
              : null;

            return (
              <article
                key={ach.id}
                data-testid={`achievement-card-${ach.id}`}
                data-earned={ach.unlocked ? "true" : "false"}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-colors ${
                  ach.unlocked
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/25"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Row: Medallion Icon & Visual Earned/Locked Indicator */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                        ach.unlocked
                          ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-700 shadow-2xs"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {renderAchievementIcon(ach.iconName, ach.unlocked)}
                    </div>

                    <div className="text-end">
                      {ach.unlocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.gamification.unlockedLabel}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.gamification.lockedLabel}</span>
                        </span>
                      )}
                      <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums mt-0.5">
                        {ach.unlocked && earnedDateShort
                          ? `${t.progress.earnedOnLabel} ${earnedDateShort}`
                          : t.progress.notEarnedYetLabel}
                      </span>
                    </div>
                  </div>

                  {/* Achievement Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                      {ach.title[uiLanguage]}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {ach.description[uiLanguage]}
                    </p>
                  </div>
                </div>

                {/* Unlock Condition & Progress Box */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
                      {t.progress.unlockConditionLabel}
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums whitespace-nowrap shrink-0 ${
                        ach.unlocked
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-blue-800 dark:text-blue-400"
                      }`}
                    >
                      {ach.currentValue} / {ach.targetValue} ({pct}%)
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {ach.conditionLabel[uiLanguage]}
                  </p>

                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        ach.unlocked
                          ? "bg-emerald-600 dark:bg-emerald-400"
                          : "bg-blue-800 dark:bg-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Learner Level Progression & Rank Thresholds */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.gamification.levelTiersTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.gamification.levelLabel} {levelInfo.level} (
              {levelInfo.title[uiLanguage]}) —{" "}
              {levelInfo.nextLevelXp
                ? `${levelInfo.xpForNextLevel} ${t.gamification.xpToNextLevel}`
                : t.gamification.maxLevelReached}
            </p>
          </div>
          <span className="text-sm font-mono font-bold text-blue-800 dark:text-blue-400 tabular-nums">
            {progress.xp} XP ({levelInfo.progressPercent}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-800 dark:bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>

        {/* 7 Level Tiers Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {LEARNER_LEVEL_TIERS.map((tier) => {
            const reached = progress.xp >= tier.minXp;
            const isCurrent = levelInfo.level === tier.level;
            return (
              <div
                key={tier.level}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isCurrent
                    ? "border-blue-800 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/40"
                    : reached
                    ? "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                    : "border-slate-200/70 dark:border-slate-800/70 opacity-55"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>Niv. {tier.level}</span>
                  <span>{tier.minXp} XP</span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white truncate">
                  {tier.title[uiLanguage]}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column Streak Calendar & Daily Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 28-Day Streak Calendar & Rules */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-800 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.gamification.streakCalendarTitle}
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800 dark:text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-800 dark:bg-blue-500 inline-block" />
                {t.gamification.activeDayLegend}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                {t.gamification.shieldDayLegend}
              </span>
            </div>
          </div>

          {/* 28-Day Grid (4 weeks x 7 days) */}
          <div className="grid grid-cols-7 gap-2 pt-1">
            {calendarDays.map((cell) => (
              <div
                key={cell.dateStr}
                title={`${cell.dateStr}: ${cell.minutes} min`}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center text-xs font-mono tabular-nums transition-colors ${
                  cell.isActive
                    ? "bg-blue-800 dark:bg-blue-600 border-blue-800 dark:border-blue-500 text-white font-bold"
                    : cell.isShielded
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200 font-semibold"
                    : cell.isToday
                    ? "border-blue-700 dark:border-blue-400 text-slate-900 dark:text-white font-semibold"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                <span>{cell.dayNumber}</span>
              </div>
            ))}
          </div>

          {/* Clear Explanation of Streak & Shield Rules */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              {t.gamification.streakRuleExplanation}
            </p>
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                  <span>
                    {t.gamification.streakShieldLabel}: {progress.streakFreezes}{" "}
                    / 2
                  </span>
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  {t.gamification.streakShieldExplanation}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Missions Status */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.gamification.dailyMissionsTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.gamification.dailyMissionsSubtitle}
            </p>
          </div>

          <div className="space-y-3">
            {dailyMissions.map((mission) => {
              const pct = Math.min(
                100,
                Math.round(
                  (mission.current / Math.max(1, mission.target)) * 100
                )
              );
              return (
                <div
                  key={mission.id}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    mission.completed
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60"
                      : "bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {mission.title[uiLanguage]}
                    </span>
                    <span className="font-mono font-semibold text-blue-800 dark:text-blue-400 tabular-nums">
                      +{mission.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mission.description[uiLanguage]}
                  </p>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                    <span>
                      {mission.current} / {mission.target}
                    </span>
                    <span>
                      {mission.completed
                        ? `✓ ${t.gamification.missionCompleted}`
                        : `${pct}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        mission.completed
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-blue-800 dark:bg-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Two-Column Activity Bar Chart & Category Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.progress.weeklyActivity}
          </h2>
          <div className="h-44 flex items-end justify-between gap-3 pt-4">
            {last7Days.map((day) => {
              const heightPct = Math.max(
                8,
                Math.round((day.minutes / maxMinutes) * 100)
              );
              return (
                <div
                  key={day.dateStr}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {day.minutes}m
                  </span>
                  <div className="w-full max-w-[36px] bg-slate-100 dark:bg-slate-800 rounded-t-lg h-28 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        day.minutes > 0
                          ? "bg-blue-800 dark:bg-blue-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {day.shortMonthDay}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.progress.categoryMastery}
          </h2>
          <div className="space-y-3.5">
            {categories.map((cat) => {
              const catExercises = exercises.filter((e) => e.category === cat);
              const solvedCount = catExercises.filter((e) =>
                progress.completedExerciseIds.includes(e.id)
              ).length;
              const pct =
                catExercises.length > 0
                  ? Math.round((solvedCount / catExercises.length) * 100)
                  : 0;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-800 dark:text-slate-200">
                      {t.categories[cat]}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {solvedCount} / {catExercises.length} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-800 dark:bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Two-Column XP History Ledger & Mistake Clinic */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t.gamification.xpHistoryTitle}
          </h2>
          {!progress.xpHistory || progress.xpHistory.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
              {t.gamification.xpHistoryEmpty}
            </p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {progress.xpHistory.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {ev.label[uiLanguage]}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      {ev.dateStr}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                    +{ev.amount} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.progress.recentMistakesTitle}
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {progress.recentMistakes.length}
              </span>
            </div>

            {progress.recentMistakes.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6">
                {t.progress.noMistakesYet}
              </p>
            ) : (
              <div className="space-y-3">
                {progress.recentMistakes.slice(0, 4).map((m) => (
                  <div
                    key={m.exerciseId}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-1 text-xs"
                  >
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {m.grammarRuleTag}
                    </span>
                    <p
                      dir="ltr"
                      className="text-rose-700 dark:text-rose-300 line-through"
                    >
                      {m.userAnswer}
                    </p>
                    <p
                      dir="ltr"
                      className="font-semibold text-emerald-800 dark:text-emerald-300"
                    >
                      → {m.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {progress.recentMistakes.length > 0 && (
            <button
              type="button"
              onClick={onPracticeMistakes}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.progress.practiceMistakesBtn}
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
