import React from "react";
import {
  Sparkles,
  Flame,
  Target,
  BookOpen,
  CheckCircle2,
  Droplet,
  Clock,
  ArrowRight,
  ListTodo,
  X,
} from "lucide-react";
import { SmartSuggestion } from "../utils/suggestionsEngine";

interface SmartSuggestionsWidgetProps {
  suggestions: SmartSuggestion[];
  onAction?: (targetTab?: string, subjectName?: string) => void;
  onDismiss?: (suggestionId: string) => void;
  studentName?: string;
}

export const SmartSuggestionsWidget: React.FC<SmartSuggestionsWidgetProps> = ({
  suggestions,
  onAction,
  onDismiss,
  studentName,
}) => {
  if (suggestions.length === 0) {
    return (
      <div className="glass-card p-5 rounded-3xl border border-white/10 bg-slate-900/40 text-center">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 p-2.5 mx-auto mb-2 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-white text-sm font-heading">
          All Caught Up!
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          No urgent study alerts or pending tasks for {studentName || "you"} right now.
        </p>
      </div>
    );
  }

  const getIcon = (type: SmartSuggestion["type"]) => {
    switch (type) {
      case "task":
        return ListTodo;
      case "study":
        return Clock;
      case "chapter":
        return BookOpen;
      case "goal":
        return Target;
      case "hydration":
        return Droplet;
      case "habit":
        return Flame;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-3 bg-slate-900/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-1.5 flex items-center justify-center text-slate-950 font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
              Smart OS Suggestions
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                AI Driven
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Personalized for {studentName || "your active session"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {suggestions.map((sug) => {
          const Icon = getIcon(sug.type);
          const isHigh = sug.priority === "high";

          return (
            <div
              key={sug.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 relative group ${
                isHigh
                  ? "bg-rose-500/10 border-rose-500/25 text-rose-200"
                  : sug.priority === "medium"
                  ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-200"
                  : "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg p-1 flex items-center justify-center shrink-0 ${
                      isHigh
                        ? "bg-rose-500/20 text-rose-300"
                        : sug.priority === "medium"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-xs font-heading leading-tight">
                        {sug.title}
                      </h4>
                      <span
                        className={`text-[8px] font-mono px-1 py-0.2 rounded uppercase font-bold ${
                          isHigh
                            ? "bg-rose-500/30 text-rose-200 border border-rose-500/40"
                            : sug.priority === "medium"
                            ? "bg-cyan-500/30 text-cyan-200 border border-cyan-500/40"
                            : "bg-emerald-500/30 text-emerald-200 border border-emerald-500/40"
                        }`}
                      >
                        {sug.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
                      {sug.description}
                    </p>
                  </div>
                </div>

                {onDismiss && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(sug.id);
                    }}
                    title="Dismiss suggestion"
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {sug.actionText && onAction && (
                <button
                  onClick={() => onAction(sug.targetTab, sug.subjectName)}
                  className="self-end px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] transition-all flex items-center gap-1 border border-white/10"
                >
                  <span>{sug.actionText}</span>
                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
