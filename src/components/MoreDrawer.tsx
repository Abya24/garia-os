import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  GraduationCap,
  HelpCircle,
  Compass,
  ShieldAlert,
  FileText,
  BarChart2,
  Settings,
  User,
  Download,
  BookOpen,
  CheckSquare,
  Timer,
  Flame,
  Droplet,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  Globe,
  Bell,
  BellRing,
  Check,
  Mail,
  Calendar,
  Target,
} from "lucide-react";
import { ActiveTab, StudentProfile } from "../types";
import { APP_VERSION } from "../constants/version";
import { ProductionVersionBadge } from "./ProductionVersionBadge";
import { AppLanguage, translations } from "../utils/i18n";
import {
  getNotificationPermission,
  requestNotificationPermission,
} from "../utils/notifications";

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  currentLanguage?: AppLanguage;
  onUpdateLanguage?: (lang: AppLanguage) => void;
  onOpenStudentModal?: () => void;
  activeStudent?: StudentProfile;
}

interface DrawerModuleItem {
  id: ActiveTab | "profile" | "sysinfo";
  label: string;
  desc: string;
  icon: any;
  color: string;
  badge?: string;
  category: "academic" | "intelligence" | "tools" | "system";
  action?: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  activeTab,
  currentLanguage = "en",
  onUpdateLanguage,
  onOpenStudentModal,
  activeStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [notificationState, setNotificationState] = useState<string>("default");
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    const perm = getNotificationPermission();
    setNotificationState(perm);
  }, []);

  const handleNotificationClick = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationState("granted");
        setNotificationMsg(
          currentLanguage === "hi"
            ? "सूचनाएं सक्षम हैं"
            : "Notifications enabled"
        );
      } else {
        setNotificationState("denied");
        setNotificationMsg(
          currentLanguage === "hi"
            ? "सूचनाएं म्यूट हैं"
            : "Notifications muted"
        );
      }
    } catch {
      setNotificationMsg("Notifications configured");
    }
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const t = translations[currentLanguage] || translations.en;

  const modulesList: DrawerModuleItem[] = useMemo(
    () => [
      // Academic & Curriculum
      {
        id: "academic" as ActiveTab,
        label: t.academics || "Academic Center",
        desc: currentLanguage === "hi" ? "कक्षा 10, 11 व 12 पाठ्यक्रम, वीवीआई विषय व रोडमैप" : "Class 10, 11 & 12 curriculum, VVI topics & roadmaps",
        icon: GraduationCap,
        color: "from-emerald-500 to-teal-600",
        badge: "V3 Suite",
        category: "academic",
      },
      {
        id: "questionbank" as ActiveTab,
        label: t.questionBank || "Question Bank",
        desc: currentLanguage === "hi" ? "एमसीक्यू, क्विज, पीवाईक्यू, स्पीड टेस्ट व वीवीआई प्रश्न" : "MCQs, PYQs, Mock Tests, Speed Drills & Question Bank",
        icon: HelpCircle,
        color: "from-teal-500 to-cyan-600",
        badge: "Smart",
        category: "academic",
      },
      // Intelligence & Careers
      {
        id: "career" as ActiveTab,
        label: t.careerCenter || "Career Center",
        desc: currentLanguage === "hi" ? "विज्ञान, वाणिज्य, कला, सरकारी परीक्षाएं व रोडमैप" : "Career paths, JEE/NEET/CUET/CA, salary & exams",
        icon: Compass,
        color: "from-cyan-500 to-blue-600",
        badge: "V3",
        category: "intelligence",
      },
      {
        id: "exam" as ActiveTab,
        label: t.examIntelligence || "Exam Intelligence",
        desc: currentLanguage === "hi" ? "बोर्ड प्रोफाइल, तैयारी स्कोर, उलटी गिनती व मॉक टेस्ट" : "Board profile, readiness score, weak areas & predictions",
        icon: ShieldAlert,
        color: "from-blue-500 to-indigo-600",
        badge: "AI",
        category: "intelligence",
      },
      {
        id: "stats" as ActiveTab,
        label: t.analytics || "Progress Analytics",
        desc: currentLanguage === "hi" ? "दैनिक उत्पादकता स्कोर व विषय अध्ययन रुझान" : "Productivity metrics, study trends & mastery breakdown",
        icon: BarChart2,
        color: "from-purple-500 to-indigo-600",
        category: "intelligence",
      },
      {
        id: "study" as ActiveTab,
        label: t.studyTracker || "Study Tracker",
        desc: currentLanguage === "hi" ? "सक्रिय अध्ययन टाइमर व विषय अध्याय लॉग" : "Subject logs, syllabus progress & focus session history",
        icon: BookOpen,
        color: "from-amber-500 to-emerald-600",
        category: "intelligence",
      },
      // Workspace & Tools
      {
        id: "calendar" as ActiveTab,
        label: t.calendar || "Calendar & Sync",
        desc: currentLanguage === "hi" ? "गूगल कैलेंडर सिंक, परीक्षा समय-सारणी व इवेंट्स" : "Google Calendar sync, exam timetable & scheduled events",
        icon: Calendar,
        color: "from-blue-500 to-indigo-500",
        category: "tools",
      },
      {
        id: "goals" as ActiveTab,
        label: t.goals || "Goals & Targets",
        desc: currentLanguage === "hi" ? "अकादमिक लक्ष्य, ग्रेड लक्ष्य व मील के पत्थर" : "Academic goals, target grades & milestone tracker",
        icon: Target,
        color: "from-emerald-500 to-teal-500",
        category: "tools",
      },
      {
        id: "gmail" as ActiveTab,
        label: "Gmail Center",
        desc: currentLanguage === "hi" ? "गूगल ईमेल, लीव एप्लिकेशन, डाउट्स व नोटिफिकेशन्स" : "Google Workspace mail, academic letters & teacher inbox",
        icon: Mail,
        color: "from-red-500 to-rose-600",
        badge: "Gmail",
        category: "tools",
      },
      {
        id: "notes" as ActiveTab,
        label: t.notes || "Notes & Books",
        desc: currentLanguage === "hi" ? "मार्कडाउन नोट्स, सूत्र पुस्तकें व अध्ययन सामग्री" : "Markdown notes, revision flashcards & study material",
        icon: FileText,
        color: "from-indigo-500 to-purple-600",
        category: "tools",
      },
      {
        id: "tasks" as ActiveTab,
        label: t.taskManager || "Task Manager",
        desc: currentLanguage === "hi" ? "दैनिक कार्य सूची, समय सीमा व प्राथमिकताएं" : "Daily todo checklist, priority tags & smart filters",
        icon: CheckSquare,
        color: "from-blue-600 to-cyan-600",
        category: "tools",
      },
      {
        id: "focus" as ActiveTab,
        label: t.focusTimer || "Focus Timer",
        desc: currentLanguage === "hi" ? "पोमोडोरो सत्र व गहन अध्ययन अंतराल" : "Pomodoro intervals, deep work & break cycles",
        icon: Timer,
        color: "from-amber-500 to-orange-600",
        category: "tools",
      },
      {
        id: "habits" as ActiveTab,
        label: t.habits || "Habits Tracker",
        desc: currentLanguage === "hi" ? "दैनिक दिनचर्या व अध्ययन स्ट्रीक्स" : "Daily routines, streak tracking & consistency habits",
        icon: Flame,
        color: "from-rose-500 to-pink-600",
        category: "tools",
      },
      {
        id: "water" as ActiveTab,
        label: t.waterTracker || "Water Tracker",
        desc: currentLanguage === "hi" ? "दैनिक जलयोजन लक्ष्य व स्वास्थ्य लॉग" : "Hydration targets, glass counters & wellness reminders",
        icon: Droplet,
        color: "from-cyan-500 to-teal-500",
        category: "tools",
      },
      // Platform & System
      {
        id: "profile",
        label: t.studentProfiles || "Student Profile",
        desc: activeStudent ? `${activeStudent.name} (${activeStudent.classLevel})` : "Switch profile & account",
        icon: User,
        color: "from-emerald-400 to-cyan-500",
        action: () => {
          if (onOpenStudentModal) onOpenStudentModal();
        },
        category: "system",
      },
      {
        id: "settings" as ActiveTab,
        label: t.settings || "Settings",
        desc: currentLanguage === "hi" ? "थीम (7 मोड्स), भाषा, बैकअप व प्राथमिकताएं" : "7 Themes, language, backup & system settings",
        icon: Settings,
        color: "from-slate-600 to-slate-700",
        category: "system",
      },
      {
        id: "download" as ActiveTab,
        label: t.downloadAPK || "Download APK",
        desc: `Garia OS Official Release APK v${APP_VERSION}`,
        icon: Download,
        color: "from-emerald-500 to-teal-500",
        badge: `v${APP_VERSION}`,
        category: "system",
      },
    ],
    [t, currentLanguage, activeStudent, onOpenStudentModal]
  );

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modulesList;
    const query = searchQuery.toLowerCase();
    return modulesList.filter(
      (m) =>
        m.label.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query)
    );
  }, [modulesList, searchQuery]);

  const categories = [
    {
      id: "academic",
      title: currentLanguage === "hi" ? "शैक्षणिक और पाठ्यक्रम" : "Academic & Curriculum",
      items: filteredModules.filter((m) => m.category === "academic"),
    },
    {
      id: "intelligence",
      title: currentLanguage === "hi" ? "इंटेलिजेंस और करियर" : "Intelligence & Career Roadmaps",
      items: filteredModules.filter((m) => m.category === "intelligence"),
    },
    {
      id: "tools",
      title: currentLanguage === "hi" ? "उपकरण और वर्कस्पेस" : "Tools & Workspace",
      items: filteredModules.filter((m) => m.category === "tools"),
    },
    {
      id: "system",
      title: currentLanguage === "hi" ? "सिस्टम और सेटिंग्स" : "System & Settings",
      items: filteredModules.filter((m) => m.category === "system"),
    },
  ].filter((c) => c.items.length > 0);

  const handleItemClick = (item: DrawerModuleItem) => {
    if (item.action) {
      item.action();
      onClose();
      return;
    }
    if (item.id !== "profile" && item.id !== "sysinfo") {
      onNavigate(item.id as ActiveTab);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="more-apps-drawer-overlay"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Right Slide Drawer Container */}
          <motion.div
            id="more-apps-slide-drawer"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/15 shadow-2xl flex flex-col overflow-hidden relative text-white"
          >
            {/* Top Header & Search Bar */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading text-white flex items-center gap-2">
                      <span>Garia OS More Apps</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        V3 Drawer
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Single-tap launcher for all academic tools
                    </p>
                  </div>
                </div>

                <button
                  id="close-more-drawer-btn"
                  onClick={onClose}
                  aria-label="Close Drawer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Real-time Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="more-drawer-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    currentLanguage === "hi"
                      ? "मॉड्यूल, विषय, टेस्ट खोजें..."
                      : "Search modules, question bank, careers..."
                  }
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Settings: Language & Notifications */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Language Switcher */}
                {onUpdateLanguage && (
                  <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
                    <Globe className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
                    <button
                      onClick={() => onUpdateLanguage("en")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentLanguage === "en"
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => onUpdateLanguage("hi")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentLanguage === "hi"
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                )}

                {/* Notifications Quick Toggle */}
                <button
                  onClick={handleNotificationClick}
                  id="more-drawer-notifications-btn"
                  title="Toggle study alert notifications"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/10 text-xs text-slate-300 hover:text-white transition-all ml-auto"
                >
                  {notificationState === "granted" ? (
                    <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Bell className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="text-[11px] font-semibold">
                    {notificationMsg ||
                      (notificationState === "granted"
                        ? currentLanguage === "hi"
                          ? "सूचना चालू"
                          : "Alerts On"
                        : currentLanguage === "hi"
                          ? "सूचना बंद"
                          : "Alerts Muted")}
                  </span>
                </button>
              </div>
            </div>

            {/* Modules List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between px-1">
                    <span>{category.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {category.items.length} items
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          className={`w-full min-h-[48px] p-3 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group active:scale-[0.99] ${
                            isActive
                              ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border-emerald-500/40 shadow-sm"
                              : "bg-slate-900/60 hover:bg-slate-900/90 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.color} p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                            >
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredModules.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-300">
                    No modules match "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching for Academics, Question Bank, Careers, or Exams.
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer & Permanent Production Version Badge */}
            <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors font-mono"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>System Architecture</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  Garia OS V{APP_VERSION}
                </span>
              </div>

              <ProductionVersionBadge variant="footer" showCopy={true} />
            </div>
          </motion.div>

          {/* About Modal Dialog */}
          {showAboutModal && (
            <div
              className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setShowAboutModal(false);
              }}
            >
              <div
                className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-base">
                      Garia OS Architecture
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAboutModal(false)}
                    className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <ProductionVersionBadge variant="card" showCopy={true} />

                <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                  <p>
                    <strong className="text-white">Garia OS V3.0</strong> features a simplified navigation hierarchy with 5 core tabs (Home, Tasks, Focus, Abya AI, More) and dedicated high-performance drawer systems for all specialized academic modules.
                  </p>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 font-mono space-y-1">
                    <div className="text-emerald-400 font-bold">
                      • Core 5 Navigation Hierarchy
                    </div>
                    <div className="text-cyan-300 font-bold">
                      • Right-Side Slide Drawer System
                    </div>
                    <div className="text-purple-300 font-bold">
                      • Offline-first Isolated Storage
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
