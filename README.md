# Phrase juste

**Phrase juste** is a mobile-first, trilingual (`Français`, `English`, `العربية` with native RTL support) French-learning application focused on grammatical precision, idiomatic usage, and habit formation.

---

## Core Features

1. **Home & Daily Learning Goal Ring (`HomeView`)**
   - Interactive SVG circular progress ring displaying `todayMinutes / dailyGoalMinutes`, 12-segment dial ticks, percentage completion, and remaining minutes toward the `+40 XP` daily goal bonus.
   - Quick daily target selector (`5m`, `10m`, `15m`, `20m`, `30m`) and `+5 min` study burst logger.
   - **La nuance du jour**: Daily "Ne dites pas / Dites plutôt" usage card with Web Speech API French pronunciation.

2. **Visual Daily Missions (`DailyMissionsCard`)**
   - 3 daily challenges refreshed at local midnight:
     - **Terminer 1 leçon** (`Complete 1 Lesson` — `+35 XP`)
     - **10 questions réussies** (`Answer 10 Questions` — `+40 XP`)
     - **Réviser 5 mots ou tournures** (`Review 5 Words & Phrases` — `+35 XP`)
   - Animated SVG completion checkboxes, live progress bars, and direct action shortcuts.

3. **Structured Lessons (`LessonsView`)**
   - Curated CEFR `A1–B2` lessons covering grammar, vocabulary, conjugation, syntax, and common mistakes.
   - Duplicate-reward protection ensures re-opening or re-toggling a completed lesson never awards duplicate XP.

4. **Interactive Exercises (`ExerciseView`)**
   - 4 exercise formats: Multiple Choice, Fill-in-the-Blank, Sentence Correction, and Word-Bank Translation.
   - Diacritic/accent-aware answer evaluation that accepts unaccented answers while reminding learners of exact French accents.

5. **Progress, Streak Calendar & Hall of Fame (`ProgressView`)**
   - **7 Learner Ranks**: *Novice curieux* (Level 1) to *Académicien du style* (Level 7).
   - **28-Day Streak Calendar & Streak Shield**: Tracks consecutive active local calendar days and transparently protects single missed days using earned Streak Shields.
   - **Hall of Fame**: Dedicated achievement grid displaying all 8 milestones, filterable by **All**, **Earned**, and **Locked**, with explicit unlock condition boxes and progress bars.

6. **AI French Coach & Live Voice Practice (`CoachView` & `server.ts`)**
   - **Grammar Tutor Chat**: Multi-turn conversational tutor powered by `@google/genai` (`gemini-3.8-flash`) with deterministic offline fallback.
   - **Live Voice Coach**: Real-time French speaking practice via `gemini-3.8-live` over WebSocket (`/live`).
   - **Sentence Checker**: Instant grammatical and idiomatic verification for learner-written French sentences.

7. **Profile, Trilingual UI & Firebase Cloud Sync (`ProfileView` & `src/firebase.ts`)**
   - Instant switching between French (`LTR`), English (`LTR`), and Arabic (`RTL`), plus Light/Dark mode and CEFR level (`A1–B2`).
   - Google Sign-In (`Firebase Auth`) and `Cloud Firestore` persistence backed by strict per-user security rules (`firestore.rules`).

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and set your Gemini API key:
```bash
cp .env.example .env
```
- `GEMINI_API_KEY`: Used server-side in `server.ts` for `/api/coach`, `/api/sentence-check`, and `/live` WebSocket voice coaching.

### 3. Run in Development
```bash
npm run dev
```
The Express + Vite server starts on `http://localhost:3000`.

### 4. Run Unit Tests & Typecheck
```bash
npm test
npm run lint
npm run build
```

---

## Publishing / Pushing to Your GitHub Repository

This project is initialized as a Git repository with release tag `v1.0.0`.

- **Via Google AI Studio UI**: Click the **GitHub** icon in the top toolbar to connect your GitHub account and push directly to a new or existing repository.
- **Via Git CLI**:
  ```bash
  git remote add origin https://github.com/<your-username>/phrase-juste.git
  git push -u origin main --tags
  ```
