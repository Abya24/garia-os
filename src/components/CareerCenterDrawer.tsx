import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Search,
  Compass,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  Globe,
  Landmark,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  DollarSign,
  Zap,
} from "lucide-react";
import { AppLanguage, translations } from "../utils/i18n";

export type CareerDrawerAction =
  // Explore Careers
  | "career_science"
  | "career_commerce"
  | "career_arts"
  | "career_class10"
  // Entrance Exams
  | "exam_jee"
  | "exam_neet"
  | "exam_cuet"
  | "exam_ca"
  | "exam_nda"
  | "exam_ssc"
  | "exam_banking"
  // Career Roadmaps
  | "roadmap_eligibility"
  | "roadmap_skills"
  | "roadmap_salary"
  | "roadmap_future_scope";

interface CareerCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: CareerDrawerAction) => void;
  activeAction?: CareerDrawerAction | string;
  currentLanguage?: AppLanguage;
  studentClassName?: string;
  studentStream?: string;
}

export const CareerCenterDrawer: React.FC<CareerCenterDrawerProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  activeAction = "career_science",
  currentLanguage = "en",
  studentClassName = "Class 10",
  studentStream = "Science",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const t = translations[currentLanguage] || translations.en;

  const drawerItems = useMemo(
    () => [
      // Explore Careers
      {
        id: "career_science" as CareerDrawerAction,
        section: "explore",
        label: "Science Careers",
        desc: "Engineering, Medicine, AI/Data Science, Biotechnology, Research & Architecture",
        icon: GraduationCap,
        badge: "PCM / PCB",
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "career_commerce" as CareerDrawerAction,
        section: "explore",
        label: "Commerce Careers",
        desc: "Chartered Accountancy (CA), Investment Banking, Corporate Law, CFA & Actuarial",
        icon: Landmark,
        badge: "Finance",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "career_arts" as CareerDrawerAction,
        section: "explore",
        label: "Arts Careers",
        desc: "Civil Services (UPSC), Journalism, International Relations, Psychology & Design",
        icon: Globe,
        badge: "Humanities",
        color: "from-purple-400 to-pink-500",
      },
      {
        id: "career_class10" as CareerDrawerAction,
        section: "explore",
        label: "Class 10 Foundation",
        desc: "Stream selection guide, aptitude match, diploma polytechnic & early Olympiads",
        icon: BookOpen,
        badge: "Foundation",
        color: "from-amber-400 to-orange-500",
      },

      // Entrance Exams
      {
        id: "exam_jee" as CareerDrawerAction,
        section: "exams",
        label: "JEE (Main & Advanced)",
        desc: "IIT/NIT Engineering entrance syllabus, cutoff percentiles & test roadmap",
        icon: Award,
        badge: "Engineering",
        color: "from-blue-400 to-cyan-500",
      },
      {
        id: "exam_neet" as CareerDrawerAction,
        section: "exams",
        label: "NEET UG",
        desc: "Medical admission entrance (MBBS/BDS), Biology weightage & score target",
        icon: Award,
        badge: "Medical",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "exam_cuet" as CareerDrawerAction,
        section: "exams",
        label: "CUET UG",
        desc: "Central Universities admission test, domain subjects & general test syllabus",
        icon: Award,
        badge: "Central Univ",
        color: "from-purple-400 to-indigo-500",
      },
      {
        id: "exam_ca" as CareerDrawerAction,
        section: "exams",
        label: "CA Foundation",
        desc: "ICAI Chartered Accountancy entry level exam syllabus and registration dates",
        icon: Award,
        badge: "Finance",
        color: "from-teal-400 to-emerald-500",
      },
      {
        id: "exam_nda" as CareerDrawerAction,
        section: "exams",
        label: "NDA & NA",
        desc: "National Defence Academy entrance, SSB interview preparation & fitness criteria",
        icon: ShieldCheck,
        badge: "Defence",
        color: "from-amber-400 to-orange-500",
      },
      {
        id: "exam_ssc" as CareerDrawerAction,
        section: "exams",
        label: "SSC CHSL / CGL",
        desc: "Staff Selection Commission exams, quantitative aptitude & general awareness",
        icon: Landmark,
        badge: "Govt Job",
        color: "from-rose-400 to-pink-500",
      },
      {
        id: "exam_banking" as CareerDrawerAction,
        section: "exams",
        label: "Banking (IBPS / SBI PO)",
        desc: "Probationary officer & clerical cadres, reasoning drills & financial awareness",
        icon: Landmark,
        badge: "Banking",
        color: "from-indigo-400 to-purple-500",
      },

      // Career Roadmaps
      {
        id: "roadmap_eligibility" as CareerDrawerAction,
        section: "roadmaps",
        label: "Eligibility Criteria",
        desc: "Class 12 percentage, subject combinations, age limits & reservation criteria",
        icon: FileCheck,
        color: "from-cyan-400 to-blue-500",
      },
      {
        id: "roadmap_skills" as CareerDrawerAction,
        section: "roadmaps",
        label: "Skills Required",
        desc: "Core technical capabilities, soft skills, certifications & internship pathways",
        icon: Zap,
        color: "from-amber-400 to-orange-500",
      },
      {
        id: "roadmap_salary" as CareerDrawerAction,
        section: "roadmaps",
        label: "Salary Insights",
        desc: "Entry-level vs senior compensation benchmarks in India and international markets",
        icon: TrendingUp,
        badge: "Pay Scale",
        color: "from-emerald-400 to-teal-500",
      },
      {
        id: "roadmap_future_scope" as CareerDrawerAction,
        section: "roadmaps",
        label: "Future Scope & Growth",
        desc: "Industry growth rates, AI impact projection, global demand & emerging domains",
        icon: Compass,
        badge: "2030 Trends",
        color: "from-purple-400 to-indigo-500",
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return drawerItems;
    const q = searchQuery.toLowerCase();
    return drawerItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
    );
  }, [drawerItems, searchQuery]);

  const sections = [
    {
      id: "explore",
      title: "Explore Careers",
      items: filteredItems.filter((i) => i.section === "explore"),
    },
    {
      id: "exams",
      title: "Entrance Exams",
      items: filteredItems.filter((i) => i.section === "exams"),
    },
    {
      id: "roadmaps",
      title: "Career Roadmaps",
      items: filteredItems.filter((i) => i.section === "roadmaps"),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="career-drawer-overlay"
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            id="career-drawer-panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full bg-slate-950/95 border-l border-white/15 shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 space-y-3 shrink-0 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md">
                    <Compass className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base font-heading text-white flex items-center gap-2">
                      <span>Career Intelligence Drawer</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        V3
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {studentClassName} • {studentStream} Career Pathways
                    </p>
                  </div>
                </div>

                <button
                  id="close-career-drawer-btn"
                  onClick={onClose}
                  aria-label="Close Career Drawer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="career-drawer-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search JEE, NEET, CUET, CA, Salaries, Skills..."
                  className="w-full bg-slate-900/90 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
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
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
              {sections.map((sec) => (
                <div key={sec.id} className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between px-1">
                    <span>{sec.title}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {sec.items.length} items
                    </span>
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeAction === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectAction(item.id);
                            onClose();
                          }}
                          className={`w-full min-h-[48px] p-3 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group active:scale-[0.99] ${
                            isActive
                              ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/40 shadow-sm"
                              : "bg-slate-900/60 hover:bg-slate-900/90 border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} p-0.5 flex items-center justify-center text-slate-950 font-bold shadow-md shrink-0 group-hover:scale-105 transition-transform`}
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredItems.length === 0 && (
                <div className="p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-300">
                    No career items match "{searchQuery}"
                  </p>
                  <p className="text-xs text-slate-500">
                    Try searching for JEE, NEET, CUET, CA, or Salaries.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Career Intelligence Drawer Active
              </span>
              <span>1-Tap Navigator</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
