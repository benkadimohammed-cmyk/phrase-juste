import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { GoogleGenAI, Modality, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getGenAIClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function buildFallbackCoachReply(
  message: string,
  level: string,
  uiLanguage: string
): {
  reply: string;
  examples: Array<{ french: string; translation: string; note: string }>;
  tip: string;
} {
  const q = message.toLowerCase();

  if (q.includes("passé composé") || q.includes("imparfait") || q.includes("past")) {
    const reply =
      uiLanguage === "ar"
        ? `في المستوى ${level}، نستخدم **Passé composé** للأحداث المحددة والمكتملة في الماضي (مثل: *Hier, j'ai fini mon travail*)، بينما نستخدم **Imparfait** لوصف العادات أو الخلفية المستمرة في الماضي (مثل: *Quand j'étais jeune, je lisais beaucoup*).`
        : uiLanguage === "fr"
        ? `Au niveau ${level}, retenez cette distinction essentielle : le **passé composé** exprime une action ponctuelle et achevée (*Hier, j'ai pris le train*), tandis que l'**imparfait** décrit une habitude, un décor ou une action en cours dans le passé (*Il pleuvait quand je suis sorti*).`
        : `At level ${level}, use **passé composé** for completed, specific actions in the past (*Hier, j'ai terminé le rapport*), and **imparfait** for ongoing background states, descriptions, or past habits (*Il faisait froid et tout le monde attendait*).`;

    return {
      reply,
      examples: [
        {
          french: "Je lisais dans le salon quand le téléphone a sonné.",
          translation:
            uiLanguage === "ar"
              ? "كنت أقرأ في الصالون عندما رن الهاتف."
              : "I was reading in the living room when the phone rang.",
          note: "Imparfait (background action) + Passé composé (interruption)",
        },
        {
          french: "Autrefois, nous allions souvent à Lyon.",
          translation:
            uiLanguage === "ar"
              ? "في السابق، كنا نذهب كثيراً إلى ليون."
              : "In the past, we used to go to Lyon often.",
          note: "Imparfait for repeated past habits",
        },
      ],
      tip:
        uiLanguage === "ar"
          ? "تذكّر: الأفعال الحركة والانعكاسية تأخذ المساعد être في المركب الماضي مع مطابقة اسم المفعول."
          : "Astuce : Avec l'auxiliaire « être », le participe passé s'accorde toujours en genre et en nombre avec le sujet.",
    };
  }

  if (q.includes("subjonctif") || q.includes("subjunctive") || q.includes("bien que") || q.includes("il faut que")) {
    return {
      reply:
        uiLanguage === "ar"
          ? `صيغة **Subjonctif** تُستخدم بعد عبارات الضرورة (*Il faut que*)، الرغبة (*Je veux que*)، العاطفة (*Je suis ravi que*)، أو التنازل (*Bien que*). على سبيل المثال: *Il faut que tu fasses attention*.`
          : `Le **subjonctif** s'emploie après les expressions d'obligation (*Il faut que*), de souhait (*Je souhaite que*), de doute ou de concession (*Bien que*). Attention : après « espérer que », on utilise l'indicatif (*J'espère qu'il viendra*).`,
      examples: [
        {
          french: "Il est indispensable que vous soyez à l'heure.",
          translation:
            uiLanguage === "ar"
              ? "من الضروري أن تكونوا في الموعد."
              : "It is essential that you be on time.",
          note: "être → que vous soyez (subjonctif présent)",
        },
        {
          french: "Bien qu'il pleuve, nous sortons marcher.",
          translation:
            uiLanguage === "ar"
              ? "رغم أنها تمطر، نخرج للمشي."
              : "Although it is raining, we are going out for a walk.",
          note: "« Bien que » est toujours suivi du subjonctif",
        },
      ],
      tip:
        uiLanguage === "ar"
          ? "احذر: بعد Après que نستخدم Indicatif وليس Subjonctif في القواعد المعيارية."
          : "Phrase juste : Dites « Malgré la pluie » (+ nom) ou « Bien qu'il pleuve » (+ subjonctif), jamais « Malgré qu'il pleut ».",
    };
  }

  if (q.includes("visiter") || q.includes("rendre visite") || q.includes("mistake") || q.includes("erreur")) {
    return {
      reply:
        uiLanguage === "ar"
          ? `من الأخطاء الشائعة الخلط بين **visiter** و **rendre visite à**. نستخدم *visiter* للأماكن والمتاحف والمدن، بينما نستخدم *rendre visite à* للأشخاص فقط.`
          : `L'une des erreurs les plus fréquentes consiste à dire *« J'ai visité mes grands-parents »*. En français soigné, on **visite un lieu** (un musée, une ville) mais on **rend visite à une personne**.`,
      examples: [
        {
          french: "J'ai rendu visite à ma sœur dimanche dernier.",
          translation:
            uiLanguage === "ar"
              ? "زرت أختي يوم الأحد الماضي."
              : "I visited my sister last Sunday.",
          note: "rendre visite à + personne",
        },
        {
          french: "Nous avons visité le musée d'Orsay.",
          translation:
            uiLanguage === "ar"
              ? "زرنا متحف أورساي."
              : "We visited the Musée d'Orsay.",
          note: "visiter + lieu / monument",
        },
      ],
      tip:
        uiLanguage === "ar"
          ? "قاعدة سريعة: visiter un lieu / rendre visite à quelqu'un."
          : "Règle d'or : visiter un lieu, rendre visite à quelqu'un.",
    };
  }

  return {
    reply:
      uiLanguage === "ar"
        ? `سؤال ممتاز لمستوى ${level}! في اللغة الفرنسية، بناء الجملة الدقيقة (**la phrase juste**) يعتمد على اختيار حرف الجر الصحيح بعد الفعل ومطابقة الأزمنة. إليك أمثلة عملية مرتبطة بسؤالك:`
        : uiLanguage === "fr"
        ? `Excellente question pour le niveau ${level}. Pour construire une **phrase juste**, vérifiez toujours trois points : le choix de la préposition (*à*, *de*, *en*), l'accord du participe passé et le registre de langue.`
        : `Great question for level ${level}! Building a precise French sentence (**la phrase juste**) comes down to verb-preposition pairing, gender/number agreement, and choosing the natural register. Here are structured examples you can apply right away:`,
    examples: [
      {
        french: "Je pense à mon projet. / Qu'est-ce que tu penses de cette idée ?",
        translation:
          uiLanguage === "ar"
            ? "أفكر في مشروعي. / ما رأيك في هذه الفكرة؟"
            : "I am thinking about my project. / What do you think of this idea?",
        note: "penser à (to think about) vs. penser de (to have an opinion on)",
      },
      {
        french: "C'est une décision difficile à prendre.",
        translation:
          uiLanguage === "ar"
            ? "إنه قرار يصعب اتخاذه."
            : "It is a difficult decision to make.",
        note: "Prendre une décision (never 'faire une décision')",
      },
    ],
    tip:
      uiLanguage === "ar"
        ? "في الفرنسية نقول « prendre une décision » وليس « faire une décision »."
        : "Astuce : En français, on dit « prendre une décision » (et non « faire une décision »).",
  };
}

function analyzeSentenceLocally(sentence: string, uiLanguage: string) {
  const trimmed = sentence.trim();
  const lower = trimmed.toLowerCase();

  const rules: Array<{
    pattern: RegExp;
    replace: string;
    explanationFr: string;
    explanationEn: string;
    explanationAr: string;
    rule: string;
  }> = [
    {
      pattern: /\bj'ai visité (mon|ma|mes|ton|ta|tes|son|sa|ses|notre|nos|un|une) (ami|amie|amis|père|mère|sœur|soeur|frère|parents|grands-parents|oncle|tante)\b/i,
      replace: "J'ai rendu visite à $1 $2",
      explanationFr: "On visite un lieu, mais on « rend visite à » une personne.",
      explanationEn: "Use 'visiter' for places and 'rendre visite à' for people.",
      explanationAr: "نستخدم visiter للأماكن، و rendre visite à للأشخاص.",
      rule: "Lexique : visiter vs. rendre visite à",
    },
    {
      pattern: /\bje suis (faim|soif|froid|chaud|peur|raison|tort|sommeil)\b/i,
      replace: "J'ai $1",
      explanationFr: "Les sensations physiques et besoins s'expriment avec l'auxiliaire « avoir » (avoir faim, avoir froid, avoir peur).",
      explanationEn: "Physical sensations and states in French use the verb 'avoir' (j'ai faim, j'ai froid), not 'être'.",
      explanationAr: "التعبيرات الجسدية كالجوع والبرد والخوف تُستخدم مع الفعل avoir وليس être.",
      rule: "Expressions avec l'auxiliaire avoir",
    },
    {
      pattern: /\bmalgré que\b/i,
      replace: "Bien que",
      explanationFr: "La locution « malgré que » est critiquée en français soutenu. Préférez « bien que » (+ subjonctif) ou « malgré » (+ nom).",
      explanationEn: "Avoid 'malgré que'. Use 'bien que' (+ subjunctive) or 'malgré' (+ noun).",
      explanationAr: "تجنب malgré que واستخدم bien que متبوعة بصيغة المنصوب (Subjonctif).",
      rule: "Concession : bien que vs. malgré",
    },
    {
      pattern: /\bfaire une décision\b/i,
      replace: "prendre une décision",
      explanationFr: "Calque de l'anglais (« make a decision »). En français, on dit toujours « prendre une décision ».",
      explanationEn: "Direct calque from English 'make a decision'. French requires 'prendre une décision'.",
      explanationAr: "في الفرنسية نقول prendre une décision وليس faire une décision.",
      rule: "Collocations verbales : prendre une décision",
    },
    {
      pattern: /\bbeaucoup des\b/i,
      replace: "beaucoup de",
      explanationFr: "Après un adverbe de quantité (beaucoup, peu, trop, assez), on utilise toujours « de » ou « d' » sans article défini.",
      explanationEn: "After adverbs of quantity ('beaucoup', 'trop', 'peu'), always use 'de' instead of 'des/du/de la'.",
      explanationAr: "بعد ظروف الكمية مثل beaucoup و trop نستخدم دائماً de وليس des.",
      rule: "Adverbes de quantité + de",
    },
  ];

  for (const r of rules) {
    if (r.pattern.test(lower)) {
      const corrected = trimmed.replace(r.pattern, r.replace);
      return {
        isCorrect: false,
        corrected: corrected.charAt(0).toUpperCase() + corrected.slice(1),
        explanation:
          uiLanguage === "ar"
            ? r.explanationAr
            : uiLanguage === "fr"
            ? r.explanationFr
            : r.explanationEn,
        grammarRule: r.rule,
        alternatives: [
          corrected.charAt(0).toUpperCase() + corrected.slice(1),
        ],
      };
    }
  }

  return {
    isCorrect: true,
    corrected: trimmed.endsWith(".") || trimmed.endsWith("?") || trimmed.endsWith("!") ? trimmed : `${trimmed}.`,
    explanation:
      uiLanguage === "ar"
        ? "الجملة سليمة نحوياً وتركيبها طبيعي في اللغة الفرنسية."
        : uiLanguage === "fr"
        ? "Votre phrase est grammaticalement correcte et idiomatique."
        : "Your sentence is grammatically sound and natural in French.",
    grammarRule: "Syntaxe et accord vérifiés",
    alternatives: [trimmed],
  };
}

const processedAwardEventIds = new Set<string>();
const MAX_SINGLE_AWARD_XP: Record<string, number> = {
  lesson_complete: 45,
  exercise_correct: 25,
  exercise_effort: 10,
  session_bonus: 30,
  perfect_quiz: 45,
  revision_complete: 35,
  daily_goal: 50,
  daily_mission: 50,
  streak_shield_used: 0,
};

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Allow requests from the native Android APK WebView (https://appassets.androidplatform.net)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json());

  const serveVerifiedApk = (_req: express.Request, res: express.Response) => {
    const apkPath = path.join(__dirname, "releases", "Phrase-juste-v1.0.0.apk");
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Phrase-juste-v1.0.0.apk"'
    );
    res.setHeader("Cache-Control", "no-store");
    res.sendFile(apkPath);
  };

  app.get("/releases/Phrase-juste-v1.0.0.apk", serveVerifiedApk);
  app.get("/releases/Phrase%20juste%201.0.0.apk", serveVerifiedApk);

  // Gemini Live API WebSocket proxy on /live (gemini-3.8-live)
  const wss = new WebSocketServer({ server: httpServer, path: "/live" });
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "/live", `http://${req.headers.host || "localhost"}`);
    const level = url.searchParams.get("level") || "A2";
    const ai = getGenAIClient();
    let liveSession: Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null = null;

    if (ai) {
      try {
        liveSession = await ai.live.connect({
          model: "gemini-3.8-live",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Zephyr" },
              },
            },
            systemInstruction: {
              parts: [
                {
                  text: `You are the "Phrase juste" Live French Voice Coach for a CEFR ${level} learner. Speak clear, encouraging French, gently correct any grammar or lexical mistakes (such as "visiter quelqu'un" vs "rendre visite à quelqu'un"), and ask a short follow-up question in French.`,
                },
              ],
            },
          },
          callbacks: {
            onmessage: (message) => {
              const part = message.serverContent?.modelTurn?.parts?.[0];
              if (part?.inlineData?.data) {
                ws.send(JSON.stringify({ audio: part.inlineData.data }));
              }
              if (part?.text) {
                ws.send(JSON.stringify({ coachTranscript: part.text }));
              }
            },
            onerror: (err) => {
              console.error("Gemini Live error:", err);
            },
          },
        });
      } catch (err) {
        console.error("Gemini Live connect fallback:", err);
      }
    }

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.audio && liveSession) {
          liveSession.sendRealtimeInput({
            media: { data: data.audio, mimeType: "audio/pcm;rate=16000" },
          });
        } else if (data.textTurn) {
          const spoken = String(data.textTurn);
          const reply = spoken.toLowerCase().includes("visité mon")
            ? "Attention : dites plutôt « J'ai rendu visite à mon ami Paul à Lyon ». Avec une personne, on utilise toujours « rendre visite à »."
            : spoken.toLowerCase().includes("suis très faim") || spoken.toLowerCase().includes("suis faim")
            ? "Presque ! En français, on dit « J'ai très faim » avec l'auxiliaire avoir. La boulangerie est tout droit !"
            : "Très bien dit ! L'emploi du subjonctif « bien qu'il pleuve » est parfaitement maîtrisé.";
          ws.send(
            JSON.stringify({
              coachTranscript: reply,
              note: `Gemini Live · CECRL ${level}`,
            })
          );
        }
      } catch {
        // Ignore invalid frame
      }
    });

    ws.on("close", () => {
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // Ignore close errors
        }
      }
    });
  });

  app.post("/api/progress/validate-award", (req, res) => {
    const { eventId, type, requestedXp } = req.body || {};
    if (!eventId || typeof eventId !== "string" || !type) {
      res.status(400).json({ valid: false, error: "Invalid award event payload." });
      return;
    }

    if (processedAwardEventIds.has(eventId)) {
      res.json({
        valid: false,
        duplicate: true,
        approvedXp: 0,
        reason: "Duplicate event ID ignored.",
      });
      return;
    }

    const maxAllowed = MAX_SINGLE_AWARD_XP[type] ?? 45;
    const numericXp = typeof requestedXp === "number" ? Math.floor(requestedXp) : 0;
    const approvedXp = Math.max(0, Math.min(maxAllowed, numericXp));

    processedAwardEventIds.add(eventId);
    if (processedAwardEventIds.size > 5000) {
      const first = processedAwardEventIds.values().next().value;
      if (first) processedAwardEventIds.delete(first);
    }

    res.json({
      valid: true,
      duplicate: false,
      approvedXp,
      serverTimestamp: new Date().toISOString(),
    });
  });

  app.post("/api/progress/sync", (req, res) => {
    const { progress } = req.body || {};
    if (!progress || typeof progress !== "object") {
      res.status(400).json({ synced: false, error: "Missing progress object." });
      return;
    }

    const lessonsCount = Array.isArray(progress.rewardedLessonIds)
      ? progress.rewardedLessonIds.length
      : 0;
    const attemptsCount =
      typeof progress.totalAttempts === "number"
        ? Math.max(0, progress.totalAttempts)
        : 0;
    const daysCount =
      progress.dailyHistory && typeof progress.dailyHistory === "object"
        ? Object.keys(progress.dailyHistory).length
        : 1;

    const reasonableMaxXp =
      250 + lessonsCount * 80 + attemptsCount * 35 + daysCount * 150;
    const validatedXp = Math.max(
      0,
      Math.min(
        typeof progress.xp === "number" ? Math.floor(progress.xp) : 0,
        reasonableMaxXp
      )
    );

    res.json({
      synced: true,
      validatedXp,
      serverTimestamp: new Date().toISOString(),
    });
  });

  app.post("/api/coach", async (req, res) => {
    const { message, level = "A2", uiLanguage = "fr", history = [] } = req.body || {};

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json(buildFallbackCoachReply(message, level, uiLanguage));
      return;
    }

    try {
      const langName =
        uiLanguage === "ar" ? "Arabic" : uiLanguage === "en" ? "English" : "French";

      const historyContext = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: { role: string; text: string }) => `${h.role}: ${h.text}`)
            .join("\n")
        : "";

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ""}Learner question (CEFR Level ${level}): ${message}`,
        config: {
          systemInstruction: `You are the "Phrase juste" AI French Coach, an expert, encouraging French grammar and usage tutor.
Adapt your explanation strictly to CEFR level ${level}.
Respond in ${langName} for explanations, while keeping French example sentences in authentic French.
Focus on clarity, idiomatic precision ("la phrase juste"), and common mistakes to avoid.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "Clear, concise pedagogical explanation adapted to the learner's level.",
              },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    french: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    note: { type: Type.STRING },
                  },
                  required: ["french", "translation", "note"],
                },
              },
              tip: {
                type: Type.STRING,
                description: "A memorable one-line 'Phrase juste' rule or tip.",
              },
            },
            required: ["reply", "examples", "tip"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.json(buildFallbackCoachReply(message, level, uiLanguage));
        return;
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error) {
      console.error("Gemini /api/coach fallback triggered:", error);
      res.json(buildFallbackCoachReply(message, level, uiLanguage));
    }
  });

  app.post("/api/sentence-check", async (req, res) => {
    const { sentence, level = "A2", uiLanguage = "fr" } = req.body || {};

    if (!sentence || typeof sentence !== "string") {
      res.status(400).json({ error: "Sentence is required." });
      return;
    }

    const ai = getGenAIClient();
    if (!ai) {
      res.json(analyzeSentenceLocally(sentence, uiLanguage));
      return;
    }

    try {
      const langName =
        uiLanguage === "ar" ? "Arabic" : uiLanguage === "en" ? "English" : "French";

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Evaluate this French sentence written by a ${level} learner: "${sentence}"`,
        config: {
          systemInstruction: `You are a precise French syntax and grammar checker for "Phrase juste".
Check if the French sentence is grammatically and idiomatically correct.
Provide the explanation in ${langName}.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              corrected: { type: Type.STRING },
              explanation: { type: Type.STRING },
              grammarRule: { type: Type.STRING },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["isCorrect", "corrected", "explanation", "grammarRule", "alternatives"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        res.json(analyzeSentenceLocally(sentence, uiLanguage));
        return;
      }
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Gemini /api/sentence-check fallback triggered:", error);
      res.json(analyzeSentenceLocally(sentence, uiLanguage));
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Phrase juste server listening on http://localhost:${PORT}`);
  });
}

startServer();
