export type UILanguage = "fr" | "en" | "ar";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2";

export type LessonCategory =
  | "grammar"
  | "vocabulary"
  | "conjugation"
  | "construction"
  | "mistakes";

export type ExerciseType =
  | "multiple-choice"
  | "fill-blank"
  | "correction"
  | "translation";

export interface LocalizedText {
  fr: string;
  en: string;
  ar: string;
}

export interface MistakeComparison {
  wrong: string;
  right: string;
  why: LocalizedText;
}

export interface LessonRule {
  heading: LocalizedText;
  explanation: LocalizedText;
  exampleFrench: string;
  exampleTranslation: LocalizedText;
}

export interface Lesson {
  id: string;
  title: LocalizedText;
  FrenchSubtitle: string;
  category: LessonCategory;
  level: CEFRLevel;
  durationMinutes: number;
  summary: LocalizedText;
  rules: LessonRule[];
  commonMistakes: MistakeComparison[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  category: LessonCategory;
  level: CEFRLevel;
  type: ExerciseType;
  prompt: LocalizedText;
  sentenceContext?: string;
  flawedSentence?: string;
  sourceSentence?: LocalizedText;
  options?: string[];
  wordBank?: string[];
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: LocalizedText;
  grammarRuleTag: string;
}

export interface MistakeRecord {
  exerciseId: string;
  promptFr: string;
  userAnswer: string;
  correctAnswer: string;
  grammarRuleTag: string;
  timestamp: string;
}

export type XPEventType =
  | "lesson_complete"
  | "exercise_correct"
  | "exercise_effort"
  | "session_bonus"
  | "perfect_quiz"
  | "revision_complete"
  | "daily_goal"
  | "daily_mission"
  | "streak_shield_used";

export interface XPEvent {
  id: string;
  type: XPEventType;
  amount: number;
  label: LocalizedText;
  timestamp: string;
  dateStr: string;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD (local calendar date)
  minutesCompleted: number;
  exercisesCompleted: number;
  correctCount: number;
  lessonsCompletedCount?: number;
  revisionCount?: number;
  perfectSessionsCount?: number;
  highAccuracySessionsCount?: number;
  completedMissionIds?: string[];
  dailyGoalRewarded?: boolean;
  streakFreezeApplied?: boolean;
}

export interface LearnerLevelInfo {
  level: number;
  title: LocalizedText;
  minXp: number;
  nextLevelXp: number | null;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export interface DailyMission {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  current: number;
  target: number;
  xpReward: number;
  completed: boolean;
  rewarded: boolean;
}

export interface AchievementDefinition {
  id: string;
  iconName:
    | "book"
    | "sparkles"
    | "flame"
    | "target"
    | "rotate"
    | "trending"
    | "check"
    | "award";
  title: LocalizedText;
  description: LocalizedText;
  conditionLabel: LocalizedText;
  currentValue: number;
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GamificationNotification {
  id: string;
  kind: "xp" | "level_up" | "achievement" | "mission" | "streak_shield";
  title: string;
  subtitle?: string;
  xpAmount?: number;
}

export interface UserProgress {
  completedLessonIds: string[];
  rewardedLessonIds: string[];
  completedExerciseIds: string[];
  totalAttempts: number;
  totalCorrect: number;
  streakDays: number;
  bestStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  xp: number;
  dailyHistory: Record<string, DailyActivity>;
  recentMistakes: MistakeRecord[];
  xpHistory: XPEvent[];
  unlockedAchievementIds: Record<string, string>; // achievementId -> ISO timestamp
  perfectQuizzesCount: number;
  revisionSessionsCompleted: number;
  streakFreezes: number;
  streakFreezeUsedDates: string[];
}

export interface UserSettings {
  learnerName: string;
  uiLanguage: UILanguage;
  level: CEFRLevel;
  dailyGoalMinutes: number;
  darkMode: boolean;
  audioEnabled: boolean;
}

export interface CoachMessage {
  id: string;
  role: "user" | "coach";
  text: string;
  examples?: Array<{
    french: string;
    translation: string;
    note: string;
  }>;
  tip?: string;
  timestamp: string;
}

export type ActiveTab =
  | "home"
  | "lessons"
  | "exercises"
  | "progress"
  | "coach"
  | "profile";
