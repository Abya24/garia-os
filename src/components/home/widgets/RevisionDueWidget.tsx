import React from "react";
import { RotateCw, Zap, ChevronRight } from "lucide-react";
import { AcademicRevisionItem, ActiveTab } from "../../../types";
import { AppLanguage } from "../../../utils/i18n";

interface RevisionDueWidgetProps {
  revisions: AcademicRevisionItem[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
}

export const RevisionDueWidget: React.FC<RevisionDueWidgetProps> = ({
  revisions,
  currentLanguage,
  onNavigate,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-r from-amber-950/15 via-slate-900/60 to-slate-900/60 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
            <RotateCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
              <span>{currentLanguage === "hi" ? "स्मार्ट रिवीजन कतार" : "Revision Due Today"}</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                1-3-7-15-30
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentLanguage === "hi"
                ? "विस्मरण वक्र को रोकने के लिए आज अनुशंसित विषय।"
                : "Spaced repetition topics due for review before forgetting."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("questionbank")}
          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1 border border-amber-500/30 shrink-0 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{currentLanguage === "hi" ? "अभ्यास करें" : "Practice"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {revisions.length > 0 ? (
          revisions.slice(0, 2).map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider truncate">
                  {rev.topicName || "Key Chapter Concept"}
                </div>
                <div className="text-xs font-semibold text-white truncate mt-0.5">
                  Confidence: {rev.confidenceLevel || "Needs Review"}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Cycle #{rev.cycleCount || 1} • Due {rev.scheduledDate || "Today"}
                </div>
              </div>

              <button
                onClick={() => onNavigate("questionbank")}
                className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
                title="Practice topic in Question Bank"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
            {currentLanguage === "hi"
              ? "सभी रिवीजन शेड्यूल अपडेट हैं। शानदार काम!"
              : "All scheduled revisions are complete. Great job keeping your memory curve strong!"}
          </div>
        )}
      </div>
    </div>
  );
};
