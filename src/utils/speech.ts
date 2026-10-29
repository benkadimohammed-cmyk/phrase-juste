interface AndroidTTSBridge {
  speakFrench?: (text: string) => void;
}

export function speakFrench(text: string, enabled = true): void {
  if (!enabled || typeof window === "undefined") {
    return;
  }

  try {
    const androidBridge = (
      window as unknown as { PhraseJusteAndroid?: AndroidTTSBridge }
    ).PhraseJusteAndroid;
    if (androidBridge && typeof androidBridge.speakFrench === "function") {
      androidBridge.speakFrench(text);
      return;
    }
  } catch {
    // Fall back to Web Speech API
  }

  if (!("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.94;
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis errors on unsupported browsers
  }
}
