import React from "react";
import { Play, ArrowRight, HelpCircle, BookOpen } from "lucide-react";
import { AcademicChapter, AcademicSubject, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";

interface ContinueLearningWidgetProps {
  activeChapter?: AcademicChapter;
  activeChapterSubject?: AcademicSubject;
  chapterProgress: number;
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const ContinueLearningWidget: React.FC<ContinueLearningWidgetProps> = ({
  activeChapter,
  activeChapterSubject,
  chapterProgress,
  currentLanguage,
  onNavigate,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 sm:p-6 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-cyan-950/20 relative overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
              {currentLanguage === "hi" ? "पढ़ाई जारी रखें" : "Continue Learning"}
            </span>
            {activeChapterSubject && (
              <span className="text-xs font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-md border border-white/10">
                {activeChapterSubject.name}
              </span>
            )}
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {chapterProgress}% {currentLanguage === "hi" ? "पूर्ण" : "Completed"}
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-white font-heading truncate">
            {activeChapter?.title || "Active Board Syllabus Chapter"}
          </h2>
          <p className="text-xs text-slate-300 line-clamp-2 max-w-2xl">
            {activeChapter?.description ||
              "Deep conceptual breakdown with verified NCERT solutions, VVI topic markers, and curated question banks."}
          </p>

          {/* Chapter Progress Bar */}
          <div className="w-full max-w-xl bg-slate-800/90 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(8, chapterProgress)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
          <button
            onClick={() => onNavigate("academic")}
            id="hero-resume-study-btn"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>{currentLanguage === "hi" ? "अध्ययन खोलें" : "Resume Study"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate("questionbank")}
            id="hero-qbank-btn"
            className="flex-1 md:flex-none px-4 py-3 rounded-2xl glass-pill hover:bg-white/10 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{currentLanguage === "hi" ? "प्रश्न बैंक" : "Solve PYQs"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
