import React from "react";
import {
  BookOpen,
  CheckCircle2,
  Compass,
  MessageSquare,
  TrendingUp,
  User,
} from "lucide-react";
import { ActiveTab } from "../types/learning";
import { UIStrings } from "../i18n/translations";

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onStartQuickPractice: () => void;
  t: UIStrings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onStartQuickPractice,
  t,
}) => {
  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { id: "home", label: t.nav.home, icon: Compass },
    { id: "lessons", label: t.nav.lessons, icon: BookOpen },
    { id: "exercises", label: t.nav.exercises, icon: CheckCircle2 },
    { id: "progress", label: t.nav.progress, icon: TrendingUp },
    { id: "coach", label: t.nav.coach, icon: MessageSquare },
    { id: "profile", label: t.nav.profile, icon: User },
  ];

  // Top bar desktop nav shows 5 main links; Profile is accessible in nav links or mobile bar
  const desktopNavItems = navItems.slice(0, 5);

  return (
    <>
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-13 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab("home")}
            className="text-lg font-bold tracking-tight text-blue-950 dark:text-white font-display whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-700 rounded"
          >
            {t.appName}
          </button>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {desktopNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? "border-blue-800 dark:border-blue-400 text-blue-900 dark:text-white font-semibold"
                      : "border-transparent hover:text-slate-950 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onSelectTab("profile")}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === "profile"
                  ? "border-blue-800 dark:border-blue-400 text-blue-900 dark:text-white font-semibold"
                  : "border-transparent hover:text-slate-950 dark:hover:text-white"
              }`}
            >
              {t.nav.profile}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onStartQuickPractice}
              className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.nav.startPractice}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (52px height to stay strictly within 15% sticky cap) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-6 items-center px-0.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "text-blue-800 dark:text-blue-400 font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
