import { getApiUrl } from "./apiConfig";

interface AndroidTTSBridge {
  speakFrench?: (text: string) => void;
}

type SpeakingListener = (speakingText: string | null) => void;
const listeners = new Set<SpeakingListener>();
let currentSpeakingText: string | null = null;
let activeAudioElement: HTMLAudioElement | null = null;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

function notifySpeaking(text: string | null) {
  currentSpeakingText = text;
  listeners.forEach((fn) => {
    try {
      fn(text);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeSpeakingState(listener: SpeakingListener): () => void {
  listeners.add(listener);
  listener(currentSpeakingText);
  return () => {
    listeners.delete(listener);
  };
}

export function stopSpeakingFrench(): void {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // Ignore audio pause errors
    }
    activeAudioElement = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis cancel errors
    }
  }
  notifySpeaking(null);
}

function playFeedbackCadence(durationMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [330, 392, 440];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(
        0.04,
        ctx.currentTime + idx * 0.09 + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0008,
        ctx.currentTime + idx * 0.09 + 0.14
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.09);
      osc.stop(ctx.currentTime + idx * 0.09 + 0.15);
    });
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, Math.min(durationMs, 1200));
  } catch {
    // Ignore Web Audio API restrictions
  }
}

async function tryServerGeminiTts(text: string): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl("/api/tts"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.slice(0, 400) }),
    });
    if (!response.ok) return false;
    const data = await response.json();
    if (!data?.audioWavBase64) return false;

    const audio = new Audio(`data:audio/wav;base64,${data.audioWavBase64}`);
    activeAudioElement = audio;
    audio.onended = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      notifySpeaking(null);
    };
    audio.onerror = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      notifySpeaking(null);
    };
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export function speakFrench(
  text: string,
  enabled = true,
  rate = 0.94
): void {
  const cleaned = (text || "").trim();
  if (!enabled || !cleaned || typeof window === "undefined") {
    return;
  }

  stopSpeakingFrench();
  notifySpeaking(cleaned);

  const estimatedDurationMs = Math.max(
    1400,
    Math.min(7000, cleaned.split(/\s+/).length * 360)
  );

  // 1. Native Android APK WebView Bridge (PhraseJusteAndroid)
  try {
    const androidBridge = (
      window as unknown as { PhraseJusteAndroid?: AndroidTTSBridge }
    ).PhraseJusteAndroid;
    if (androidBridge && typeof androidBridge.speakFrench === "function") {
      androidBridge.speakFrench(cleaned);
      fallbackTimer = setTimeout(() => {
        notifySpeaking(null);
      }, estimatedDurationMs);
      return;
    }
  } catch {
    // Fall through to Web Speech API
  }

  // 2. Browser Web Speech API (with Chromium resume/cancel timing fix)
  if ("speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
    try {
      const synth = window.speechSynthesis;
      synth.resume();
      const voices = synth.getVoices();
      const frenchVoice =
        voices.find((v) => v.lang.toLowerCase() === "fr-fr") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("fr"));

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = "fr-FR";
      utterance.rate = Math.max(0.75, Math.min(1.15, rate));
      if (frenchVoice) {
        utterance.voice = frenchVoice;
      }

      let started = false;
      utterance.onstart = () => {
        started = true;
      };
      utterance.onend = () => {
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
          fallbackTimer = null;
        }
        notifySpeaking(null);
      };
      utterance.onerror = () => {
        if (!started) {
          void tryServerGeminiTts(cleaned).then((played) => {
            if (!played) {
              playFeedbackCadence(estimatedDurationMs);
              fallbackTimer = setTimeout(() => notifySpeaking(null), 1500);
            }
          });
        } else {
          notifySpeaking(null);
        }
      };

      synth.speak(utterance);

      // Watchdog: if browser speechSynthesis has no voice engine and doesn't start within 350ms, fall back to server TTS / audio cadence
      fallbackTimer = setTimeout(() => {
        if (!started && !synth.speaking) {
          void tryServerGeminiTts(cleaned).then((played) => {
            if (!played) {
              playFeedbackCadence(estimatedDurationMs);
              setTimeout(() => notifySpeaking(null), 1400);
            }
          });
        } else {
          setTimeout(() => {
            if (currentSpeakingText === cleaned) {
              notifySpeaking(null);
            }
          }, estimatedDurationMs);
        }
      }, 350);
      return;
    } catch {
      // Fall through to server TTS
    }
  }

  // 3. Server Gemini TTS fallback + Web Audio feedback
  void tryServerGeminiTts(cleaned).then((played) => {
    if (!played) {
      playFeedbackCadence(estimatedDurationMs);
      fallbackTimer = setTimeout(() => {
        notifySpeaking(null);
      }, 1500);
    }
  });
}
