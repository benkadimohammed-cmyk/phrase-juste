import React from "react";
import {
  ArrowRight,
  BookOpen,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import { DailyMission, UILanguage } from "../types/learning";
import { UIStrings } from "../i18n/translations";

interface DailyMissionsCardProps {
  missions: DailyMission[];
  uiLanguage: UILanguage;
  t: UIStrings;
  onSelectMissionAction: (missionId: string) => void;
  onViewAllProgress: () => void;
}

export const DailyMissionsCard: React.FC<DailyMissionsCardProps> = ({
  missions,
  uiLanguage,
  t,
  onSelectMissionAction,
  onViewAllProgress,
}) => {
  const completedCount = missions.filter((m) => m.completed).length;
  const totalCount = missions.length;
  const earnedXp = missions
    .filter((m) => m.completed)
    .reduce((sum, m) => sum + m.xpReward, 0);
  const totalPossibleXp = missions.reduce((sum, m) => sum + m.xpReward, 0);

  const getMissionIcon = (missionId: string, completed: boolean) => {
    const cls = `w-4 h-4 shrink-0 ${
      completed
        ? "text-emerald-700 dark:text-emerald-300"
        : "text-blue-800 dark:text-blue-400"
    }`;
    if (missionId.includes("lesson")) return <BookOpen className={cls} />;
    if (missionId.includes("review")) return <RotateCcw className={cls} />;
    return <Target className={cls} />;
  };

  const getMissionCtaLabel = (missionId: string) => {
    if (uiLanguage === "ar") {
      if (missionId.includes("lesson")) return "فتح الدروس";
      if (missionId.includes("review")) return "بدء المراجعة";
      return "حل التمارين";
    }
    if (uiLanguage === "en") {
      if (missionId.includes("lesson")) return "Go to Lessons";
      if (missionId.includes("review")) return "Review Words";
      return "Answer Questions";
    }
    if (missionId.includes("lesson")) return "Voir les leçons";
    if (missionId.includes("review")) return "Réviser les mots";
    return "Faire 10 questions";
  };

  return (
    <section
      data-testid="daily-missions-component"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
    >
      {/* Component Header & Aggregate Completion Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-800 dark:text-blue-400 shrink-0" />
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">
              {t.gamification.dailyMissionsTitle}
            </h2>
            <span className="text-xs font-mono font-semibold text-blue-800 dark:text-blue-400 tabular-nums">
              ({completedCount}/{totalCount})
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.gamification.dailyMissionsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-xs font-mono tabular-nums whitespace-nowrap shrink-0">
            <span className="text-slate-500 dark:text-slate-400">XP : </span>
            <strong className="text-emerald-700 dark:text-emerald-400">
              +{earnedXp}
            </strong>
            <span className="text-slate-400"> / {totalPossibleXp} XP</span>
          </div>

          <button
            type="button"
            onClick={onViewAllProgress}
            className="text-xs font-semibold text-blue-800 dark:text-blue-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer py-1"
          >
            {t.progress.title} →
          </button>
        </div>
      </div>

      {/* 3 Daily Mission Cards with Animated Checkboxes & Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {missions.map((mission) => {
          const pct = Math.min(
            100,
            Math.round((mission.current / Math.max(1, mission.target)) * 100)
          );

          return (
            <div
              key={mission.id}
              data-testid={`daily-mission-card-${mission.id}`}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 transition-all duration-300 ${
                mission.completed
                  ? "bg-emerald-50/45 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80"
                  : "bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
              }`}
            >
              <div className="space-y-3">
                {/* Top Row: Animated Completion Checkbox + Status & XP Reward */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Animated Checkbox Visual */}
                    <div
                      data-testid={`mission-checkbox-${mission.id}`}
                      role="checkbox"
                      aria-checked={mission.completed}
                      aria-label={mission.title[uiLanguage]}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                        mission.completed
                          ? "bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500 text-white scale-105 shadow-2xs"
                          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 scale-100"
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        className={`w-3.5 h-3.5 stroke-current transition-all duration-300 ${
                          mission.completed
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-50"
                        }`}
                      >
                        <path
                          d="M4.5 10.5L8.2 14.2L15.5 6.5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="20"
                          strokeDashoffset={mission.completed ? "0" : "20"}
                          className="transition-all duration-300 ease-out"
                        />
                      </svg>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        mission.completed
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-blue-800 dark:text-blue-400"
                      }`}
                    >
                      {mission.completed
                        ? t.gamification.missionCompleted
                        : t.gamification.missionInProgress}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-xs font-bold tabular-nums whitespace-nowrap shrink-0 ${
                      mission.completed
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    +{mission.xpReward} XP
                  </span>
                </div>

                {/* Mission Title & Description */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    {getMissionIcon(mission.id, mission.completed)}
                    <h3
                      className={`text-sm font-bold ${
                        mission.completed
                          ? "text-emerald-950 dark:text-emerald-100"
                          : "text-slate-950 dark:text-white"
                      }`}
                    >
                      {mission.title[uiLanguage]}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {mission.description[uiLanguage]}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Animated Progress Bar & Direct Action Link */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                    <span>
                      {mission.current} / {mission.target}
                    </span>
                    <span className="font-semibold">{pct}%</span>
                  </div>

                  <div
                    data-testid={`mission-progress-${mission.id}`}
                    role="progressbar"
                    aria-valuenow={mission.current}
                    aria-valuemin={0}
                    aria-valuemax={mission.target}
                    className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        mission.completed
                          ? "bg-emerald-600 dark:bg-emerald-400"
                          : "bg-blue-800 dark:bg-blue-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {mission.completed ? (
                  <div className="w-full py-1.5 min-h-[34px] px-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <span>
                      ✓{" "}
                      {uiLanguage === "ar"
                        ? "تم استلام المكافأة"
                        : uiLanguage === "en"
                        ? "Reward claimed"
                        : "Récompense attribuée"}
                    </span>
                    <span className="font-mono tabular-nums">
                      +{mission.xpReward} XP
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectMissionAction(mission.id)}
                    className="w-full py-1.5 min-h-[34px] px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <span>{getMissionCtaLabel(mission.id)}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
