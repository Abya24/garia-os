import React from "react";
import {
  X,
  Compass,
  BookOpen,
  CheckSquare,
  FileText,
  Target,
  Calendar,
  Timer,
  Droplet,
  Flame,
  BarChart2,
  Download,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { ActiveTab } from "../types";
import { APP_VERSION } from "../constants/version";
import { AppLanguage, translations } from "../utils/i18n";

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  currentLanguage?: AppLanguage;
  onOpenStudentModal?: () => void;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeTab,
  currentLanguage = "en",
}) => {
  if (!isOpen) return null;

  const t = translations[currentLanguage] || translations.en;

  const moreItems = [
    {
      id: "career" as ActiveTab,
      label: t.careerCenter || "Career Center",
      desc: currentLanguage === "hi" ? "विज्ञान, वाणिज्य, कला, सरकारी नौकरियां और छात्रवृत्तियां" : "Science, Commerce, Arts, Govt Jobs, Scholarships & Roadmaps",
      icon: Compass,
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "study" as ActiveTab,
      label: t.studyTracker || "Study Tracker",
      desc: currentLanguage === "hi" ? "विषय अध्ययन लॉग, अध्याय और अध्ययन टाइमर" : "Subject study logs, chapters & active study session timer",
      icon: BookOpen,
      color: "from-teal-500 to-emerald-500",
    },
    {
      id: "tasks" as ActiveTab,
      label: t.taskManager || "Task Manager",
      desc: currentLanguage === "hi" ? "कार्य सूची, समय सीमा और प्राथमिकता टैग" : "Todo matrix, deadlines, priority tags & categories",
      icon: CheckSquare,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "notes" as ActiveTab,
      label: t.notes || "Notes & Docs",
      desc: currentLanguage === "hi" ? "समृद्ध मार्कडाउन नोट्स, टैग और अनुलग्नक" : "Rich markdown notes, tags & attachments",
      icon: FileText,
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "exam" as ActiveTab,
      label: t.examIntelligence || "Exam Intelligence",
      desc: currentLanguage === "hi" ? "बोर्ड प्रोफाइल, तैयारी स्कोर और मॉक टेस्ट" : "Board profile, readiness score & mock tests",
      icon: ShieldAlert,
      color: "from-cyan-400 to-emerald-400",
    },
    {
      id: "calendar" as ActiveTab,
      label: t.calendar || "Calendar & Events",
      desc: currentLanguage === "hi" ? "परीक्षा समय-सारणी व इवेंट्स" : "Exam timetable, scheduled events & deadlines",
      icon: Calendar,
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "goals" as ActiveTab,
      label: t.goals || "Goals & Targets",
      desc: currentLanguage === "hi" ? "अकादमिक लक्ष्य, ग्रेड लक्ष्य व मील के पत्थर" : "Academic goals, target grades & milestone tracker",
      icon: Target,
      color: "from-emerald-500 to-teal-500",
    },
    {
      id: "focus" as ActiveTab,
      label: t.focusTimer || "Focus Timer",
      desc: currentLanguage === "hi" ? "पोमोडोरो सत्र और ब्रेक ट्रैकर" : "Pomodoro sessions & break tracker",
      icon: Timer,
      color: "from-amber-500 to-orange-500",
    },
    {
      id: "water" as ActiveTab,
      label: t.waterTracker || "Water Tracker",
      desc: currentLanguage === "hi" ? "दैनिक जलयोजन और गिलास काउंटर" : "Daily hydration & glass counter",
      icon: Droplet,
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: "habits" as ActiveTab,
      label: t.habits || "Habit Tracker",
      desc: currentLanguage === "hi" ? "दैनिक स्ट्रीक्स और दिनचर्या जांच" : "Daily streaks & routine checks",
      icon: Flame,
      color: "from-rose-500 to-pink-500",
    },
    {
      id: "stats" as ActiveTab,
      label: t.analytics || "Advanced Analytics",
      desc: currentLanguage === "hi" ? "उत्पादकता स्कोर और अध्ययन रुझान" : "Productivity score & study trends",
      icon: BarChart2,
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: "settings" as ActiveTab,
      label: t.settings || "Settings",
      desc: currentLanguage === "hi" ? "थीम, भाषा, एपीआई कॉन्फ़िगरेशन और डेटा बैकअप" : "Theme, Language, API config & data backup",
      icon: Settings,
      color: "from-slate-500 to-slate-400",
    },
  ];

  return (
    <div
      id="more-menu-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="more-menu-modal-card"
        className="w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold font-heading text-white">
              Garia OS Features
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an OS module to navigate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of features */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    isActive
                      ? "bg-emerald-500/20 border-emerald-500/40 text-white"
                      : "bg-slate-800/60 hover:bg-slate-800 border-white/5 text-slate-300"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} p-0.5 flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="w-4 h-4 text-slate-950" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {item.label}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
