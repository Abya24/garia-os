import React from "react";
import { Globe, Check } from "lucide-react";
import { AppLanguage, saveStoredLanguage } from "../utils/i18n";
import { motion } from "motion/react";

interface LanguageSwitcherProps {
  currentLanguage: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  variant?: "pill" | "compact" | "dropdown";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  variant = "pill",
  className = "",
}) => {
  const handleToggle = (newLang: AppLanguage) => {
    if (newLang === currentLanguage) return;
    saveStoredLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const handleCycle = () => {
    const nextLang: AppLanguage = currentLanguage === "en" ? "hi" : "en";
    handleToggle(nextLang);
  };

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleCycle}
        id="header-language-switcher-compact"
        title={`Current: ${currentLanguage === "hi" ? "हिंदी (Hindi)" : "English"}. Click to switch to ${currentLanguage === "hi" ? "English" : "हिंदी"}`}
        aria-label="Toggle language between English and Hindi"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all card-press ${className}`}
      >
        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-cyan-300">
          {currentLanguage === "hi" ? "हिं" : "EN"}
        </span>
      </button>
    );
  }

  return (
    <div
      id="header-language-switcher"
      role="group"
      aria-label="Language selector"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 shadow-inner backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        id="lang-btn-en"
        onClick={() => handleToggle("en")}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
          currentLanguage === "en"
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-extrabold"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
        title="Switch to English"
        aria-pressed={currentLanguage === "en"}
      >
        <span>EN</span>
        {currentLanguage === "en" && <Check className="w-3 h-3 stroke-[3]" />}
      </button>

      <button
        type="button"
        id="lang-btn-hi"
        onClick={() => handleToggle("hi")}
        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
          currentLanguage === "hi"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-extrabold"
            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
        }`}
        title="हिंदी में बदलें (Switch to Hindi)"
        aria-pressed={currentLanguage === "hi"}
      >
        <span>हिन्दी</span>
        {currentLanguage === "hi" && <Check className="w-3 h-3 stroke-[3]" />}
      </button>
    </div>
  );
};
