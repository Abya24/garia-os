import React from "react";
import {
  Sparkles,
  Award,
  AlertTriangle,
  BookOpen,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { PerformanceIntelligenceData } from "../../utils/studentPerformanceAnalytics";

interface AIInsightsSectionProps {
  data: PerformanceIntelligenceData;
  onNavigate?: (tab: string) => void;
}

export const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({
  data,
  onNavigate,
}) => {
  const { aiInsights } = data;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <span>Abya AI Performance Insights</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30">
                Cognitive Analytics
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized strengths, weak areas, dynamic study recommendations, and targeted next steps
            </p>
          </div>
        </div>
      </div>

      {/* Top Insights Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Top Strength */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-emerald-500/30 space-y-3 relative overflow-hidden shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-heading">
                Top Core Strength
              </span>
            </div>
            {aiInsights.topStrength.metric && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30">
                {aiInsights.topStrength.metric}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-white font-heading">
            {aiInsights.topStrength.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {aiInsights.topStrength.description}
          </p>
        </div>

        {/* 2. Top Weakness / Focus Area */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-amber-500/30 space-y-3 relative overflow-hidden shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-heading">
                Primary Opportunity
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
              High Impact
            </span>
          </div>
          <h3 className="text-base font-bold text-white font-heading">
            {aiInsights.topWeakness.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {aiInsights.topWeakness.description}
          </p>
          <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Suggested Action:</strong> {aiInsights.topWeakness.suggestedFix}</span>
          </div>
        </div>
      </div>

      {/* Recommended Subject & Daily Target Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-cyan-950/50 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-heading">
              Strategic Next Subject Focus
            </span>
          </div>
          <h3 className="text-xl font-black text-white font-heading">
            {aiInsights.recommendedSubject.subjectName}
          </h3>
          <p className="text-xs text-slate-300">
            {aiInsights.recommendedSubject.reason}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Recommended Daily Target
            </span>
            <div className="text-2xl font-black font-mono text-cyan-300">
              {aiInsights.recommendedDailyStudyTimeHours} <span className="text-xs font-normal text-slate-400">hrs/day</span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("exam")}
              className="px-4 py-2.5 rounded-2xl bg-cyan-500 text-slate-900 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95"
            >
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Suggested Improvement Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
        <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Recommended Improvement Actions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {aiInsights.suggestedImprovementActions.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 flex flex-col justify-between transition-all hover:border-white/20"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                    act.priority === "high"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : act.priority === "medium"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}>
                    {act.priority} Priority
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                    {act.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white pt-1">
                  {act.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {act.description}
                </p>
              </div>

              {onNavigate && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onNavigate(act.targetTab)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>{act.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
