import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStreakForActivity,
  calculateAccuracy,
  calculateCalendarDayDiff,
  completeExerciseSession,
  evaluateExerciseAnswer,
  filterLessons,
  getAchievementsList,
  getDailyMissions,
  getLearnerLevelInfo,
  getLocalDateString,
  getRecommendedLesson,
  migrateUserProgress,
  normalizeFrenchText,
  recordExerciseAttempt,
  toggleLessonCompletion,
} from "./learningLogic";
import { Exercise, Lesson, UserProgress } from "../types/learning";

function createBaseProgress(): UserProgress {
  return {
    completedLessonIds: [],
    rewardedLessonIds: [],
    completedExerciseIds: [],
    totalAttempts: 10,
    totalCorrect: 8,
    streakDays: 4,
    bestStreakDays: 5,
    lastActiveDate: "2026-10-28",
    xp: 120,
    dailyHistory: {},
    recentMistakes: [],
    xpHistory: [],
    unlockedAchievementIds: {},
    perfectQuizzesCount: 0,
    revisionSessionsCompleted: 0,
    streakFreezes: 1,
    streakFreezeUsedDates: [],
  };
}

test("normalizeFrenchText handles curly apostrophes, trailing punctuation, and extra spaces", () => {
  assert.equal(
    normalizeFrenchText("  J’ai   rendu visite à ma sœur. "),
    "j'ai rendu visite à ma sœur"
  );
});

test("evaluateExerciseAnswer matches exact French answer and flags missing accents", () => {
  const sampleExercise: Pick<Exercise, "correctAnswer" | "acceptedAnswers"> = {
    correctAnswer: "J'ai rendu visite à mes parents",
    acceptedAnswers: ["Nous avons rendu visite à mes parents"],
  };

  const exact = evaluateExerciseAnswer(
    "J'ai rendu visite à mes parents.",
    sampleExercise
  );
  assert.equal(exact.isCorrect, true);
  assert.equal(exact.hasAccentWarning, false);

  const withoutAccent = evaluateExerciseAnswer(
    "J'ai rendu visite a mes parents",
    sampleExercise
  );
  assert.equal(withoutAccent.isCorrect, true);
  assert.equal(withoutAccent.hasAccentWarning, true);

  const wrong = evaluateExerciseAnswer(
    "J'ai visité mes parents",
    sampleExercise
  );
  assert.equal(wrong.isCorrect, false);
});

test("getLearnerLevelInfo computes level thresholds and progress percentages accurately", () => {
  const lvl1 = getLearnerLevelInfo(40);
  assert.equal(lvl1.level, 1);
  assert.equal(lvl1.progressPercent, 40);
  assert.equal(lvl1.xpForNextLevel, 60);

  const lvl2 = getLearnerLevelInfo(100);
  assert.equal(lvl2.level, 2);
  assert.equal(lvl2.title.fr, "Apprenti du mot");
  assert.equal(lvl2.progressPercent, 0);

  const lvl3 = getLearnerLevelInfo(260);
  assert.equal(lvl3.level, 3);
  assert.equal(lvl3.title.fr, "Artisan de la phrase");

  const maxLvl = getLearnerLevelInfo(2500);
  assert.equal(maxLvl.level, 7);
  assert.equal(maxLvl.nextLevelXp, null);
  assert.equal(maxLvl.progressPercent, 100);
});

test("toggleLessonCompletion awards XP and mission bonus once and prevents duplicate rewards", () => {
  const initial = createBaseProgress();
  const title = {
    fr: "Les articles",
    en: "Articles",
    ar: "أدوات التعريف",
  };

  // 1st completion: awards lesson XP (35) + daily mission "Complete 1 lesson" (35) = +70 XP
  const first = toggleLessonCompletion(
    initial,
    "les-1",
    title,
    "2026-10-29",
    15,
    5
  );
  assert.equal(first.progress.completedLessonIds.includes("les-1"), true);
  assert.equal(first.progress.rewardedLessonIds.includes("les-1"), true);
  assert.equal(first.xpAwarded, 70);
  assert.equal(first.newlyCompletedMissions.length, 1);
  assert.equal(
    Boolean(first.progress.unlockedAchievementIds["first-lesson"]),
    true
  );

  // Unmark lesson: 0 XP change, keeps rewardedLessonIds intact
  const unmarked = toggleLessonCompletion(
    first.progress,
    "les-1",
    title,
    "2026-10-29",
    15,
    5
  );
  assert.equal(unmarked.progress.completedLessonIds.includes("les-1"), false);
  assert.equal(unmarked.xpAwarded, 0);

  // Re-mark the same lesson: 0 duplicate XP awarded!
  const remarked = toggleLessonCompletion(
    unmarked.progress,
    "les-1",
    title,
    "2026-10-29",
    15,
    5
  );
  assert.equal(remarked.progress.completedLessonIds.includes("les-1"), true);
  assert.equal(remarked.xpAwarded, 0);
  assert.equal(remarked.progress.xp, first.progress.xp);
});

test("streak calculation handles local midnight boundaries, consecutive days, and Streak Shield", () => {
  const localStr = getLocalDateString(new Date(2026, 9, 29, 0, 5, 0));
  assert.equal(localStr, "2026-10-29");
  assert.equal(calculateCalendarDayDiff("2026-10-28", "2026-10-29"), 1);
  assert.equal(calculateCalendarDayDiff("2026-10-27", "2026-10-29"), 2);

  // Consecutive day increments streak
  const base = createBaseProgress();
  const consecutive = applyStreakForActivity(base, "2026-10-29");
  assert.equal(consecutive.streakDays, 5);
  assert.equal(consecutive.shieldConsumedDate, null);

  // Missed 1 day (2026-10-29) and active on 2026-10-30 -> consumes 1 Streak Shield transparently
  const missedOne = applyStreakForActivity(base, "2026-10-30");
  assert.equal(missedOne.streakDays, 5);
  assert.equal(missedOne.streakFreezes, 0);
  assert.equal(missedOne.shieldConsumedDate, "2026-10-29");
  assert.equal(missedOne.streakFreezeUsedDates.includes("2026-10-29"), true);

  // Missed 2+ days -> resets streak to 1
  const missedTwo = applyStreakForActivity(base, "2026-11-02");
  assert.equal(missedTwo.streakDays, 1);
});

test("recordExerciseAttempt and completeExerciseSession update missions and achievements", () => {
  const initial = createBaseProgress();
  const exercise: Exercise = {
    id: "ex-1",
    lessonId: "les-1",
    category: "mistakes",
    level: "A2",
    type: "correction",
    prompt: {
      fr: "Corrigez la phrase",
      en: "Correct the sentence",
      ar: "صحح الجملة",
    },
    flawedSentence: "J'ai visité mon ami.",
    correctAnswer: "J'ai rendu visite à mon ami.",
    explanation: {
      fr: "Rendre visite à quelqu'un",
      en: "Visit a person",
      ar: "زيارة شخص",
    },
    grammarRuleTag: "visiter vs rendre visite",
  };

  const afterWrong = recordExerciseAttempt(
    initial,
    exercise,
    "J'ai visité mon ami",
    false,
    "2026-10-29"
  );
  assert.equal(afterWrong.streakDays, 5);
  assert.equal(afterWrong.xp, 125);
  assert.equal(afterWrong.recentMistakes.length, 1);

  const afterRight = recordExerciseAttempt(
    afterWrong,
    exercise,
    "J'ai rendu visite à mon ami.",
    true,
    "2026-10-29"
  );
  // 15 base + 5 streak habit bonus = +20 XP
  assert.equal(afterRight.xp, 145);
  assert.equal(afterRight.recentMistakes.length, 0);
  assert.equal(
    Boolean(afterRight.unlockedAchievementIds["first-revision"]),
    true
  );

  // Complete a perfect quiz session
  const sessionDone = completeExerciseSession(
    afterRight,
    { attempted: 5, correct: 5, isRevisionMode: true },
    "2026-10-29",
    15
  );
  assert.equal(sessionDone.isPerfect, true);
  assert.equal(sessionDone.progress.perfectQuizzesCount, 1);
  assert.equal(
    Boolean(sessionDone.progress.unlockedAchievementIds["first-perfect-quiz"]),
    true
  );
});

test("migrateUserProgress preserves existing learner progress and backfills gamification fields", () => {
  const legacySaved = {
    completedLessonIds: ["les-grammar-articles"],
    completedExerciseIds: ["ex-mc-1"],
    totalAttempts: 4,
    totalCorrect: 4,
    streakDays: 3,
    bestStreakDays: 3,
    lastActiveDate: "2026-10-28",
    xp: 260,
    dailyHistory: {},
    recentMistakes: [],
  };

  const migrated = migrateUserProgress(legacySaved, createBaseProgress());
  assert.deepEqual(migrated.rewardedLessonIds, ["les-grammar-articles"]);
  assert.equal(Boolean(migrated.unlockedAchievementIds["first-lesson"]), true);
  assert.equal(Boolean(migrated.unlockedAchievementIds["level-3"]), true);
});

test("filterLessons, getDailyMissions, and getAchievementsList return consistent structures", () => {
  const sampleLessons: Lesson[] = [
    {
      id: "l1",
      title: { fr: "Les articles", en: "Articles", ar: "أدوات التعريف" },
      FrenchSubtitle: "Le, la, les, du, de la",
      category: "grammar",
      level: "A1",
      durationMinutes: 6,
      summary: { fr: "Base", en: "Basics", ar: "أساسيات" },
      rules: [],
      commonMistakes: [],
    },
    {
      id: "l2",
      title: { fr: "Le subjonctif", en: "Subjunctive", ar: "صيغة المنصوب" },
      category: "conjugation",
      FrenchSubtitle: "Il faut que tu saches",
      level: "B1",
      durationMinutes: 10,
      summary: { fr: "Mode", en: "Mood", ar: "صيغة" },
      rules: [],
      commonMistakes: [],
    },
  ];

  assert.equal(filterLessons(sampleLessons, "conjugation", "all", "").length, 1);
  assert.equal(getRecommendedLesson(sampleLessons, ["l1"], "B1").id, "l2");

  const missions = getDailyMissions("2026-10-29", createBaseProgress(), 15);
  assert.equal(missions.length, 3);
  assert.equal(missions[0].id, "mission-lesson-1");
  assert.equal(missions[0].target, 1);
  assert.equal(missions[1].id, "mission-correct-10");
  assert.equal(missions[1].target, 10);
  assert.equal(missions[2].id, "mission-review-5");
  assert.equal(missions[2].target, 5);

  const progressWithEarned = {
    ...createBaseProgress(),
    completedLessonIds: ["l1"],
    unlockedAchievementIds: { "first-lesson": "2026-10-29T09:00:00.000Z" },
  };
  const hallOfFame = getAchievementsList(progressWithEarned, 5);
  assert.equal(hallOfFame.length, 8);
  const firstLessonAch = hallOfFame.find((a) => a.id === "first-lesson");
  const lockedAch = hallOfFame.find((a) => a.id === "correct-100");
  assert.equal(firstLessonAch?.unlocked, true);
  assert.equal(firstLessonAch?.conditionLabel.fr, "1 leçon terminée");
  assert.equal(lockedAch?.unlocked, false);
  assert.equal(lockedAch?.conditionLabel.en, "100 correct answers");
});
