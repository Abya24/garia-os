import React from "react";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Award,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PerformanceIntelligenceData } from "../../utils/studentPerformanceAnalytics";

interface GoalTrackingSectionProps {
  data: PerformanceIntelligenceData;
  onNavigate?: (tab: string) => void;
}

export const GoalTrackingSection: React.FC<GoalTrackingSectionProps> = ({
  data,
  onNavigate,
}) => {
  const { goalTracking } = data;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Goal Milestones & Achievement Velocity
            </h2>
            <p className="text-xs text-slate-400">
              Weekly and monthly target commitments, deadlines, and milestone completion rate
            </p>
          </div>
        </div>
      </div>

      {/* 4 Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Weekly Goal Progress */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[10px]">
              Weekly Goal Progress
            </span>
            <Calendar className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {goalTracking.weeklyGoalProgressPct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalTracking.weeklyGoalProgressPct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {goalTracking.weeklyGoalCompleted} / {goalTracking.weeklyGoalCount} goals done this week
          </div>
        </div>

        {/* 2. Monthly Goal Progress */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-indigo-300 uppercase tracking-wider text-[10px]">
              Monthly Goal Progress
            </span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">
            {goalTracking.monthlyGoalProgressPct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalTracking.monthlyGoalProgressPct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {goalTracking.monthlyGoalCompleted} / {goalTracking.monthlyGoalCount} goals done this month
          </div>
        </div>

        {/* 3. Achievement Rate */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 uppercase tracking-wider text-[10px]">
              Achievement Rate
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-300">
            {goalTracking.achievementRatePct}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalTracking.achievementRatePct}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {goalTracking.completedGoalsCount} of {goalTracking.totalGoals} all-time goals
          </div>
        </div>

        {/* 4. Missed Goals Alert */}
        <div className={`p-5 rounded-3xl bg-slate-900/80 border space-y-2 relative overflow-hidden ${
          goalTracking.missedGoalsCount > 0 ? "border-rose-500/40 bg-rose-950/10" : "border-white/10"
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-300 uppercase tracking-wider text-[10px]">
              Overdue / Missed
            </span>
            <AlertTriangle className={`w-4 h-4 ${goalTracking.missedGoalsCount > 0 ? "text-rose-400" : "text-slate-500"}`} />
          </div>
          <div className={`text-3xl font-extrabold font-mono ${goalTracking.missedGoalsCount > 0 ? "text-rose-400" : "text-slate-300"}`}>
            {goalTracking.missedGoalsCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {goalTracking.missedGoalsCount === 0
              ? "Zero missed goals! All deadlines on schedule."
              : "Goals past target date requiring reschedule."}
          </p>
        </div>
      </div>

      {/* Upcoming Goals Preview */}
      {goalTracking.upcomingGoals.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-white">
              Active Milestone Targets
            </h3>
            {onNavigate && (
              <button
                onClick={() => onNavigate("goals")}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>Manage Goals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goalTracking.upcomingGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-white truncate max-w-[200px]">
                      {goal.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {goal.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 font-bold shrink-0">
                    Due: {goal.targetDate}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
