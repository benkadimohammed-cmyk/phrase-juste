/**
 * Resolves API and WebSocket URLs for both Web (Cloud Run / localhost)
 * and Native Android APK WebView (https://appassets.androidplatform.net or file://).
 */

const PRODUCTION_BACKEND_ORIGIN =
  "https://ais-pre-f7hif3dfsfmj5fo52fwgkq-1000072351383.europe-west2.run.app";

export function isNativeAndroidWebView(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return (
    protocol === "file:" ||
    protocol === "capacitor:" ||
    host === "appassets.androidplatform.net" ||
    Boolean((window as unknown as { PhraseJusteAndroid?: unknown }).PhraseJusteAndroid)
  );
}

export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (isNativeAndroidWebView()) {
    return `${PRODUCTION_BACKEND_ORIGIN}${normalizedPath}`;
  }
  return normalizedPath;
}

export function getLiveWebSocketUrl(level: string, uiLanguage: string): string {
  const query = `level=${encodeURIComponent(level)}&lang=${encodeURIComponent(uiLanguage)}`;
  if (isNativeAndroidWebView()) {
    const wsOrigin = PRODUCTION_BACKEND_ORIGIN.replace(/^http/, "ws");
    return `${wsOrigin}/live?${query}`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/live?${query}`;
}
