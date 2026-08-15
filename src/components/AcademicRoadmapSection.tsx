import React from "react";
import {
  GraduationCap,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Flame,
  BookOpen,
  Target,
  Award,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { AcademicRoadmapData, RoadmapStageStatus } from "../types";
import { CalendarSyncDropdown } from "./CalendarSyncDropdown";

interface AcademicRoadmapSectionProps {
  roadmap: AcademicRoadmapData;
  onNavigateToTab?: (tab: "chapters" | "vvi" | "revision" | "practice" | "tests") => void;
}

export const AcademicRoadmapSection: React.FC<AcademicRoadmapSectionProps> = ({
  roadmap,
  onNavigateToTab,
}) => {
  const getStatusBadge = (status: RoadmapStageStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "Almost Done":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Almost Done
          </span>
        );
      case "In Progress":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> In Progress
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-600/50 flex items-center gap-1">
            Not Started
          </span>
        );
    }
  };

  const getStageTabTarget = (index: number): "chapters" | "vvi" | "revision" | "practice" | "tests" => {
    switch (index) {
      case 1:
        return "chapters";
      case 2:
        return "vvi";
      case 3:
        return "revision";
      case 4:
        return "practice";
      case 5:
        return "tests";
      default:
        return "chapters";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-900/80 border border-purple-500/30 backdrop-blur-md shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Garia OS V1.8 Academic Engine
              </span>
              <span className="text-xs text-slate-400">
                {roadmap.classLevel} • {roadmap.stream}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-purple-400" /> Academic & Entrance Roadmap
            </h2>
            <p className="text-sm text-slate-300">
              Personalized target track aligned with <span className="font-semibold text-purple-300">{roadmap.targetCareerTitle || "Your Career Goals"}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-xs text-slate-400">Overall Progress</div>
              <div className="text-2xl font-black text-purple-400">{roadmap.overallProgress}%</div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300">
              {roadmap.overallProgress}%
            </div>
          </div>
        </div>
      </div>

      {/* Stage Cards Flow */}
      <div className="relative space-y-4">
        {roadmap.stages.map((stage, idx) => (
          <div
            key={stage.id}
            className="relative p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all shadow-md group"
          >
            {/* Stage Connector Line */}
            {idx < roadmap.stages.length - 1 && (
              <div className="absolute left-8 -bottom-4 w-0.5 h-4 bg-purple-500/30 z-10 hidden sm:block" />
            )}

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-base shrink-0">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-slate-100 text-lg">{stage.title}</h3>
                    {getStatusBadge(stage.status)}
                  </div>
                  <p className="text-xs text-slate-400">{stage.description}</p>
                </div>
              </div>

              {/* Progress & Nav Button */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <div className="w-28 text-right hidden sm:block mr-1">
                  <div className="text-xs text-slate-400">Completion</div>
                  <div className="text-sm font-semibold text-purple-300">{stage.progress}%</div>
                </div>
                <CalendarSyncDropdown
                  event={{
                    id: `roadmap-stage-${stage.id}`,
                    title: `[Roadmap Stage ${idx + 1}] ${stage.title}`,
                    description: `Progress: ${stage.progress}%\nStatus: ${stage.status}\nPending: ${stage.pendingItems.join(", ")}\nSuggested Action: ${stage.suggestedAction}`,
                    date: new Date().toISOString().split("T")[0],
                    category: "ROADMAP",
                  }}
                  buttonLabel="Sync .ics"
                  variant="pill"
                />
                {idx > 0 && idx < 6 && onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab(getStageTabTarget(idx))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-white border border-slate-700 hover:border-purple-500/40 transition-all flex items-center gap-1 text-xs"
                    title="Open Section"
                  >
                    Open <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5 w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, stage.progress)}%` }}
              />
            </div>

            {/* Pending & Completed Lists */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Items
                </div>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {stage.pendingItems.map((item, i) => (
                    <li key={i} className="truncate">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed Milestones
                </div>
                <ul className="space-y-1 text-slate-300 list-disc list-inside">
                  {stage.completedItems.map((item, i) => (
                    <li key={i} className="truncate">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggested Action */}
            <div className="mt-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong className="text-purple-300">Suggested Action:</strong> {stage.suggestedAction}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
