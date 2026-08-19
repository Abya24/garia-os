import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Trash2,
  BarChart3,
  Check,
  ShieldCheck,
  GraduationCap,
  Globe,
  Landmark,
  FileCheck,
  Bot,
  ExternalLink,
  HelpCircle,
  Send,
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
  GovtJobOption,
  ScholarshipOption,
  StudyAbroadOption,
} from "../types";
import { CAREER_CATALOG, GOVT_JOBS_CATALOG, SCHOLARSHIPS_CATALOG, STUDY_ABROAD_CATALOG, calculateCareerMatches, generateDefaultRoadmap } from "../utils/careerEngine";
import { CareerQuizModal } from "../components/CareerQuizModal";
import { CareerCenterDrawer, CareerDrawerAction } from "../components/CareerCenterDrawer";

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
  onBack?: () => void;
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
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "matches" | "govt_jobs" | "scholarships" | "study_abroad" | "ai_advisor" | "assessment" | "compare" | "roadmap"
  >("matches");

  const [isCareerDrawerOpen, setIsCareerDrawerOpen] = useState(false);

  const [stream, setStream] = useState<StreamType>(profile.stream || "Commerce");
  const [currentClass, setCurrentClass] = useState<string>(
    profile.currentClass || "Class 12"
  );

  // Search filter for catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatalogStream, setSelectedCatalogStream] = useState<
    "All" | "Commerce" | "Science" | "Arts / Humanities" | "Arts"
  >(profile.stream || "Commerce");

  // Keep stream and target career validated when profile stream changes
  useEffect(() => {
    if (profile.stream) {
      setStream(profile.stream);
      setSelectedCatalogStream(profile.stream);

      // Check if currently selected target career matches new stream
      const currentTarget = CAREER_CATALOG.find((c) => c.id === profile.selectedCareerId);
      const isTargetValid =
        currentTarget &&
        (profile.stream === "General" ||
          profile.stream === "All" ||
          currentTarget.stream === profile.stream ||
          ((profile.stream === "Arts" || profile.stream === "Arts / Humanities") &&
            (currentTarget.stream === "Arts" || currentTarget.stream === "Arts / Humanities")));

      if (!isTargetValid) {
        // Auto-select first valid career for this stream
        const firstMatching = CAREER_CATALOG.find(
          (c) =>
            c.stream === profile.stream ||
            ((profile.stream === "Arts" || profile.stream === "Arts / Humanities") &&
              (c.stream === "Arts" || c.stream === "Arts / Humanities"))
        ) || CAREER_CATALOG[0];

        if (firstMatching && firstMatching.id !== profile.selectedCareerId) {
          const updatedProf: CareerProfile = {
            ...profile,
            selectedCareerId: firstMatching.id,
            stream: firstMatching.stream,
            updatedAt: Date.now(),
          };
          onUpdateProfile(updatedProf);
          const newRoadmap = generateDefaultRoadmap(firstMatching, updatedProf);
          onUpdateRoadmap(newRoadmap);
        }
      }
    }
  }, [profile.stream]);

  const handleCareerDrawerAction = (action: CareerDrawerAction) => {
    switch (action) {
      case "career_commerce":
        setStream("Commerce");
        setSelectedCatalogStream("Commerce");
        setActiveSubTab("matches");
        break;
      case "career_science":
        setStream("Science");
        setSelectedCatalogStream("Science");
        setActiveSubTab("matches");
        break;
      case "career_arts":
        setStream("Arts / Humanities");
        setSelectedCatalogStream("Arts / Humanities");
        setActiveSubTab("matches");
        break;
      case "career_class10":
        setCurrentClass("Class 10");
        setActiveSubTab("matches");
        break;
      case "exam_jee":
      case "exam_neet":
      case "exam_cuet":
      case "exam_ca":
        setActiveSubTab("matches");
        break;
      case "exam_nda":
      case "exam_ssc":
      case "exam_banking":
        setActiveSubTab("govt_jobs");
        break;
      case "roadmap_eligibility":
      case "roadmap_skills":
      case "roadmap_future_scope":
        setActiveSubTab("roadmap");
        break;
      case "roadmap_salary":
        setActiveSubTab("compare");
        break;
      default:
        setActiveSubTab("matches");
    }
  };

  const [showQuizModal, setShowQuizModal] = useState(false);

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

  // Filters for other tabs
  const [govtJobSearch, setGovtJobSearch] = useState("");
  const [scholarshipSearch, setScholarshipSearch] = useState("");
  const [studyAbroadCountry, setStudyAbroadCountry] = useState<string>("all");
  const [aiAdvisorPrompt, setAiAdvisorPrompt] = useState("");
  const [aiAdvisorHistory, setAiAdvisorHistory] = useState<
    { role: "user" | "advisor"; text: string; time: string }[]
  >([
    {
      role: "advisor",
      text: `Hello ${activeStudentName}! I am your Garia OS Career & Stream AI Advisor. I can analyze your aptitude, compare Science vs Commerce vs Arts roadmaps, guide you on competitive exams (JEE, NEET, CUET, UPSC, CA, NDA), and provide scholarship/abroad admission strategies. How can I help your career planning today?`,
      time: "Just now",
    },
  ]);

  // Universal Dropdown Filters for Career Center (Rule 1)
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedExam, setSelectedExam] = useState<string>("All");
  const [selectedRole, setSelectedRole] = useState<string>("All");

  // Expanded card IDs
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [expandedGovtJobId, setExpandedGovtJobId] = useState<string | null>(null);
  const [expandedScholarshipId, setExpandedScholarshipId] = useState<string | null>(null);

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

  // Calculate live match results with quiz answers & student subjects for active stream
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
    stream: selectedCatalogStream === "All" ? ("All" as any) : selectedCatalogStream,
    currentClass,
  };

  const matchResults: CareerMatchResult[] = calculateCareerMatches(
    currentAssessment,
    currentProfile,
    quizAnswers,
    subjects
  );

  // Derived available filter options for Career Center
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    matchResults.forEach((res) => {
      if (res.career.category) set.add(res.career.category);
    });
    return Array.from(set);
  }, [matchResults]);

  const availableExams = useMemo(() => {
    const set = new Set<string>();
    matchResults.forEach((res) => {
      const exams = (res.career as any)?.entranceExams;
      if (Array.isArray(exams)) {
        exams.forEach((e: string) => {
          if (typeof e === "string") set.add(e);
        });
      } else if (typeof exams === "string") {
        set.add(exams);
      }

      const stages = res.career?.courseStages;
      if (Array.isArray(stages)) {
        stages.forEach((stage) => {
          if (typeof stage === "string" && (stage.toLowerCase().includes("entrance") || stage.toLowerCase().includes("exam") || stage.toLowerCase().includes("jee") || stage.toLowerCase().includes("neet") || stage.toLowerCase().includes("cuet") || stage.toLowerCase().includes("foundation") || stage.toLowerCase().includes("cat") || stage.toLowerCase().includes("clat"))) {
            set.add(stage);
          }
        });
      }
    });
    return Array.from(set);
  }, [matchResults]);

  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    matchResults.forEach((res) => {
      if (res.career.title) set.add(res.career.title);
    });
    return Array.from(set);
  }, [matchResults]);

  // Filter match results for catalog view
  const filteredMatches = matchResults.filter((res) => {
    const matchesStream =
      selectedCatalogStream === "All" ||
      res.career.stream === selectedCatalogStream ||
      ((selectedCatalogStream === "Arts" || selectedCatalogStream === "Arts / Humanities") &&
        (res.career.stream === "Arts" || res.career.stream === "Arts / Humanities"));
    const matchesCategory =
      selectedCategory === "All" || res.career.category === selectedCategory;
    const matchesExam =
      selectedExam === "All" ||
      ((res.career as any).entranceExams && (res.career as any).entranceExams.includes(selectedExam)) ||
      (res.career.courseStages && res.career.courseStages.includes(selectedExam));
    const matchesRole =
      selectedRole === "All" || res.career.title === selectedRole;
    const matchesQuery =
      res.career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.career.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.career.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStream && matchesCategory && matchesExam && matchesRole && matchesQuery;
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
  const selectedCareerObj =
    CAREER_CATALOG.find((c) => c.id === profile.selectedCareerId) ||
    CAREER_CATALOG.find((c) => c.stream === profile.stream) ||
    CAREER_CATALOG[0];

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/70 border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Garia OS v1.4 Feature</span>
              </div>
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
              id="open-career-drawer-btn"
              onClick={() => setIsCareerDrawerOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-2 border border-purple-500/40 shadow-lg transition-all"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Career Drawer</span>
            </button>

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

      {/* Universal Dropdown Navigation Ribbon (Rule 1 & Rule 2) */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stream Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-400">Stream:</span>
            <select
              id="career-stream-dropdown"
              value={selectedCatalogStream}
              onChange={(e) => {
                const s = e.target.value as "Commerce" | "Science" | "Arts / Humanities" | "All";
                setSelectedCatalogStream(s);
                if (s !== "All") {
                  setStream(s as StreamType);
                  onUpdateProfile({
                    ...profile,
                    stream: s as StreamType,
                    updatedAt: Date.now(),
                  });
                }
              }}
              className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="All" className="bg-slate-900 text-white">All Streams</option>
              <option value="Commerce" className="bg-slate-900 text-white">Commerce</option>
              <option value="Science" className="bg-slate-900 text-white">Science</option>
              <option value="Arts / Humanities" className="bg-slate-900 text-white">Arts / Humanities</option>
            </select>
          </div>

          {/* Career Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <span className="text-[11px] font-semibold text-slate-400">Category:</span>
            <select
              id="career-category-dropdown"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="All" className="bg-slate-900 text-white">All Categories ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-400">Exam:</span>
            <select
              id="career-exam-dropdown"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-300 focus:outline-none cursor-pointer max-w-[140px] truncate"
            >
              <option value="All" className="bg-slate-900 text-white">All Entrance Exams</option>
              {availableExams.map((ex) => (
                <option key={ex} value={ex} className="bg-slate-900 text-white">
                  {ex}
                </option>
              ))}
            </select>
          </div>

          {/* Role Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <span className="text-[11px] font-semibold text-slate-400">Role:</span>
            <select
              id="career-role-dropdown"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="All" className="bg-slate-900 text-white">All Career Roles ({availableRoles.length})</option>
              {availableRoles.map((role) => (
                <option key={role} value={role} className="bg-slate-900 text-white">
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* View / Sub-Tab Dropdown (Converted from >5 Tabs into Standard Dropdown) */}
          <div className="flex items-center gap-1.5 bg-emerald-500/20 px-3 py-2 rounded-2xl border border-emerald-500/40 min-h-[44px] ml-auto">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-300">View:</span>
            <select
              id="career-view-dropdown"
              value={activeSubTab}
              onChange={(e) => setActiveSubTab(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="matches" className="bg-slate-900 text-white">Stream Careers ({filteredMatches.length})</option>
              <option value="govt_jobs" className="bg-slate-900 text-white">Govt Jobs & UPSC</option>
              <option value="scholarships" className="bg-slate-900 text-white">Scholarships Hub</option>
              <option value="study_abroad" className="bg-slate-900 text-white">Study Abroad</option>
              <option value="ai_advisor" className="bg-slate-900 text-white">Career AI Advisor</option>
              <option value="roadmap" className="bg-slate-900 text-white">Personal Roadmap</option>
              <option value="assessment" className="bg-slate-900 text-white">Know Yourself</option>
              <option value="compare" className="bg-slate-900 text-white">Compare Careers</option>
            </select>
          </div>
        </div>

        {/* Breadcrumbs & Quick Search Row */}
        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 flex-wrap font-mono text-[11px]">
            <span className="text-emerald-400 font-bold">{selectedCatalogStream === "All" ? "All Streams" : selectedCatalogStream}</span>
            {selectedCategory !== "All" && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-cyan-300 font-semibold truncate max-w-[130px]">{selectedCategory}</span>
              </>
            )}
            {selectedExam !== "All" && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-purple-300 font-semibold truncate max-w-[120px]">{selectedExam}</span>
              </>
            )}
            {selectedRole !== "All" && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="text-amber-300 font-semibold truncate max-w-[140px]">{selectedRole}</span>
              </>
            )}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search careers, skills, eligibility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-white placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500 min-h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* TAB 1: CAREER CATALOG & MATCH ENGINE */}
      {activeSubTab === "matches" && (
        <div className="space-y-6">
          {/* Filters & Search Bar */}
          <div className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Stream Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-mono text-slate-400 shrink-0 font-bold">Stream Filter:</label>
              <select
                value={selectedCatalogStream}
                onChange={(e) => {
                  const s = e.target.value as "Commerce" | "Science" | "Arts / Humanities" | "All";
                  setSelectedCatalogStream(s);
                  if (s !== "All") {
                    setStream(s as StreamType);
                    onUpdateProfile({
                      ...profile,
                      stream: s as StreamType,
                      updatedAt: Date.now(),
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-emerald-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
              >
                <option value="All" className="bg-slate-900 text-white">All Streams (All 15+ Careers)</option>
                <option value="Commerce" className="bg-slate-900 text-white">Commerce Careers</option>
                <option value="Science" className="bg-slate-900 text-white">Science Careers</option>
                <option value="Arts / Humanities" className="bg-slate-900 text-white">Arts / Humanities Careers</option>
              </select>
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
              <select
                value={stream}
                onChange={(e) => setStream(e.target.value as StreamType)}
                className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900"
              >
                <option value="Commerce" className="bg-slate-900 text-white">Commerce Stream</option>
                <option value="Science" className="bg-slate-900 text-white">Science Stream</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                Current Class / Standard
              </label>
              <select
                value={currentClass}
                onChange={(e) => setCurrentClass(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900"
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
              2. Strong Subjects ({strongSubjects.length} Selected)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value && !strongSubjects.includes(e.target.value)) {
                    setStrongSubjects([...strongSubjects, e.target.value]);
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-full sm:w-80 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  + Add Strong Subject from Dropdown...
                </option>
                {SUBJECT_OPTIONS.map((subj) => (
                  <option key={subj} value={subj} disabled={strongSubjects.includes(subj)} className="bg-slate-900 text-white">
                    {subj} {strongSubjects.includes(subj) ? "(Selected)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5 items-center">
                {strongSubjects.map((subj) => (
                  <span
                    key={subj}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold shadow-sm"
                  >
                    <span>✓ {subj}</span>
                    <button
                      type="button"
                      onClick={() => setStrongSubjects(strongSubjects.filter((s) => s !== subj))}
                      className="hover:text-white text-emerald-400 ml-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Key Interests */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              3. Interests & Passions ({interests.length} Selected)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value && !interests.includes(e.target.value)) {
                    setInterests([...interests, e.target.value]);
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-full sm:w-80 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 bg-slate-900"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  + Add Interest/Passion from Dropdown...
                </option>
                {INTEREST_OPTIONS.map((int) => (
                  <option key={int} value={int} disabled={interests.includes(int)} className="bg-slate-900 text-white">
                    {int} {interests.includes(int) ? "(Selected)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5 items-center">
                {interests.map((int) => (
                  <span
                    key={int}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold shadow-sm"
                  >
                    <span>✓ {int}</span>
                    <button
                      type="button"
                      onClick={() => setInterests(interests.filter((i) => i !== int))}
                      className="hover:text-white text-cyan-400 ml-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Core Skills */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              4. Key Skills ({skills.length} Selected)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value && !skills.includes(e.target.value)) {
                    setSkills([...skills, e.target.value]);
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-full sm:w-80 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-slate-900"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  + Add Core Skill from Dropdown...
                </option>
                {SKILL_OPTIONS.map((sk) => (
                  <option key={sk} value={sk} disabled={skills.includes(sk)} className="bg-slate-900 text-white">
                    {sk} {skills.includes(sk) ? "(Selected)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5 items-center">
                {skills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold shadow-sm"
                  >
                    <span>✓ {sk}</span>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((s) => s !== sk))}
                      className="hover:text-white text-purple-400 ml-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Preferred Work Environment */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              5. Preferred Work Environment ({workAreas.length} Selected)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                onChange={(e) => {
                  if (e.target.value && !workAreas.includes(e.target.value)) {
                    setWorkAreas([...workAreas, e.target.value]);
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className="w-full sm:w-80 px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 bg-slate-900"
              >
                <option value="" disabled className="bg-slate-900 text-slate-400">
                  + Add Work Environment from Dropdown...
                </option>
                {WORK_AREA_OPTIONS.map((wa) => (
                  <option key={wa} value={wa} disabled={workAreas.includes(wa)} className="bg-slate-900 text-white">
                    {wa} {workAreas.includes(wa) ? "(Selected)" : ""}
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap gap-1.5 items-center">
                {workAreas.map((wa) => (
                  <span
                    key={wa}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold shadow-sm"
                  >
                    <span>✓ {wa}</span>
                    <button
                      type="button"
                      onClick={() => setWorkAreas(workAreas.filter((w) => w !== wa))}
                      className="hover:text-white text-amber-400 ml-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Study Preference */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              6. Study & Learning Style
            </label>
            <select
              value={studyPreference}
              onChange={(e) => setStudyPreference(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 bg-slate-900"
            >
              {STUDY_PREF_OPTIONS.map((pref) => (
                <option key={pref} value={pref} className="bg-slate-900 text-white">
                  {pref}
                </option>
              ))}
            </select>
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

      {/* TAB: GOVT JOBS & UPSC SECTORS */}
      {activeSubTab === "govt_jobs" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Search */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-1.5">
                <Landmark className="w-3.5 h-3.5" />
                <span>Public Sector & Defense Pathways</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Government Jobs & Civil Services Intelligence
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive eligibility, exam patterns, pay scales, and strategic prep timelines for national competitive exams.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search UPSC, NDA, SSC, Bank PO..."
                value={govtJobSearch}
                onChange={(e) => setGovtJobSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl glass-pill text-xs text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {GOVT_JOBS_CATALOG.filter((job) => {
              const q = govtJobSearch.toLowerCase();
              return (
                job.title.toLowerCase().includes(q) ||
                job.organization.toLowerCase().includes(q) ||
                job.keySubjects.some((s) => s.toLowerCase().includes(q))
              );
            }).map((job) => {
              const isExpanded = expandedGovtJobId === job.id;
              return (
                <div
                  key={job.id}
                  className="glass-card rounded-3xl p-5 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">
                          {job.organization}
                        </span>
                        <h3 className="text-base font-bold text-white font-heading mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 shrink-0">
                        {job.minAge}
                      </span>
                    </div>

                    {/* Quick Specs */}
                    <div className="mt-3.5 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <GraduationCap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate"><strong>Eligibility:</strong> {job.eligibility}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>Pay Scale:</strong> {job.salaryTier}</span>
                      </div>
                    </div>

                    {/* Key Subject Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {job.keySubjects.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 text-[10px] border border-white/5 font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3.5 text-xs animate-in fade-in">
                        <div>
                          <div className="font-bold text-amber-300 mb-1">Exam Structure & Stages:</div>
                          <ul className="space-y-1 text-slate-300 list-disc list-inside">
                            {job.examPattern.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <div className="font-bold text-emerald-300 mb-1">Recommended Strategy:</div>
                          <p className="text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                            {job.preparationStrategy}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setExpandedGovtJobId(isExpanded ? null : job.id)}
                      className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Less Details" : "View Exam Pattern & Prep"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={job.officialPortal}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: SCHOLARSHIPS HUB */}
      {activeSubTab === "scholarships" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header & Search */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Financial Aid & Grants</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                National & Corporate Scholarships Hub
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified scholarships for Class 10/11/12 students and college undergraduates with full eligibility requirements.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search NSP, INSPIRE, Tata, Reliance..."
                value={scholarshipSearch}
                onChange={(e) => setScholarshipSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-2xl glass-pill text-xs text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Scholarship Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SCHOLARSHIPS_CATALOG.filter((s) => {
              const q = scholarshipSearch.toLowerCase();
              return (
                s.title.toLowerCase().includes(q) ||
                s.provider.toLowerCase().includes(q) ||
                s.eligibility.toLowerCase().includes(q)
              );
            }).map((sch) => {
              const isExpanded = expandedScholarshipId === sch.id;
              return (
                <div
                  key={sch.id}
                  className="glass-card rounded-3xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">
                          {sch.provider}
                        </span>
                        <h3 className="text-base font-bold text-white font-heading mt-0.5">
                          {sch.title}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shrink-0">
                        {sch.applicationPeriod}
                      </span>
                    </div>

                    <div className="mt-3.5 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/20">
                      <div className="text-[11px] text-emerald-400 uppercase font-mono font-bold">Grant Amount</div>
                      <div className="text-sm font-extrabold text-white mt-0.5">{sch.awardAmount}</div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                      <div><strong>Target Level:</strong> {sch.targetClass}</div>
                      <div><strong>Eligibility:</strong> {sch.eligibility}</div>
                      <div><strong>Selection:</strong> {sch.selectionBasis}</div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3 text-xs animate-in fade-in">
                        <div>
                          <div className="font-bold text-cyan-300 mb-1">Required Documents Checklist:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {sch.requiredDocuments.map((doc, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] border border-white/5"
                              >
                                ✓ {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setExpandedScholarshipId(isExpanded ? null : sch.id)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>{isExpanded ? "Less Details" : "Document Checklist"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <a
                      href={sch.applyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30 transition-all"
                    >
                      <span>Apply on Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: STUDY ABROAD NAVIGATOR */}
      {activeSubTab === "study_abroad" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Global University Admissions</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Study Abroad Country & Visa Navigator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cost of living, key entrance exams (SAT, IELTS, GRE), intake cycles, and admission timelines for top global destinations.
              </p>
            </div>

            {/* Country Selector Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "All Countries" },
                { id: "usa", label: "🇺🇸 USA" },
                { id: "uk", label: "🇬🇧 UK" },
                { id: "germany", label: "🇩🇪 Germany" },
                { id: "canada", label: "🇨🇦 Canada" },
                { id: "australia", label: "🇦🇺 Australia" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setStudyAbroadCountry(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    studyAbroadCountry === c.id
                      ? "bg-cyan-500 text-slate-950 shadow-md"
                      : "glass-pill text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country Cards */}
          <div className="space-y-5">
            {STUDY_ABROAD_CATALOG.filter((c) => studyAbroadCountry === "all" || c.id === studyAbroadCountry).map((country) => (
              <div
                key={country.id}
                className="glass-card rounded-3xl p-6 border border-white/10 hover:border-cyan-500/30 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white font-heading">{country.country}</h3>
                      <div className="text-xs text-cyan-400 font-mono mt-0.5">
                        {country.intakes.join(" • ")}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-right">
                    <div className="text-[10px] text-cyan-300 uppercase font-mono font-bold">Estimated Cost / Year</div>
                    <div className="text-sm font-extrabold text-white">{country.avgCostPerYear}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Exams & Courses */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Required Entrance Exams</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {country.keyEntranceExams.map((e, idx) => (
                        <li key={idx}>• {e}</li>
                      ))}
                    </ul>

                    <div className="font-bold text-cyan-300 pt-2 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Popular Fields</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {country.popularCourses.map((crs, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300">
                          {crs}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Visa & Scholarships */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Visa & Financial Criteria</span>
                    </div>
                    <ul className="space-y-1 text-slate-300">
                      {country.visaRequirements.map((v, idx) => (
                        <li key={idx}>• {v}</li>
                      ))}
                    </ul>

                    <div className="font-bold text-emerald-300 pt-2 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Scholarship Opportunities</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {country.scholarshipAvailable}
                    </p>
                  </div>

                  {/* Timeline Roadmap */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-black/20 border border-white/5">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5" />
                      <span>Standard Application Timeline</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      {country.admissionTimeline.map((t, idx) => (
                        <div key={idx} className="p-1.5 rounded-lg bg-purple-950/30 border border-purple-500/10">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CAREER AI ADVISOR */}
      {activeSubTab === "ai_advisor" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header */}
          <div className="glass-card p-5 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>Abya AI Career Intelligence</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
                Interactive Career & Stream AI Advisor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Get intelligent advice on subject combinations, entrance exam roadmaps, CA vs Engineering vs Civil Services, and abroad strategies.
              </p>
            </div>

            <button
              onClick={onNavigateToAbya}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:brightness-110 transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Full Abya AI Screen</span>
            </button>
          </div>

          {/* Quick Consultation Chips */}
          <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
            <div className="text-xs font-bold text-slate-300 font-heading">Popular Career Advice Prompts:</div>
            <div className="flex flex-wrap gap-2">
              {[
                "Should I choose Science (PCM/PCB) or Commerce after Class 10?",
                "What is the step-by-step roadmap to become a Chartered Accountant (CA)?",
                "How to prepare for UPSC Civil Services along with college graduation?",
                "Which engineering branches have the highest AI and future demand?",
                "How can I secure full tuition scholarships for studying in Germany or USA?",
                "What are the best high-paying career options for Arts / Humanities students?",
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiAdvisorHistory((prev) => [
                      ...prev,
                      { role: "user", text: p, time: "Just now" },
                      {
                        role: "advisor",
                        text: `Analyzing "${p}" for ${profile.stream} (${profile.currentClass})...\n\nStrategic Advice:\n1. Foundation: Ensure strong mastery in core prerequisites during ${profile.currentClass}.\n2. Timeline: Register for key entrance tests early and solve 5 years of past papers.\n3. Skill Stack: Build practical digital proficiencies alongside academic scores.\n\nTip: You can chat directly with Abya AI for real-time deep answers!`,
                        time: "Just now",
                      },
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-xl glass-pill text-slate-300 hover:text-white hover:bg-purple-500/20 text-xs text-left border border-white/10 transition-all"
                >
                  💬 {p}
                </button>
              ))}
            </div>
          </div>

          {/* Chat / Advice Stream */}
          <div className="glass-card rounded-3xl p-5 border border-white/10 space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {aiAdvisorHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    item.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {item.role === "advisor" && (
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-xl ${
                      item.role === "user"
                        ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md"
                        : "bg-slate-900/90 text-slate-200 border border-white/10 rounded-tl-none whitespace-pre-line shadow-inner"
                    }`}
                  >
                    <div className="text-[10px] opacity-70 mb-1 font-mono">
                      {item.role === "user" ? activeStudentName : "Garia OS Career AI Advisor"} • {item.time}
                    </div>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!aiAdvisorPrompt.trim()) return;
                const prompt = aiAdvisorPrompt.trim();
                setAiAdvisorHistory((prev) => [
                  ...prev,
                  { role: "user", text: prompt, time: "Just now" },
                  {
                    role: "advisor",
                    text: `Regarding your query "${prompt}":\n\nBased on your ${profile.stream} profile in ${profile.currentClass}, our academic recommendation is to align your weekly study blocks with key entrance syllabi. Click 'Open Full Abya AI Screen' above for interactive live conversation with continuous memory.`,
                    time: "Just now",
                  },
                ]);
                setAiAdvisorPrompt("");
              }}
              className="flex items-center gap-2 pt-3 border-t border-white/10"
            >
              <input
                type="text"
                placeholder="Ask Career Advisor anything (e.g. Is CA better than MBA for finance?)..."
                value={aiAdvisorPrompt}
                onChange={(e) => setAiAdvisorPrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl glass-pill text-xs text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ask Advisor</span>
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

      {/* Dedicated Career Intelligence Drawer */}
      <CareerCenterDrawer
        isOpen={isCareerDrawerOpen}
        onClose={() => setIsCareerDrawerOpen(false)}
        onSelectAction={handleCareerDrawerAction}
        activeAction={activeSubTab}
        studentStream={profile.stream || "Commerce"}
        targetCareerTitle={selectedCareerObj.title}
      />
    </div>
  );
};
