import React, { useState } from "react";
import {
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Sliders,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  BarChart3,
  Check,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import {
  CareerProfile,
  CareerAssessment,
  CareerRoadmap,
  StreamType,
  CareerOption,
  CareerMatchResult,
  ActiveTab,
  Milestone,
  CareerQuizAnswers,
  Subject,
} from "../types";
import {
  CAREER_CATALOG,
  calculateCareerMatches,
  generateDefaultRoadmap,
} from "../utils/careerEngine";
import { CareerQuizModal } from "../components/CareerQuizModal";

interface CareerCenterPageProps {
  profile: CareerProfile;
  assessment: CareerAssessment;
  roadmap: CareerRoadmap;
  quizAnswers?: CareerQuizAnswers;
  activeStudentName?: string;
  subjects?: Subject[];
  onUpdateProfile: (p: CareerProfile) => void;
  onUpdateAssessment: (a: CareerAssessment) => void;
  onUpdateRoadmap: (r: CareerRoadmap) => void;
  onUpdateQuiz?: (q: CareerQuizAnswers) => void;
  onNavigateToAbya: () => void;
}

const SUBJECT_OPTIONS = [
  "Accountancy",
  "Economics",
  "Business Studies",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Political Science",
  "Geography",
  "Sociology",
  "Psychology",
  "Statistics",
];

const INTEREST_OPTIONS = [
  "Finance/Markets",
  "Problem Solving",
  "Coding/Tech",
  "Creative Writing",
  "Scientific Research",
  "Management/Leadership",
  "Medicine/Healthcare",
  "Design & Arts",
];

const SKILL_OPTIONS = [
  "Analytical Thinking",
  "Numerical Ability",
  "Communication",
  "Corporate Law",
  "Programming & Coding",
  "Logical Reasoning",
  "Teamwork",
  "Organization",
];

const WORK_AREA_OPTIONS = [
  "Corporate/Office",
  "Tech/Lab",
  "Remote/Freelance",
  "Field Work",
  "Healthcare/Clinic",
  "Audit Firms",
];

const GOAL_OPTIONS = [
  "High Earning Potential",
  "Job Security",
  "Creative Freedom",
  "Social Impact",
  "Global Opportunities",
];

const STUDY_PREF_OPTIONS = [
  "Professional Certifications",
  "Practical & Hands-on",
  "Theoretical & Analytical",
  "Project-Based",
];

export const CareerCenterPage: React.FC<CareerCenterPageProps> = ({
  profile,
  assessment,
  roadmap,
  quizAnswers,
  activeStudentName = "Student",
  subjects = [],
  onUpdateProfile,
  onUpdateAssessment,
  onUpdateRoadmap,
  onUpdateQuiz,
  onNavigateToAbya,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "assessment" | "matches" | "compare" | "roadmap"
  >("matches");

  const [showQuizModal, setShowQuizModal] = useState(false);

  const [stream, setStream] = useState<StreamType>(profile.stream || "Commerce");
  const [currentClass, setCurrentClass] = useState<string>(
    profile.currentClass || "Class 12"
  );

  // Local assessment state
  const [strongSubjects, setStrongSubjects] = useState<string[]>(
    assessment.strongSubjects || []
  );
  const [interests, setInterests] = useState<string[]>(assessment.interests || []);
  const [skills, setSkills] = useState<string[]>(assessment.skills || []);
  const [workAreas, setWorkAreas] = useState<string[]>(assessment.workAreas || []);
  const [careerGoals, setCareerGoals] = useState<string[]>(
    assessment.careerGoals || []
  );
  const [studyPreference, setStudyPreference] = useState<string>(
    assessment.studyPreference || "Professional Certifications"
  );

  // Compare selection state
  const [compareIdA, setCompareIdA] = useState<string>("ca");
  const [compareIdB, setCompareIdB] = useState<string>("fin_analyst");

  // Search filter for catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogStream, setSelectedCatalogStream] = useState<
    "All" | "Commerce" | "Science" | "Arts / Humanities" | "Arts"
  >(profile.stream);

  // Expanded card IDs
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Custom milestone input
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const togglePill = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const handleSaveAssessment = () => {
    const newAssessment: CareerAssessment = {
      strongSubjects,
      interests,
      skills,
      workAreas,
      careerGoals,
      studyPreference,
    };
    const newProfile: CareerProfile = {
      ...profile,
      stream,
      currentClass,
      updatedAt: Date.now(),
    };

    onUpdateAssessment(newAssessment);
    onUpdateProfile(newProfile);

    // Auto switch to matches tab
    setActiveSubTab("matches");
  };

  // Calculate live match results with quiz answers & student subjects
  const currentAssessment: CareerAssessment = {
    strongSubjects,
    interests,
    skills,
    workAreas,
    careerGoals,
    studyPreference,
  };
  const currentProfile: CareerProfile = {
    ...profile,
    stream,
    currentClass,
  };

  const matchResults: CareerMatchResult[] = calculateCareerMatches(
    currentAssessment,
    currentProfile,
    quizAnswers,
    subjects
  );

  // Filter match results for catalog view
  const filteredMatches = matchResults.filter((res) => {
    const matchesStream =
      selectedCatalogStream === "All" || res.career.stream === selectedCatalogStream;
    const matchesQuery =
      res.career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.career.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.career.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStream && matchesQuery;
  });

  const handleSelectTargetCareer = (career: CareerOption) => {
    const updatedProfile: CareerProfile = {
      ...profile,
      stream: career.stream,
      selectedCareerId: career.id,
      updatedAt: Date.now(),
    };
    onUpdateProfile(updatedProfile);

    // Generate new roadmap
    const newRoadmap = generateDefaultRoadmap(career, updatedProfile);
    onUpdateRoadmap(newRoadmap);

    alert(`🎯 "${career.title}" set as your target career! Your personal roadmap has been generated.`);
    setActiveSubTab("roadmap");
  };

  const handleToggleMilestone = (milestoneId: string) => {
    const updatedMilestones = roadmap.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    onUpdateRoadmap({
      ...roadmap,
      milestones: updatedMilestones,
      lastUpdated: Date.now(),
    });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: Milestone = {
      id: `custom-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      stage: "Custom Target",
      description: "User-defined custom career milestone.",
      completed: false,
      targetTimeframe: "Upcoming Goal",
    };

    onUpdateRoadmap({
      ...roadmap,
      milestones: [...roadmap.milestones, newM],
      lastUpdated: Date.now(),
    });

    setNewMilestoneTitle("");
  };

  const handleDeleteMilestone = (id: string) => {
    const updated = roadmap.milestones.filter((m) => m.id !== id);
    onUpdateRoadmap({
      ...roadmap,
      milestones: updated,
      lastUpdated: Date.now(),
    });
  };

  // Roadmap progress %
  const completedMilestones = roadmap.milestones.filter((m) => m.completed).length;
  const roadmapProgress =
    roadmap.milestones.length > 0
      ? Math.round((completedMilestones / roadmap.milestones.length) * 100)
      : 0;

  // Selected Target Career Object
  const selectedCareerObj = CAREER_CATALOG.find(
    (c) => c.id === (profile.selectedCareerId || "ca")
  ) || CAREER_CATALOG[0];

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Garia OS v1.4 Feature</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              Career & Stream Intelligence Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Discover optimal career pathways tailored for Commerce and Science students. Transparent rule-based compatibility, side-by-side career comparisons, and personalized stage roadmaps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowQuizModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-2 border border-emerald-500/40 shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Take Career Quiz</span>
            </button>

            <button
              onClick={onNavigateToAbya}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Abya AI</span>
            </button>
          </div>
        </div>
      </div>

      {showQuizModal && (
        <CareerQuizModal
          stream={profile.stream}
          studentName={activeStudentName}
          initialAnswers={
            quizAnswers || {
              favoriteSubjects: [],
              strongSubjects: [],
              problemSolvingPref: "Practical & Hands-on",
              creativityLevel: 3,
              communicationLevel: 3,
              numbersInterest: 3,
              scienceTechInterest: 3,
              businessFinanceInterest: 3,
              lawGovInterest: 3,
              peopleHelpingInterest: 3,
              researchInterest: 3,
            }
          }
          onSaveQuiz={(updatedQuiz) => {
            if (onUpdateQuiz) onUpdateQuiz(updatedQuiz);
            setShowQuizModal(false);
          }}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {/* Stream & Target Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Stream */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
              Selected Stream
            </div>
            <div className="text-base font-bold text-white font-heading flex items-center gap-2">
              <span>{profile.stream}</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {profile.currentClass}
              </span>
            </div>
          </div>
        </div>

        {/* Selected Target Career */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
              Target Career
            </div>
            <div className="text-base font-bold text-white font-heading truncate">
              {selectedCareerObj.title}
            </div>
          </div>
        </div>

        {/* Roadmap Completion */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span>ROADMAP PROGRESS</span>
              <span className="text-purple-400 font-bold">{roadmapProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${roadmapProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-card rounded-2xl border border-white/10 overflow-x-auto">
        {[
          {
            id: "matches",
            label: "Career Catalog & Matches",
            icon: Compass,
            badge: `${filteredMatches.length} Pathways`,
          },
          {
            id: "assessment",
            label: "Know Yourself Assessment",
            icon: Sliders,
          },
          {
            id: "compare",
            label: "Career Comparison",
            icon: Layers,
          },
          {
            id: "roadmap",
            label: "Personal Roadmap",
            icon: Award,
            badge: `${roadmapProgress}% Done`,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-transparent text-emerald-300 border border-emerald-500/40 shadow-md font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : ""}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAREER CATALOG & MATCH ENGINE */}
      {activeSubTab === "matches" && (
        <div className="space-y-6">
          {/* Filters & Search Bar */}
          <div className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Stream Filter Pills */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(["Commerce", "Science", "Arts / Humanities", "All"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedCatalogStream(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCatalogStream === s
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-md"
                      : "glass-pill text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {s === "All" ? "All Streams" : `${s}`}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search careers, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl glass-pill text-xs text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map((res) => {
              const { career, matchScore, whyMatches, relevantStrengths, areasToExplore } = res;
              const isSelectedTarget = profile.selectedCareerId === career.id;
              const isExpanded = expandedMatchId === career.id;

              return (
                <div
                  key={career.id}
                  className={`glass-card rounded-3xl p-6 border transition-all relative flex flex-col justify-between ${
                    isSelectedTarget
                      ? "border-emerald-400/80 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-cyan-950/30 shadow-xl shadow-emerald-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              career.stream === "Commerce"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : career.stream === "Science"
                                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {career.stream} • {career.category}
                          </span>
                          {isSelectedTarget && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                              Active Target
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold font-heading text-white mt-1">
                          {career.title}
                        </h3>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 text-emerald-300 font-extrabold text-sm flex items-center gap-1 shadow-inner">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{matchScore}% Match</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">Rule-based score</span>
                      </div>
                    </div>

                    {/* Match Score Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3 overflow-hidden border border-white/5">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          matchScore >= 80
                            ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                            : matchScore >= 65
                            ? "bg-gradient-to-r from-cyan-400 to-amber-400"
                            : "bg-gradient-to-r from-amber-400 to-rose-400"
                        }`}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {career.description}
                    </p>

                    {/* Key Specs Pills */}
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="p-2.5 rounded-xl glass-pill border border-white/5 flex items-center justify-between">
                        <span className="text-slate-400 font-mono">Duration:</span>
                        <span className="text-white font-semibold">{career.duration}</span>
                      </div>
                      <div className="p-2.5 rounded-xl glass-pill border border-white/5 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-mono">Suggested Pathway:</span>
                          <span className="text-emerald-300 font-semibold">{career.requiredSubjects.join(", ")}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans leading-tight mt-0.5">
                          {career.studyPathway}
                        </p>
                      </div>
                    </div>

                    {/* Required Skills */}
                    <div className="mb-4">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 font-mono">Required Core Skills:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {career.keySkills.map((sk) => (
                          <span
                            key={sk}
                            className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px]"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Why Match Accordion */}
                    <div className="space-y-2">
                      <button
                        onClick={() =>
                          setExpandedMatchId(isExpanded ? null : career.id)
                        }
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/15 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Why it matches your profile ({whyMatches.length})</span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-3 rounded-2xl glass-pill border border-emerald-500/20 space-y-3 animate-in fade-in duration-200 text-xs">
                          <div>
                            <div className="font-semibold text-slate-200 mb-1">Compatibility Factors:</div>
                            <ul className="space-y-1 text-slate-300 list-disc list-inside text-[11px]">
                              {whyMatches.map((reason, idx) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>

                          {res.alternativeCareers && res.alternativeCareers.length > 0 && (
                            <div className="pt-2 border-t border-white/10">
                              <div className="font-semibold text-slate-200 mb-1.5 text-[11px]">
                                Alternative Careers in Same Domain:
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {res.alternativeCareers.map((alt) => (
                                  <button
                                    key={alt.id}
                                    onClick={() => {
                                      setCompareIdA(career.id);
                                      setCompareIdB(alt.id);
                                      setActiveSubTab("compare");
                                    }}
                                    className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-semibold transition-all flex items-center gap-1"
                                  >
                                    <span>{alt.title}</span>
                                    <span className="text-[9px] text-slate-400">⚡ Compare</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setCompareIdA(career.id);
                        setActiveSubTab("compare");
                      }}
                      className="px-3 py-2 rounded-xl glass-pill text-slate-300 hover:text-white text-xs font-semibold border border-white/10"
                    >
                      Compare
                    </button>

                    <button
                      onClick={() => handleSelectTargetCareer(career)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isSelectedTarget
                          ? "bg-emerald-400 text-slate-950 shadow-md"
                          : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110"
                      }`}
                    >
                      {isSelectedTarget ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active Target</span>
                        </>
                      ) : (
                        <>
                          <span>Select Target & Roadmap</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: KNOW YOURSELF ASSESSMENT */}
      {activeSubTab === "assessment" && (
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>Know Yourself Career Assessment</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your strong subjects, skills, interests, and preferences. The Garia rule engine will compute your career compatibility matrix.
            </p>
          </div>

          {/* 1. Stream & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                1. Select Academic Stream
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["Commerce", "Science"] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStream(s)}
                    className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition-all ${
                      stream === s
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md"
                        : "glass-pill border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {s} Stream
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Current Class / Standard
              </label>
              <select
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Class 11" className="bg-slate-900 text-white">Class 11</option>
                <option value="Class 12" className="bg-slate-900 text-white">Class 12</option>
                <option value="Undergraduate Year 1" className="bg-slate-900 text-white">Undergraduate Year 1</option>
                <option value="Undergraduate Year 2+" className="bg-slate-900 text-white">Undergraduate Year 2+</option>
              </select>
            </div>
          </div>

          {/* 2. Strong Subjects */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              2. Strong Subjects (Select top 2-4)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((subj) => {
                const isSelected = strongSubjects.includes(subj);
                return (
                  <button
                    type="button"
                    key={subj}
                    onClick={() => togglePill(strongSubjects, setStrongSubjects, subj)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950 font-bold border border-emerald-400 shadow-md"
                        : "glass-pill border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${subj}` : subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Key Interests */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              3. Interests & Passions
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => togglePill(interests, setInterests, interest)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-cyan-500 text-slate-950 font-bold border border-cyan-400 shadow-md"
                        : "glass-pill border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${interest}` : interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Core Skills */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              4. Key Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((sk) => {
                const isSelected = skills.includes(sk);
                return (
                  <button
                    type="button"
                    key={sk}
                    onClick={() => togglePill(skills, setSkills, sk)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-purple-500 text-white font-bold border border-purple-400 shadow-md"
                        : "glass-pill border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${sk}` : sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Preferred Work Environment */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              5. Preferred Work Environment
            </label>
            <div className="flex flex-wrap gap-2">
              {WORK_AREA_OPTIONS.map((wa) => {
                const isSelected = workAreas.includes(wa);
                return (
                  <button
                    type="button"
                    key={wa}
                    onClick={() => togglePill(workAreas, setWorkAreas, wa)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-bold border border-amber-400 shadow-md"
                        : "glass-pill border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {isSelected ? `✓ ${wa}` : wa}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Study Preference */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              6. Study & Learning Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STUDY_PREF_OPTIONS.map((pref) => {
                const isSelected = studyPreference === pref;
                return (
                  <button
                    type="button"
                    key={pref}
                    onClick={() => setStudyPreference(pref)}
                    className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-md"
                        : "glass-pill border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save & Run Engine */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              onClick={handleSaveAssessment}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-xl hover:brightness-110 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Save & Calculate Career Compatibility</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: CAREER COMPARISON TOOL */}
      {activeSubTab === "compare" && (
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Side-by-Side Career Comparison</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select two career pathways to evaluate study requirements, key skills, and course stages.
            </p>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-mono text-emerald-400 mb-1">
                  Career Option A
                </label>
                <select
                  value={compareIdA}
                  onChange={(e) => setCompareIdA(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
                >
                  {CAREER_CATALOG.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      [{c.stream}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">
                  Career Option B
                </label>
                <select
                  value={compareIdB}
                  onChange={(e) => setCompareIdB(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
                >
                  {CAREER_CATALOG.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      [{c.stream}] {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Side-by-side Matrix */}
          {(() => {
            const carA = CAREER_CATALOG.find((c) => c.id === compareIdA) || CAREER_CATALOG[0];
            const carB = CAREER_CATALOG.find((c) => c.id === compareIdB) || CAREER_CATALOG[1];

            const matchA = matchResults.find((m) => m.career.id === carA.id)?.matchScore || 70;
            const matchB = matchResults.find((m) => m.career.id === carB.id)?.matchScore || 70;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option A Card */}
                <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                      {carA.stream} • {carA.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs">
                      {matchA}% Match
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-white">{carA.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{carA.description}</p>

                  <div className="space-y-3 pt-3 border-t border-white/10 text-xs font-mono">
                    <div>
                      <div className="text-slate-400 mb-1">Duration & Pathway:</div>
                      <div className="text-white font-semibold">{carA.duration}</div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{carA.studyPathway}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Required Subjects:</div>
                      <div className="text-emerald-300">{carA.requiredSubjects.join(", ")}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Key Skills Needed:</div>
                      <div className="text-slate-200">{carA.keySkills.join(", ")}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Course Stages:</div>
                      <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
                        {carA.courseStages.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectTargetCareer(carA)}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs mt-4 hover:bg-emerald-400 transition-colors"
                  >
                    Select Option A Target
                  </button>
                </div>

                {/* Option B Card */}
                <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      {carB.stream} • {carB.category}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs">
                      {matchB}% Match
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-white">{carB.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{carB.description}</p>

                  <div className="space-y-3 pt-3 border-t border-white/10 text-xs font-mono">
                    <div>
                      <div className="text-slate-400 mb-1">Duration & Pathway:</div>
                      <div className="text-white font-semibold">{carB.duration}</div>
                      <div className="text-slate-300 text-[11px] mt-0.5">{carB.studyPathway}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Required Subjects:</div>
                      <div className="text-cyan-300">{carB.requiredSubjects.join(", ")}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Key Skills Needed:</div>
                      <div className="text-slate-200">{carB.keySkills.join(", ")}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Course Stages:</div>
                      <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1">
                        {carB.courseStages.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectTargetCareer(carB)}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs mt-4 hover:bg-cyan-400 transition-colors"
                  >
                    Select Option B Target
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: PERSONAL CAREER ROADMAP */}
      {activeSubTab === "roadmap" && (
        <div className="space-y-6">
          {/* Target Summary Card */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Target Career Roadmap
                </span>
                <h2 className="text-2xl font-extrabold font-heading text-white mt-0.5">
                  {roadmap.careerTitle}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Stream: {roadmap.stream} • Class: {roadmap.currentClass}
                </p>
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {completedMilestones} / {roadmap.milestones.length}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    Milestones Done
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-sm">
                  {roadmapProgress}%
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${roadmapProgress}%` }}
              />
            </div>
          </div>

          {/* Interactive Milestones Timeline */}
          <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-lg font-bold font-heading text-white">
              Chronological Roadmap Milestones
            </h3>

            <div className="space-y-3">
              {roadmap.milestones.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => handleToggleMilestone(m.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                    m.completed
                      ? "bg-emerald-500/10 border-emerald-500/40 text-slate-100"
                      : "glass-pill border-white/5 hover:border-white/20 text-slate-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMilestone(m.id);
                    }}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      m.completed
                        ? "bg-emerald-400 border-emerald-400 text-slate-950"
                        : "border-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {m.completed && <Check className="w-4 h-4 font-extrabold" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-300 border border-white/10">
                          Stage {idx + 1}: {m.stage}
                        </span>
                        {m.targetTimeframe && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{m.targetTimeframe}]
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMilestone(m.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4
                      className={`font-semibold text-sm font-heading mt-1 ${
                        m.completed ? "line-through text-slate-400" : "text-white"
                      }`}
                    >
                      {m.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Milestone */}
            <form onSubmit={handleAddMilestone} className="pt-4 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Add custom milestone (e.g. Cleared CUET / Entrance Mock 1)..."
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl glass-pill text-xs text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Safety & Ethics Guidance Disclaimer Footer */}
      <div className="p-4 rounded-2xl glass-pill border border-white/10 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">Garia OS Guidance & Ethics Notice:</span>{" "}
          Career match scores and recommendations are transparent, rule-based academic advisory tools designed to foster self-discovery and structured preparation. Real-world success depends on individual exam performance, continuous dedication, and evolving market dynamics.
        </div>
      </div>
    </div>
  );
};
