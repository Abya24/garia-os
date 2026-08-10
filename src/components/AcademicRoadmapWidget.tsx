import React from "react";
import { GraduationCap, ArrowRight, AlertTriangle, Flame, BookOpen, CheckCircle } from "lucide-react";
import { AcademicRoadmapData, AcademicVVITopic, AcademicRevisionItem, ActiveTab } from "../types";

interface AcademicRoadmapWidgetProps {
  roadmap: AcademicRoadmapData;
  vviTopics: AcademicVVITopic[];
  revisions: AcademicRevisionItem[];
  onNavigate: (tab: ActiveTab) => void;
}

export const AcademicRoadmapWidget: React.FC<AcademicRoadmapWidgetProps> = ({
  roadmap,
  vviTopics,
  revisions,
  onNavigate,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  // Overdue and Today's revisions
  const overdueCount = revisions.filter((r) => !r.completed && r.scheduledDate < todayStr).length;
  const todayCount = revisions.filter((r) => !r.completed && r.scheduledDate === todayStr).length;

  // Top Priority VVI topic
  const topVVI = vviTopics.find((v) => v.status !== "Completed" && v.priority === "VVI") || vviTopics[0];

  // Next recommended action
  let recommendedAction = "Review roadmap stages to keep learning on track.";
  if (overdueCount > 0) {
    recommendedAction = `⚠️ ${overdueCount} revision${overdueCount > 1 ? "s" : ""} overdue — review now!`;
  } else if (topVVI) {
    recommendedAction = `🔥 Priority Focus: Revise ${topVVI.chapterTitle || topVVI.topicName}`;
  } else if (roadmap.stages[1]?.suggestedAction) {
    recommendedAction = roadmap.stages[1].suggestedAction;
  }

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/25 glass-card space-y-3 text-white">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-400">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold font-heading text-slate-100 text-sm">Academic Roadmap</h3>
            <p className="text-[11px] text-slate-400">
              {roadmap.classLevel} • {roadmap.stream}
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate("academic")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-all"
        >
          <span>Roadmap</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center text-[11px] mb-1">
          <span className="text-slate-300 font-medium">Overall Progress</span>
          <span className="text-purple-400 font-semibold">{roadmap.overallProgress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, roadmap.overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-400 mb-0.5">Today Revisions</span>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
            <BookOpen className="w-3 h-3" /> {todayCount}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-400 mb-0.5">Overdue</span>
          <div
            className={`flex items-center gap-1 text-xs font-bold ${
              overdueCount > 0 ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> {overdueCount}
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-800/60 border border-white/5 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-400 mb-0.5">Top VVI</span>
          <div className="flex items-center gap-1 text-xs font-bold text-rose-400 truncate max-w-full">
            <Flame className="w-3 h-3 shrink-0" />
            <span className="truncate">{topVVI ? topVVI.subjectName : "None"}</span>
          </div>
        </div>
      </div>

      {/* Next Recommended Action */}
      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 truncate">
          <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="truncate font-medium">{recommendedAction}</span>
        </div>
        <button
          onClick={() => onNavigate("academic")}
          className="text-purple-300 hover:text-white underline font-bold text-[11px] shrink-0"
        >
          Action
        </button>
      </div>
    </div>
  );
};
