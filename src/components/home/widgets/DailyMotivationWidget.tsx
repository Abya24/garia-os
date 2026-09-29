import React, { useState, useEffect } from "react";
import {
  Sunrise,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  Bookmark,
  Compass,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  MotivationalQuote,
  fetchDailyQuote,
  fetchMorningDailyMotivation,
  loadMorningMotivationState,
  saveMorningMotivationState,
  getMorningDateKey,
} from "../../../utils/quotes";
import { AppLanguage } from "../../../utils/i18n";

export interface DailyMotivationProps {
  profileId?: string;
  studentName?: string;
  currentLanguage?: AppLanguage;
  activeQuote?: MotivationalQuote;
  morningDateKey?: string;
  onQuoteUpdated?: (quote: MotivationalQuote) => void;
  className?: string;
}

export type DailyMotivationWidgetProps = DailyMotivationProps;

const QUOTE_CATEGORIES: { id: string; label: string; hiLabel: string }[] = [
  { id: "all", label: "Morning Pick", hiLabel: "आज का विचार" },
  { id: "focus", label: "Focus", hiLabel: "एकाग्रता" },
  { id: "consistency", label: "Consistency", hiLabel: "निरंतरता" },
  { id: "discipline", label: "Discipline", hiLabel: "अनुशासन" },
  { id: "excellence", label: "Excellence", hiLabel: "उत्कृष्टता" },
  { id: "resilience", label: "Resilience", hiLabel: "धैर्य" },
  { id: "mindset", label: "Mindset", hiLabel: "मानसिकता" },
];

export const DailyMotivation: React.FC<DailyMotivationProps> = ({
  profileId,
  studentName = "Student",
  currentLanguage = "en",
  activeQuote,
  morningDateKey,
  onQuoteUpdated,
  className = "",
}) => {
  const effectiveDateKey = morningDateKey || getMorningDateKey();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [displayedQuote, setDisplayedQuote] = useState<MotivationalQuote>(
    () => activeQuote || fetchDailyQuote(effectiveDateKey)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [affirmedToday, setAffirmedToday] = useState<boolean>(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync when parent activeQuote updates
  useEffect(() => {
    if (activeQuote) {
      setDisplayedQuote(activeQuote);
    }
  }, [activeQuote]);

  // Fetch fresh morning quote & affirmation state on mount and whenever morning dateKey or profileId changes
  useEffect(() => {
    let isMounted = true;
    const loadMorningQuote = async () => {
      setIsLoading(true);
      try {
        const res = await fetchMorningDailyMotivation({
          profileId,
          dateKey: effectiveDateKey,
          category: selectedCategory,
          forceRefresh: false,
        });
        if (!isMounted) return;
        setDisplayedQuote(res.quote);
        setAffirmedToday(res.affirmedToday);
        setBookmarkedIds(res.bookmarkedIds);
        if (onQuoteUpdated) {
          onQuoteUpdated(res.quote);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadMorningQuote();
    return () => {
      isMounted = false;
    };
  }, [profileId, effectiveDateKey]);

  const handleSelectCategory = async (category: string) => {
    setSelectedCategory(category);
    setIsLoading(true);
    try {
      const res = await fetchMorningDailyMotivation({
        profileId,
        dateKey: effectiveDateKey,
        category,
        forceRefresh: category !== "all",
        excludeId: displayedQuote.id,
      });
      setDisplayedQuote(res.quote);
      if (onQuoteUpdated) {
        onQuoteUpdated(res.quote);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQuote = async () => {
    setIsLoading(true);
    try {
      const res = await fetchMorningDailyMotivation({
        profileId,
        dateKey: effectiveDateKey,
        category: selectedCategory,
        forceRefresh: true,
        excludeId: displayedQuote.id,
      });
      setDisplayedQuote(res.quote);
      if (onQuoteUpdated) {
        onQuoteUpdated(res.quote);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAffirmToday = () => {
    const nextAffirmed = !affirmedToday;
    setAffirmedToday(nextAffirmed);

    const existing = loadMorningMotivationState(profileId);
    saveMorningMotivationState(
      {
        dateKey: effectiveDateKey,
        quote: displayedQuote,
        fetchedAt: existing?.fetchedAt || Date.now(),
        affirmedToday: nextAffirmed,
        bookmarkedIds,
      },
      profileId
    );

    if (nextAffirmed) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.75 },
          colors: ["#10b981", "#06b6d4", "#f59e0b"],
        });
      } catch {
        // Ignore confetti error in headless environments
      }
    }
  };

  const handleToggleBookmark = () => {
    const isSaved = bookmarkedIds.includes(displayedQuote.id);
    const nextBookmarks = isSaved
      ? bookmarkedIds.filter((id) => id !== displayedQuote.id)
      : [...bookmarkedIds, displayedQuote.id];

    setBookmarkedIds(nextBookmarks);
    const existing = loadMorningMotivationState(profileId);
    saveMorningMotivationState(
      {
        dateKey: effectiveDateKey,
        quote: displayedQuote,
        fetchedAt: existing?.fetchedAt || Date.now(),
        affirmedToday,
        bookmarkedIds: nextBookmarks,
      },
      profileId
    );
  };

  const handleCopyQuote = async () => {
    const textToCopy = `"${displayedQuote.quote}" — ${displayedQuote.author}\nDaily Affirmation: ${displayedQuote.affirmation}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isBookmarked = bookmarkedIds.includes(displayedQuote.id);

  return (
    <section
      id="daily-motivation-affirmation-widget"
      aria-label="Daily Motivation and Affirmation"
      className={`glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/25 shadow-lg space-y-4 ${className}`}
    >
      {/* Top Bar: Title, Morning Status & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
            <Sunrise className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <span>
                {currentLanguage === "hi"
                  ? "दैनिक प्रेरणा और सकारात्मक संकल्प"
                  : "Daily Motivation & Morning Affirmation"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-400">
                {effectiveDateKey}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              {currentLanguage === "hi"
                ? `${studentName} का सुबह का प्रेरणा स्रोत`
                : `Morning Mindset & Quote of the Day`}
            </h2>
          </div>
        </div>

        {/* Interactive Controls: Copy, Bookmark, Refresh Quote */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleCopyQuote}
            className="px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            title="Copy Quote & Affirmation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              isBookmarked
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-slate-950/70 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-white"
            }`}
            title={isBookmarked ? "Saved to Favorite Quotes" : "Save Quote"}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${
                isBookmarked ? "fill-amber-400 text-amber-400" : "text-slate-400"
              }`}
            />
            <span>{isBookmarked ? "Saved" : "Save"}</span>
          </button>

          <button
            type="button"
            id="refresh-morning-quote-btn"
            onClick={handleRefreshQuote}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer disabled:opacity-60"
            title="Fetch a fresh inspirational quote"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-amber-300 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{currentLanguage === "hi" ? "नया विचार" : "New Quote"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Theme / Category Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {QUOTE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-900 border border-white/5"
              }`}
            >
              {currentLanguage === "hi" ? cat.hiLabel : cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Grid: Left = Inspirational Quote, Right = Daily Affirmation & Intention */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Inspirational Quote Column (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-white/10 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-amber-300">
                {currentLanguage === "hi" ? "सुविचार" : "Inspirational Quote"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{displayedQuote.category}</span>
            </div>

            <blockquote
              id="daily-motivation-quote-text"
              className="text-base sm:text-lg font-semibold text-white leading-relaxed tracking-tight"
            >
              &ldquo;{displayedQuote.quote}&rdquo;
            </blockquote>

            {displayedQuote.hindiTranslation && (
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {displayedQuote.hindiTranslation}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span
              id="daily-motivation-quote-author"
              className="font-semibold text-amber-300"
            >
              — {displayedQuote.author}
            </span>
            {displayedQuote.tags && displayedQuote.tags.length > 0 && (
              <span className="text-slate-400">
                {displayedQuote.tags.join(" · ")}
              </span>
            )}
          </div>
        </div>

        {/* Daily Personal Affirmation & Morning Action Column (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/25 flex flex-col justify-between space-y-3.5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300">
                {currentLanguage === "hi" ? "आज का आत्म-संकल्प" : "Daily Affirmation"}
              </span>
              <span className="text-slate-400">
                {affirmedToday
                  ? currentLanguage === "hi"
                    ? "आज का संकल्प पूरा"
                    : "Affirmed Today"
                  : currentLanguage === "hi"
                  ? "सुबह का अभ्यास"
                  : "Morning Check-In"}
              </span>
            </div>

            <p
              id="daily-affirmation-text"
              className="text-sm font-medium text-emerald-100 leading-relaxed"
            >
              &ldquo;
              {currentLanguage === "hi" && displayedQuote.affirmationHindi
                ? displayedQuote.affirmationHindi
                : displayedQuote.affirmation}
              &rdquo;
            </p>

            {displayedQuote.morningActionTip && (
              <div className="pt-2 border-t border-white/5 flex items-start gap-2 text-xs text-slate-300">
                <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-cyan-300">Morning Action: </strong>
                  {displayedQuote.morningActionTip}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            id="claim-daily-affirmation-btn"
            onClick={handleAffirmToday}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              affirmedToday
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-sm"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {affirmedToday
                ? currentLanguage === "hi"
                  ? "संकल्प स्वीकार किया गया ✓"
                  : "Mindset Affirmed for Today ✓"
                : currentLanguage === "hi"
                ? "मैं आज इस संकल्प को अपनाता हूँ"
                : "I Affirm This Mindset Today"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export const DailyMotivationWidget = DailyMotivation;
export default DailyMotivation;

