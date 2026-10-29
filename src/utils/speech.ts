export function speakFrench(text: string, enabled = true): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
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
