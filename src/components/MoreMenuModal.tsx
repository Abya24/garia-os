import React, { useState } from "react";
import {
  Sparkles,
  Timer,
  Droplet,
  Flame,
  BarChart2,
  Settings,
  X,
  BookOpen,
  CheckSquare,
  FileText,
  Home,
  Target,
  Calendar,
  Compass,
  GraduationCap,
  ShieldAlert,
  Users,
  Download,
  Info,
  ShieldCheck,
  Zap,
  HelpCircle,
  Mail,
} from "lucide-react";
import { ActiveTab } from "../types";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "./ProductionVersionBadge";
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
  onOpenStudentModal,
}) => {
  const [showAbout, setShowAbout] = useState(false);

  if (!isOpen) return null;

  const t = translations[currentLanguage] || translations.en;

  const moreItems = [
    {
      id: "questionbank" as ActiveTab,
      label: t.questionBank || "Question Bank Center",
      desc: currentLanguage === "hi" ? "एमसीक्यू, क्विज, पीवाईक्यू, अभ्यास और टेस्ट" : "MCQ, Quiz, PYQs, Practice, VVI, Revision & Tests",
      icon: HelpCircle,
      color: "from-emerald-400 to-teal-500",
      badge: "V3 Center",
    },
    {
      id: "academic" as ActiveTab,
      label: t.academics || "Academic Center",
      desc: currentLanguage === "hi" ? "कक्षा 10, 11 और 12 पाठ्यक्रम, वीवीआई विषय और रोडमैप" : "Class 10, 11 & 12 curriculum, VVI topics & roadmap",
      icon: GraduationCap,
      color: "from-emerald-400 to-cyan-400",
      badge: `v${APP_VERSION}`,
    },
    {
      id: "career" as ActiveTab,
      label: t.careerCenter || "Career Center V3",
      desc: currentLanguage === "hi" ? "विज्ञान, वाणिज्य, कला, सरकारी नौकरियां और छात्रवृत्तियां" : "Science, Commerce, Arts, Govt Jobs, Scholarships & Study Abroad",
      icon: Compass,
      color: "from-cyan-500 to-blue-500",
      badge: "V3 Suite",
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
      desc: currentLanguage === "hi" ? "समृद्ध मार्कडाउन नोट्स, टैग और पीडीएफ अनुलग्नक" : "Rich markdown notes, tags & PDF attachments",
      icon: FileText,
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "exam" as ActiveTab,
      label: t.examIntelligence || "Exam Intelligence",
      desc: currentLanguage === "hi" ? "बोर्ड प्रोफाइल, तैयारी स्कोर और मॉक टेस्ट" : "Board profile, readiness score, queue & mock tests",
      icon: ShieldAlert,
      color: "from-cyan-400 to-emerald-400",
      badge: `v${APP_VERSION}`,
    },
    {
      id: "calendar" as ActiveTab,
      label: t.calendar || "Calendar & Sync",
      desc: currentLanguage === "hi" ? "गूगल कैलेंडर सिंक, परीक्षा समय-सारणी व इवेंट्स" : "Google Calendar sync, exam timetable & scheduled events",
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
      id: "gmail" as ActiveTab,
      label: "Gmail Center",
      desc: currentLanguage === "hi" ? "गूगल ईमेल, लीव एप्लिकेशन, डाउट्स व नोटिफिकेशन्स" : "Google Workspace mail, academic letters & teacher inbox",
      icon: Mail,
      color: "from-red-500 to-rose-600",
      badge: "Gmail",
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
      id: "download" as ActiveTab,
      label: t.downloadAPK || "Download Official APK",
      desc: `Get Garia OS Android app v${APP_VERSION}`,
      icon: Download,
      color: "from-emerald-500 to-teal-400",
      badge: `v${APP_VERSION}`,
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
        className="w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <span>Garia OS Features</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Menu
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an OS module to open
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full glass-pill text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 overflow-y-auto">
          {onOpenStudentModal && (
            <button
              onClick={() => {
                onClose();
                onOpenStudentModal();
              }}
              className="sm:col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-transparent border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-emerald-400 p-2 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white font-heading block">
                    Student Profiles & Switching
                  </span>
                  <span className="text-xs text-slate-400">
                    Manage multi-student profiles & isolated datasets
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Multi-Student v{APP_VERSION}
              </span>
            </button>
          )}

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
                className={`flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all duration-200 group border ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                    : "glass-pill border-white/5 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-2 flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-100 font-heading">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Footer Links */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About Garia OS & System Information</span>
            </button>
          </div>
          <ProductionVersionBadge variant="compact" showCopy={true} />
        </div>
      </div>

      {/* About Garia OS Modal */}
      {showAbout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowAbout(false)}
        >
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  G
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-heading">
                    Garia OS v{APP_VERSION}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium">
                    Smart Student Productivity & Study Platform
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="p-1.5 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Permanent Version Badge */}
            <ProductionVersionBadge variant="card" showCopy={true} />

            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">Garia OS</strong> is an offline-first academic operating system designed specifically for students across Class 10, 11, and 12 (Science, Commerce, Arts).
              </p>
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Privacy & Session Isolation Architecture</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  All student profiles, study logs, task matrices, notes, and question bank progress remain isolated strictly inside your browser installation context.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1 text-[11px] text-slate-300 font-mono">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5 mb-1 font-sans">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Core V3 Modules</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  <li>Unified Class 10 &amp; Stream-Separated Class 11/12 Academics</li>
                  <li>Question Bank Center (MCQ, Quiz, PYQ, Practice, VVI, Revision, Chapter Test)</li>
                  <li>Career Center V3 (Science, Commerce, Arts, Govt Jobs, Scholarships, Study Abroad)</li>
                  <li>Bilingual Interface Engine (English &amp; हिन्दी)</li>
                  <li>Official Signed Android Release APK v{APP_VERSION}</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-2.5 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs transition-colors"
            >
              Close Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

