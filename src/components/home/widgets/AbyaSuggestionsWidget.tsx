import React from "react";
import { Bot, MessageSquare, Sparkles, ChevronRight } from "lucide-react";
import { ActiveTab } from "../../../types";
import { SmartSuggestion } from "../../../utils/suggestionsEngine";
import { AppLanguage } from "../../../utils/i18n";

interface AbyaSuggestionsWidgetProps {
  smartSuggestions: SmartSuggestion[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onDismissSuggestion: (id: string) => void;
}

export const AbyaSuggestionsWidget: React.FC<AbyaSuggestionsWidgetProps> = ({
  smartSuggestions,
  currentLanguage,
  onNavigate,
  onDismissSuggestion,
}) => {
  return (
    <div className="glass-card rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/80 to-slate-900/80 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
              <span>{currentLanguage === "hi" ? "अव्या एआई सुझाव" : "Abya AI Suggestions"}</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
                Adaptive
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {currentLanguage === "hi"
                ? "आपकी अध्ययन गति के आधार पर वैयक्तिकृत सिफारिशें।"
                : "Personalized recommendations based on your recent activity."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate("abya")}
          className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-semibold transition-all flex items-center gap-1 border border-purple-500/30 shrink-0 active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{currentLanguage === "hi" ? "चैट करें" : "Ask AI"}</span>
        </button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-2.5">
        {smartSuggestions.length > 0 ? (
          smartSuggestions.slice(0, 2).map((sug) => (
            <div
              key={sug.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/20 hover:border-purple-500/40 space-y-2 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">{sug.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    {sug.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <button
                  onClick={() => {
                    if (sug.targetTab) onNavigate(sug.targetTab as ActiveTab);
                  }}
                  className="text-[11px] text-purple-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>{sug.actionText || "Start Action"}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onDismissSuggestion(sug.id)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center space-y-1">
            <p className="text-xs text-slate-300">
              {currentLanguage === "hi"
                ? "अव्या एआई का सुझाव: आज के 25 मिनट पोमोडोरो सत्र से शुरुआत करें!"
                : "Abya AI Tip: Begin today with a 25-minute focused study session."}
            </p>
            <button
              onClick={() => onNavigate("abya")}
              className="text-xs text-purple-300 font-bold hover:underline"
            >
              {currentLanguage === "hi" ? "अव्या से मार्गदर्शन लें →" : "Get AI Strategy →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
