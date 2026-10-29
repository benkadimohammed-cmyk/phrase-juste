import { LessonCategory, UILanguage } from "../types/learning";

export interface UIStrings {
  appName: string;
  tagline: string;
  nav: {
    home: string;
    lessons: string;
    exercises: string;
    progress: string;
    coach: string;
    profile: string;
    startPractice: string;
  };
  gamification: {
    levelLabel: string;
    xpToNextLevel: string;
    maxLevelReached: string;
    recentXpEarned: string;
    dailyMissionsTitle: string;
    dailyMissionsSubtitle: string;
    missionCompleted: string;
    missionInProgress: string;
    streakCalendarTitle: string;
    streakRuleExplanation: string;
    streakShieldLabel: string;
    streakShieldExplanation: string;
    currentStreakLabel: string;
    longestStreakLabel: string;
    activeDayLegend: string;
    shieldDayLegend: string;
    xpHistoryTitle: string;
    xpHistoryEmpty: string;
    levelTiersTitle: string;
    unlockedLabel: string;
    lockedLabel: string;
    milestoneReached: string;
    levelUpAnnouncement: string;
    alreadyRewardedNote: string;
  };
  home: {
    welcomeBack: string;
    dailyGoal: string;
    minutesToday: string;
    goalReached: string;
    keepGoing: string;
    goalRemainingMinutes: string;
    quickGoalTarget: string;
    logQuickStudy: string;
    streakDays: string;
    accuracy: string;
    completedLessons: string;
    recommendedForYou: string;
    startLesson: string;
    practiceNow: string;
    quickActions: string;
    actionMistakes: string;
    actionMistakesDesc: string;
    actionCorrection: string;
    actionCorrectionDesc: string;
    actionCoach: string;
    actionCoachDesc: string;
    actionDailyMix: string;
    actionDailyMixDesc: string;
    mistakeOfTheDay: string;
    dontSay: string;
    sayInstead: string;
  };
  categories: Record<LessonCategory | "all", string>;
  lessons: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allLevels: string;
    minutes: string;
    completed: string;
    studyLesson: string;
    practiceLesson: string;
    keyRules: string;
    commonMistakesTitle: string;
    markComplete: string;
    markedComplete: string;
    listenPronunciation: string;
    noLessonsFound: string;
    resetFilters: string;
  };
  exercises: {
    title: string;
    subtitle: string;
    allTypes: string;
    typeMultipleChoice: string;
    typeFillBlank: string;
    typeCorrection: string;
    typeTranslation: string;
    questionOf: string;
    checkAnswer: string;
    nextQuestion: string;
    finishSession: string;
    correctBanner: string;
    incorrectBanner: string;
    accentWarning: string;
    correctSolutionLabel: string;
    ruleExplanationLabel: string;
    typeYourAnswer: string;
    clearWords: string;
    sessionComplete: string;
    sessionScore: string;
    xpEarned: string;
    practiceAgain: string;
    reviewMistakes: string;
    backToHome: string;
  };
  progress: {
    title: string;
    subtitle: string;
    weeklyActivity: string;
    categoryMastery: string;
    achievements: string;
    hallOfFameTitle: string;
    hallOfFameSubtitle: string;
    unlockConditionLabel: string;
    filterAllAchievements: string;
    filterEarnedAchievements: string;
    filterLockedAchievements: string;
    earnedOnLabel: string;
    notEarnedYetLabel: string;
    recentMistakesTitle: string;
    noMistakesYet: string;
    practiceMistakesBtn: string;
    totalXp: string;
    bestStreak: string;
    exercisesSolved: string;
  };
  coach: {
    title: string;
    subtitle: string;
    modeChat: string;
    modeVoice: string;
    modeChecker: string;
    inputPlaceholder: string;
    send: string;
    clearChat: string;
    thinking: string;
    starter1: string;
    starter2: string;
    starter3: string;
    starter4: string;
    voiceTitle: string;
    voiceSubtitle: string;
    startVoiceBtn: string;
    stopVoiceBtn: string;
    voiceConnected: string;
    voiceIdle: string;
    checkerTitle: string;
    checkerPlaceholder: string;
    checkSentenceBtn: string;
    sentenceValid: string;
    sentenceNeedsFix: string;
    suggestedCorrection: string;
  };
  profile: {
    title: string;
    subtitle: string;
    cloudAccountTitle: string;
    cloudAccountSubtitle: string;
    signInGoogle: string;
    signOut: string;
    cloudSyncedAs: string;
    learnerName: string;
    interfaceLanguage: string;
    learningLevel: string;
    dailyGoal: string;
    minutesPerDay: string;
    appearance: string;
    lightMode: string;
    darkMode: string;
    audioPronunciation: string;
    enabled: string;
    disabled: string;
    saveChanges: string;
    savedConfirmation: string;
    resetProgress: string;
    resetConfirmPrompt: string;
    confirmReset: string;
    cancel: string;
  };
}

export const TRANSLATIONS: Record<UILanguage, UIStrings> = {
  fr: {
    appName: "Phrase juste",
    tagline: "Maîtrisez la précision et l'élégance du français",
    nav: {
      home: "Accueil",
      lessons: "Leçons",
      exercises: "Exercices",
      progress: "Progrès",
      coach: "Coach IA",
      profile: "Profil",
      startPractice: "S'entraîner",
    },
    gamification: {
      levelLabel: "Niveau",
      xpToNextLevel: "XP avant le niveau suivant",
      maxLevelReached: "Rang maximal atteint",
      recentXpEarned: "Dernier gain",
      dailyMissionsTitle: "Missions du jour",
      dailyMissionsSubtitle: "3 défis renouvelés chaque jour à minuit (récompensés une fois par jour)",
      missionCompleted: "Accomplie",
      missionInProgress: "En cours",
      streakCalendarTitle: "Calendrier d'assiduité (28 jours)",
      streakRuleExplanation: "Comment fonctionne la série : terminez au moins 1 leçon ou 1 exercice interactif avant minuit (heure locale) pour valider votre journée.",
      streakShieldLabel: "Bouclier de série",
      streakShieldExplanation: "Protège automatiquement votre série si vous manquez 1 journée isolée. Vous gagnez +1 bouclier (max 2) tous les 7 jours de série.",
      currentStreakLabel: "Série actuelle",
      longestStreakLabel: "Record de série",
      activeDayLegend: "Jour validé",
      shieldDayLegend: "Protégé par bouclier",
      xpHistoryTitle: "Journal des gains d'expérience (XP)",
      xpHistoryEmpty: "Aucune activité enregistrée pour le moment.",
      levelTiersTitle: "Échelle des rangs d'apprenant",
      unlockedLabel: "Débloqué",
      lockedLabel: "Verrouillé",
      milestoneReached: "Distinction débloquée",
      levelUpAnnouncement: "Nouveau rang atteint !",
      alreadyRewardedNote: "XP déjà attribués pour cette leçon",
    },
    home: {
      welcomeBack: "Bonjour",
      dailyGoal: "Objectif quotidien",
      minutesToday: "min aujourd'hui",
      goalReached: "Objectif du jour atteint (+40 XP)",
      keepGoing: "Continuez votre série quotidienne",
      goalRemainingMinutes: "min restantes pour le bonus +40 XP",
      quickGoalTarget: "Cible :",
      logQuickStudy: "+5 min de révision (+15 XP)",
      streakDays: "Jours de série",
      accuracy: "Précision",
      completedLessons: "Leçons terminées",
      recommendedForYou: "Leçon recommandée pour votre niveau",
      startLesson: "Étudier la leçon",
      practiceNow: "S'entraîner",
      quickActions: "Entraînement ciblé",
      actionMistakes: "Corriger mes erreurs",
      actionMistakesDesc: "Révisez les phrases qui vous ont posé problème",
      actionCorrection: "Chasse aux fautes",
      actionCorrectionDesc: "Transformez les tournures maladroites en phrases justes",
      actionCoach: "Coach grammatical IA",
      actionCoachDesc: "Posez une question ou vérifiez une phrase instantanément",
      actionDailyMix: "Défi synthèse",
      actionDailyMixDesc: "5 exercices variés adaptés à votre niveau",
      mistakeOfTheDay: "La nuance du jour",
      dontSay: "Ne dites pas",
      sayInstead: "Dites plutôt",
    },
    categories: {
      all: "Toutes",
      grammar: "Grammaire",
      vocabulary: "Vocabulaire",
      conjugation: "Conjugaison",
      construction: "Syntaxe",
      mistakes: "Erreurs fréquentes",
    },
    lessons: {
      title: "Bibliothèque de leçons",
      subtitle: "Règles claires, exemples authentiques et pièges à éviter",
      searchPlaceholder: "Rechercher un sujet (ex. subjonctif, visiter...)",
      allLevels: "Tous niveaux",
      minutes: "min",
      completed: "Terminée",
      studyLesson: "Ouvrir la leçon",
      practiceLesson: "Faire les exercices",
      keyRules: "Règles essentielles & exemples",
      commonMistakesTitle: "Phrase fausse vs. Phrase juste",
      markComplete: "Valider la leçon (+30 XP)",
      markedComplete: "Leçon validée",
      listenPronunciation: "Écouter",
      noLessonsFound: "Aucune leçon ne correspond à vos filtres.",
      resetFilters: "Réinitialiser les filtres",
    },
    exercises: {
      title: "Atelier d'exercices",
      subtitle: "Pratiquez la précision grammaticale avec explications immédiates",
      allTypes: "Tous les formats",
      typeMultipleChoice: "Choix multiple",
      typeFillBlank: "Texte à trous",
      typeCorrection: "Correction de phrase",
      typeTranslation: "Construction & Traduction",
      questionOf: "Question",
      checkAnswer: "Vérifier la réponse",
      nextQuestion: "Question suivante",
      finishSession: "Voir le bilan",
      correctBanner: "Exact — Phrase juste !",
      incorrectBanner: "Attention à la règle",
      accentWarning: "Réponse acceptée, mais pensez aux accents en français :",
      correctSolutionLabel: "Formulation attendue :",
      ruleExplanationLabel: "Explication grammaticale :",
      typeYourAnswer: "Écrivez la phrase ou le mot exact en français...",
      clearWords: "Effacer",
      sessionComplete: "Série d'exercices terminée",
      sessionScore: "Score de précision",
      xpEarned: "Points d'expérience gagnés",
      practiceAgain: "Nouvelle série",
      reviewMistakes: "Revoir mes erreurs",
      backToHome: "Retour à l'accueil",
    },
    progress: {
      title: "Progrès & Récompenses",
      subtitle: "Rangs d'expérience, calendrier de série, missions du jour et Hall of Fame",
      weeklyActivity: "Activité des 7 derniers jours (minutes)",
      categoryMastery: "Maîtrise par compétence",
      achievements: "Distinctions & Succès déblocables",
      hallOfFameTitle: "Hall of Fame — Panthéon des distinctions",
      hallOfFameSubtitle: "Collection complète des jalons d'excellence, conditions d'obtention et statut de déblocage",
      unlockConditionLabel: "Condition d'obtention",
      filterAllAchievements: "Toutes",
      filterEarnedAchievements: "Obtenues",
      filterLockedAchievements: "À débloquer",
      earnedOnLabel: "Obtenue le",
      notEarnedYetLabel: "En progression",
      recentMistakesTitle: "Carnet d'erreurs à retravailler",
      noMistakesYet: "Aucune erreur enregistrée récemment. Excellent travail !",
      practiceMistakesBtn: "S'entraîner sur ces erreurs (+25 XP bonus)",
      totalXp: "Total XP",
      bestStreak: "Meilleure série",
      exercisesSolved: "Exercices réussis",
    },
    coach: {
      title: "Coach de français IA",
      subtitle: "Tuteur conversationnel, pratique vocale en direct et vérificateur de phrases",
      modeChat: "Tuteur écrit",
      modeVoice: "Conversation vocale",
      modeChecker: "Vérificateur",
      inputPlaceholder: "Posez une question de grammaire ou de vocabulaire...",
      send: "Envoyer",
      clearChat: "Nouvelle discussion",
      thinking: "Analyse grammaticale en cours...",
      starter1: "Quelle est la différence entre le passé composé et l'imparfait ?",
      starter2: "Quand faut-il utiliser le subjonctif après « bien que » ?",
      starter3: "Pourquoi dit-on « rendre visite à » et non « visiter quelqu'un » ?",
      starter4: "Comment accorder le participe passé avec l'auxiliaire avoir ?",
      voiceTitle: "Pratique orale en direct (Gemini Live)",
      voiceSubtitle: "Parlez en français avec votre tuteur vocal en temps réel ou lancez une simulation orale.",
      startVoiceBtn: "Démarrer la session vocale",
      stopVoiceBtn: "Terminer la session",
      voiceConnected: "Session vocale active — Parlez dans votre microphone",
      voiceIdle: "Prêt pour l'entraînement oral en français",
      checkerTitle: "Vérifiez si votre phrase est idiomatique",
      checkerPlaceholder: "Ex. : J'ai visité mes parents hier soir...",
      checkSentenceBtn: "Analyser ma phrase",
      sentenceValid: "Phrase juste et idiomatique",
      sentenceNeedsFix: "Amélioration recommandée",
      suggestedCorrection: "Phrase corrigée :",
    },
    profile: {
      title: "Profil & Préférences",
      subtitle: "Personnalisez votre langue d'interface, votre niveau, votre objectif et votre compte cloud",
      cloudAccountTitle: "Compte Cloud & Synchronisation Firebase",
      cloudAccountSubtitle: "Connectez-vous avec Google pour sauvegarder vos XP, votre série et vos leçons dans le cloud.",
      signInGoogle: "Se connecter avec Google",
      signOut: "Se déconnecter",
      cloudSyncedAs: "Synchronisé avec",
      learnerName: "Prénom ou pseudonyme",
      interfaceLanguage: "Langue de l'interface",
      learningLevel: "Niveau CECRL actuel",
      dailyGoal: "Objectif d'étude quotidien",
      minutesPerDay: "minutes / jour",
      appearance: "Apparence visuelle",
      lightMode: "Mode clair",
      darkMode: "Mode sombre",
      audioPronunciation: "Synthèse vocale française",
      enabled: "Activée",
      disabled: "Désactivée",
      saveChanges: "Enregistrer les préférences",
      savedConfirmation: "Préférences enregistrées",
      resetProgress: "Réinitialiser la progression",
      resetConfirmPrompt: "Voulez-vous vraiment remettre à zéro vos statistiques locales ?",
      confirmReset: "Confirmer la réinitialisation",
      cancel: "Annuler",
    },
  },
  en: {
    appName: "Phrase juste",
    tagline: "Master accurate, natural French sentence by sentence",
    nav: {
      home: "Home",
      lessons: "Lessons",
      exercises: "Practice",
      progress: "Progress",
      coach: "AI Coach",
      profile: "Profile",
      startPractice: "Practice Now",
    },
    gamification: {
      levelLabel: "Level",
      xpToNextLevel: "XP to next level",
      maxLevelReached: "Maximum rank achieved",
      recentXpEarned: "Latest XP gain",
      dailyMissionsTitle: "Daily Missions",
      dailyMissionsSubtitle: "3 daily challenges refreshed at local midnight (rewarded once per day)",
      missionCompleted: "Completed",
      missionInProgress: "In progress",
      streakCalendarTitle: "28-Day Streak Calendar",
      streakRuleExplanation: "How streaks work: complete at least 1 lesson or 1 interactive exercise before local midnight to count toward your daily streak.",
      streakShieldLabel: "Streak Shield",
      streakShieldExplanation: "Automatically protects your streak if you miss a single calendar day. Earn +1 shield (max 2) every 7 streak days.",
      currentStreakLabel: "Current Streak",
      longestStreakLabel: "Longest Streak",
      activeDayLegend: "Completed day",
      shieldDayLegend: "Shield protected",
      xpHistoryTitle: "Recent XP History",
      xpHistoryEmpty: "No XP events recorded yet.",
      levelTiersTitle: "Learner Rank Progression",
      unlockedLabel: "Unlocked",
      lockedLabel: "Locked",
      milestoneReached: "Achievement Unlocked",
      levelUpAnnouncement: "Level Up!",
      alreadyRewardedNote: "XP already claimed for this lesson",
    },
    home: {
      welcomeBack: "Bienvenue",
      dailyGoal: "Daily Learning Goal",
      minutesToday: "min today",
      goalReached: "Daily goal achieved (+40 XP)",
      keepGoing: "Keep your daily learning habit alive",
      goalRemainingMinutes: "min left to unlock +40 XP bonus",
      quickGoalTarget: "Target:",
      logQuickStudy: "+5 min quick study (+15 XP)",
      streakDays: "Day Streak",
      accuracy: "Accuracy",
      completedLessons: "Lessons Done",
      recommendedForYou: "Recommended for your level",
      startLesson: "Read Lesson",
      practiceNow: "Practice",
      quickActions: "Quick Actions",
      actionMistakes: "Mistake Clinic",
      actionMistakesDesc: "Re-practice exercises you previously missed",
      actionCorrection: "Sentence Correction",
      actionCorrectionDesc: "Fix common French grammar and word-choice errors",
      actionCoach: "Ask AI French Coach",
      actionCoachDesc: "Get instant, level-adapted grammar explanations",
      actionDailyMix: "Daily 5-Question Mix",
      actionDailyMixDesc: "Balanced drill across grammar, verbs, and syntax",
      mistakeOfTheDay: "Usage Focus of the Day",
      dontSay: "Avoid saying",
      sayInstead: "Say instead",
    },
    categories: {
      all: "All",
      grammar: "Grammar",
      vocabulary: "Vocabulary",
      conjugation: "Conjugation",
      construction: "Sentence Structure",
      mistakes: "Common Mistakes",
    },
    lessons: {
      title: "Structured French Lessons",
      subtitle: "Clear grammar rules, authentic usage, and common pitfalls",
      searchPlaceholder: "Search topics (e.g., subjunctive, visiter, articles...)",
      allLevels: "All Levels",
      minutes: "min",
      completed: "Completed",
      studyLesson: "Open Lesson",
      practiceLesson: "Start Exercises",
      keyRules: "Core Rules & Examples",
      commonMistakesTitle: "Common Mistake vs. Phrase juste",
      markComplete: "Complete Lesson (+30 XP)",
      markedComplete: "Lesson Completed",
      listenPronunciation: "Listen",
      noLessonsFound: "No lessons match your current filters.",
      resetFilters: "Reset Filters",
    },
    exercises: {
      title: "Interactive Exercises",
      subtitle: "Active recall with immediate feedback and rule explanations",
      allTypes: "All Formats",
      typeMultipleChoice: "Multiple Choice",
      typeFillBlank: "Fill in the Blank",
      typeCorrection: "Sentence Correction",
      typeTranslation: "Translation & Order",
      questionOf: "Question",
      checkAnswer: "Check Answer",
      nextQuestion: "Next Question",
      finishSession: "View Results",
      correctBanner: "Correct — Phrase juste!",
      incorrectBanner: "Not quite — review the rule below",
      accentWarning: "Accepted! Watch the French accents in the exact spelling:",
      correctSolutionLabel: "Correct French sentence:",
      ruleExplanationLabel: "Why this rule applies:",
      typeYourAnswer: "Type the French word or sentence...",
      clearWords: "Clear",
      sessionComplete: "Practice Session Complete",
      sessionScore: "Session Accuracy",
      xpEarned: "XP Earned",
      practiceAgain: "Practice New Set",
      reviewMistakes: "Retry Missed Items",
      backToHome: "Back to Home",
    },
    progress: {
      title: "Progress & Rewards",
      subtitle: "Track your learner rank, streak calendar, daily missions, and Hall of Fame",
      weeklyActivity: "Last 7 Days Activity (Minutes)",
      categoryMastery: "Mastery by Category",
      achievements: "Unlockable Achievements",
      hallOfFameTitle: "Hall of Fame — All Achievements",
      hallOfFameSubtitle: "Every milestone, its exact unlock condition, and your earned or in-progress status",
      unlockConditionLabel: "Unlock Condition",
      filterAllAchievements: "All",
      filterEarnedAchievements: "Earned",
      filterLockedAchievements: "Locked",
      earnedOnLabel: "Earned on",
      notEarnedYetLabel: "In progress",
      recentMistakesTitle: "Recent Mistakes to Review",
      noMistakesYet: "No active mistakes on your list. Great precision!",
      practiceMistakesBtn: "Practice Missed Sentences (+25 XP bonus)",
      totalXp: "Total XP",
      bestStreak: "Longest Streak",
      exercisesSolved: "Exercises Mastered",
    },
    coach: {
      title: "AI French Coach",
      subtitle: "Multi-turn grammar tutor, live voice conversation, and sentence checker",
      modeChat: "Grammar Chat",
      modeVoice: "Live Voice Coach",
      modeChecker: "Sentence Checker",
      inputPlaceholder: "Ask any question about French grammar, verbs, or nuance...",
      send: "Send",
      clearChat: "Reset Thread",
      thinking: "Preparing explanation...",
      starter1: "When do I use passé composé vs. imparfait?",
      starter2: "Why do we use subjunctive after 'bien que'?",
      starter3: "What is the difference between 'visiter' and 'rendre visite à'?",
      starter4: "How does past participle agreement work with 'avoir'?",
      voiceTitle: "Live French Speaking Practice (Gemini Live)",
      voiceSubtitle: "Speak aloud in French with your real-time AI voice coach or test a conversational prompt.",
      startVoiceBtn: "Start Voice Session",
      stopVoiceBtn: "End Voice Session",
      voiceConnected: "Live voice session active — Speak into your microphone",
      voiceIdle: "Ready for real-time French speaking practice",
      checkerTitle: "Check a French sentence for accuracy",
      checkerPlaceholder: "e.g., J'ai visité mes parents hier soir...",
      checkSentenceBtn: "Check My Sentence",
      sentenceValid: "Natural & Grammatically Accurate",
      sentenceNeedsFix: "Suggested Improvement",
      suggestedCorrection: "Phrase juste:",
    },
    profile: {
      title: "Profile & Settings",
      subtitle: "Configure your interface language, CEFR level, daily goal, and cloud sync",
      cloudAccountTitle: "Cloud Account & Firebase Sync",
      cloudAccountSubtitle: "Sign in with Google to synchronize your XP, streaks, and completed lessons across devices.",
      signInGoogle: "Sign in with Google",
      signOut: "Sign out",
      cloudSyncedAs: "Synced as",
      learnerName: "Learner Name",
      interfaceLanguage: "Interface Language (FR / EN / AR)",
      learningLevel: "Current CEFR Level",
      dailyGoal: "Daily Study Goal",
      minutesPerDay: "minutes / day",
      appearance: "Appearance & Theme",
      lightMode: "Light Mode",
      darkMode: "Dark Mode",
      audioPronunciation: "French Audio Pronunciation",
      enabled: "Enabled",
      disabled: "Disabled",
      saveChanges: "Save Preferences",
      savedConfirmation: "Settings saved",
      resetProgress: "Reset Learning Progress",
      resetConfirmPrompt: "Are you sure you want to reset your saved progress?",
      confirmReset: "Confirm Reset",
      cancel: "Cancel",
    },
  },
  ar: {
    appName: "Phrase juste",
    tagline: "أتقن دقة اللغة الفرنسية وبناء الجملة الصحيحة",
    nav: {
      home: "الرئيسية",
      lessons: "الدروس",
      exercises: "التمارين",
      progress: "التقدم",
      coach: "المدرب الذكي",
      profile: "الإعدادات",
      startPractice: "ابدأ التدريب",
    },
    gamification: {
      levelLabel: "المستوى",
      xpToNextLevel: "نقطة خبرة للمستوى التالي",
      maxLevelReached: "تم بلوغ أعلى رتبة",
      recentXpEarned: "آخر نقاط مكتسبة",
      dailyMissionsTitle: "المهام اليومية",
      dailyMissionsSubtitle: "٣ تحديات يومية تتجدد عند منتصف الليل (تُمنح المكافأة مرة واحدة يومياً)",
      missionCompleted: "مكتملة",
      missionInProgress: "قيد الإنجاز",
      streakCalendarTitle: "تقويم الالتزام (٢٨ يوماً)",
      streakRuleExplanation: "كيف تُحسب السلسلة: أكمل درساً واحداً أو تمريناً تفاعلياً واحداً على الأقل قبل منتصف الليل بتوقيتك المحلي لتسجيل يومك.",
      streakShieldLabel: "درع حماية السلسلة",
      streakShieldExplanation: "يحمي سلسلتك تلقائياً إذا فاتك يوم واحد فقط. تحصل على +١ درع (بحد أقصى ٢) كل ٧ أيام متتالية.",
      currentStreakLabel: "السلسلة الحالية",
      longestStreakLabel: "أطول سلسلة",
      activeDayLegend: "يوم مكتمل",
      shieldDayLegend: "محمي بالدرع",
      xpHistoryTitle: "سجل نقاط الخبرة (XP)",
      xpHistoryEmpty: "لا توجد نقاط مسجلة بعد.",
      levelTiersTitle: "سلم رتب المتعلم",
      unlockedLabel: "مكتسب",
      lockedLabel: "غير مكتسب بعد",
      milestoneReached: "إنجاز جديد مفتوح",
      levelUpAnnouncement: "ترقية مستوى جديدة!",
      alreadyRewardedNote: "تم استلام نقاط الخبرة لهذا الدرس مسبقاً",
    },
    home: {
      welcomeBack: "مرحباً بك",
      dailyGoal: "الهدف اليومي",
      minutesToday: "دقيقة اليوم",
      goalReached: "تم تحقيق هدف اليوم (+٤٠ نقطة)",
      keepGoing: "واصل التعلم اليومي للحفاظ على سلسلتك",
      goalRemainingMinutes: "دقائق متبقية لمكافأة +٤٠ XP",
      quickGoalTarget: "الهدف:",
      logQuickStudy: "+٥ دقائق مراجعة سريعة (+١٥ XP)",
      streakDays: "أيام متتالية",
      accuracy: "نسبة الدقة",
      completedLessons: "دروس مكتملة",
      recommendedForYou: "الدرس الموصى به لمستواك",
      startLesson: "دراسة الدرس",
      practiceNow: "تدرّب الآن",
      quickActions: "تدريبات سريعة",
      actionMistakes: "مراجعة أخطائي",
      actionMistakesDesc: "أعد التدرب على الجمل التي أخطأت فيها سابقاً",
      actionCorrection: "تصحيح الجمل",
      actionCorrectionDesc: "تعلّم تجنب الأخطاء الشائعة في الفرنسية",
      actionCoach: "المدرب الذكي للفرنسية",
      actionCoachDesc: "اسأل عن أي قاعدة نحوية أو صحح جملتك فوراً",
      actionDailyMix: "تحدي الخمس أسئلة",
      actionDailyMixDesc: "تدريب شامل في القواعد والتصريف والمفردات",
      mistakeOfTheDay: "لمحة لغوية اليوم",
      dontSay: "لا تقل",
      sayInstead: "بل قل",
    },
    categories: {
      all: "الكل",
      grammar: "القواعد",
      vocabulary: "المفردات",
      conjugation: "تصريف الأفعال",
      construction: "تركيب الجمل",
      mistakes: "أخطاء شائعة",
    },
    lessons: {
      title: "مكتبة الدروس المنظمة",
      subtitle: "قواعد واضحة، أمثلة فرنسية أصيلة، وتنبيهات للأخطاء الشائعة",
      searchPlaceholder: "ابحث عن درس (مثال: subjonctif، visiter...)",
      allLevels: "جميع المستويات",
      minutes: "دقائق",
      completed: "مكتمل",
      studyLesson: "فتح الدرس",
      practiceLesson: "بدء التمارين",
      keyRules: "القواعد الأساسية والأمثلة",
      commonMistakesTitle: "خطأ شائع مقابل الجملة الصحيحة",
      markComplete: "إتمام الدرس (+٣٠ XP)",
      markedComplete: "تم إكمال الدرس",
      listenPronunciation: "استماع",
      noLessonsFound: "لا توجد دروس تطابق عوامل التصفية الحالية.",
      resetFilters: "إعادة ضبط التصفية",
    },
    exercises: {
      title: "التمارين التفاعلية",
      subtitle: "اختيار من متعدد، إكمال الفراغ، تصحيح الجمل، والترجمة مع شرح فوري",
      allTypes: "كل الأنواع",
      typeMultipleChoice: "اختيار من متعدد",
      typeFillBlank: "إكمال الفراغ",
      typeCorrection: "تصحيح الجملة",
      typeTranslation: "ترجمة وتركيب",
      questionOf: "السؤال",
      checkAnswer: "تحقق من الإجابة",
      nextQuestion: "السؤال التالي",
      finishSession: "عرض النتيجة",
      correctBanner: "إجابة صحيحة — جملة دقيقة!",
      incorrectBanner: "إجابة غير دقيقة — راجع القاعدة أدناه",
      accentWarning: "إجابتك مقبولة! انتبه فقط لعلامات التشكيل الفرنسية (Accents):",
      correctSolutionLabel: "الجملة الفرنسية الصحيحة:",
      ruleExplanationLabel: "شرح القاعدة النحوية:",
      typeYourAnswer: "اكتب الكلمة أو الجملة بالفرنسية...",
      clearWords: "مسح",
      sessionComplete: "اكتملت جلسة التدريب",
      sessionScore: "دقة الجلسة",
      xpEarned: "نقاط الخبرة المكتسبة",
      practiceAgain: "جولة تدريب جديدة",
      reviewMistakes: "إعادة الأسئلة الخاطئة",
      backToHome: "العودة للرئيسية",
    },
    progress: {
      title: "التقدم والمكافآت",
      subtitle: "تابع رتبتك، تقويم السلسلة اليومية، المهام اليومية، وقاعة المشاهير",
      weeklyActivity: "نشاط آخر 7 أيام (بالدقائق)",
      categoryMastery: "الإتقان حسب المهارة",
      achievements: "الأوسمة والإنجازات القابلة للفتح",
      hallOfFameTitle: "قاعة المشاهير (Hall of Fame) — جميع الأوسمة",
      hallOfFameSubtitle: "جميع الأوسمة الممكنة، شروط فتح كل وسام، ومؤشرات الإنجاز",
      unlockConditionLabel: "شرط فتح الوسام",
      filterAllAchievements: "الكل",
      filterEarnedAchievements: "المكتسبة",
      filterLockedAchievements: "غير المفتوحة",
      earnedOnLabel: "تم اكتسابه في",
      notEarnedYetLabel: "قيد التقدم",
      recentMistakesTitle: "سجل الأخطاء للمراجعة",
      noMistakesYet: "لا توجد أخطاء مسجلة حالياً. عمل رائع!",
      practiceMistakesBtn: "التدرب على هذه الأخطاء (+٢٥ XP مكافأة)",
      totalXp: "مجموع النقاط",
      bestStreak: "أطول سلسلة",
      exercisesSolved: "تمارين متقنة",
    },
    coach: {
      title: "مدرب الفرنسية الذكي",
      subtitle: "محادثة تعليمية، تدريب صوتي مباشر، ومدقق فوري للجمل الفرنسية",
      modeChat: "محادثة نصية",
      modeVoice: "محادثة صوتية",
      modeChecker: "مدقق الجمل",
      inputPlaceholder: "اكتب سؤالك حول قواعد اللغة الفرنسية أو المفردات...",
      send: "إرسال",
      clearChat: "محادثة جديدة",
      thinking: "جاري تحضير الشرح...",
      starter1: "ما الفرق بين Passé composé و Imparfait؟",
      starter2: "متى نستخدم صيغة Subjonctif بعد bien que؟",
      starter3: "لماذا نقول rendre visite à ولا نقول visiter لشخص؟",
      starter4: "كيف تعمل مطابقة اسم المفعول مع المساعد avoir؟",
      voiceTitle: "تدريب المحادثة الصوتية المباشرة (Gemini Live)",
      voiceSubtitle: "تحدث بالفرنسية مع مدربك الذكي في الوقت الفعلي أو اختر جملة للتدريب الصوتي.",
      startVoiceBtn: "بدء الجلسة الصوتية",
      stopVoiceBtn: "إنهاء الجلسة",
      voiceConnected: "الجلسة الصوتية نشطة — تحدث الآن بالفرنسية",
      voiceIdle: "جاهز للتدريب الصوتي باللغة الفرنسية",
      checkerTitle: "تحقق من صحة جملتك الفرنسية",
      checkerPlaceholder: "مثال: J'ai visité mes parents hier soir...",
      checkSentenceBtn: "فحص الجملة",
      sentenceValid: "جملة سليمة وطبيعية",
      sentenceNeedsFix: "تصحيح مقترح",
      suggestedCorrection: "الصياغة الأصح:",
    },
    profile: {
      title: "الملف الشخصي والإعدادات",
      subtitle: "تحكم في لغة الواجهة، المستوى اللغوي، الهدف اليومي، والمزامنة السحابية",
      cloudAccountTitle: "الحساب السحابي والمزامنة (Firebase)",
      cloudAccountSubtitle: "سجّل الدخول بحساب Google لحفظ نقاط الخبرة وسلسلتك اليومية عبر جميع أجهزتك.",
      signInGoogle: "تسجيل الدخول باستخدام Google",
      signOut: "تسجيل الخروج",
      cloudSyncedAs: "تمت المزامنة باسم",
      learnerName: "اسم المتعلم",
      interfaceLanguage: "لغة الواجهة (العربية / الفرنسية / الإنجليزية)",
      learningLevel: "المستوى الحالي (CEFR)",
      dailyGoal: "هدف الدراسة اليومي",
      minutesPerDay: "دقيقة / يوم",
      appearance: "المظهر والألوان",
      lightMode: "الوضع الفاتح",
      darkMode: "الوضع الداكن",
      audioPronunciation: "النطق الصوتي الفرنسي",
      enabled: "مفعّل",
      disabled: "معطّل",
      saveChanges: "حفظ الإعدادات",
      savedConfirmation: "تم حفظ الإعدادات بنجاح",
      resetProgress: "إعادة تعيين التقدم",
      resetConfirmPrompt: "هل أنت متأكد من رغبتك في مسح سجل التقدم المحلي؟",
      confirmReset: "تأكيد إعادة التعيين",
      cancel: "إلغاء",
    },
  },
};
