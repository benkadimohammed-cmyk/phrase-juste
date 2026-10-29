import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  RotateCcw,
  Volume2,
} from "lucide-react";
import {
  Exercise,
  ExerciseType,
  UILanguage,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import {
  AnswerCheckResult,
  evaluateExerciseAnswer,
} from "../utils/learningLogic";
import { speakFrench } from "../utils/speech";

interface ExerciseViewProps {
  exercises: Exercise[];
  initialFilterType: ExerciseType | "all";
  isRevisionMode?: boolean;
  uiLanguage: UILanguage;
  audioEnabled: boolean;
  t: UIStrings;
  onAttemptRecorded: (
    exercise: Exercise,
    userAnswer: string,
    isCorrect: boolean
  ) => void;
  onSessionCompleted: (stats: {
    attempted: number;
    correct: number;
    isRevisionMode: boolean;
  }) => number;
  onBackHome: () => void;
}

const ACCENT_CHARS = [
  "é",
  "è",
  "ê",
  "à",
  "â",
  "ç",
  "ù",
  "û",
  "î",
  "ô",
  "œ",
  "'",
];

export const ExerciseView: React.FC<ExerciseViewProps> = ({
  exercises,
  initialFilterType,
  isRevisionMode = false,
  uiLanguage,
  audioEnabled,
  t,
  onAttemptRecorded,
  onSessionCompleted,
  onBackHome,
}) => {
  const [selectedType, setSelectedType] = useState<ExerciseType | "all">(
    initialFilterType
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [checkResult, setCheckResult] = useState<AnswerCheckResult | null>(
    null
  );
  const [sessionStats, setSessionStats] = useState({
    attempted: 0,
    correct: 0,
    xp: 0,
    bonusXp: 0,
  });
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  useEffect(() => {
    setSelectedType(initialFilterType);
    setCurrentIndex(0);
    setUserInput("");
    setSelectedWords([]);
    setCheckResult(null);
    setIsSessionFinished(false);
    setSessionStats({ attempted: 0, correct: 0, xp: 0, bonusXp: 0 });
  }, [initialFilterType, exercises]);

  const filteredExercises =
    selectedType === "all"
      ? exercises
      : exercises.filter((e) => e.type === selectedType);

  const activeDeck =
    filteredExercises.length > 0 ? filteredExercises : exercises;
  const currentExercise = activeDeck[currentIndex] || activeDeck[0];

  const handleSelectType = (type: ExerciseType | "all") => {
    setSelectedType(type);
    setCurrentIndex(0);
    setUserInput("");
    setSelectedWords([]);
    setCheckResult(null);
    setIsSessionFinished(false);
    setSessionStats({ attempted: 0, correct: 0, xp: 0, bonusXp: 0 });
  };

  const getEffectiveInput = (): string => {
    if (currentExercise.type === "translation") {
      return selectedWords.join(" ");
    }
    return userInput;
  };

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (checkResult) return;

    const effective = getEffectiveInput();
    if (!effective.trim()) return;

    const result = evaluateExerciseAnswer(effective, currentExercise);
    setCheckResult(result);
    setSessionStats((prev) => ({
      ...prev,
      attempted: prev.attempted + 1,
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      xp: prev.xp + (result.isCorrect ? 15 : 5),
    }));
    onAttemptRecorded(currentExercise, effective, result.isCorrect);

    if (result.isCorrect && audioEnabled) {
      speakFrench(currentExercise.correctAnswer, true);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < activeDeck.length) {
      setCurrentIndex((prev) => prev + 1);
      setUserInput("");
      setSelectedWords([]);
      setCheckResult(null);
    } else {
      const awardedBonus = onSessionCompleted({
        attempted: sessionStats.attempted,
        correct: sessionStats.correct,
        isRevisionMode: isRevisionMode || selectedType === "correction",
      });
      setSessionStats((prev) => ({ ...prev, bonusXp: awardedBonus }));
      setIsSessionFinished(true);
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setUserInput("");
    setSelectedWords([]);
    setCheckResult(null);
    setIsSessionFinished(false);
    setSessionStats({ attempted: 0, correct: 0, xp: 0, bonusXp: 0 });
  };

  const typeTabs: Array<{ id: ExerciseType | "all"; label: string }> = [
    { id: "all", label: t.exercises.allTypes },
    { id: "multiple-choice", label: t.exercises.typeMultipleChoice },
    { id: "fill-blank", label: t.exercises.typeFillBlank },
    { id: "correction", label: t.exercises.typeCorrection },
    { id: "translation", label: t.exercises.typeTranslation },
  ];

  if (isSessionFinished) {
    const scorePct =
      sessionStats.attempted > 0
        ? Math.round((sessionStats.correct / sessionStats.attempted) * 100)
        : 100;
    const totalSessionXp = sessionStats.xp + sessionStats.bonusXp;

    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-400 flex items-center justify-center mx-auto">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
            {t.exercises.sessionComplete}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
            {sessionStats.correct} / {sessionStats.attempted}{" "}
            {scorePct === 100
              ? uiLanguage === "ar"
                ? "— دقة كاملة بدون أخطاء!"
                : uiLanguage === "en"
                ? "— Flawless precision!"
                : "— Sans faute, précision parfaite !"
              : ""}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {t.exercises.sessionScore}
            </span>
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-400 tabular-nums">
              {scorePct}%
            </span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {t.exercises.xpEarned}
            </span>
            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +{totalSessionXp} XP
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestartSession}
            className="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.exercises.practiceAgain}</span>
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="w-full sm:w-auto px-5 py-3 min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.exercises.backToHome}
          </button>
        </div>
      </div>
    );
  }

  const effectiveInput = getEffectiveInput();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header & Exercise Type Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">
              {t.exercises.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t.exercises.subtitle}
            </p>
          </div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
            {t.exercises.questionOf} {currentIndex + 1} / {activeDeck.length}
          </div>
        </div>

        {/* Interactive Format Filter Bar */}
        <div
          role="group"
          aria-label="Filter exercise format"
          className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl overflow-x-auto"
        >
          {typeTabs.map((tab) => {
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectType(tab.id)}
                className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-800 dark:bg-blue-500 transition-all duration-300"
            style={{
              width: `${Math.round(((currentIndex + 1) / activeDeck.length) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Main Exercise Card */}
      <form
        onSubmit={handleCheck}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6"
      >
        {/* Unboxed Metadata Line */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-800 dark:text-blue-400">
              {currentExercise.level}
            </span>
            <span aria-hidden="true">·</span>
            <span>{t.categories[currentExercise.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{currentExercise.grammarRuleTag}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              speakFrench(
                currentExercise.flawedSentence ||
                  currentExercise.sentenceContext?.replace("___", "...") ||
                  currentExercise.correctAnswer,
                true
              )
            }
            aria-label="Écouter la phrase"
            className="min-h-[38px] px-2.5 rounded-lg text-xs font-medium text-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 inline-flex items-center gap-1 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>{t.lessons.listenPronunciation}</span>
          </button>
        </div>

        {/* Prompt */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          {currentExercise.prompt[uiLanguage]}
        </h2>

        {/* Context / Flawed Sentence / Source Sentence Display */}
        {currentExercise.sentenceContext && (
          <div
            dir="ltr"
            className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 text-base sm:text-lg font-medium text-slate-900 dark:text-white"
          >
            {currentExercise.sentenceContext}
          </div>
        )}

        {currentExercise.flawedSentence && (
          <div
            dir="ltr"
            className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1"
          >
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300 block">
              ✗ Phrase à corriger :
            </span>
            <p className="text-base sm:text-lg font-medium text-rose-950 dark:text-rose-200">
              « {currentExercise.flawedSentence} »
            </p>
          </div>
        )}

        {currentExercise.sourceSentence && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70">
            <p className="text-base font-medium text-slate-900 dark:text-white">
              {currentExercise.sourceSentence[uiLanguage]}
            </p>
          </div>
        )}

        {/* Interactive Input Area by Exercise Type */}
        {currentExercise.type === "multiple-choice" &&
          currentExercise.options && (
            <div
              dir="ltr"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Multiple choice options"
            >
              {currentExercise.options.map((option) => {
                const isSelected = userInput === option;
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={!!checkResult}
                    onClick={() => setUserInput(option)}
                    className={`p-4 min-h-[48px] rounded-xl border text-start text-sm font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "border-blue-800 bg-blue-50/80 dark:bg-blue-950/50 dark:border-blue-400 text-blue-950 dark:text-white font-semibold"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

        {(currentExercise.type === "fill-blank" ||
          currentExercise.type === "correction") && (
          <div className="space-y-3" dir="ltr">
            <label htmlFor="french-answer-input" className="sr-only">
              {t.exercises.typeYourAnswer}
            </label>
            <input
              id="french-answer-input"
              type="text"
              disabled={!!checkResult}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={t.exercises.typeYourAnswer}
              className="w-full px-4 py-3 min-h-[48px] rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base focus:outline-none focus:border-blue-700"
            />

            {/* French Accent Helper Bar for Mobile Touch */}
            <div className="flex flex-wrap items-center gap-1.5">
              {ACCENT_CHARS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  disabled={!!checkResult}
                  onClick={() => setUserInput((prev) => prev + ch)}
                  aria-label={`Insérer le caractère ${ch}`}
                  className="min-h-[38px] min-w-[38px] px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-mono font-medium transition-colors cursor-pointer"
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentExercise.type === "translation" && currentExercise.wordBank && (
          <div className="space-y-4" dir="ltr">
            <div className="min-h-[56px] p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedWords.length === 0 ? (
                  <span className="text-sm text-slate-400">
                    {t.exercises.typeYourAnswer}
                  </span>
                ) : (
                  selectedWords.map((w, idx) => (
                    <button
                      key={`${w}-${idx}`}
                      type="button"
                      disabled={!!checkResult}
                      onClick={() =>
                        setSelectedWords((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="px-3 py-1.5 min-h-[38px] rounded-lg bg-blue-800 text-white text-sm font-medium cursor-pointer"
                    >
                      {w}
                    </button>
                  ))
                )}
              </div>

              {selectedWords.length > 0 && !checkResult && (
                <button
                  type="button"
                  onClick={() => setSelectedWords([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 cursor-pointer"
                >
                  {t.exercises.clearWords}
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {currentExercise.wordBank.map((word, idx) => {
                const alreadyUsedCount = selectedWords.filter(
                  (w) => w === word
                ).length;
                const totalInBank = currentExercise.wordBank!.filter(
                  (w) => w === word
                ).length;
                const disabled =
                  !!checkResult || alreadyUsedCount >= totalInBank;

                return (
                  <button
                    key={`${word}-${idx}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedWords((prev) => [...prev, word])}
                    className={`px-3.5 py-2 min-h-[42px] rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                      disabled
                        ? "opacity-40 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-400 cursor-not-allowed"
                        : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-700 text-slate-900 dark:text-white"
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Immediate Feedback Panel */}
        {checkResult && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 sm:p-5 rounded-xl border space-y-3 ${
              checkResult.isCorrect
                ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                : "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {checkResult.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" />
                )}
                <span
                  className={`text-sm font-bold ${
                    checkResult.isCorrect
                      ? "text-emerald-900 dark:text-emerald-200"
                      : "text-rose-900 dark:text-rose-200"
                  }`}
                >
                  {checkResult.isCorrect
                    ? `${t.exercises.correctBanner} (+15 XP)`
                    : `${t.exercises.incorrectBanner} (+5 XP)`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => speakFrench(currentExercise.correctAnswer, true)}
                className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.lessons.listenPronunciation}</span>
              </button>
            </div>

            {checkResult.hasAccentWarning && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                {t.exercises.accentWarning}{" "}
                <strong dir="ltr">{currentExercise.correctAnswer}</strong>
              </p>
            )}

            {!checkResult.isCorrect && (
              <div className="text-xs sm:text-sm space-y-1">
                <span className="font-semibold text-rose-900 dark:text-rose-300 block">
                  {t.exercises.correctSolutionLabel}
                </span>
                <p
                  dir="ltr"
                  className="font-bold text-slate-950 dark:text-white"
                >
                  « {currentExercise.correctAnswer} »
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 text-xs sm:text-sm space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                {t.exercises.ruleExplanationLabel}
              </span>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                {currentExercise.explanation[uiLanguage]}
              </p>
            </div>
          </div>
        )}

        {/* Submit or Next Action */}
        <div className="pt-2 flex items-center justify-end">
          {!checkResult ? (
            <button
              type="submit"
              disabled={!effectiveInput.trim()}
              className="w-full sm:w-auto px-6 py-3 min-h-[48px] rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {t.exercises.checkAnswer}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-3 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {currentIndex + 1 < activeDeck.length
                ? t.exercises.nextQuestion
                : t.exercises.finishSession}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
