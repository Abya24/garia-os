import React from "react";
import { Atom, TrendingUp, Compass, Check } from "lucide-react";
import { StreamType } from "../types";

interface StreamSelectorProps {
  selectedStream: StreamType;
  onSelectStream: (stream: StreamType) => void;
  showTitle?: boolean;
}

export const STREAM_OPTIONS: {
  id: StreamType;
  title: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgGradient: string;
  subjectsText: string;
  pathwaysText: string;
}[] = [
  {
    id: "Science",
    title: "Science Stream",
    badge: "PCM / PCB",
    icon: Atom,
    color: "from-cyan-500 to-blue-500",
    borderColor: "border-cyan-500/40",
    bgGradient: "from-cyan-950/40 via-slate-900 to-blue-950/20",
    subjectsText: "Physics, Chemistry, Biology, Mathematics, English Core",
    pathwaysText: "Engineering (JEE), Medicine (NEET), AI & Data, Biotech, Research",
  },
  {
    id: "Commerce",
    title: "Commerce Stream",
    badge: "CA / Finance",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-500",
    borderColor: "border-emerald-500/40",
    bgGradient: "from-emerald-950/40 via-slate-900 to-cyan-950/20",
    subjectsText: "Accountancy, Business Studies, Economics, Mathematics, English Core",
    pathwaysText: "Chartered Accountant (CA), CS, CMA, Investment Banking, BBA/MBA",
  },
  {
    id: "Arts / Humanities",
    title: "Arts / Humanities",
    badge: "Law / UPSC",
    icon: Compass,
    color: "from-purple-500 to-rose-500",
    borderColor: "border-purple-500/40",
    bgGradient: "from-purple-950/40 via-slate-900 to-rose-950/20",
    subjectsText: "History, Political Science, Geography, Sociology, English Core",
    pathwaysText: "Integrated Law (CLAT), Civil Services (UPSC), Psychology, Journalism, Design",
  },
];

export const StreamSelector: React.FC<StreamSelectorProps> = ({
  selectedStream,
  onSelectStream,
  showTitle = true,
}) => {
  return (
    <div className="space-y-3">
      {showTitle && (
        <label className="block text-xs font-semibold text-slate-300">
          Select Academic Stream *
        </label>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STREAM_OPTIONS.map((opt) => {
          const isSelected =
            selectedStream === opt.id ||
            (opt.id === "Arts / Humanities" && selectedStream === "Arts");
          const Icon = opt.icon;

          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onSelectStream(opt.id)}
              className={`relative p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? `bg-gradient-to-br ${opt.bgGradient} ${opt.borderColor} shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-400/50`
                  : "bg-slate-900/60 border-white/10 hover:border-white/20 text-slate-300"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${opt.color} p-1.5 flex items-center justify-center text-slate-950 font-bold shadow-md`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm font-heading leading-tight">
                      {opt.title}
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400">
                      {opt.badge}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mt-2 text-[11px]">
                  <p className="text-slate-300 line-clamp-2">
                    <strong className="text-slate-200">Subjects:</strong> {opt.subjectsText}
                  </p>
                  <p className="text-slate-400 line-clamp-2">
                    <strong className="text-slate-300">Careers:</strong> {opt.pathwaysText}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
