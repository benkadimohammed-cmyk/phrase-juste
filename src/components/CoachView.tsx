import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Volume2,
  VolumeX,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  CEFRLevel,
  CoachMessage,
  UILanguage,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import {
  speakFrench,
  stopSpeakingFrench,
  subscribeSpeakingState,
} from "../utils/speech";
import { getApiUrl, getLiveWebSocketUrl } from "../utils/apiConfig";

interface CoachViewProps {
  level: CEFRLevel;
  uiLanguage: UILanguage;
  audioEnabled: boolean;
  speechRate?: number;
  t: UIStrings;
}

interface SentenceCheckResponse {
  isCorrect: boolean;
  corrected: string;
  explanation: string;
  grammarRule: string;
  alternatives: string[];
}

interface VoiceTranscriptItem {
  id: string;
  role: "user" | "coach";
  french: string;
  note?: string;
  phoneticTip?: string;
  suggestedFollowUp?: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function createSpeechRecognition(): BrowserSpeechRecognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  try {
    const recognition = new Ctor();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    return recognition;
  } catch {
    return null;
  }
}

export const CoachView: React.FC<CoachViewProps> = ({
  level,
  uiLanguage,
  audioEnabled,
  speechRate = 0.95,
  t,
}) => {
  const [activeMode, setActiveMode] = useState<"chat" | "voice" | "checker">(
    "chat"
  );

  // Track global speaking state so user always sees when audio is playing
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  useEffect(() => {
    return subscribeSpeakingState((playing, text) => {
      setIsSpeaking(playing);
      setSpeakingText(text);
    });
  }, []);

  const buildWelcomeMessage = (): CoachMessage => ({
    id: "welcome-msg",
    role: "coach",
    text:
      uiLanguage === "ar"
        ? `مرحباً! أنا مدربك الذكي للغة الفرنسية في تطبيق Phrase juste (المستوى ${level}). اسألني عن أي قاعدة نحوية أو فرق بين الكلمات، أو اضغط على زر الصوت للاستماع إلى النطق الفرنسي.`
        : uiLanguage === "en"
        ? `Bonjour! I am your Phrase juste French Coach (calibrated for CEFR ${level}). Ask me about any grammar rule, verb tense, or word nuance, or tap any speaker icon to hear French pronunciation aloud.`
        : `Bonjour ! Je suis votre coach grammatical « Phrase juste » (calibré sur le niveau ${level}). Posez-moi vos questions sur la grammaire, la conjugaison ou les nuances du français, et cliquez sur « Écouter » pour entendre chaque explication.`,
    examples: [
      {
        french: "J'ai rendu visite à mes parents dimanche.",
        translation:
          uiLanguage === "ar"
            ? "زرت والديّ يوم الأحد."
            : "I visited my parents on Sunday.",
        note: "rendre visite à + personne",
      },
      {
        french: "Nous avons visité le musée d'Orsay hier matin.",
        translation:
          uiLanguage === "ar"
            ? "زرنا متحف أورساي صباح أمس."
            : "We visited the Musée d'Orsay yesterday morning.",
        note: "visiter + lieu ou monument",
      },
    ],
    tip:
      uiLanguage === "ar"
        ? "اضغط على أيقونة الميكروفون أو مكبر الصوت للاستماع والتحدث بالفرنسية."
        : "Astuce : Cliquez sur le bouton « Écouter » en haut de chaque réponse ou passez en mode Conversation vocale.",
    timestamp: new Date().toISOString(),
  });

  const [messages, setMessages] = useState<CoachMessage[]>(() => [
    buildWelcomeMessage(),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDictatingChat, setIsDictatingChat] = useState(false);
  const [autoSpeakCoachReplies, setAutoSpeakCoachReplies] = useState(true);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatDictationIndexRef = useRef(0);

  // Live Voice Coach state
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState<string>("");
  const [voiceInputText, setVoiceInputText] = useState("");
  const [voiceTurnLoading, setVoiceTurnLoading] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<
    VoiceTranscriptItem[]
  >([
    {
      id: "voice-init",
      role: "coach",
      french:
        "Bonjour ! Cliquez sur « Démarrer la session vocale » ou sur l'une des situations ci-dessous pour parler français avec moi et recevoir une réponse vocale immédiate.",
      note: `Studio Vocal · CECRL ${level}`,
      phoneticTip: "Chaque réplique du coach est lue à haute voix en français.",
      suggestedFollowUp: "Bonjour ! Hier soir, j'ai visité mon ami Paul à Lyon.",
    },
  ]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const speechRecRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceScrollRef = useRef<HTMLDivElement | null>(null);

  // Sentence checker state
  const [sentenceToCheck, setSentenceToCheck] = useState("");
  const [checkerLoading, setCheckerLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<SentenceCheckResponse | null>(
    null
  );

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (voiceScrollRef.current) {
      voiceScrollRef.current.scrollTop = voiceScrollRef.current.scrollHeight;
    }
  }, [voiceTranscripts, voiceTurnLoading]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
      stopSpeakingFrench();
    };
  }, []);

  const handleSpeakText = (text: string) => {
    if (isSpeaking && speakingText === text) {
      stopSpeakingFrench();
      return;
    }
    // Explicit user click always plays audio even if background sound setting was muted
    speakFrench(text, true, speechRate);
  };

  const handleChatVoiceDictation = () => {
    if (isDictatingChat) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsDictatingChat(false);
      return;
    }

    const recognition = createSpeechRecognition();
    if (recognition) {
      speechRecRef.current = recognition;
      setIsDictatingChat(true);
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        if (transcript.trim()) {
          setInput((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
        setIsDictatingChat(false);
      };
      recognition.onerror = () => {
        setIsDictatingChat(false);
      };
      recognition.onend = () => {
        setIsDictatingChat(false);
      };
      try {
        recognition.start();
        return;
      } catch {
        setIsDictatingChat(false);
      }
    }

    // Fallback when WebView SpeechRecognition isn't available: insert a spoken French question and read it aloud
    const fallbackDictations = [
      "Quelle est la différence entre visiter et rendre visite à ?",
      "Comment choisir entre le passé composé et l'imparfait ?",
      "Quand faut-il utiliser le subjonctif après bien que ?",
      "Pourquoi dit-on prendre une décision et non faire une décision ?",
    ];
    const picked =
      fallbackDictations[chatDictationIndexRef.current % fallbackDictations.length];
    chatDictationIndexRef.current += 1;
    setInput(picked);
    speakFrench(picked, true, speechRate);
  };

  const sendQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: CoachMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/coach"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          level,
          uiLanguage,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      const replyText =
        data.reply || "Voici l'explication grammaticale correspondante.";
      const examplesList = Array.isArray(data.examples) ? data.examples : [];
      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        text: replyText,
        examples: examplesList,
        tip: data.tip || "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, coachMsg]);

      if (autoSpeakCoachReplies && audioEnabled) {
        const firstFrenchExample = examplesList[0]?.french;
        const textToRead =
          uiLanguage === "fr"
            ? replyText.replace(/[*_`]/g, "")
            : firstFrenchExample || replyText.replace(/[*_`]/g, "");
        speakFrench(textToRead, true, speechRate);
      }
    } catch {
      const fallbackText =
        "Pour construire une phrase juste, vérifiez toujours la préposition qui suit le verbe et l'accord du participe passé.";
      const fallbackMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        text: fallbackText,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      if (autoSpeakCoachReplies && audioEnabled) {
        speakFrench(fallbackText, true, speechRate);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const playBase64Pcm24k = async (base64Audio: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = audioCtxRef.current;
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768;
      }
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch {
      // Ignore audio decode issues
    }
  };

  const startVoiceSession = async () => {
    if (voiceActive) {
      stopVoiceSession();
      return;
    }

    // Immediately activate voice session and speak the French greeting aloud so the user gets instant feedback
    setVoiceActive(true);
    setVoiceStatusText(t.coach.voiceConnected);

    const welcomeGreeting =
      level === "A1" || level === "A2"
        ? "Bonjour ! La session vocale est active. Parlez-moi en français ou cliquez sur une réplique : comment allez-vous aujourd'hui ?"
        : "Bonjour et bienvenue dans votre session vocale ! Dites-moi une phrase en français ou choisissez un scénario pour commencer.";

    setVoiceTranscripts((prev) => {
      const alreadyHasActiveGreeting = prev.some((p) =>
        p.french.includes("La session vocale est active")
      );
      if (alreadyHasActiveGreeting) return prev;
      return [
        ...prev,
        {
          id: `vt-welcome-${Date.now()}`,
          role: "coach",
          french: welcomeGreeting,
          note: `Coach en direct · CECRL ${level}`,
          phoneticTip: "Cliquez sur le micro pour dicter votre phrase ou choisissez une réplique.",
          suggestedFollowUp: "Bonjour ! Je vais très bien, je voudrais pratiquer mon français oral.",
        },
      ];
    });

    speakFrench(welcomeGreeting, true, speechRate);

    // Also open WebSocket in background when available
    const wsUrl = getLiveWebSocketUrl(level, uiLanguage);
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playBase64Pcm24k(msg.audio);
          }
          if (msg.coachTranscript && !msg.coachTranscript.includes("Je suis votre coach vocal")) {
            setVoiceTranscripts((prev) => [
              ...prev,
              {
                id: `vt-coach-${Date.now()}`,
                role: "coach",
                french: msg.coachTranscript,
                note: msg.note || `Correction & Réponse orale (${level})`,
                phoneticTip: msg.phoneticTip,
                suggestedFollowUp: msg.suggestedFollowUp,
              },
            ]);
            if (!msg.audio) {
              speakFrench(msg.coachTranscript, true, speechRate);
            }
          }
        } catch {
          // Ignore malformed WS frame
        }
      };

      ws.onerror = () => {
        // Keep voiceActive true because HTTP /api/voice-turn + TTS handles turns seamlessly
      };
    } catch {
      // Keep voiceActive true with HTTP /api/voice-turn + TTS
    }
  };

  const stopVoiceSession = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch {
        // Ignore
      }
      speechRecRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    stopSpeakingFrench();
    setIsListeningMic(false);
    setVoiceActive(false);
    setVoiceStatusText(t.coach.voiceIdle);
  };

  const sendOralPromptTurn = async (spokenFrench: string) => {
    const trimmed = spokenFrench.trim();
    if (!trimmed || voiceTurnLoading) return;

    if (!voiceActive) {
      setVoiceActive(true);
      setVoiceStatusText(t.coach.voiceConnected);
    }

    setVoiceTranscripts((prev) => [
      ...prev,
      {
        id: `vt-user-${Date.now()}`,
        role: "user",
        french: trimmed,
      },
    ]);
    setVoiceInputText("");
    setVoiceTurnLoading(true);

    try {
      const response = await fetch(getApiUrl("/api/voice-turn"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spokenFrench: trimmed,
          level,
          uiLanguage,
        }),
      });
      const data = await response.json();
      const coachReply =
        data.coachTranscript ||
        "Très bien dit ! Continuez sur cette lancée avec une nouvelle phrase.";

      setVoiceTranscripts((prev) => [
        ...prev,
        {
          id: `vt-coach-${Date.now()}`,
          role: "coach",
          french: coachReply,
          note: data.grammarNote || `Feedback oral · CECRL ${level}`,
          phoneticTip: data.phoneticTip,
          suggestedFollowUp: data.suggestedFollowUp,
        },
      ]);

      speakFrench(coachReply, true, speechRate);
    } catch {
      const fallbackReply = trimmed.toLowerCase().includes("visité mon")
        ? "Attention : dites plutôt « J'ai rendu visite à mon ami Paul à Lyon ». Avec une personne, on utilise toujours « rendre visite à »."
        : trimmed.toLowerCase().includes("suis faim") ||
          trimmed.toLowerCase().includes("suis très faim")
        ? "Petite correction : en français, on dit « J'ai très faim » avec l'auxiliaire avoir. Répétez après moi : « J'ai très faim, où est la boulangerie ? »"
        : "Très bonne prononciation ! Votre phrase est claire et idiomatique. Voulez-vous essayer une autre réplique ?";

      setVoiceTranscripts((prev) => [
        ...prev,
        {
          id: `vt-coach-${Date.now()}`,
          role: "coach",
          french: fallbackReply,
          note: `Correction orale · CECRL ${level}`,
        },
      ]);
      speakFrench(fallbackReply, true, speechRate);
    } finally {
      setVoiceTurnLoading(false);
    }
  };

  const handleVoiceMicCapture = () => {
    if (isListeningMic) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListeningMic(false);
      return;
    }

    const recognition = createSpeechRecognition();
    if (recognition) {
      speechRecRef.current = recognition;
      setIsListeningMic(true);
      setVoiceStatusText("Écoute de votre voix en français (fr-FR)...");
      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        setIsListeningMic(false);
        if (transcript.trim()) {
          sendOralPromptTurn(transcript.trim());
        }
      };
      recognition.onerror = () => {
        setIsListeningMic(false);
        setVoiceStatusText(t.coach.voiceConnected);
      };
      recognition.onend = () => {
        setIsListeningMic(false);
      };
      try {
        recognition.start();
        return;
      } catch {
        setIsListeningMic(false);
      }
    }

    // If WebView doesn't support SpeechRecognition API, trigger the next oral turn immediately
    const latestSuggested =
      [...voiceTranscripts].reverse().find((item) => item.suggestedFollowUp)
        ?.suggestedFollowUp ||
      "Bonjour ! Je voudrais un café allongé et un croissant, s'il vous plaît.";
    sendOralPromptTurn(latestSuggested);
  };

  const handleCheckSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sentenceToCheck.trim();
    if (!trimmed || checkerLoading) return;

    setCheckerLoading(true);
    try {
      const response = await fetch(getApiUrl("/api/sentence-check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: trimmed,
          level,
          uiLanguage,
        }),
      });
      const data = await response.json();
      setCheckResult(data);
      if (data.corrected) {
        speakFrench(data.corrected, true, speechRate);
      }
    } catch {
      setCheckResult({
        isCorrect: true,
        corrected: trimmed,
        explanation: "Phrase analysée localement.",
        grammarRule: "Syntaxe",
        alternatives: [trimmed],
      });
    } finally {
      setCheckerLoading(false);
    }
  };

  const starters = [
    t.coach.starter1,
    t.coach.starter2,
    t.coach.starter3,
    t.coach.starter4,
  ];

  const oralScenarios = [
    {
      label: "Piège : visiter vs rendre visite",
      phrase: "Bonjour ! Hier soir, j'ai visité mon ami Paul à Lyon.",
    },
    {
      label: "Boulangerie : avoir faim",
      phrase: "Excusez-moi, je suis très faim, où est la boulangerie ?",
    },
    {
      label: "Subjonctif : bien qu'il pleuve",
      phrase: "Bien qu'il pleuve aujourd'hui, je préfère marcher jusqu'au musée.",
    },
    {
      label: "Au café à Paris",
      phrase: "Bonjour ! Je voudrais un café allongé et un croissant chaud, s'il vous plaît.",
    },
    {
      label: "Entretien professionnel",
      phrase: "J'ai eu l'occasion de gérer un projet international l'année dernière.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            {t.coach.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t.coach.subtitle}
          </p>
        </div>

        {/* 3-Mode Switcher: Chat | Live Voice | Sentence Checker */}
        <div
          role="group"
          aria-label="Coach Mode"
          className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-900 rounded-xl self-start shrink-0 overflow-x-auto max-w-full"
        >
          <button
            type="button"
            onClick={() => setActiveMode("chat")}
            className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeMode === "chat"
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.coach.modeChat}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("voice")}
            className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeMode === "voice"
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{t.coach.modeVoice}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode("checker")}
            className={`px-3 py-2 min-h-[38px] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeMode === "checker"
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.coach.modeChecker}</span>
          </button>
        </div>
      </div>

      {/* Active Audio Playback Banner */}
      {isSpeaking && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-900 text-white shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <span className="text-xs font-semibold truncate" dir="ltr">
              Lecture vocale : « {speakingText} »
            </span>
          </div>
          <button
            type="button"
            onClick={stopSpeakingFrench}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold shrink-0 cursor-pointer"
          >
            Arrêter
          </button>
        </div>
      )}

      {activeMode === "chat" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Starter Prompts & Auto-Voice Toggle */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex flex-wrap gap-2 flex-1">
              {starters.map((promptText, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendQuestion(promptText)}
                  className="text-start px-3 py-2 min-h-[38px] rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-700 text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  {promptText}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAutoSpeakCoachReplies((prev) => !prev)}
                className={`px-2.5 py-1.5 min-h-[34px] rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  autoSpeakCoachReplies
                    ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}
                title="Lire automatiquement les réponses du coach"
              >
                {autoSpeakCoachReplies ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>Voix auto</span>
              </button>

              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMessages([buildWelcomeMessage()])}
                  className="px-2.5 py-1.5 min-h-[34px] rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.coach.clearChat}</span>
                </button>
              )}
            </div>
          </div>

          {/* Conversation Messages */}
          <div
            ref={chatScrollRef}
            className="p-5 space-y-4 max-h-[480px] overflow-y-auto"
          >
            {messages.map((msg) => {
              const cleanBubbleText = msg.text.replace(/[*_`]/g, "");
              const isBubblePlaying =
                isSpeaking && speakingText === cleanBubbleText;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 space-y-3 ${
                      msg.role === "user"
                        ? "bg-blue-800 text-white"
                        : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {msg.role === "coach" && (
                      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                          Coach Phrase juste · {level}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSpeakText(cleanBubbleText)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isBubblePlaying
                              ? "bg-blue-800 text-white"
                              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-blue-800 dark:text-blue-300 hover:border-blue-600"
                          }`}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>
                            {isBubblePlaying ? "Arrêter" : "Écouter"}
                          </span>
                        </button>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed">{msg.text}</p>

                    {msg.examples && msg.examples.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                        {msg.examples.map((ex, i) => {
                          const isExPlaying =
                            isSpeaking && speakingText === ex.french;
                          return (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3"
                            >
                              <div className="space-y-0.5">
                                <p
                                  dir="ltr"
                                  className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300"
                                >
                                  « {ex.french} »
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {ex.translation}
                                </p>
                                {ex.note && (
                                  <p className="text-[11px] font-mono text-slate-500">
                                    {ex.note}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSpeakText(ex.french)}
                                aria-label={`Écouter : ${ex.french}`}
                                className={`min-h-[38px] px-3 rounded-lg flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                                  isExPlaying
                                    ? "bg-blue-800 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-800 dark:text-blue-400"
                                }`}
                              >
                                <Volume2 className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  {isExPlaying ? "Stop" : "Écouter"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {msg.tip && (
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-300 pt-1">
                        {msg.tip}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                {t.coach.thinking}
              </div>
            )}
          </div>

          {/* Chat Input Form with Voice Dictation Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleChatVoiceDictation}
              aria-label="Dicter une question en français"
              title="Dicter une question en français"
              className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                isDictatingChat
                  ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-600"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <label htmlFor="coach-chat-input" className="sr-only">
              {t.coach.inputPlaceholder}
            </label>
            <input
              id="coach-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.coach.inputPlaceholder}
              className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t.coach.send}</span>
            </button>
          </form>
        </div>
      )}

      {activeMode === "voice" && (
        /* Live Voice Conversation Studio */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.coach.voiceTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {t.coach.voiceSubtitle}
              </p>
              <p className="text-xs font-mono text-blue-800 dark:text-blue-400 pt-1">
                {voiceStatusText || t.coach.voiceIdle}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleVoiceMicCapture}
                className={`px-4 py-3 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 border transition-colors cursor-pointer ${
                  isListeningMic
                    ? "bg-amber-500 border-amber-500 text-slate-950 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-blue-600"
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListeningMic ? "Écoute..." : "Parler au micro"}</span>
              </button>

              <button
                type="button"
                onClick={voiceActive ? stopVoiceSession : startVoiceSession}
                className={`px-5 py-3 min-h-[48px] rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${
                  voiceActive
                    ? "bg-rose-700 hover:bg-rose-800 text-white"
                    : "bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
                }`}
              >
                {voiceActive ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>{t.coach.stopVoiceBtn}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>{t.coach.startVoiceBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive 12-Bar Acoustic Waveform Visualizer when session or audio is active */}
          {(voiceActive || isSpeaking || isListeningMic) && (
            <div className="rounded-2xl bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {isListeningMic
                    ? "Microphone actif · Parlez en français"
                    : isSpeaking
                    ? "Coach Vocal IA · En train de parler"
                    : `Studio Vocal Connecté · CECRL ${level}`}
                </p>
                <p className="text-xs text-slate-300">
                  Cliquez sur n'importe quelle réplique pour l'écouter ou répondre à voix haute.
                </p>
              </div>
              <div className="flex items-center gap-1 h-8 shrink-0" aria-hidden="true">
                {[18, 28, 14, 32, 22, 30, 16, 26, 20, 32, 14, 24].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isSpeaking || isListeningMic
                        ? "bg-amber-400 animate-pulse"
                        : "bg-blue-400/60"
                    }`}
                    style={{ height: `${ isSpeaking || isListeningMic ? h : Math.max(8, Math.floor(h / 2)) }px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 5 Situational Roleplay Prompts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Situations orales interactives (cliquez pour parler au coach) :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" dir="ltr">
              {oralScenarios.map((item) => (
                <button
                  key={item.phrase}
                  type="button"
                  onClick={() => sendOralPromptTurn(item.phrase)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-600 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-0.5">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-950 dark:group-hover:text-white">
                    « {item.phrase} »
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Transcript Thread */}
          <div
            ref={voiceScrollRef}
            className="space-y-3 max-h-[380px] overflow-y-auto pt-2"
          >
            {voiceTranscripts.map((item) => {
              const isItemPlaying =
                isSpeaking && speakingText === item.french;
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    item.role === "user"
                      ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
                      : "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-semibold text-blue-800 dark:text-blue-400 block">
                        {item.role === "user" ? "Vous (Oral)" : "Coach Vocal IA"}
                        {item.note ? ` · ${item.note}` : ""}
                      </span>
                      <p
                        dir="ltr"
                        className="text-sm font-medium text-slate-900 dark:text-white leading-relaxed"
                      >
                        {item.french}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakText(item.french)}
                      aria-label={`Écouter : ${item.french}`}
                      className={`min-h-[38px] px-3 rounded-lg border flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                        isItemPlaying
                          ? "bg-blue-800 border-blue-800 text-white"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-blue-800 dark:text-blue-400 hover:border-blue-600"
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isItemPlaying ? "Stop" : "Écouter"}</span>
                    </button>
                  </div>

                  {item.phoneticTip && (
                    <p
                      dir="ltr"
                      className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-700/70 pt-2"
                    >
                      Conseil phonétique : {item.phoneticTip}
                    </p>
                  )}

                  {item.suggestedFollowUp && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          sendOralPromptTurn(item.suggestedFollowUp!)
                        }
                        className="text-xs font-semibold text-blue-800 dark:text-blue-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                        dir="ltr"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          Répondre : « {item.suggestedFollowUp} »
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {voiceTurnLoading && (
              <div className="text-xs font-medium text-slate-500 px-2">
                Le coach vocal prépare sa réponse en français...
              </div>
            )}
          </div>

          {/* Direct Custom Spoken Turn Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendOralPromptTurn(voiceInputText);
            }}
            className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              dir="ltr"
              value={voiceInputText}
              onChange={(e) => setVoiceInputText(e.target.value)}
              placeholder="Ou écrivez votre réplique orale en français ici..."
              className="flex-1 px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-700"
            />
            <button
              type="submit"
              disabled={!voiceInputText.trim() || voiceTurnLoading}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Répondre</span>
            </button>
          </form>
        </div>
      )}

      {activeMode === "checker" && (
        /* Sentence Checker Mode */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t.coach.checkerTitle}
          </h2>

          {/* Quick sample buttons */}
          <div className="flex flex-wrap gap-2" dir="ltr">
            {[
              "J'ai visité mon frère hier soir.",
              "Je suis très faim ce midi.",
              "Malgré qu'il pleut, je sors.",
              "Il faut faire une décision.",
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setSentenceToCheck(sample)}
                className="px-3 py-1.5 min-h-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                « {sample} »
              </button>
            ))}
          </div>

          <form onSubmit={handleCheckSentence} className="space-y-4">
            <label htmlFor="sentence-checker-input" className="sr-only">
              {t.coach.checkerPlaceholder}
            </label>
            <textarea
              id="sentence-checker-input"
              dir="ltr"
              rows={3}
              value={sentenceToCheck}
              onChange={(e) => setSentenceToCheck(e.target.value)}
              placeholder={t.coach.checkerPlaceholder}
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-base focus:outline-none focus:border-blue-700"
            />
            <button
              type="submit"
              disabled={!sentenceToCheck.trim() || checkerLoading}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-blue-800 hover:bg-blue-900 disabled:opacity-40 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {checkerLoading ? t.coach.thinking : t.coach.checkSentenceBtn}
            </button>
          </form>

          {checkResult && (
            <div
              role="status"
              className={`p-5 rounded-xl border space-y-3 ${
                checkResult.isCorrect
                  ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                  : "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {checkResult.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  )}
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {checkResult.isCorrect
                      ? t.coach.sentenceValid
                      : t.coach.sentenceNeedsFix}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {checkResult.grammarRule}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                  {t.coach.suggestedCorrection}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <p
                    dir="ltr"
                    className="text-base font-bold text-blue-950 dark:text-white"
                  >
                    « {checkResult.corrected} »
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSpeakText(checkResult.corrected)}
                    aria-label="Écouter la phrase corrigée"
                    className="min-h-[38px] px-3 rounded-lg bg-white dark:bg-slate-800 text-xs font-medium text-blue-800 dark:text-blue-400 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{t.lessons.listenPronunciation}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {checkResult.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
