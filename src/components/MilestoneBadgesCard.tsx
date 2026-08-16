import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
  X,
  Share2,
} from "lucide-react";
import { MilestoneBadge } from "../utils/gamificationEngine";

interface MilestoneBadgesCardProps {
  title: string;
  subtitle?: string;
  category: "tasks" | "study";
  badges: MilestoneBadge[];
  unlockedCount: number;
  totalCount: number;
  latestUnlocked?: MilestoneBadge | null;
  defaultExpanded?: boolean;
}

export const MilestoneBadgesCard: React.FC<MilestoneBadgesCardProps> = ({
  title,
  subtitle,
  category,
  badges,
  unlockedCount,
  totalCount,
  latestUnlocked,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [selectedBadge, setSelectedBadge] = useState<MilestoneBadge | null>(null);

  const percentComplete = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);

  const filteredBadges = badges.filter((b) => {
    if (filter === "unlocked") return b.unlocked;
    if (filter === "locked") return !b.unlocked;
    return true;
  });

  const getRarityBadge = (rarity: MilestoneBadge["rarity"]) => {
    switch (rarity) {
      case "legendary":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "epic":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "rare":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  return (
    <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-lg transition-all">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md ${
              category === "tasks"
                ? "bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
            }`}
          >
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
                {title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {unlockedCount}/{totalCount} Unlocked
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {subtitle ||
                (category === "tasks"
                  ? "Hit task completion goals like '5 Tasks Completed' to earn prestige badges & XP."
                  : "Clock study hours like '10 Hours Studied' to unlock academic mastery milestones.")}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {latestUnlocked && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              <span>{latestUnlocked.icon}</span>
              <span className="font-semibold">{latestUnlocked.name}</span>
            </div>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1 text-xs font-semibold"
          >
            <span>{isExpanded ? "Collapse" : "View Badges"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Header Summary */}
      <div className="px-4 py-2.5 bg-slate-950/40 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-slate-400 shrink-0 font-medium">Milestone Progress:</span>
          <div className="w-full bg-slate-800/90 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                category === "tasks"
                  ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                  : "bg-gradient-to-r from-cyan-400 to-blue-500"
              }`}
              style={{ width: `${Math.max(5, percentComplete)}%` }}
            />
          </div>
          <span className="font-mono font-bold text-white shrink-0">{percentComplete}%</span>
        </div>

        {/* Filter chips */}
        {isExpanded && (
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: `All (${badges.length})` },
              { id: "unlocked", label: `Unlocked (${unlockedCount})` },
              { id: "locked", label: `In Progress (${totalCount - unlockedCount})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filter === t.id
                    ? "bg-white/15 text-white border border-white/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Badge Grid Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-900/60">
          {filteredBadges.map((badge) => {
            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  badge.unlocked
                    ? "bg-gradient-to-br from-slate-900/95 to-slate-900/80 border-emerald-500/40 hover:border-emerald-400/80 hover:shadow-lg hover:shadow-emerald-500/10"
                    : "bg-slate-950/40 border-white/5 hover:border-white/15 opacity-80"
                }`}
              >
                {/* Top row */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 shadow-md ${
                          badge.unlocked
                            ? "bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 shadow-emerald-500/20"
                            : "bg-slate-900 border border-white/10 grayscale opacity-60"
                        }`}
                      >
                        {badge.icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate font-heading">
                            {badge.name}
                          </h4>
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border mt-0.5 ${getRarityBadge(
                            badge.rarity
                          )}`}
                        >
                          {badge.rarity} • +{badge.xpBonus} XP
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {badge.unlocked ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 border border-white/10 flex items-center justify-center">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="mt-3 pt-2 border-t border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>
                      {badge.unlocked ? "Milestone Achieved" : `Goal: ${badge.targetValue} ${badge.unit}`}
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                      {badge.currentValue} / {badge.targetValue} ({badge.progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        badge.unlocked
                          ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                          : "bg-slate-600"
                      }`}
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-in zoom-in-95 text-center relative">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-xl ${
                selectedBadge.unlocked
                  ? "bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-emerald-500/20 animate-bounce"
                  : "bg-slate-800 border border-white/10 grayscale opacity-60"
              }`}
            >
              {selectedBadge.icon}
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-bold font-heading text-white">
                  {selectedBadge.name}
                </h3>
              </div>
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border mt-1 ${getRarityBadge(
                  selectedBadge.rarity
                )}`}
              >
                {selectedBadge.rarity} Milestone
              </span>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            {/* Achievement Status details */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Progress:</span>
                <span className="font-mono font-bold text-white">
                  {selectedBadge.currentValue} / {selectedBadge.targetValue} {selectedBadge.unit}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full"
                  style={{ width: `${selectedBadge.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                <span>XP Reward:</span>
                <span className="font-bold text-emerald-400">+{selectedBadge.xpBonus} XP</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Status:</span>
                <span className={`font-bold ${selectedBadge.unlocked ? "text-emerald-400" : "text-amber-400"}`}>
                  {selectedBadge.unlocked ? "Unlocked & Awarded" : "Locked (In Progress)"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
