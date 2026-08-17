import React from "react";
import {
  BookOpen,
  HelpCircle,
  Compass,
  Bot,
  BarChart3,
  ListTodo,
} from "lucide-react";
import { ActiveTab } from "../../../types";

interface QuickAccessWidgetProps {
  onNavigate: (tab: ActiveTab) => void;
}

export const QuickAccessWidget: React.FC<QuickAccessWidgetProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold font-heading uppercase tracking-wider text-slate-400">
          Quick Access
        </h2>
        <span className="text-[10px] text-emerald-400 font-mono">Garia Core Ecosystem</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* 1. Academic Center */}
        <button
          onClick={() => onNavigate("academic")}
          id="quick-access-academic"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-blue-500/30 hover:border-blue-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-blue-300 transition-colors">
              Academic Center
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Class 10, 11 & 12
            </div>
          </div>
        </button>

        {/* 2. Question Bank */}
        <button
          onClick={() => onNavigate("questionbank")}
          id="quick-access-questionbank"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-cyan-500/30 hover:border-cyan-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-cyan-300 transition-colors">
              Question Bank
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              MCQ, PYQ & Tests
            </div>
          </div>
        </button>

        {/* 3. Career Center */}
        <button
          onClick={() => onNavigate("career")}
          id="quick-access-career"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-amber-500/30 hover:border-amber-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-amber-300 transition-colors">
              Career Center
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Roadmaps & Jobs
            </div>
          </div>
        </button>

        {/* 4. Abya AI */}
        <button
          onClick={() => onNavigate("abya")}
          id="quick-access-abya"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-purple-500/30 hover:border-purple-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-purple-300 transition-colors">
              Abya AI
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              AI Mentor & Doubts
            </div>
          </div>
        </button>

        {/* 5. Study Intelligence */}
        <button
          onClick={() => onNavigate("stats")}
          id="quick-access-stats"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-emerald-300 transition-colors">
              Study Intelligence
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Analytics & Score
            </div>
          </div>
        </button>

        {/* 6. Task Manager */}
        <button
          onClick={() => onNavigate("tasks")}
          id="quick-access-tasks"
          className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400/60 text-left flex flex-col justify-between transition-all card-press group min-h-[95px] shadow-sm"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold font-heading text-white truncate group-hover:text-rose-300 transition-colors">
              Task Manager
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Tasks & Routines
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
