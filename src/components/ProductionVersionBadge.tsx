import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  Cpu,
  Timer,
  CheckSquare,
  LayoutGrid,
  Sparkles,
  Lock,
  Cloud,
} from "lucide-react";
import {
  APP_VERSION_LABEL,
  APP_RELEASE_DATE,
  APP_BUILD_CHANNEL,
  APP_CODENAME,
  getFullBuildString,
} from "../constants/version";

interface ProductionVersionBadgeProps {
  variant?: "pill" | "card" | "footer" | "minimal";
  showCopy?: boolean;
  className?: string;
}

export const ProductionVersionBadge: React.FC<ProductionVersionBadgeProps> = ({
  variant = "pill",
  showCopy = false,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyBuildInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = getFullBuildString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "card") {
    return (
      <div
        id="about-garia-os-card"
        className={`p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/25 space-y-4 ${className}`}
      >
        {/* Top Identity & Version Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-white font-heading">
                  Garia OS {APP_VERSION_LABEL}
                </span>
                <span className="text-xs font-mono text-emerald-300 font-semibold">
                  · {APP_BUILD_CHANNEL}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {APP_CODENAME} · Released {APP_RELEASE_DATE}
              </p>
            </div>
          </div>

          {showCopy && (
            <button
              type="button"
              onClick={handleCopyBuildInfo}
              title="Copy build version string"
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Build ID</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* About App Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Garia OS is a distraction-free student study operating system engineered for board exam preparation, deep-work Pomodoro execution, structured task & subtask tracking, and intelligent revision planning.
        </p>

        {/* What's New in v3.0 Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
              <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Now Focus Mode Studio</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Synchronized 25-min Pomodoro & Deep Work timer linked directly to your active tasks with ambient study soundscapes.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Streamlined Task Manager</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Instant quick-add task bar, 1-click task focus launcher, subtask checklists, and automatic overdue rescheduling.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <LayoutGrid className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Decluttered Bento Dashboard</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clean execution workspace with Urgent Attention alerts, Study Streak, Weekly Study Hours comparison, and Academic Milestones.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Cloud className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Offline-First + Cloud Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero-latency local storage with optional Firebase Firestore cloud backup, multi-student profiles, and PIN lock security.
            </p>
          </div>
        </div>

        {/* System Architecture Footer */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Production Build ({APP_VERSION_LABEL})</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Local-First Privacy · Zero Telemetry</span>
          </span>
        </div>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div
        className={`inline-flex items-center gap-2 text-[11px] font-mono text-slate-400 ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-slate-300 font-bold">Garia OS {APP_VERSION_LABEL}</span>
        <span>·</span>
        <span>{APP_CODENAME}</span>
      </div>
    );
  }

  return (
    <span
      title={getFullBuildString()}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 select-none ${className}`}
    >
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span>{APP_VERSION_LABEL}</span>
    </span>
  );
};
