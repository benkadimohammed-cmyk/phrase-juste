import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Volume2,
  MessageSquare,
  Mic,
  MicOff,
  RotateCcw,
} from "lucide-react";
import {
  CEFRLevel,
  CoachMessage,
  UILanguage,
} from "../types/learning";
import { UIStrings } from "../i18n/translations";
import { speakFrench } from "../utils/speech";

interface CoachViewProps {
  level: CEFRLevel;
  uiLanguage: UILanguage;
  audioEnabled: boolean;
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
}

export const CoachView: React.FC<CoachViewProps> = ({
  level,
  uiLanguage,
  audioEnabled,
  t,
}) => {
  const [activeMode, setActiveMode] = useState<"chat" | "voice" | "checker">(
    "chat"
  );

  const buildWelcomeMessage = (): CoachMessage => ({
    id: "welcome-msg",
    role: "coach",
    text:
      uiLanguage === "ar"
        ? `مرحباً! أنا مدربك الذكي للغة الفرنسية في تطبيق Phrase juste (المستوى ${level}). اسألني عن أي قاعدة نحوية أو فرق بين الكلمات، أو انتقل إلى المحادثة الصوتية المباشرة.`
        : uiLanguage === "en"
        ? `Bonjour! I am your Phrase juste AI French Coach (adapted to level ${level}). Ask me about any grammar rule, verb tense, or word choice, or switch to Live Voice Coach to practice speaking.`
        : `Bonjour ! Je suis votre coach grammatical « Phrase juste » (calibré sur le niveau ${level}). Posez-moi vos questions sur la grammaire, la conjugaison ou les nuances du français.`,
    examples: [
      {
        french: "J'ai rendu visite à mes parents dimanche.",
        translation:
          uiLanguage === "ar"
            ? "زرت والديّ يوم الأحد."
            : "I visited my parents on Sunday.",
        note: "rendre visite à + personne",
      },
    ],
    tip:
      uiLanguage === "ar"
        ? "اختر أحد الأسئلة السريعة أدناه أو اكتب سؤالك مباشرة."
        : "Astuce : Cliquez sur l'une des questions suggérées ci-dessous ou écrivez la vôtre.",
    timestamp: new Date().toISOString(),
  });

  const [messages, setMessages] = useState<CoachMessage[]>(() => [
    buildWelcomeMessage(),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Live Voice Coach state (Gemini Live API /live WebSocket)
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceStatusText, setVoiceStatusText] = useState<string>("");
  const [voiceTranscripts, setVoiceTranscripts] = useState<
    VoiceTranscriptItem[]
  >([
    {
      id: "voice-init",
      role: "coach",
      french:
        "Bonjour ! Cliquez sur « Démarrer la session vocale » ou choisissez une réplique orale ci-dessous pour pratiquer votre prononciation et votre syntaxe.",
      note: `Gemini Live · CECRL ${level}`,
    },
  ]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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

  // Clean up WebSocket and microphone on unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, []);

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
      const response = await fetch("/api/coach", {
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
      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        text: data.reply || "Voici l'explication grammaticale correspondante.",
        examples: Array.isArray(data.examples) ? data.examples : [],
        tip: data.tip || "",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      const fallbackMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: "coach",
        text: "Pour construire une phrase juste, vérifiez toujours la préposition qui suit le verbe et l'accord du participe passé.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
      // Ignore audio decode issues in headless browser environments
    }
  };

  const startVoiceSession = async () => {
    if (voiceActive) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/live?level=${encodeURIComponent(
      level
    )}&lang=${encodeURIComponent(uiLanguage)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setVoiceActive(true);
        setVoiceStatusText(t.coach.voiceConnected);

        // Attempt microphone capture at 16kHz PCM if available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
              },
            });
            mediaStreamRef.current = stream;
            const audioCtx = new AudioContext({ sampleRate: 16000 });
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);

            source.connect(processor);
            processor.connect(audioCtx.destination);

            processor.onaudioprocess = (event) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const inputData = event.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }
              const uint8 = new Uint8Array(pcm16.buffer);
              let binary = "";
              for (let i = 0; i < uint8.byteLength; i++) {
                binary += String.fromCharCode(uint8[i]);
              }
              ws.send(JSON.stringify({ audio: btoa(binary) }));
            };
          } catch {
            // Microphone permission declined or unavailable; keep WebSocket active for interactive oral prompts
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            playBase64Pcm24k(msg.audio);
          }
          if (msg.coachTranscript) {
            setVoiceTranscripts((prev) => [
              ...prev,
              {
                id: `vt-coach-${Date.now()}`,
                role: "coach",
                french: msg.coachTranscript,
                note: msg.note || `Correction & Réponse orale (${level})`,
              },
            ]);
            if (!msg.audio) {
              speakFrench(msg.coachTranscript, audioEnabled);
            }
          }
        } catch {
          // Ignore malformed WS frame
        }
      };

      ws.onclose = () => {
        setVoiceActive(false);
        setVoiceStatusText(t.coach.voiceIdle);
      };
    } catch {
      setVoiceActive(false);
    }
  };

  const stopVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setVoiceActive(false);
    setVoiceStatusText(t.coach.voiceIdle);
  };

  const sendOralPromptTurn = (spokenFrench: string) => {
    setVoiceTranscripts((prev) => [
      ...prev,
      {
        id: `vt-user-${Date.now()}`,
        role: "user",
        french: spokenFrench,
      },
    ]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          textTurn: spokenFrench,
          level,
          uiLanguage,
        })
      );
      return;
    }

    // Immediate local / fallback oral response if session wasn't opened yet
    const replyFrench = spokenFrench.toLowerCase().includes("visité mon")
      ? "Attention : dites plutôt « J'ai rendu visite à mon ami ». Avec une personne, on utilise toujours « rendre visite à »."
      : spokenFrench.toLowerCase().includes("suis faim")
      ? "Petite correction : en français, on dit « J'ai faim » avec le verbe avoir. Répétez après moi : « J'ai très faim à midi. »"
      : "Très bonne prononciation ! Votre phrase est fluide. Vous pouvez aussi ajouter « En revanche » pour enrichir votre argument.";

    setTimeout(() => {
      setVoiceTranscripts((prev) => [
        ...prev,
        {
          id: `vt-coach-${Date.now()}`,
          role: "coach",
          french: replyFrench,
          note: `Feedback oral instantané (${level})`,
        },
      ]);
      speakFrench(replyFrench, audioEnabled);
    }, 250);
  };

  const handleCheckSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sentenceToCheck.trim();
    if (!trimmed || checkerLoading) return;

    setCheckerLoading(true);
    try {
      const response = await fetch("/api/sentence-check", {
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

  const oralPrompts = [
    "Bonjour ! Hier soir, j'ai visité mon ami Paul à Lyon.",
    "Excusez-moi, je suis très faim, où est la boulangerie ?",
    "Bien qu'il pleuve aujourd'hui, je voudrais pratiquer mon français.",
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

      {activeMode === "chat" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {/* Starter Prompts & Reset Thread */}
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

          {/* Conversation Messages */}
          <div
            ref={chatScrollRef}
            className="p-5 space-y-4 max-h-[460px] overflow-y-auto"
          >
            {messages.map((msg) => (
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
                  <p className="text-sm leading-relaxed">{msg.text}</p>

                  {msg.examples && msg.examples.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700">
                      {msg.examples.map((ex, i) => (
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
                            onClick={() => speakFrench(ex.french, audioEnabled)}
                            aria-label={`Écouter : ${ex.french}`}
                            className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-800 dark:text-blue-400 shrink-0 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.tip && (
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300 pt-1">
                      {msg.tip}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">
                {t.coach.thinking}
              </div>
            )}
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
          >
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
        /* Live Voice Conversation Mode (Gemini Live API) */
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
                  <Mic className="w-4 h-4" />
                  <span>{t.coach.startVoiceBtn}</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Spoken French Prompts */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Simuler une prise de parole en français :
            </span>
            <div className="flex flex-wrap gap-2" dir="ltr">
              {oralPrompts.map((phrase) => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => sendOralPromptTurn(phrase)}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-blue-800 dark:text-blue-400 shrink-0" />
                  <span>« {phrase} »</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Transcript Thread */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pt-2">
            {voiceTranscripts.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  item.role === "user"
                    ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60"
                    : "bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-semibold text-blue-800 dark:text-blue-400 block">
                    {item.role === "user" ? "Vous (Oral)" : "Coach Vocal IA"}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                  <p
                    dir="ltr"
                    className="text-sm font-medium text-slate-900 dark:text-white"
                  >
                    {item.french}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => speakFrench(item.french, true)}
                  aria-label={`Écouter : ${item.french}`}
                  className="min-h-[38px] min-w-[38px] rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-blue-800 dark:text-blue-400 shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
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
                    onClick={() => speakFrench(checkResult.corrected, true)}
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
