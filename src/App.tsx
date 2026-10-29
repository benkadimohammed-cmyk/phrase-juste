/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Award, CheckCircle2, Sparkles, X } from "lucide-react";
import { User } from "firebase/auth";
import {
  ActiveTab,
  AuthAccount,
  Exercise,
  ExerciseType,
  GamificationNotification,
  Lesson,
  UserProgress,
  UserSettings,
} from "./types/learning";
import { EXERCISES_DATA, LESSONS_DATA } from "./data/curriculum";
import { TRANSLATIONS } from "./i18n/translations";
import {
  completeExerciseSession,
  getLearnerLevelInfo,
  getLocalDateString,
  getRecommendedLesson,
  migrateUserProgress,
  recordExerciseAttempt,
  toggleLessonCompletion,
} from "./utils/learningLogic";
import {
  getActiveAuthAccount,
  saveLearnerCloudState,
  signInWithGoogleDirect,
  signOutLearner,
  subscribeAuthAccountChanges,
  subscribeAuthChanges,
  subscribeLearnerCloudState,
  testFirebaseConnection,
} from "./firebase";
import { getApiUrl } from "./utils/apiConfig";
import { Navbar } from "./components/Navbar";
import { HomeView } from "./components/HomeView";
import { LessonsView } from "./components/LessonsView";
import { ExerciseView } from "./components/ExerciseView";
import { ProgressView } from "./components/ProgressView";
import { CoachView } from "./components/CoachView";
import { ProfileView } from "./components/ProfileView";
import { AuthModal } from "./components/AuthModal";

const STORAGE_KEY_PROGRESS = "phrase_juste_progress_v1";
const STORAGE_KEY_SETTINGS = "phrase_juste_settings_v1";

const DEFAULT_SETTINGS: UserSettings = {
  learnerName: "Camille",
  uiLanguage: "fr",
  level: "A2",
  dailyGoalMinutes: 15,
  darkMode: false,
  audioEnabled: true,
  speechRate: 0.95,
  learningObjective: "conversation",
  learnerBio: "Passionné par la précision de la langue française et la richesse de ses expressions.",
};

function buildDefaultProgress(todayStr: string): UserProgress {
  return {
    completedLessonIds: ["les-grammar-articles"],
    rewardedLessonIds: ["les-grammar-articles"],
    completedExerciseIds: ["ex-mc-1", "ex-fb-1"],
    totalAttempts: 6,
    totalCorrect: 5,
    streakDays: 4,
    bestStreakDays: 7,
    lastActiveDate: todayStr,
    xp: 185,
    dailyHistory: {
      "2026-10-26": {
        date: "2026-10-26",
        minutesCompleted: 12,
        exercisesCompleted: 6,
        correctCount: 5,
      },
      "2026-10-27": {
        date: "2026-10-27",
        minutesCompleted: 16,
        exercisesCompleted: 8,
        correctCount: 7,
      },
      "2026-10-28": {
        date: "2026-10-28",
        minutesCompleted: 14,
        exercisesCompleted: 7,
        correctCount: 6,
      },
      [todayStr]: {
        date: todayStr,
        minutesCompleted: 8,
        exercisesCompleted: 4,
        correctCount: 3,
        lessonsCompletedCount: 1,
        revisionCount: 1,
        completedMissionIds: ["mission-lesson-1"],
      },
    },
    recentMistakes: [
      {
        exerciseId: "ex-cor-1",
        promptFr: "Dimanche dernier, j'ai visité ma grand-mère.",
        userAnswer: "J'ai visité ma grand-mère dimanche dernier.",
        correctAnswer: "Dimanche dernier, j'ai rendu visite à ma grand-mère.",
        grammarRuleTag: "Visiter vs. Rendre visite à",
        timestamp: "2026-10-28T18:00:00.000Z",
      },
    ],
    xpHistory: [
      {
        id: "seed-xp-1",
        type: "lesson_complete",
        amount: 35,
        label: {
          fr: "Leçon terminée : Articles partitifs et adverbes de quantité",
          en: "Lesson completed: Partitive Articles & Expressions of Quantity",
          ar: "إكمال درس: أدوات التبعيض وظروف الكمية",
        },
        timestamp: "2026-10-29T09:00:00.000Z",
        dateStr: todayStr,
      },
      {
        id: "seed-xp-2",
        type: "daily_mission",
        amount: 35,
        label: {
          fr: "Mission accomplie : Étudier une leçon complète",
          en: "Daily mission: Complete One Lesson",
          ar: "مهمة يومية: إكمال درس واحد",
        },
        timestamp: "2026-10-29T09:00:01.000Z",
        dateStr: todayStr,
      },
    ],
    unlockedAchievementIds: {
      "first-lesson": "2026-10-29T09:00:00.000Z",
      "streak-7": "2026-10-28T18:00:00.000Z",
    },
    perfectQuizzesCount: 0,
    revisionSessionsCompleted: 0,
    streakFreezes: 1,
    streakFreezeUsedDates: [],
  };
}

export default function App() {
  const [todayStr, setTodayStr] = useState<string>(() => getLocalDateString());
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(() =>
    getActiveAuthAccount()
  );
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const applyingCloudSnapshotRef = useRef<boolean>(false);

  // Verify Firestore connection and subscribe to Firebase + Local Auth state
  useEffect(() => {
    testFirebaseConnection();
    const unsubAuth = subscribeAuthChanges((user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    const unsubAccount = subscribeAuthAccountChanges((acc) => {
      setAuthAccount(acc);
      setAuthLoading(false);
    });
    return () => {
      unsubAuth();
      unsubAccount();
    };
  }, []);

  // Periodically check local midnight rollover
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getLocalDateString();
      if (current !== todayStr) {
        setTodayStr(current);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [todayStr]);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [progress, setProgress] = useState<UserProgress>(() => {
    const defaults = buildDefaultProgress(getLocalDateString());
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return saved
        ? migrateUserProgress(JSON.parse(saved), defaults)
        : defaults;
    } catch {
      return defaults;
    }
  });

  // Subscribe to Firestore user document when signed in
  useEffect(() => {
    if (!authUser) return;
    const defaults = buildDefaultProgress(todayStr);
    const unsubDoc = subscribeLearnerCloudState(authUser.uid, (cloud) => {
      applyingCloudSnapshotRef.current = true;
      if (cloud.settings) {
        setSettings((prev) => ({ ...prev, ...cloud.settings }));
      }
      if (cloud.progress) {
        setProgress((prev) => {
          const migrated = migrateUserProgress(cloud.progress, defaults);
          return migrated.xp >= prev.xp ? migrated : prev;
        });
      }
      setTimeout(() => {
        applyingCloudSnapshotRef.current = false;
      }, 150);
    });
    return () => unsubDoc();
  }, [authUser, todayStr]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [exerciseFilterLessonId, setExerciseFilterLessonId] = useState<
    string | null
  >(null);
  const [exerciseMistakesOnly, setExerciseMistakesOnly] = useState(false);
  const [exerciseInitialType, setExerciseInitialType] = useState<
    ExerciseType | "all"
  >("all");
  const [notifications, setNotifications] = useState<
    GamificationNotification[]
  >([]);

  const pushNotification = (notif: Omit<GamificationNotification, "id">) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setNotifications((prev) => [{ ...notif, id }, ...prev].slice(0, 3));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
    const targetAccount = authUser || authAccount;
    if (targetAccount && !applyingCloudSnapshotRef.current) {
      saveLearnerCloudState(targetAccount, settings, progress);
    }
  }, [settings, authUser, authAccount]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
      fetch(getApiUrl("/api/progress/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      }).catch(() => {
        // Offline resilience
      });
    } catch {
      // Ignore storage quota errors
    }
    const targetAccount = authUser || authAccount;
    if (targetAccount && !applyingCloudSnapshotRef.current) {
      saveLearnerCloudState(targetAccount, settings, progress);
    }
  }, [progress, authUser, authAccount]);

  // Synchronize Dark Mode and RTL / language attributes on documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.lang = settings.uiLanguage;
    root.dir = settings.uiLanguage === "ar" ? "rtl" : "ltr";
  }, [settings.darkMode, settings.uiLanguage]);

  const t = TRANSLATIONS[settings.uiLanguage];
  const recommendedLesson = getRecommendedLesson(
    LESSONS_DATA,
    progress.completedLessonIds,
    settings.level
  );
  const todayMinutes =
    progress.dailyHistory[todayStr]?.minutesCompleted || 0;

  const handleLogQuickStudyMinutes = (minutesToAdd: number) => {
    const prevDay = progress.dailyHistory[todayStr] || {
      date: todayStr,
      minutesCompleted: 0,
      exercisesCompleted: 0,
      correctCount: 0,
      lessonsCompletedCount: 0,
      revisionCount: 0,
      completedMissionIds: [],
    };
    const wasBelowGoal = prevDay.minutesCompleted < settings.dailyGoalMinutes;
    const newMinutes = prevDay.minutesCompleted + minutesToAdd;
    const reachedGoalNow =
      wasBelowGoal && newMinutes >= settings.dailyGoalMinutes;

    const bonusXp = 15 + (reachedGoalNow ? 40 : 0);
    const updatedXp = progress.xp + bonusXp;

    const newEvent = {
      id: `xp-quick-${Date.now()}`,
      type: reachedGoalNow ? ("daily_goal" as const) : ("revision_complete" as const),
      amount: bonusXp,
      label: {
        fr: reachedGoalNow
          ? "Objectif quotidien atteint (+40 XP bonus)"
          : `Session d'étude rapide (+${minutesToAdd} min)`,
        en: reachedGoalNow
          ? "Daily goal reached (+40 XP bonus)"
          : `Quick study session (+${minutesToAdd} min)`,
        ar: reachedGoalNow
          ? "تم تحقيق الهدف اليومي (+٤٠ XP)"
          : `جلسة مراجعة سريعة (+${minutesToAdd} دقائق)`,
      },
      timestamp: new Date().toISOString(),
      dateStr: todayStr,
    };

    setProgress((prev) => ({
      ...prev,
      xp: updatedXp,
      lastActiveDate: todayStr,
      dailyHistory: {
        ...prev.dailyHistory,
        [todayStr]: {
          ...prevDay,
          minutesCompleted: newMinutes,
        },
      },
      xpHistory: [newEvent, ...(prev.xpHistory || [])].slice(0, 30),
    }));

    pushNotification({
      kind: "xp",
      title: newEvent.label[settings.uiLanguage],
      xpAmount: bonusXp,
    });
  };

  const handleToggleLessonComplete = (lesson: Lesson) => {
    const result = toggleLessonCompletion(
      progress,
      lesson.id,
      lesson.title,
      todayStr,
      settings.dailyGoalMinutes,
      LESSONS_DATA.length
    );

    setProgress(result.progress);

    if (result.xpAwarded > 0) {
      fetch(getApiUrl("/api/progress/validate-award"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: `lesson-${lesson.id}`,
          type: "lesson_complete",
          requestedXp: result.xpAwarded,
        }),
      }).catch(() => {});

      pushNotification({
        kind: "xp",
        title: lesson.title[settings.uiLanguage],
        xpAmount: result.xpAwarded,
      });
    }

    if (result.leveledUpTo) {
      pushNotification({
        kind: "level_up",
        title: `${t.gamification.levelUpAnnouncement} (${t.gamification.levelLabel} ${result.leveledUpTo.level})`,
        subtitle: result.leveledUpTo.title[settings.uiLanguage],
      });
    }

    for (const ach of result.newlyUnlockedAchievements) {
      pushNotification({
        kind: "achievement",
        title: `${t.gamification.milestoneReached}: ${ach.title[settings.uiLanguage]}`,
        subtitle: ach.description[settings.uiLanguage],
      });
    }
  };

  const handleStartLessonExercises = (lessonId: string) => {
    setExerciseFilterLessonId(lessonId);
    setExerciseMistakesOnly(false);
    setExerciseInitialType("all");
    setActiveTab("exercises");
  };

  const handleStartFilteredExercise = (
    mode: "all" | "mistakes" | "correction"
  ) => {
    setExerciseFilterLessonId(null);
    if (mode === "mistakes") {
      setExerciseMistakesOnly(true);
      setExerciseInitialType("all");
    } else if (mode === "correction") {
      setExerciseMistakesOnly(false);
      setExerciseInitialType("correction");
    } else {
      setExerciseMistakesOnly(false);
      setExerciseInitialType("all");
    }
    setActiveTab("exercises");
  };

  const handleAttemptRecorded = (
    exercise: Exercise,
    userAnswer: string,
    isCorrect: boolean
  ) => {
    const prevLevel = getLearnerLevelInfo(progress.xp).level;
    const prevUnlocked = { ...(progress.unlockedAchievementIds || {}) };

    const updated = recordExerciseAttempt(
      progress,
      exercise,
      userAnswer,
      isCorrect,
      todayStr,
      settings.dailyGoalMinutes,
      exerciseMistakesOnly
    );

    setProgress(updated);

    const newLevelInfo = getLearnerLevelInfo(updated.xp);
    if (newLevelInfo.level > prevLevel) {
      pushNotification({
        kind: "level_up",
        title: `${t.gamification.levelUpAnnouncement} (${t.gamification.levelLabel} ${newLevelInfo.level})`,
        subtitle: newLevelInfo.title[settings.uiLanguage],
      });
    }

    const newlyUnlockedIds = Object.keys(
      updated.unlockedAchievementIds || {}
    ).filter((id) => !prevUnlocked[id]);
    if (newlyUnlockedIds.length > 0) {
      pushNotification({
        kind: "achievement",
        title: t.gamification.milestoneReached,
        xpAmount: updated.xp - progress.xp,
      });
    }
  };

  const handleSessionCompleted = (stats: {
    attempted: number;
    correct: number;
    isRevisionMode: boolean;
  }): number => {
    const prevLevel = getLearnerLevelInfo(progress.xp).level;
    const res = completeExerciseSession(
      progress,
      stats,
      todayStr,
      settings.dailyGoalMinutes
    );
    setProgress(res.progress);

    if (res.bonusXp > 0) {
      pushNotification({
        kind: "xp",
        title: t.exercises.sessionComplete,
        xpAmount: res.bonusXp,
      });
    }

    const newLevelInfo = getLearnerLevelInfo(res.progress.xp);
    if (newLevelInfo.level > prevLevel) {
      pushNotification({
        kind: "level_up",
        title: `${t.gamification.levelUpAnnouncement} (${t.gamification.levelLabel} ${newLevelInfo.level})`,
        subtitle: newLevelInfo.title[settings.uiLanguage],
      });
    }

    return res.bonusXp;
  };

  const handleUpdateSettings = (updated: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleResetProgress = () => {
    const freshProgress: UserProgress = {
      completedLessonIds: [],
      rewardedLessonIds: [],
      completedExerciseIds: [],
      totalAttempts: 0,
      totalCorrect: 0,
      streakDays: 0,
      bestStreakDays: 0,
      lastActiveDate: "",
      xp: 0,
      dailyHistory: {},
      recentMistakes: [],
      xpHistory: [],
      unlockedAchievementIds: {},
      perfectQuizzesCount: 0,
      revisionSessionsCompleted: 0,
      streakFreezes: 1,
      streakFreezeUsedDates: [],
    };
    setProgress(freshProgress);
  };

  const handleAuthenticated = (account: AuthAccount) => {
    setAuthAccount(account);
    if (account.displayName) {
      setSettings((prev) => ({
        ...prev,
        learnerName: account.displayName || prev.learnerName,
      }));
    }
    pushNotification({
      kind: "xp",
      title: `Connecté : ${account.email}`,
      subtitle:
        account.provider === "google"
          ? "Compte Google synchronisé"
          : "Compte E-mail synchronisé",
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const account = await signInWithGoogleDirect(
        "insergent01@gmail.com",
        settings.learnerName !== "Camille" ? settings.learnerName : "Mohammed",
        false
      );
      handleAuthenticated(account);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutLearner();
      setAuthAccount(null);
    } catch (error) {
      console.error("Sign-Out failed:", error);
    }
  };

  // Compute active exercise deck
  let activeExercises = EXERCISES_DATA;
  if (exerciseFilterLessonId) {
    const byLesson = EXERCISES_DATA.filter(
      (e) => e.lessonId === exerciseFilterLessonId
    );
    if (byLesson.length > 0) activeExercises = byLesson;
  } else if (exerciseMistakesOnly && progress.recentMistakes.length > 0) {
    const mistakeIds = progress.recentMistakes.map((m) => m.exerciseId);
    const byMistake = EXERCISES_DATA.filter((e) => mistakeIds.includes(e.id));
    if (byMistake.length > 0) activeExercises = byMistake;
  }

  return (
    <div
      dir={settings.uiLanguage === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-12 transition-colors"
    >
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === "exercises") {
            setExerciseFilterLessonId(null);
            setExerciseMistakesOnly(false);
          }
          setActiveTab(tab);
        }}
        onStartQuickPractice={() => handleStartFilteredExercise("all")}
        t={t}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        uiLanguage={settings.uiLanguage}
        currentLearnerName={settings.learnerName}
        onAuthenticated={handleAuthenticated}
      />

      {/* Restrained Gamification Notifications (XP, Level-Up, Achievements) */}
      {notifications.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 end-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
        >
          {notifications.map((n) => (
            <div
              key={n.id}
              className="pointer-events-auto bg-slate-900 dark:bg-blue-950 text-white border border-slate-700 dark:border-blue-700 rounded-xl p-3.5 shadow-lg flex items-center justify-between gap-3 transition-transform"
            >
              <div className="flex items-center gap-2.5">
                {n.kind === "level_up" ? (
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                ) : n.kind === "achievement" ? (
                  <Award className="w-5 h-5 text-blue-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div className="text-xs">
                  <p className="font-bold">{n.title}</p>
                  {n.subtitle && (
                    <p className="text-slate-300 mt-0.5">{n.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.xpAmount && n.xpAmount > 0 && (
                  <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                    +{n.xpAmount} XP
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((prev) =>
                      prev.filter((item) => item.id !== n.id)
                    )
                  }
                  aria-label="Fermer la notification"
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {activeTab === "home" && (
          <HomeView
            settings={settings}
            progress={progress}
            recommendedLesson={recommendedLesson}
            todayDateStr={todayStr}
            todayMinutes={todayMinutes}
            authAccount={authAccount}
            t={t}
            onNavigate={setActiveTab}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenLesson={(lesson) => {
              setSelectedLesson(lesson);
              setActiveTab("lessons");
            }}
            onStartLessonExercises={handleStartLessonExercises}
            onStartFilteredExercise={handleStartFilteredExercise}
            onUpdateGoalMinutes={(mins) =>
              handleUpdateSettings({ dailyGoalMinutes: mins })
            }
            onLogQuickStudyMinutes={handleLogQuickStudyMinutes}
          />
        )}

        {activeTab === "lessons" && (
          <LessonsView
            lessons={LESSONS_DATA}
            completedLessonIds={progress.completedLessonIds}
            rewardedLessonIds={progress.rewardedLessonIds || []}
            uiLanguage={settings.uiLanguage}
            audioEnabled={settings.audioEnabled}
            selectedLesson={selectedLesson}
            t={t}
            onSelectLesson={setSelectedLesson}
            onToggleLessonComplete={handleToggleLessonComplete}
            onStartLessonPractice={handleStartLessonExercises}
          />
        )}

        {activeTab === "exercises" && (
          <ExerciseView
            exercises={activeExercises}
            initialFilterType={exerciseInitialType}
            isRevisionMode={exerciseMistakesOnly}
            uiLanguage={settings.uiLanguage}
            audioEnabled={settings.audioEnabled}
            t={t}
            onAttemptRecorded={handleAttemptRecorded}
            onSessionCompleted={handleSessionCompleted}
            onBackHome={() => setActiveTab("home")}
          />
        )}

        {activeTab === "progress" && (
          <ProgressView
            progress={progress}
            lessons={LESSONS_DATA}
            exercises={EXERCISES_DATA}
            todayDateStr={todayStr}
            dailyGoalMinutes={settings.dailyGoalMinutes}
            uiLanguage={settings.uiLanguage}
            t={t}
            onPracticeMistakes={() => handleStartFilteredExercise("mistakes")}
          />
        )}

        {activeTab === "coach" && (
          <CoachView
            level={settings.level}
            uiLanguage={settings.uiLanguage}
            audioEnabled={settings.audioEnabled}
            speechRate={settings.speechRate ?? 0.95}
            t={t}
          />
        )}

        {activeTab === "profile" && (
          <ProfileView
            settings={settings}
            progress={progress}
            totalLessonsCount={LESSONS_DATA.length}
            t={t}
            authAccount={authAccount}
            authUserEmail={authAccount?.email || authUser?.email || null}
            authLoading={authLoading}
            onSignInGoogle={handleGoogleSignIn}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onAuthenticated={handleAuthenticated}
            onSignOut={handleSignOut}
            onUpdateSettings={handleUpdateSettings}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>
    </div>
  );
}

