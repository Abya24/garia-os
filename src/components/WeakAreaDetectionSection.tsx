import React from "react";
import { AlertTriangle, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { WeakAreaItem } from "../types";

interface WeakAreaDetectionSectionProps {
  weakAreas: WeakAreaItem[];
  onNavigate: (tab: string) => void;
}

export const WeakAreaDetectionSection: React.FC<WeakAreaDetectionSectionProps> = ({
  weakAreas,
  onNavigate,
}) => {
  if (!weakAreas || weakAreas.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-emerald-500/20 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-white">No critical weak areas detected!</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Your test scores, question accuracy, and syllabus coverage are on track. Continue logging regular tests to monitor performance.
        </p>
      </div>
    );
  }

  const getPriorityBadge = (priority: WeakAreaItem["priority"]) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
            HIGH PRIORITY
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            MEDIUM PRIORITY
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
            LOW PRIORITY
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" /> Weak Area Detection & Priority Queue
          </h3>
          <p className="text-xs text-slate-400">
            AI-flagged concepts ranked by urgency to maximize exam readiness
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {weakAreas.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-3xl bg-slate-900/80 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ${
              item.priority === "HIGH"
                ? "border-rose-500/40 hover:border-rose-500/60 bg-rose-950/10"
                : item.priority === "MEDIUM"
                ? "border-amber-500/30 hover:border-amber-500/50 bg-amber-950/10"
                : "border-white/10 hover:border-emerald-500/30"
            }`}
          >
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                {getPriorityBadge(item.priority)}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-white/10">
                  {item.subjectName}
                </span>
                {item.metricDetail && (
                  <span className="text-xs text-slate-400 font-semibold">
                    [{item.metricDetail}]
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-white">{item.areaTitle}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{item.reason}</p>
            </div>

            <button
              onClick={() => onNavigate(item.targetTab || "academic")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 ${
                item.priority === "HIGH"
                  ? "bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20"
                  : item.priority === "MEDIUM"
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
                  : "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20"
              }`}
            >
              <span>Take Action</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
