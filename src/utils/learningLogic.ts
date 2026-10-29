import {
  AchievementDefinition,
  CEFRLevel,
  DailyActivity,
  DailyMission,
  Exercise,
  LearnerLevelInfo,
  Lesson,
  LessonCategory,
  LocalizedText,
  UserProgress,
  XPEvent,
} from "../types/learning";

/**
 * Formats a Date object as a local calendar date string (YYYY-MM-DD),
 * respecting the learner's local timezone and midnight boundary.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact integer calendar day difference (dateB - dateA)
 * between two YYYY-MM-DD strings without daylight-saving drift.
 */
export function calculateCalendarDayDiff(dateA: string, dateB: string): number {
  if (!dateA || !dateB) return 999;
  const [yA, mA, dA] = dateA.split("-").map(Number);
  const [yB, mB, dB] = dateB.split("-").map(Number);
  if (!yA || !mA || !dA || !yB || !mB || !dB) return 999;
  const utcA = Date.UTC(yA, mA - 1, dA);
  const utcB = Date.UTC(yB, mB - 1, dB);
  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export interface LevelTier {
  level: number;
  minXp: number;
  title: LocalizedText;
}

export const LEARNER_LEVEL_TIERS: LevelTier[] = [
  {
    level: 1,
    minXp: 0,
    title: {
      fr: "Novice curieux",
      en: "Curious Novice",
      ar: "مبتدئ طموح",
    },
  },
  {
    level: 2,
    minXp: 100,
    title: {
      fr: "Apprenti du mot",
      en: "Word Apprentice",
      ar: "متدرب الكلمات",
    },
  },
  {
    level: 3,
    minXp: 250,
    title: {
      fr: "Artisan de la phrase",
      en: "Sentence Artisan",
      ar: "صانع الجمل",
    },
  },
  {
    level: 4,
    minXp: 500,
    title: {
      fr: "Plume précise",
      en: "Precise Pen",
      ar: "قلم دقيق",
    },
  },
  {
    level: 5,
    minXp: 900,
    title: {
      fr: "Orateur éclairé",
      en: "Articulate Speaker",
      ar: "متحدث فصيح",
    },
  },
  {
    level: 6,
    minXp: 1400,
    title: {
      fr: "Maître de la syntaxe",
      en: "Syntax Master",
      ar: "أستاذ النحو",
    },
  },
  {
    level: 7,
    minXp: 2100,
    title: {
      fr: "Académicien du style",
      en: "Style Academician",
      ar: "خبير البيان الفرنسي",
    },
  },
];

/**
 * Computes the learner's current level, title, and XP progress toward the next level.
 */
export function getLearnerLevelInfo(xp: number): LearnerLevelInfo {
  const safeXp = Math.max(0, Math.floor(xp));
  let currentTier = LEARNER_LEVEL_TIERS[0];
  let nextTier: LevelTier | null = LEARNER_LEVEL_TIERS[1] || null;

  for (let i = 0; i < LEARNER_LEVEL_TIERS.length; i++) {
    if (safeXp >= LEARNER_LEVEL_TIERS[i].minXp) {
      currentTier = LEARNER_LEVEL_TIERS[i];
      nextTier = LEARNER_LEVEL_TIERS[i + 1] || null;
    } else {
      break;
    }
  }

  if (!nextTier) {
    return {
      level: currentTier.level,
      title: currentTier.title,
      minXp: currentTier.minXp,
      nextLevelXp: null,
      currentLevelXp: safeXp - currentTier.minXp,
      xpForNextLevel: 0,
      progressPercent: 100,
    };
  }

  const span = nextTier.minXp - currentTier.minXp;
  const intoLevel = safeXp - currentTier.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((intoLevel / span) * 100))
  );

  return {
    level: currentTier.level,
    title: currentTier.title,
    minXp: currentTier.minXp,
    nextLevelXp: nextTier.minXp,
    currentLevelXp: intoLevel,
    xpForNextLevel: nextTier.minXp - safeXp,
    progressPercent,
  };
}

/**
 * Normalizes French text for comparison while preserving accent distinction analysis.
 */
export function normalizeFrenchText(input: string): string {
  return input
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Strips diacritics/accents from French text to detect "almost right (check accents)" answers.
 */
export function stripAccents(input: string): string {
  return input
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  hasAccentWarning: boolean;
  matchedCanonical: string;
}

/**
 * Checks a user's submitted French answer against the canonical answer and accepted variants.
 */
export function evaluateExerciseAnswer(
  userInput: string,
  exercise: Pick<Exercise, "correctAnswer" | "acceptedAnswers">
): AnswerCheckResult {
  const normalizedUser = normalizeFrenchText(userInput);
  if (!normalizedUser) {
    return {
      isCorrect: false,
      hasAccentWarning: false,
      matchedCanonical: exercise.correctAnswer,
    };
  }

  const candidates = [
    exercise.correctAnswer,
    ...(exercise.acceptedAnswers || []),
  ];

  for (const candidate of candidates) {
    if (normalizeFrenchText(candidate) === normalizedUser) {
      return {
        isCorrect: true,
        hasAccentWarning: false,
        matchedCanonical: exercise.correctAnswer,
      };
    }
  }

  const strippedUser = stripAccents(normalizedUser);
  for (const candidate of candidates) {
    if (stripAccents(normalizeFrenchText(candidate)) === strippedUser) {
      return {
        isCorrect: true,
        hasAccentWarning: true,
        matchedCanonical: exercise.correctAnswer,
      };
    }
  }

  return {
    isCorrect: false,
    hasAccentWarning: false,
    matchedCanonical: exercise.correctAnswer,
  };
}

/**
 * Computes overall accuracy percentage (0-100).
 */
export function calculateAccuracy(
  totalCorrect: number,
  totalAttempts: number
): number {
  if (totalAttempts <= 0) return 0;
  return Math.round((totalCorrect / totalAttempts) * 100);
}

function createEmptyDailyActivity(dateStr: string): DailyActivity {
  return {
    date: dateStr,
    minutesCompleted: 0,
    exercisesCompleted: 0,
    correctCount: 0,
    lessonsCompletedCount: 0,
    revisionCount: 0,
    perfectSessionsCount: 0,
    highAccuracySessionsCount: 0,
    completedMissionIds: [],
    dailyGoalRewarded: false,
    streakFreezeApplied: false,
  };
}

/**
 * Updates streak count based on local calendar date and transparent Streak Shield rules.
 */
export function applyStreakForActivity(
  progress: UserProgress,
  todayDateStr: string
): {
  streakDays: number;
  bestStreakDays: number;
  lastActiveDate: string;
  streakFreezes: number;
  streakFreezeUsedDates: string[];
  shieldConsumedDate: string | null;
} {
  let newStreak = progress.streakDays;
  let freezes = progress.streakFreezes ?? 1;
  let freezeDates = [...(progress.streakFreezeUsedDates || [])];
  let shieldConsumedDate: string | null = null;

  if (!progress.lastActiveDate) {
    newStreak = 1;
  } else if (progress.lastActiveDate === todayDateStr) {
    newStreak = Math.max(1, progress.streakDays);
  } else {
    const diff = calculateCalendarDayDiff(progress.lastActiveDate, todayDateStr);
    if (diff === 1) {
      newStreak = progress.streakDays + 1;
    } else if (diff === 2 && freezes > 0 && progress.streakDays > 0) {
      // Missed exactly 1 calendar day: consume 1 Streak Shield transparently
      const [y, m, d] = todayDateStr.split("-").map(Number);
      const missedDateObj = new Date(Date.UTC(y, m - 1, d - 1));
      const missedDateStr = missedDateObj.toISOString().slice(0, 10);
      freezes -= 1;
      if (!freezeDates.includes(missedDateStr)) {
        freezeDates.push(missedDateStr);
      }
      shieldConsumedDate = missedDateStr;
      newStreak = progress.streakDays + 1;
    } else if (diff < 0) {
      // Activity logged on an earlier date than lastActiveDate
      newStreak = Math.max(1, progress.streakDays);
    } else {
      newStreak = 1;
    }
  }

  // Award +1 Streak Shield (up to 2 max) when hitting a new 7-day multiple
  if (
    newStreak > progress.streakDays &&
    newStreak % 7 === 0 &&
    freezes < 2
  ) {
    freezes += 1;
  }

  const bestStreak = Math.max(progress.bestStreakDays, newStreak);

  return {
    streakDays: newStreak,
    bestStreakDays: bestStreak,
    lastActiveDate: todayDateStr,
    streakFreezes: freezes,
    streakFreezeUsedDates: freezeDates,
    shieldConsumedDate,
  };
}

/**
 * Generates the 3 daily missions for a given local date and computes their current progress.
 */
export function getDailyMissions(
  dateStr: string,
  progress: UserProgress,
  dailyGoalMinutes = 15
): DailyMission[] {
  const today: DailyActivity =
    progress.dailyHistory[dateStr] || createEmptyDailyActivity(dateStr);
  const completedIds = today.completedMissionIds || [];

  const targetMinutes = Math.min(15, Math.max(5, dailyGoalMinutes));

  const missionPool: Array<Omit<DailyMission, "completed" | "rewarded">> = [
    {
      id: "mission-lesson-1",
      title: {
        fr: "Terminer 1 leçon",
        en: "Complete 1 Lesson",
        ar: "إكمال درس واحد",
      },
      description: {
        fr: "Lisez et validez 1 leçon structurée aujourd'hui",
        en: "Read and mark 1 structured lesson complete today",
        ar: "اقرأ وأكمل درساً واحداً اليوم",
      },
      current: Math.min(1, today.lessonsCompletedCount || 0),
      target: 1,
      xpReward: 35,
    },
    {
      id: "mission-correct-10",
      title: {
        fr: "10 questions réussies",
        en: "Answer 10 Questions",
        ar: "الإجابة عن ١٠ أسئلة",
      },
      description: {
        fr: "Répondez correctement à 10 questions d'exercice aujourd'hui",
        en: "Answer 10 interactive exercise questions accurately today",
        ar: "أجب بشكل صحيح عن ١٠ أسئلة تفاعلية اليوم",
      },
      current: Math.min(10, today.correctCount || 0),
      target: 10,
      xpReward: 40,
    },
    {
      id: "mission-review-5",
      title: {
        fr: "Réviser 5 mots ou tournures",
        en: "Review 5 Words & Phrases",
        ar: "مراجعة ٥ كلمات أو عبارات",
      },
      description: {
        fr: "Révisez 5 expressions, corrections ou erreurs passées",
        en: "Review 5 vocabulary expressions, corrections, or past mistakes",
        ar: "راجع ٥ مفردات أو تصحيحات جمل اليوم",
      },
      current: Math.min(5, today.revisionCount || 0),
      target: 5,
      xpReward: 35,
    },
    {
      id: "mission-duration",
      title: {
        fr: `Pratiquer ${targetMinutes} minutes`,
        en: `Practice for ${targetMinutes} Minutes`,
        ar: `التدرب لمدة ${targetMinutes} دقائق`,
      },
      description: {
        fr: `Cumulez ${targetMinutes} minutes d'étude active aujourd'hui`,
        en: `Reach ${targetMinutes} minutes of focused French study today`,
        ar: `أكمل ${targetMinutes} دقائق من الدراسة المركزة اليوم`,
      },
      current: Math.min(targetMinutes, today.minutesCompleted || 0),
      target: targetMinutes,
      xpReward: 30,
    },
    {
      id: "mission-accuracy-80",
      title: {
        fr: "Précision supérieure à 80 %",
        en: "Reach 80%+ Accuracy",
        ar: "تحقيق دقة ٨٠٪ أو أعلى",
      },
      description: {
        fr: "Maintenez au moins 80 % de réussite sur 3+ questions aujourd'hui",
        en: "Achieve at least 80% accuracy across 3+ questions today",
        ar: "حقق دقة ٨٠٪ على الأقل في ٣ أسئلة أو أكثر اليوم",
      },
      current:
        (today.highAccuracySessionsCount || 0) > 0 ||
        (today.exercisesCompleted >= 3 &&
          Math.round((today.correctCount / today.exercisesCompleted) * 100) >=
            80)
          ? 1
          : 0,
      target: 1,
      xpReward: 45,
    },
  ];

  // Select the 3 core daily missions: 1 Lesson, 10 Questions, Review 5 Words
  const selectedIndices = [0, 1, 2];

  return selectedIndices.map((idx) => {
    const m = missionPool[idx];
    const isCompleted = m.current >= m.target || completedIds.includes(m.id);
    const isRewarded = completedIds.includes(m.id);
    return {
      ...m,
      current: isCompleted ? m.target : m.current,
      completed: isCompleted,
      rewarded: isRewarded,
    };
  });
}

/**
 * Evaluates all 8 unlockable achievements against current UserProgress.
 */
export function getAchievementsList(
  progress: UserProgress,
  totalLessonsCount = 5
): AchievementDefinition[] {
  const unlockedMap = progress.unlockedAchievementIds || {};
  const levelInfo = getLearnerLevelInfo(progress.xp);

  const anyDayTripleMission = Object.values(progress.dailyHistory).some(
    (d) => (d.completedMissionIds?.length || 0) >= 3
  );

  const definitions: Array<
    Omit<AchievementDefinition, "unlocked" | "unlockedAt">
  > = [
    {
      id: "first-lesson",
      iconName: "book",
      title: {
        fr: "Première leçon",
        en: "First Completed Lesson",
        ar: "الدرس الأول",
      },
      description: {
        fr: "Étudier et valider votre première leçon de français",
        en: "Complete your first structured French lesson",
        ar: "إتمام أول درس فرنسي منظم بنجاح",
      },
      conditionLabel: {
        fr: "1 leçon terminée",
        en: "1 lesson completed",
        ar: "إكمال درس واحد",
      },
      currentValue: Math.min(1, progress.completedLessonIds.length),
      targetValue: 1,
    },
    {
      id: "first-perfect-quiz",
      iconName: "sparkles",
      title: {
        fr: "Sans faute",
        en: "First Perfect Quiz",
        ar: "اختبار كامل الدقة",
      },
      description: {
        fr: "Terminer une série d'exercices avec 100 % de précision",
        en: "Finish an exercise session with 100% accuracy",
        ar: "إنهاء جلسة تمارين بنسبة دقة ١٠٠٪",
      },
      conditionLabel: {
        fr: "1 série à 100 %",
        en: "1 perfect session",
        ar: "جلسة واحدة بدقة ١٠٠٪",
      },
      currentValue: Math.min(1, progress.perfectQuizzesCount || 0),
      targetValue: 1,
    },
    {
      id: "streak-7",
      iconName: "flame",
      title: {
        fr: "Semaine d'excellence",
        en: "Seven-Day Streak",
        ar: "سلسلة سبعة أيام",
      },
      description: {
        fr: "Maintenir une habitude d'apprentissage pendant 7 jours consécutifs",
        en: "Maintain a consistent learning streak for 7 consecutive days",
        ar: "الحفاظ على سلسلة تعلم لمدة ٧ أيام متتالية",
      },
      conditionLabel: {
        fr: "7 jours de série",
        en: "7-day streak",
        ar: "سلسلة ٧ أيام",
      },
      currentValue: Math.min(
        7,
        Math.max(progress.streakDays, progress.bestStreakDays)
      ),
      targetValue: 7,
    },
    {
      id: "correct-100",
      iconName: "target",
      title: {
        fr: "Centurion du français",
        en: "One Hundred Correct Answers",
        ar: "مئة إجابة صحيحة",
      },
      description: {
        fr: "Atteindre 100 réponses justes dans les exercices interactifs",
        en: "Accumulate 100 accurate answers across interactive exercises",
        ar: "الوصول إلى ١٠٠ إجابة صحيحة في التمارين التفاعلية",
      },
      conditionLabel: {
        fr: "100 réponses exactes",
        en: "100 correct answers",
        ar: "١٠٠ إجابة صحيحة",
      },
      currentValue: Math.min(100, progress.totalCorrect),
      targetValue: 100,
    },
    {
      id: "first-revision",
      iconName: "rotate",
      title: {
        fr: "L'art de la révision",
        en: "First Revision Session",
        ar: "أول جلسة مراجعة",
      },
      description: {
        fr: "Terminer une séance de révision ou corriger une erreur passée",
        en: "Complete a revision session or resolve a previously missed item",
        ar: "إكمال جلسة مراجعة أو تصحيح خطأ سابق",
      },
      conditionLabel: {
        fr: "1 séance de révision",
        en: "1 revision completed",
        ar: "جلسة مراجعة واحدة",
      },
      currentValue: Math.min(1, progress.revisionSessionsCompleted || 0),
      targetValue: 1,
    },
    {
      id: "level-3",
      iconName: "trending",
      title: {
        fr: "Artisan de la phrase",
        en: "Reaching Level 3",
        ar: "الوصول للمستوى الثالث",
      },
      description: {
        fr: "Atteindre le niveau 3 d'apprenant (250 XP ou plus)",
        en: "Reach Learner Level 3 (Sentence Artisan — 250+ XP)",
        ar: "الوصول إلى المستوى الثالث للمتعلم (٢٥٠ نقطة خبرة)",
      },
      conditionLabel: {
        fr: "Atteindre le Niveau 3",
        en: "Reach Level 3",
        ar: "بلوغ المستوى ٣",
      },
      currentValue: Math.min(3, levelInfo.level),
      targetValue: 3,
    },
    {
      id: "mission-master",
      iconName: "check",
      title: {
        fr: "Triple mission",
        en: "Daily Mission Trio",
        ar: "ثلاثية المهام اليومية",
      },
      description: {
        fr: "Accomplir les 3 missions quotidiennes au cours d'une même journée",
        en: "Complete all 3 daily missions in a single day",
        ar: "إنجاز جميع المهام اليومية الثلاث في يوم واحد",
      },
      conditionLabel: {
        fr: "3/3 missions du jour",
        en: "3/3 daily missions",
        ar: "٣ من ٣ مهام يومية",
      },
      currentValue: anyDayTripleMission ? 3 : 0,
      targetValue: 3,
    },
    {
      id: "grammar-scholar",
      iconName: "award",
      title: {
        fr: "Érudit du programme",
        en: "Curriculum Master",
        ar: "باحث القواعد الشامل",
      },
      description: {
        fr: "Étudier et valider l'ensemble des leçons de la bibliothèque",
        en: "Complete all structured French lessons in the library",
        ar: "إتمام دراسة جميع الدروس المنظمة في المكتبة",
      },
      conditionLabel: {
        fr: `${totalLessonsCount} leçons validées`,
        en: `${totalLessonsCount} lessons completed`,
        ar: `إكمال ${totalLessonsCount} دروس`,
      },
      currentValue: Math.min(
        totalLessonsCount,
        progress.completedLessonIds.length
      ),
      targetValue: totalLessonsCount,
    },
  ];

  return definitions.map((def) => {
    const isMet = def.currentValue >= def.targetValue || Boolean(unlockedMap[def.id]);
    return {
      ...def,
      unlocked: isMet,
      unlockedAt: unlockedMap[def.id],
    };
  });
}

/**
 * Evaluates daily missions, daily goal, and achievements after any progress update,
 * awarding one-time bonuses and appending XP events.
 */
export function settleMissionsGoalsAndAchievements(
  progress: UserProgress,
  todayDateStr: string,
  dailyGoalMinutes = 15,
  totalLessonsCount = 5
): {
  progress: UserProgress;
  newlyCompletedMissions: DailyMission[];
  newlyUnlockedAchievements: AchievementDefinition[];
  dailyGoalJustReached: boolean;
} {
  let working = { ...progress };
  const today = {
    ...(working.dailyHistory[todayDateStr] ||
      createEmptyDailyActivity(todayDateStr)),
  };
  const completedMissionIds = [...(today.completedMissionIds || [])];
  const xpHistory = [...(working.xpHistory || [])];
  let addedXp = 0;

  // 1. Check Daily Goal one-time reward
  let dailyGoalJustReached = false;
  if (
    !today.dailyGoalRewarded &&
    today.minutesCompleted >= Math.max(5, dailyGoalMinutes)
  ) {
    today.dailyGoalRewarded = true;
    dailyGoalJustReached = true;
    addedXp += 40;
    xpHistory.unshift({
      id: `xp-goal-${todayDateStr}`,
      type: "daily_goal",
      amount: 40,
      label: {
        fr: "Objectif quotidien atteint",
        en: "Daily learning goal reached",
        ar: "تحقيق الهدف اليومي للتعلم",
      },
      timestamp: new Date().toISOString(),
      dateStr: todayDateStr,
    });
  }

  working = {
    ...working,
    xp: working.xp + addedXp,
    dailyHistory: {
      ...working.dailyHistory,
      [todayDateStr]: {
        ...today,
        completedMissionIds,
      },
    },
    xpHistory: xpHistory.slice(0, 40),
  };

  // 2. Check Daily Missions one-time rewards
  const currentMissions = getDailyMissions(
    todayDateStr,
    working,
    dailyGoalMinutes
  );
  const newlyCompletedMissions: DailyMission[] = [];
  let missionXp = 0;

  for (const m of currentMissions) {
    if (m.completed && !completedMissionIds.includes(m.id)) {
      completedMissionIds.push(m.id);
      newlyCompletedMissions.push({ ...m, rewarded: true });
      missionXp += m.xpReward;
      xpHistory.unshift({
        id: `xp-${m.id}-${todayDateStr}`,
        type: "daily_mission",
        amount: m.xpReward,
        label: {
          fr: `Mission accomplie : ${m.title.fr}`,
          en: `Daily mission: ${m.title.en}`,
          ar: `مهمة يومية: ${m.title.ar}`,
        },
        timestamp: new Date().toISOString(),
        dateStr: todayDateStr,
      });
    }
  }

  if (newlyCompletedMissions.length > 0) {
    working = {
      ...working,
      xp: working.xp + missionXp,
      dailyHistory: {
        ...working.dailyHistory,
        [todayDateStr]: {
          ...working.dailyHistory[todayDateStr],
          completedMissionIds,
        },
      },
      xpHistory: xpHistory.slice(0, 40),
    };
  }

  // 3. Check Achievements unlock
  const unlockedMap = { ...(working.unlockedAchievementIds || {}) };
  const evaluatedAchievements = getAchievementsList(working, totalLessonsCount);
  const newlyUnlockedAchievements: AchievementDefinition[] = [];
  const nowIso = new Date().toISOString();

  for (const ach of evaluatedAchievements) {
    if (ach.unlocked && !unlockedMap[ach.id]) {
      unlockedMap[ach.id] = nowIso;
      newlyUnlockedAchievements.push({ ...ach, unlockedAt: nowIso });
    }
  }

  working = {
    ...working,
    unlockedAchievementIds: unlockedMap,
  };

  return {
    progress: working,
    newlyCompletedMissions,
    newlyUnlockedAchievements,
    dailyGoalJustReached,
  };
}

/**
 * Toggles lesson completion while strictly preventing duplicate XP or streak rewards
 * if a user unmarks and re-marks or repeatedly opens a completed lesson.
 */
export function toggleLessonCompletion(
  progress: UserProgress,
  lessonId: string,
  lessonTitle: LocalizedText,
  todayDateStr: string,
  dailyGoalMinutes = 15,
  totalLessonsCount = 5
): {
  progress: UserProgress;
  xpAwarded: number;
  leveledUpTo: LearnerLevelInfo | null;
  newlyCompletedMissions: DailyMission[];
  newlyUnlockedAchievements: AchievementDefinition[];
} {
  const prevLevel = getLearnerLevelInfo(progress.xp).level;
  const isCurrentlyCompleted = progress.completedLessonIds.includes(lessonId);
  const alreadyRewarded = (progress.rewardedLessonIds || []).includes(lessonId);

  if (isCurrentlyCompleted) {
    // Allow unmarking visual completion status without removing earned XP or allowing re-farming
    return {
      progress: {
        ...progress,
        completedLessonIds: progress.completedLessonIds.filter(
          (id) => id !== lessonId
        ),
      },
      xpAwarded: 0,
      leveledUpTo: null,
      newlyCompletedMissions: [],
      newlyUnlockedAchievements: [],
    };
  }

  const completedLessonIds = [...progress.completedLessonIds, lessonId];
  if (alreadyRewarded) {
    // Lesson was already rewarded previously; restore completed status with 0 duplicate XP
    return {
      progress: {
        ...progress,
        completedLessonIds,
      },
      xpAwarded: 0,
      leveledUpTo: null,
      newlyCompletedMissions: [],
      newlyUnlockedAchievements: [],
    };
  }

  // First-time reward for this lesson
  const rewardedLessonIds = [...(progress.rewardedLessonIds || []), lessonId];
  const streakUpdate = applyStreakForActivity(progress, todayDateStr);
  const habitBonus = streakUpdate.streakDays >= 3 ? 5 : 0;
  const lessonXp = 30 + habitBonus;

  const existingToday =
    progress.dailyHistory[todayDateStr] ||
    createEmptyDailyActivity(todayDateStr);

  const updatedToday: DailyActivity = {
    ...existingToday,
    minutesCompleted: existingToday.minutesCompleted + 5,
    lessonsCompletedCount: (existingToday.lessonsCompletedCount || 0) + 1,
    streakFreezeApplied:
      existingToday.streakFreezeApplied ||
      Boolean(streakUpdate.shieldConsumedDate),
  };

  const newEvent: XPEvent = {
    id: `xp-lesson-${lessonId}-${Date.now()}`,
    type: "lesson_complete",
    amount: lessonXp,
    label: {
      fr: `Leçon terminée : ${lessonTitle.fr}`,
      en: `Lesson completed: ${lessonTitle.en}`,
      ar: `إكمال درس: ${lessonTitle.ar}`,
    },
    timestamp: new Date().toISOString(),
    dateStr: todayDateStr,
  };

  const xpHistory = [newEvent, ...(progress.xpHistory || [])].slice(0, 40);
  if (streakUpdate.shieldConsumedDate) {
    xpHistory.unshift({
      id: `shield-${streakUpdate.shieldConsumedDate}`,
      type: "streak_shield_used",
      amount: 0,
      label: {
        fr: `Bouclier de série utilisé pour protéger le ${streakUpdate.shieldConsumedDate}`,
        en: `Streak Shield used to protect ${streakUpdate.shieldConsumedDate}`,
        ar: `تم استخدام درع السلسلة لحماية يوم ${streakUpdate.shieldConsumedDate}`,
      },
      timestamp: new Date().toISOString(),
      dateStr: todayDateStr,
    });
  }

  const intermediate: UserProgress = {
    ...progress,
    completedLessonIds,
    rewardedLessonIds,
    streakDays: streakUpdate.streakDays,
    bestStreakDays: streakUpdate.bestStreakDays,
    lastActiveDate: streakUpdate.lastActiveDate,
    streakFreezes: streakUpdate.streakFreezes,
    streakFreezeUsedDates: streakUpdate.streakFreezeUsedDates,
    xp: progress.xp + lessonXp,
    dailyHistory: {
      ...progress.dailyHistory,
      [todayDateStr]: updatedToday,
    },
    xpHistory,
  };

  const settled = settleMissionsGoalsAndAchievements(
    intermediate,
    todayDateStr,
    dailyGoalMinutes,
    totalLessonsCount
  );

  const newLevelInfo = getLearnerLevelInfo(settled.progress.xp);
  const leveledUpTo = newLevelInfo.level > prevLevel ? newLevelInfo : null;

  return {
    progress: settled.progress,
    xpAwarded: settled.progress.xp - progress.xp,
    leveledUpTo,
    newlyCompletedMissions: settled.newlyCompletedMissions,
    newlyUnlockedAchievements: settled.newlyUnlockedAchievements,
  };
}

/**
 * Records an exercise attempt and returns updated UserProgress.
 * Prevents duplicate full XP farming on already-mastered exercises while rewarding new mastery and habits.
 */
export function recordExerciseAttempt(
  progress: UserProgress,
  exercise: Exercise,
  userAnswer: string,
  isCorrect: boolean,
  todayDateStr: string,
  dailyGoalMinutes = 15,
  isRevisionMode = false
): UserProgress {
  const existingToday =
    progress.dailyHistory[todayDateStr] ||
    createEmptyDailyActivity(todayDateStr);

  const streakUpdate = applyStreakForActivity(progress, todayDateStr);
  const wasAlreadySolved = progress.completedExerciseIds.includes(exercise.id);
  const wasInMistakes = progress.recentMistakes.some(
    (m) => m.exerciseId === exercise.id
  );

  // Determine XP award:
  // - New correct answer: 15 XP (+5 XP habit bonus if streak >= 3)
  // - Correct answer on a mistake/revision item: 15 XP
  // - Re-answering an already-mastered exercise outside revision: 5 XP practice credit
  // - Incorrect attempt: 5 XP effort credit
  let earnedXp = 5;
  if (isCorrect) {
    if (!wasAlreadySolved || wasInMistakes || isRevisionMode) {
      earnedXp = 15 + (streakUpdate.streakDays >= 3 ? 5 : 0);
    } else {
      earnedXp = 5;
    }
  }

  const countedAsRevision =
    isRevisionMode || wasInMistakes || exercise.type === "correction";

  const updatedToday: DailyActivity = {
    ...existingToday,
    date: todayDateStr,
    minutesCompleted: existingToday.minutesCompleted + 2,
    exercisesCompleted: existingToday.exercisesCompleted + 1,
    correctCount: existingToday.correctCount + (isCorrect ? 1 : 0),
    revisionCount:
      (existingToday.revisionCount || 0) + (countedAsRevision ? 1 : 0),
    streakFreezeApplied:
      existingToday.streakFreezeApplied ||
      Boolean(streakUpdate.shieldConsumedDate),
  };

  const completedExerciseIds =
    isCorrect && !wasAlreadySolved
      ? [...progress.completedExerciseIds, exercise.id]
      : progress.completedExerciseIds;

  let recentMistakes = progress.recentMistakes;
  let revisionSessionsCompleted = progress.revisionSessionsCompleted || 0;

  if (!isCorrect) {
    const newMistake = {
      exerciseId: exercise.id,
      promptFr:
        exercise.flawedSentence ||
        exercise.sentenceContext ||
        exercise.prompt.fr,
      userAnswer: userAnswer.trim(),
      correctAnswer: exercise.correctAnswer,
      grammarRuleTag: exercise.grammarRuleTag,
      timestamp: new Date().toISOString(),
    };
    recentMistakes = [
      newMistake,
      ...progress.recentMistakes.filter((m) => m.exerciseId !== exercise.id),
    ].slice(0, 15);
  } else if (wasInMistakes) {
    recentMistakes = progress.recentMistakes.filter(
      (m) => m.exerciseId !== exercise.id
    );
    revisionSessionsCompleted += 1;
  }

  const xpEvent: XPEvent = {
    id: `xp-ex-${exercise.id}-${Date.now()}`,
    type: isCorrect ? "exercise_correct" : "exercise_effort",
    amount: earnedXp,
    label: isCorrect
      ? {
          fr: `Réponse juste (${exercise.grammarRuleTag})`,
          en: `Correct answer (${exercise.grammarRuleTag})`,
          ar: `إجابة صحيحة (${exercise.grammarRuleTag})`,
        }
      : {
          fr: `Exercice pratiqué (${exercise.grammarRuleTag})`,
          en: `Practice effort (${exercise.grammarRuleTag})`,
          ar: `محاولة تدريب (${exercise.grammarRuleTag})`,
        },
    timestamp: new Date().toISOString(),
    dateStr: todayDateStr,
  };

  const xpHistory = [xpEvent, ...(progress.xpHistory || [])].slice(0, 40);

  const intermediate: UserProgress = {
    ...progress,
    completedExerciseIds,
    totalAttempts: progress.totalAttempts + 1,
    totalCorrect: progress.totalCorrect + (isCorrect ? 1 : 0),
    streakDays: streakUpdate.streakDays,
    bestStreakDays: streakUpdate.bestStreakDays,
    lastActiveDate: streakUpdate.lastActiveDate,
    streakFreezes: streakUpdate.streakFreezes,
    streakFreezeUsedDates: streakUpdate.streakFreezeUsedDates,
    xp: progress.xp + earnedXp,
    dailyHistory: {
      ...progress.dailyHistory,
      [todayDateStr]: updatedToday,
    },
    recentMistakes,
    revisionSessionsCompleted,
    xpHistory,
  };

  const settled = settleMissionsGoalsAndAchievements(
    intermediate,
    todayDateStr,
    dailyGoalMinutes
  );

  return settled.progress;
}

/**
 * Awards end-of-session accuracy and revision bonuses when a learner completes a practice set.
 */
export function completeExerciseSession(
  progress: UserProgress,
  sessionStats: { attempted: number; correct: number; isRevisionMode: boolean },
  todayDateStr: string,
  dailyGoalMinutes = 15
): {
  progress: UserProgress;
  bonusXp: number;
  isPerfect: boolean;
} {
  if (sessionStats.attempted <= 0) {
    return { progress, bonusXp: 0, isPerfect: false };
  }

  const pct = Math.round(
    (sessionStats.correct / sessionStats.attempted) * 100
  );
  const isPerfect = pct === 100 && sessionStats.attempted >= 1;
  const isHighAccuracy = pct >= 80;

  let bonusXp = 0;
  const xpHistory = [...(progress.xpHistory || [])];

  if (isPerfect) {
    bonusXp += 35;
    xpHistory.unshift({
      id: `xp-perfect-${Date.now()}`,
      type: "perfect_quiz",
      amount: 35,
      label: {
        fr: "Bonus sans faute (100 % de précision)",
        en: "Perfect quiz bonus (100% accuracy)",
        ar: "مكافأة الدقة الكاملة (١٠٠٪)",
      },
      timestamp: new Date().toISOString(),
      dateStr: todayDateStr,
    });
  } else if (isHighAccuracy) {
    bonusXp += 20;
    xpHistory.unshift({
      id: `xp-high-acc-${Date.now()}`,
      type: "session_bonus",
      amount: 20,
      label: {
        fr: `Bonus de précision (${pct} %)`,
        en: `High accuracy bonus (${pct}%)`,
        ar: `مكافأة الدقة العالية (${pct}٪)`,
      },
      timestamp: new Date().toISOString(),
      dateStr: todayDateStr,
    });
  }

  if (sessionStats.isRevisionMode) {
    bonusXp += 25;
    xpHistory.unshift({
      id: `xp-rev-${Date.now()}`,
      type: "revision_complete",
      amount: 25,
      label: {
        fr: "Séance de révision terminée",
        en: "Revision session completed",
        ar: "إتمام جلسة مراجعة",
      },
      timestamp: new Date().toISOString(),
      dateStr: todayDateStr,
    });
  }

  const existingToday =
    progress.dailyHistory[todayDateStr] ||
    createEmptyDailyActivity(todayDateStr);

  const updatedToday: DailyActivity = {
    ...existingToday,
    perfectSessionsCount:
      (existingToday.perfectSessionsCount || 0) + (isPerfect ? 1 : 0),
    highAccuracySessionsCount:
      (existingToday.highAccuracySessionsCount || 0) +
      (isHighAccuracy ? 1 : 0),
    revisionCount:
      (existingToday.revisionCount || 0) +
      (sessionStats.isRevisionMode ? 1 : 0),
  };

  const intermediate: UserProgress = {
    ...progress,
    xp: progress.xp + bonusXp,
    perfectQuizzesCount:
      (progress.perfectQuizzesCount || 0) + (isPerfect ? 1 : 0),
    revisionSessionsCompleted:
      (progress.revisionSessionsCompleted || 0) +
      (sessionStats.isRevisionMode ? 1 : 0),
    dailyHistory: {
      ...progress.dailyHistory,
      [todayDateStr]: updatedToday,
    },
    xpHistory: xpHistory.slice(0, 40),
  };

  const settled = settleMissionsGoalsAndAchievements(
    intermediate,
    todayDateStr,
    dailyGoalMinutes
  );

  return {
    progress: settled.progress,
    bonusXp: settled.progress.xp - progress.xp,
    isPerfect,
  };
}

/**
 * Safely migrates existing UserProgress from storage so all gamification fields exist
 * and pre-existing lessons/achievements are preserved.
 */
export function migrateUserProgress(
  saved: Partial<UserProgress> | null | undefined,
  defaults: UserProgress
): UserProgress {
  if (!saved) return defaults;
  const merged: UserProgress = {
    ...defaults,
    ...saved,
    completedLessonIds: Array.isArray(saved.completedLessonIds)
      ? saved.completedLessonIds
      : defaults.completedLessonIds,
    rewardedLessonIds: Array.isArray(saved.rewardedLessonIds)
      ? saved.rewardedLessonIds
      : Array.isArray(saved.completedLessonIds)
      ? saved.completedLessonIds
      : defaults.rewardedLessonIds,
    completedExerciseIds: Array.isArray(saved.completedExerciseIds)
      ? saved.completedExerciseIds
      : defaults.completedExerciseIds,
    dailyHistory:
      saved.dailyHistory && typeof saved.dailyHistory === "object"
        ? saved.dailyHistory
        : defaults.dailyHistory,
    recentMistakes: Array.isArray(saved.recentMistakes)
      ? saved.recentMistakes
      : defaults.recentMistakes,
    xpHistory: Array.isArray(saved.xpHistory)
      ? saved.xpHistory
      : defaults.xpHistory,
    unlockedAchievementIds:
      saved.unlockedAchievementIds &&
      typeof saved.unlockedAchievementIds === "object"
        ? saved.unlockedAchievementIds
        : defaults.unlockedAchievementIds,
    perfectQuizzesCount:
      typeof saved.perfectQuizzesCount === "number"
        ? saved.perfectQuizzesCount
        : defaults.perfectQuizzesCount,
    revisionSessionsCompleted:
      typeof saved.revisionSessionsCompleted === "number"
        ? saved.revisionSessionsCompleted
        : defaults.revisionSessionsCompleted,
    streakFreezes:
      typeof saved.streakFreezes === "number"
        ? saved.streakFreezes
        : defaults.streakFreezes,
    streakFreezeUsedDates: Array.isArray(saved.streakFreezeUsedDates)
      ? saved.streakFreezeUsedDates
      : defaults.streakFreezeUsedDates,
  };

  // Ensure already-met achievements are marked unlocked
  const evaluated = getAchievementsList(merged);
  const unlockedMap = { ...merged.unlockedAchievementIds };
  for (const ach of evaluated) {
    if (ach.unlocked && !unlockedMap[ach.id]) {
      unlockedMap[ach.id] = new Date().toISOString();
    }
  }
  merged.unlockedAchievementIds = unlockedMap;

  return merged;
}

/**
 * Filters lessons by category, CEFR level, and search query.
 */
export function filterLessons(
  lessons: Lesson[],
  category: LessonCategory | "all",
  level: CEFRLevel | "all",
  searchQuery: string
): Lesson[] {
  const q = searchQuery.trim().toLowerCase();
  return lessons.filter((lesson) => {
    if (category !== "all" && lesson.category !== category) return false;
    if (level !== "all" && lesson.level !== level) return false;
    if (!q) return true;
    return (
      lesson.title.fr.toLowerCase().includes(q) ||
      lesson.title.en.toLowerCase().includes(q) ||
      lesson.title.ar.toLowerCase().includes(q) ||
      lesson.FrenchSubtitle.toLowerCase().includes(q) ||
      lesson.summary.fr.toLowerCase().includes(q) ||
      lesson.summary.en.toLowerCase().includes(q)
    );
  });
}

/**
 * Recommends the next best lesson based on learner's CEFR level and uncompleted lessons.
 */
export function getRecommendedLesson(
  lessons: Lesson[],
  completedLessonIds: string[],
  learnerLevel: CEFRLevel
): Lesson {
  const levelMatchUncompleted = lessons.find(
    (l) => l.level === learnerLevel && !completedLessonIds.includes(l.id)
  );
  if (levelMatchUncompleted) return levelMatchUncompleted;

  const anyUncompleted = lessons.find(
    (l) => !completedLessonIds.includes(l.id)
  );
  return anyUncompleted || lessons[0];
}
