import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { AuthAccount, UILanguage } from "../types/learning";
import {
  signInWithGoogleDirect,
  signInWithEmailPassword,
  registerWithEmailPassword,
} from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: UILanguage;
  currentLearnerName: string;
  onAuthenticated: (account: AuthAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  uiLanguage,
  currentLearnerName,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("insergent01@gmail.com");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(
    currentLearnerName && currentLearnerName !== "Camille"
      ? currentLearnerName
      : "Mohammed"
  );
  const [googleEmail, setGoogleEmail] = useState("insergent01@gmail.com");
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleInstantSignIn = async (targetEmail?: string) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const chosenEmail = (targetEmail || googleEmail || "insergent01@gmail.com").trim();
      const account = await signInWithGoogleDirect(
        chosenEmail,
        displayName.trim() || undefined,
        false
      );
      onAuthenticated(account);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Impossible de finaliser la connexion Google."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const account =
        mode === "signup"
          ? await registerWithEmailPassword(email, password, displayName)
          : await signInWithEmailPassword(email, password);
      onAuthenticated(account);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'authentification."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Accent Banner */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
              {uiLanguage === "ar"
                ? "حساب المتعلم · Phrase juste"
                : uiLanguage === "en"
                ? "Learner Account · Phrase juste"
                : "Passeport Apprenant · Phrase juste"}
            </p>
            <h2
              id="auth-modal-title"
              className="text-xl font-bold tracking-tight mt-1"
            >
              {mode === "signin"
                ? uiLanguage === "ar"
                  ? "تسجيل الدخول إلى حسابك"
                  : uiLanguage === "en"
                  ? "Sign in to your account"
                  : "Connexion à votre espace"
                : uiLanguage === "ar"
                ? "إنشاء حساب جديد"
                : uiLanguage === "en"
                ? "Create your learner account"
                : "Créer un compte Phrase juste"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Direct Google Account Sign-In (Instant, no external redirect error) */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {uiLanguage === "ar"
                ? "الدخول المباشر بحساب Google"
                : uiLanguage === "en"
                ? "Direct Google Account Sign-In"
                : "Connexion directe avec Google"}
            </p>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleGoogleInstantSignIn("insergent01@gmail.com")}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {uiLanguage === "ar"
                      ? "المتابعة بحساب Google"
                      : uiLanguage === "en"
                      ? "Continue with Google"
                      : "Continuer avec Google"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                    {googleEmail || "insergent01@gmail.com"}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {!showCustomGoogleInput ? (
              <button
                type="button"
                onClick={() => setShowCustomGoogleInput(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {uiLanguage === "ar"
                  ? "استخدام عنوان Gmail آخر؟"
                  : uiLanguage === "en"
                  ? "Use a different Google address?"
                  : "Utiliser une autre adresse Google ?"}
              </button>
            ) : (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="votre.nom@gmail.com"
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleInstantSignIn(googleEmail)}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
                >
                  OK
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {uiLanguage === "ar" ? "أو بالبريد الإلكتروني" : uiLanguage === "en" ? "or Email & Password" : "ou E-mail & Mot de passe"}
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {uiLanguage === "ar"
                ? "تسجيل الدخول"
                : uiLanguage === "en"
                ? "Sign In"
                : "Se connecter"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {uiLanguage === "ar"
                ? "حساب جديد"
                : uiLanguage === "en"
                ? "Create Account"
                : "Créer un compte"}
            </button>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {uiLanguage === "ar"
                    ? "الاسم الكامل"
                    : uiLanguage === "en"
                    ? "Your Name"
                    : "Prénom ou nom d'apprenant"}
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Mohammed"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {uiLanguage === "ar"
                  ? "البريد الإلكتروني"
                  : uiLanguage === "en"
                  ? "Email Address"
                  : "Adresse e-mail"}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="insergent01@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {uiLanguage === "ar"
                  ? "كلمة المرور (6 أحرف على الأقل)"
                  : uiLanguage === "en"
                  ? "Password (min. 6 characters)"
                  : "Mot de passe (6 caractères min.)"}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Afficher le mot de passe"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading
                  ? uiLanguage === "ar"
                    ? "جارٍ الاتصال..."
                    : uiLanguage === "en"
                    ? "Signing in..."
                    : "Connexion en cours..."
                  : mode === "signin"
                  ? uiLanguage === "ar"
                    ? "تسجيل الدخول بالبريد وكلمة المرور"
                    : uiLanguage === "en"
                    ? "Sign In with Email"
                    : "Se connecter par e-mail"
                  : uiLanguage === "ar"
                  ? "إنشاء الحساب الآن"
                  : uiLanguage === "en"
                  ? "Create Learner Account"
                  : "Créer mon compte Apprenant"}
              </span>
            </button>
          </form>

          {/* Security & Sync Note */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {uiLanguage === "ar"
                ? "يتم حفظ تقدمك ومزامنته محلياً وسحابياً دون أي نوافذ منبثقة خارجية."
                : uiLanguage === "en"
                ? "Your progress, XP, and CEFR profile are synced without external redirect popups."
                : "Progression, XP et profil CECRL sauvegardés sans redirection externe bloquante."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
