import React, { useState } from "react";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Search,
  Volume2,
  X,
} from "lucide-react";
import {
  CEFRLevel,
  Lesson,
  LessonCategory,
  UILanguage,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import { filterLessons } from "../utils/learningLogic";
import { speakFrench } from "../utils/speech";

interface LessonsViewProps {
  lessons: Lesson[];
  completedLessonIds: string[];
  rewardedLessonIds: string[];
  uiLanguage: UILanguage;
  audioEnabled: boolean;
  selectedLesson: Lesson | null;
  t: UIStrings;
  onSelectLesson: (lesson: Lesson | null) => void;
  onToggleLessonComplete: (lesson: Lesson) => void;
  onStartLessonPractice: (lessonId: string) => void;
}

const CATEGORIES: Array<LessonCategory | "all"> = [
  "all",
  "grammar",
  "vocabulary",
  "conjugation",
  "construction",
  "mistakes",
];

const LEVELS: Array<CEFRLevel | "all"> = ["all", "A1", "A2", "B1", "B2"];

export const LessonsView: React.FC<LessonsViewProps> = ({
  lessons,
  completedLessonIds,
  uiLanguage,
  audioEnabled,
  selectedLesson,
  t,
  onSelectLesson,
  onToggleLessonComplete,
  onStartLessonPractice,
}) => {
  const [activeCategory, setActiveCategory] = useState<LessonCategory | "all">(
    "all"
  );
  const [activeLevel, setActiveLevel] = useState<CEFRLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = filterLessons(
    lessons,
    activeCategory,
    activeLevel,
    searchQuery
  );

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            {t.lessons.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t.lessons.subtitle}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <label htmlFor="lesson-search" className="sr-only">
            {t.lessons.searchPlaceholder}
          </label>
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="lesson-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.lessons.searchPlaceholder}
            className="w-full ps-10 pe-4 py-2.5 min-h-[44px] text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
          />
        </div>
      </div>

      {/* Interactive Filter Controls (Category & Level Segmented Bars) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter by category"
          className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl overflow-x-auto"
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t.categories[cat]}
              </button>
            );
          })}
        </div>

        <div
          role="group"
          aria-label="Filter by CEFR level"
          className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl self-start"
        >
          {LEVELS.map((lvl) => {
            const active = activeLevel === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevel(lvl)}
                className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {lvl === "all" ? t.lessons.allLevels : lvl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lessons List / Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.lessons.noLessonsFound}
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveCategory("all");
              setActiveLevel("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 min-h-[40px] rounded-xl bg-blue-800 text-white text-xs font-semibold hover:bg-blue-900 transition-colors cursor-pointer"
          >
            {t.lessons.resetFilters}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lesson, idx) => {
            const isCompleted = completedLessonIds.includes(lesson.id);
            return (
              <article
                key={lesson.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-blue-700/60 dark:hover:border-blue-500/60 transition-colors"
              >
                <div className="space-y-2">
                  {/* Zero-Pill Unboxed Metadata with typographic separators */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-blue-800 dark:text-blue-400">
                        {String(idx + 1).padStart(2, "0")}. {lesson.level}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{t.categories[lesson.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {lesson.durationMinutes} {t.lessons.minutes}
                      </span>
                    </div>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.lessons.completed}</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lesson.title[uiLanguage]}
                  </h2>

                  <p className="text-xs font-mono text-blue-900/80 dark:text-blue-300">
                    {lesson.FrenchSubtitle}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {lesson.summary[uiLanguage]}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t.lessons.studyLesson}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStartLessonPractice(lesson.id)}
                    className="px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>{t.lessons.practiceLesson}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Interactive Lesson Study Sheet / Modal */}
      {selectedLesson && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-blue-800 dark:text-blue-400">
                    {selectedLesson.level}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{t.categories[selectedLesson.category]}</span>
                </div>
                <h2
                  id="lesson-modal-title"
                  className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white"
                >
                  {selectedLesson.title[uiLanguage]}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onSelectLesson(null)}
                aria-label="Fermer la leçon"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedLesson.summary[uiLanguage]}
              </p>

              {/* Key Rules */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.lessons.keyRules}
                </h3>
                {selectedLesson.rules.map((rule, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5"
                  >
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {rule.heading[uiLanguage]}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {rule.explanation[uiLanguage]}
                    </p>
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          « {rule.exampleFrench} »
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {rule.exampleTranslation[uiLanguage]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          speakFrench(rule.exampleFrench, audioEnabled)
                        }
                        aria-label={`Écouter : ${rule.exampleFrench}`}
                        className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                        <span>{t.lessons.listenPronunciation}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Common Mistakes Table */}
              {selectedLesson.commonMistakes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.lessons.commonMistakesTitle}
                  </h3>
                  <div className="space-y-3">
                    {selectedLesson.commonMistakes.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 text-xs">
                            <span className="font-semibold text-rose-800 dark:text-rose-300 block">
                              ✗ {t.home.dontSay}
                            </span>
                            <span className="text-rose-950 dark:text-rose-200 line-through">
                              {m.wrong}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 text-xs">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                              ✓ {t.home.sayInstead}
                            </span>
                            <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                              {m.right}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {m.why[uiLanguage]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onToggleLessonComplete(selectedLesson)}
                  className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                    completedLessonIds.includes(selectedLesson.id)
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                      : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {completedLessonIds.includes(selectedLesson.id)
                      ? t.lessons.markedComplete
                      : rewardedLessonIds.includes(selectedLesson.id)
                      ? t.lessons.markedComplete
                      : t.lessons.markComplete}
                  </span>
                </button>
                {rewardedLessonIds.includes(selectedLesson.id) && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.gamification.alreadyRewardedNote}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  const id = selectedLesson.id;
                  onSelectLesson(null);
                  onStartLessonPractice(id);
                }}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {t.lessons.practiceLesson}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
