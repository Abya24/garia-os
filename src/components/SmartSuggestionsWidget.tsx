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
    <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-emerald-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              Smart OS Suggestions
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Data-Driven
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Personalized for {studentName || "your active session"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((sug) => {
          const Icon = getIcon(sug.type);
          const isHigh = sug.priority === "high";

          return (
            <div
              key={sug.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative group ${
                isHigh
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                  : sug.priority === "medium"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl p-1.5 flex items-center justify-center shrink-0 ${
                      isHigh
                        ? "bg-rose-500/20 text-rose-300"
                        : sug.priority === "medium"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm font-heading leading-tight">
                        {sug.title}
                      </h4>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md uppercase font-bold ${
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
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {sug.actionText && onAction && (
                <button
                  onClick={() => onAction(sug.targetTab, sug.subjectName)}
                  className="self-end px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex items-center gap-1 border border-white/10"
                >
                  <span>{sug.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
