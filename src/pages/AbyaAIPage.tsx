import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Key,
  BookOpen,
  Calendar,
  Lightbulb,
  Compass,
  GraduationCap,
  RefreshCw,
  AlertTriangle,
  Flame,
  Target,
  Trophy,
  BarChart3,
  ArrowRight,
  Zap,
  RotateCw,
  Globe,
  X,
  MessageCircle,
  Brain,
  Search,
  Mic,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  Clock,
  CheckCircle2,
  ChevronDown,
  Layers,
  FileText,
  HelpCircle,
  Award,
  Activity,
  Wifi,
  WifiOff,
  Server,
  Cpu,
  ShieldCheck,
  Radio,
  ArrowLeft,
  MoreHorizontal,
  ChevronUp,
  Camera,
  Sliders,
  Paperclip,
  CheckSquare,
  TrendingUp,
  Bookmark,
  Hash,
  PlusCircle,
  CornerDownRight,
  Eye,
  Plus,
} from "lucide-react";
import {
  AbyaMessage,
  AbyaChatSession,
  UserSettings,
  StudentProfile,
  AbyaInsightCard,
  AbyaQuickActionType,
  ActiveTab,
  AbyaLanguageSetting,
  AbyaAIMode,
  AbyaDiagnosticsInfo,
  AcademicSubject,
  AcademicChapter,
  AcademicRevisionItem,
  AcademicPracticeSession,
  ExamProfile,
  Task,
  Habit,
} from "../types";
import { AbyaLiveVoiceModal } from "../components/AbyaLiveVoiceModal";
import { AcademicDecisionEngineSection } from "../components/home/sections/AcademicDecisionEngineSection";
import {
  getCurriculumSubjects,
  CurriculumSubject,
  CurriculumChapter,
  CurriculumTopic,
} from "../data/masterCurriculum";
import {
  loadAbyaChatSessions,
  saveAbyaChatSessions,
  deleteAbyaChatSession,
} from "../utils/storage";
import { getStudentDisplayName } from "../utils/studentNameUtils";

interface AbyaAIPageProps {
  messages: AbyaMessage[];
  settings: UserSettings;
  activeStudent?: StudentProfile | null;
  insightCards: AbyaInsightCard[];
  abyaLanguage?: AbyaLanguageSetting;
  onUpdateAbyaLanguage?: (lang: AbyaLanguageSetting) => void;
  onSendMessage: (
    prompt: string,
    contextNote?: string,
    actionType?: AbyaQuickActionType,
    mode?: AbyaAIMode,
    image?: { data: string; mimeType: string },
    curriculumContext?: {
      classLevel?: string;
      stream?: string;
      subject?: string;
      chapter?: string;
      topic?: string;
      modeType?: string;
    }
  ) => Promise<void>;
  onClearChat: () => void;
  onUpdateSettings: (s: UserSettings) => void;
  attachedContextNote?: string;
  onClearAttachedContext?: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  onTriggerFallbackAction?: (actionType: AbyaQuickActionType) => void;
  onRetryLastMessage?: () => void;
  diagnostics?: AbyaDiagnosticsInfo;
  onTestDiagnostics?: () => Promise<void>;
  onBack?: () => void;
  // Context props
  tasks?: Task[];
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  academicRevisions?: AcademicRevisionItem[];
  academicPractice?: AcademicPracticeSession[];
  examProfile?: ExamProfile;
  habits?: Habit[];
}

export const AbyaAIPage: React.FC<AbyaAIPageProps> = ({
  messages,
  settings,
  activeStudent,
  insightCards = [],
  abyaLanguage = "WhatsApp Language",
  onUpdateAbyaLanguage,
  onSendMessage,
  onClearChat,
  onUpdateSettings,
  attachedContextNote,
  onClearAttachedContext,
  onNavigate,
  onTriggerFallbackAction,
  onRetryLastMessage,
  diagnostics,
  onTestDiagnostics,
  onBack,
  tasks = [],
  academicSubjects = [],
  academicChapters = [],
  academicRevisions = [],
  academicPractice = [],
  examProfile,
  habits = [],
}) => {
  // Navigation between Home Dashboard and Active Conversation Thread
  const [viewMode, setViewMode] = useState<"home" | "chat">(
    messages.length > 0 ? "chat" : "home"
  );

  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedMode, setSelectedMode] = useState<AbyaAIMode>("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [isPingingDiagnostics, setIsPingingDiagnostics] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.customApiKey || "");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Recent chat sessions state
  const [chatSessions, setChatSessions] = useState<AbyaChatSession[]>(() =>
    loadAbyaChatSessions(activeStudent?.id || "")
  );

  // Drawers
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isIntelligenceDrawerOpen, setIsIntelligenceDrawerOpen] = useState(false);

  // Image input
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Responsive Virtual Keyboard Handling for mobile viewports
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        setViewportHeight(height);
        const isOpen = height < window.screen.height * 0.75;
        setIsKeyboardOpen(isOpen);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
      handleResize();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, []);

  // Sync sessions when student changes or messages change
  useEffect(() => {
    const loaded = loadAbyaChatSessions(activeStudent?.id || "");
    setChatSessions(loaded);
  }, [activeStudent?.id]);

  // Save current active session whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m) => m.role === "user")?.content || "Academic Session";
      const lastMsg = messages[messages.length - 1]?.content || "";
      const title = firstUserMsg.slice(0, 45).trim() + (firstUserMsg.length > 45 ? "..." : "");

      const currentSessions = loadAbyaChatSessions(activeStudent?.id || "");
      const existingIdx = currentSessions.findIndex((s) => s.id === "active_session");

      const sessionObj: AbyaChatSession = {
        id: "active_session",
        title: title || "Study Session",
        createdAt: messages[0]?.timestamp || Date.now(),
        updatedAt: Date.now(),
        previewMessage: lastMsg.slice(0, 70) || "Recent conversation",
        messagesCount: messages.length,
        mode: selectedMode,
        messages: messages,
      };

      let updated: AbyaChatSession[];
      if (existingIdx >= 0) {
        updated = [...currentSessions];
        updated[existingIdx] = sessionObj;
      } else {
        updated = [sessionObj, ...currentSessions];
      }
      saveAbyaChatSessions(updated, activeStudent?.id || "");
      setChatSessions(updated);
    }
  }, [messages, activeStudent?.id, selectedMode]);

  // Master Curriculum State (for contextual drilldown)
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [selectedChapId, setSelectedChapId] = useState<string>("");
  const [selectedTopId, setSelectedTopId] = useState<string>("");

  const curriculumSubjects = useMemo(() => {
    return getCurriculumSubjects(activeStudent?.classLevel, activeStudent?.stream);
  }, [activeStudent?.classLevel, activeStudent?.stream]);

  // Initialize selected subject if empty
  useEffect(() => {
    if (curriculumSubjects.length > 0 && !selectedSubId) {
      setSelectedSubId(curriculumSubjects[0].id);
    }
  }, [curriculumSubjects, selectedSubId]);

  const currentSubject: CurriculumSubject | undefined = useMemo(() => {
    return (
      curriculumSubjects.find((s) => s.id === selectedSubId) || curriculumSubjects[0]
    );
  }, [curriculumSubjects, selectedSubId]);

  const currentChapter: CurriculumChapter | undefined = useMemo(() => {
    if (!currentSubject) return undefined;
    return (
      currentSubject.chapters.find((c) => c.id === selectedChapId) ||
      currentSubject.chapters[0]
    );
  }, [currentSubject, selectedChapId]);

  const currentTopic: CurriculumTopic | undefined = useMemo(() => {
    if (!currentChapter) return undefined;
    return (
      currentChapter.topics.find((t) => t.id === selectedTopId) ||
      currentChapter.topics[0]
    );
  }, [currentChapter, selectedTopId]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (viewMode === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, viewMode]);

  // Image Upload Handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        previewUrl: result,
        fileName: file.name,
      });
      // Switch to chat view to prepare asking
      setViewMode("chat");
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Primary Message Sender
  const handleSend = async (
    textToSend?: string,
    actionType?: AbyaQuickActionType,
    overrideMode?: AbyaAIMode,
    curriculumContextPayload?: {
      classLevel?: string;
      stream?: string;
      subject?: string;
      chapter?: string;
      topic?: string;
      modeType?: string;
    }
  ) => {
    const prompt = (textToSend || inputPrompt).trim();
    if ((!prompt && !selectedImage) || isLoading) return;

    const modeToUse = overrideMode || selectedMode;
    const imagePayload = selectedImage
      ? { data: selectedImage.data, mimeType: selectedImage.mimeType }
      : undefined;

    setInputPrompt("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    setIsLoading(true);
    setViewMode("chat");

    try {
      await onSendMessage(
        prompt || "Please analyze this study image and solve the problem step by step.",
        attachedContextNote,
        actionType,
        modeToUse,
        imagePayload,
        curriculumContextPayload
      );
      if (onClearAttachedContext) onClearAttachedContext();
    } catch (err) {
      console.error("Error sending message to Abya AI", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveApiKey = () => {
    onUpdateSettings({ ...settings, customApiKey: tempApiKey.trim() });
    setShowApiKeyModal(false);
  };

  // Time of day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Student Intelligence & Briefing Calculations
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const highPriorityTasksCount = useMemo(
    () => pendingTasks.filter((t) => t.priority === "high").length,
    [pendingTasks]
  );

  // Study Time Calculation
  const studyTimeMinutesToday = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return habits
      .filter((h) => h.completedDates.includes(todayStr))
      .reduce((acc, h) => acc + (h.durationMinutes || 30), 0);
  }, [habits]);

  const targetStudyHours = examProfile?.dailyStudyHours || 4;
  const studyTimeHours = Math.floor(studyTimeMinutesToday / 60);
  const studyTimeMinutes = studyTimeMinutesToday % 60;
  const studyProgressPct = Math.min(
    100,
    Math.round((studyTimeMinutesToday / (targetStudyHours * 60)) * 100)
  );

  // Weak Subject & Topic Extraction
  const weakSubjectInfo = useMemo(() => {
    const weakChap = academicChapters.find(
      (c) => (c.status as string) === "needs_revision" || (c.masteryLevel && c.masteryLevel < 50) || c.isWeak
    );
    if (weakChap) {
      return {
        title: weakChap.title,
        detail: `Needs revision (${weakChap.masteryLevel || 42}% mastery)`,
      };
    }
    const defaultSub = academicSubjects[0]?.name || activeStudent?.stream || "Core Subject";
    return {
      title: defaultSub,
      detail: "Steady mastery • Keep practicing PYQs",
    };
  }, [academicChapters, academicSubjects, activeStudent?.stream]);

  // Suggested Study Duration based on pending tasks and countdown
  const daysRemaining = useMemo(() => {
    if (!examProfile?.targetDate) return 179;
    const target = new Date(examProfile.targetDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [examProfile]);

  const suggestedDurationText = useMemo(() => {
    if (pendingTasks.length > 4) return "3h 30m recommended";
    if (pendingTasks.length > 0) return "2h 15m recommended";
    return "1h 45m (Light Recall)";
  }, [pendingTasks.length]);

  const calculatedReadiness = useMemo(() => {
    const completedChapters = academicChapters.filter((c) => c.status === "Completed").length;
    const total = academicChapters.length || 1;
    const base = Math.round((completedChapters / total) * 100);
    return Math.max(35, Math.min(95, base || 74));
  }, [academicChapters]);

  const streakCount = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, h.streak || 1), 5);
  }, [habits]);

  // Contextual AI Tip
  const aiRecommendationTip = useMemo(() => {
    if (weakSubjectInfo.title) {
      return `Dedicate your next 45-minute focus session to "${weakSubjectInfo.title}" to boost your readiness score by +4% today!`;
    }
    return `Review high-yield PYQs and summary definitions today to reinforce long-term memory retention!`;
  }, [weakSubjectInfo.title]);

  // Suggested Prompts List (dynamically tailored to student context)
  const suggestedPromptsList = useMemo(() => {
    const stream = activeStudent?.stream || "General";
    const careerTarget = activeStudent?.stream === "Commerce" ? "CA Foundation & B.Com" : "JEE / NEET / Board";
    return [
      "What should I study today?",
      "Create a revision timetable for my upcoming exams.",
      "Analyze my weak subjects and tell me where to start.",
      "Help me prepare for boards with scoring tips.",
      `Build a ${careerTarget} roadmap.`,
      "Give me 5 high-yield MCQs for quick practice.",
      `Explain the hardest concept in ${weakSubjectInfo.title}.`,
    ];
  }, [activeStudent?.stream, weakSubjectInfo.title]);

  // Quick Action Handler
  const handleQuickActionClick = (actionType: AbyaQuickActionType) => {
    let promptToSend = "";
    switch (actionType) {
      case "study_plan":
        promptToSend = `Please create a customized, high-yield Today's Study Plan for me (${activeStudent?.name || "Student"}, ${activeStudent?.classLevel || "Class 12"} ${activeStudent?.stream || "Commerce"} • ${activeStudent?.board || "CBSE"} Board). Balance my pending tasks and weak chapters into time blocks with active breaks.`;
        break;
      case "revision_plan":
        promptToSend = `Please generate an active recall Spaced Revision Plan for my subjects (${activeStudent?.classLevel || "Class 12"} ${activeStudent?.stream || "Commerce"}). Prioritize weak topics, formulas to write down, and 3-step recall intervals.`;
        break;
      case "exam_strategy":
        promptToSend = `Please generate an Exam Scoring Strategy for my ${examProfile?.examName || "Board Exam"} (${activeStudent?.board || "CBSE"} ${activeStudent?.classLevel || "Class 12"}). Include high-weightage topics, time management in the exam hall, and step-by-step marking rubrics.`;
        break;
      case "progress_analysis":
        promptToSend = `Please perform a detailed Progress & Mastery Analysis for my syllabus. Review completed chapters, identify gaps in my weak areas, and suggest concrete next steps to reach 95%+ score.`;
        break;
      case "weekly_schedule":
        promptToSend = `Please create a balanced 7-Day Weekly Timetable covering all my subjects (${activeStudent?.classLevel || "Class 12"} ${activeStudent?.stream || "Commerce"}). Allocate dedicated slots for theory, solved numericals/cases, mock test day, and Sunday backlog clearance.`;
        break;
      case "ask_doubt":
        // Switch to chat and focus input
        setViewMode("chat");
        setInputPrompt("Explain step-by-step: ");
        setTimeout(() => inputRef.current?.focus(), 150);
        return;
      default:
        promptToSend = `Help me with ${actionType} for my studies.`;
    }

    handleSend(promptToSend, actionType);
  };

  const handleSendSuggestedPrompt = (promptText: string) => {
    handleSend(promptText);
  };

  const handleStartNewChat = () => {
    onClearChat();
    setViewMode("chat");
  };

  const handleReopenSession = (session: AbyaChatSession) => {
    // If messages are available, view them
    setViewMode("chat");
  };

  const handleDeleteRecentSession = (sessionId: string) => {
    deleteAbyaChatSession(sessionId, activeStudent?.id || "");
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const formatSessionTimestamp = (ts: number) => {
    const now = Date.now();
    const diffHours = Math.floor((now - ts) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `Today, ${new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffHours < 48) return "Yesterday";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Helper for curriculum action
  const handleCurriculumTopicAction = (action: "explanation" | "notes" | "mcq" | "pyq" | "revision") => {
    if (!currentTopic || !currentSubject) return;

    let prompt = "";
    switch (action) {
      case "explanation":
        prompt = `Please explain the concept "${currentTopic.name}" from ${currentSubject.name} (Chapter: ${currentChapter?.title || "Current Chapter"}) in simple intuitive language with real-world examples and exam key points.`;
        break;
      case "notes":
        prompt = `Generate high-yield revision notes and formula bullet points for "${currentTopic.name}" in ${currentSubject.name} (${activeStudent?.classLevel || "Class 12"} ${activeStudent?.board || "CBSE"}).`;
        break;
      case "mcq":
        prompt = `Provide 5 exam-level Multiple Choice Questions (MCQs) on "${currentTopic.name}" from ${currentSubject.name} with detailed answer explanations.`;
        break;
      case "pyq":
        prompt = `Give 3 previous year board examination questions and step-by-step model answers for "${currentTopic.name}" in ${currentSubject.name}.`;
        break;
      case "revision":
        prompt = `Give me a rapid 5-minute recall summary and key memory triggers for "${currentTopic.name}" (${currentSubject.name}).`;
        break;
    }

    handleSend(prompt, undefined, undefined, {
      classLevel: activeStudent?.classLevel,
      stream: activeStudent?.stream,
      subject: currentSubject.name,
      chapter: currentChapter?.title,
      topic: currentTopic.name,
      modeType: action,
    });
  };

  return (
    <div
      className={`flex flex-col w-full max-w-4xl mx-auto animate-in fade-in duration-300 relative ${
        isKeyboardOpen ? "pb-1" : "pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] md:pb-2"
      }`}
      style={{
        height: viewportHeight
          ? `${Math.max(300, viewportHeight - (isKeyboardOpen ? 8 : 84))}px`
          : "calc(var(--visual-viewport-height, 100dvh) - 84px)",
        maxHeight: viewportHeight ? `${viewportHeight}px` : "calc(100dvh - 74px)",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP ABYA HEADER                                                        */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 border border-emerald-500/30 flex items-center justify-between gap-3 mb-2 shrink-0 relative z-40 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20">
        {/* Left: Avatar & View Toggle */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-slate-900" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-xs sm:text-sm text-white font-heading truncate">
                Abya AI
              </h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold truncate">
                Study Mentor
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 flex items-center gap-1">
              <span className="text-emerald-300 font-medium truncate">{activeStudent?.name || "Student"}</span>
              <span className="text-slate-600">•</span>
              <span className="truncate">{activeStudent?.classLevel || "Class 12"}</span>
              {activeStudent?.stream && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="truncate hidden xs:inline">{activeStudent.stream}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Center / Navigation Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setViewMode("home")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              viewMode === "home"
                ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("chat")}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              viewMode === "chat"
                ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20"
                : "bg-white/5 hover:bg-white/10 text-slate-300"
            }`}
          >
            <MessageCircle className="w-3 h-3" />
            <span>Chat ({messages.length})</span>
          </button>
        </div>

        {/* Right Actions: Voice, Language, More */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Voice Button */}
          <button
            onClick={() => setShowLiveVoiceModal(true)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-r from-emerald-500/15 to-cyan-500/15 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            title="Live Voice Mentor"
            aria-label="Live Voice Mentor"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => setShowLanguageModal(true)}
            id="abya-language-switcher-btn"
            className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 active:scale-95 border border-purple-500/30 text-purple-200 transition-all text-xs flex items-center gap-1 font-semibold shrink-0 shadow-sm"
            title="Switch Language"
          >
            <Globe className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="hidden xs:inline text-xs">{abyaLanguage}</span>
            <ChevronDown className="w-2.5 h-2.5 text-purple-300 opacity-70 shrink-0" />
          </button>

          {/* More Options */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              id="abya-more-options-btn"
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all border border-white/10 text-xs"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-card border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1 bg-slate-900/95 backdrop-blur-xl">
                  {/* New Chat */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleStartNewChat();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors text-left"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Start New Chat</span>
                  </button>

                  {/* Curriculum & AI Context */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsContextDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-purple-300 transition-colors text-left"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <div>
                      <div className="text-white">Curriculum Context</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {currentSubject?.name || "Subject"} • {currentTopic?.name || "Topic"}
                      </div>
                    </div>
                  </button>

                  {/* Academic Intelligence Dashboard */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsIntelligenceDrawerOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-indigo-300 transition-colors text-left"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <div className="text-white">Academic Intelligence</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        Student insights & recommendations
                      </div>
                    </div>
                  </button>

                  {/* Diagnostics */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowDiagnosticsModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-emerald-300 transition-colors text-left"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Diagnostics & Health</span>
                  </button>

                  {/* Gemini API Key */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setShowApiKeyModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors text-left"
                  >
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gemini API Key</span>
                  </button>

                  <div className="border-t border-white/10 my-1" />

                  {/* Clear Chat */}
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      onClearChat();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition-colors text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Chat History</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Context Note Attachment Banner */}
      {attachedContextNote && (
        <div className="glass-pill p-1.5 px-2.5 rounded-xl border border-cyan-500/30 mb-2 flex items-center justify-between text-xs text-cyan-300 shrink-0 bg-cyan-950/40">
          <div className="flex items-center gap-1.5 truncate">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-[11px]">Context: "{attachedContextNote}"</span>
          </div>
          <button
            onClick={onClearAttachedContext}
            className="text-slate-400 hover:text-white ml-2 text-[11px] font-bold"
          >
            Remove
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN VIEW CONTAINER                                                    */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin flex flex-col">
        {viewMode === "home" ? (
          /* ===================================================================== */
          /* HOME SCREEN (Intelligent Assistant Dashboard)                         */
          /* ===================================================================== */
          <div className="space-y-4 animate-in fade-in duration-300 max-w-3xl mx-auto w-full pb-4">
            {/* ------------------------------------------------------------------- */}
            {/* SECTION 1: Greeting Card                                            */}
            {/* ------------------------------------------------------------------- */}
            <div className="glass-card p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/95 via-slate-950/90 to-emerald-950/30 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 p-0.5 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                      <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-black text-white font-heading tracking-tight">
                      {getGreeting()}, <span className="inline-block" dir="ltr">{getStudentDisplayName(activeStudent, settings, "Student")}</span> 👋
                    </h1>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                      {activeStudent?.classLevel || "Class 12"}
                    </span>
                    {activeStudent?.stream && (
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold">
                        {activeStudent.stream}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold">
                      {activeStudent?.board || "CBSE"} Board
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      {streakCount} Day Streak
                    </span>
                  </div>
                </div>

                {/* Countdown & Readiness Badge */}
                <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-xl p-2.5 px-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {examProfile?.examName || "Target Exam"}
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-emerald-400 flex items-center justify-end gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{daysRemaining} Days Left</span>
                    </div>
                  </div>
                  <div className="h-7 w-px bg-white/10 mx-1" />
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Readiness</div>
                    <div className="text-xs sm:text-sm font-extrabold text-cyan-300">
                      {calculatedReadiness}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 2: Today's AI Briefing                                      */}
            {/* ------------------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  Today's AI Briefing
                </div>
                <span className="text-[11px] text-slate-400">Contextual Overview</span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* 1. Pending Tasks */}
                <div className="glass-card p-3 rounded-2xl border border-white/10 hover:border-emerald-500/30 transition-all bg-slate-900/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold text-slate-300">Pending Tasks</span>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-white font-heading">
                    {pendingTasks.length === 0 ? "All Done! 🎉" : `${pendingTasks.length} Left`}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {highPriorityTasksCount > 0
                      ? `${highPriorityTasksCount} high priority • Today`
                      : "Daily tasks queue"}
                  </p>
                </div>

                {/* 2. Study Time Completed */}
                <div className="glass-card p-3 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all bg-slate-900/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold text-slate-300">Study Completed</span>
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-cyan-300 font-heading">
                    {studyTimeHours}h {studyTimeMinutes}m
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Target: {targetStudyHours}h • {studyProgressPct}% done
                  </p>
                </div>

                {/* 3. Weak Subject */}
                <div className="glass-card p-3 rounded-2xl border border-white/10 hover:border-amber-500/30 transition-all bg-slate-900/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold text-slate-300">Weak Subject</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-300 font-heading truncate">
                    {weakSubjectInfo.title}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {weakSubjectInfo.detail}
                  </p>
                </div>

                {/* 4. Suggested Duration */}
                <div className="glass-card p-3 rounded-2xl border border-white/10 hover:border-purple-500/30 transition-all bg-slate-900/60">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-semibold text-slate-300">Suggested Duration</span>
                    <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-purple-300 font-heading truncate">
                    {suggestedDurationText}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    Optimized for {daysRemaining}d countdown
                  </p>
                </div>
              </div>

              {/* Smart AI Recommendation Tip */}
              <div className="glass-card p-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Abya AI Mentor Tip
                    </span>
                    <p className="text-xs text-slate-200 font-medium line-clamp-2">
                      {aiRecommendationTip}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickActionClick("study_plan")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 active:scale-95 transition-all shadow-sm shadow-emerald-500/20 flex items-center gap-1"
                >
                  <span>Apply Plan</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 3: Quick Actions Grid (6 Action Cards)                      */}
            {/* ------------------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Quick Actions
                </div>
                <span className="text-[11px] text-slate-400">Instant AI generation</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* 1. Study Plan */}
                <button
                  onClick={() => handleQuickActionClick("study_plan")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 flex items-center justify-between">
                      <span>📚 Study Plan</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      Today's customized timetable & priorities
                    </div>
                  </div>
                </button>

                {/* 2. Revision Plan */}
                <button
                  onClick={() => handleQuickActionClick("revision_plan")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300 flex items-center justify-between">
                      <span>📝 Revision Plan</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      Spaced recall for weak & due topics
                    </div>
                  </div>
                </button>

                {/* 3. Exam Strategy */}
                <button
                  onClick={() => handleQuickActionClick("exam_strategy")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 flex items-center justify-between">
                      <span>🎯 Exam Strategy</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      High weightage, scoring rubrics & tricks
                    </div>
                  </div>
                </button>

                {/* 4. Progress Analysis */}
                <button
                  onClick={() => handleQuickActionClick("progress_analysis")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-300 flex items-center justify-between">
                      <span>📊 Progress Analysis</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      Mastery breakdown & test accuracy
                    </div>
                  </div>
                </button>

                {/* 5. Weekly Schedule */}
                <button
                  onClick={() => handleQuickActionClick("weekly_schedule")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 flex items-center justify-between">
                      <span>📅 Weekly Schedule</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      7-day timetable balancing all subjects
                    </div>
                  </div>
                </button>

                {/* 6. Ask a Doubt */}
                <button
                  onClick={() => handleQuickActionClick("ask_doubt")}
                  className="p-3.5 rounded-2xl glass-card border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all group text-left active:scale-[0.98] flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-300 flex items-center justify-between">
                      <span>❓ Ask a Doubt</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      Step-by-step solutions & camera upload
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 4: Suggested Prompts                                        */}
            {/* ------------------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Suggested Prompts
                </div>
                <span className="text-[11px] text-slate-400">One-tap ask</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {suggestedPromptsList.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendSuggestedPrompt(promptText)}
                    className="px-3 py-2 rounded-xl glass-card border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-xs font-medium text-slate-200 hover:text-white transition-all text-left flex items-center gap-2 group active:scale-95 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 5: Recent Conversations                                     */}
            {/* ------------------------------------------------------------------- */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Recent Conversations
                </div>
                {chatSessions.length > 0 && (
                  <button
                    onClick={handleStartNewChat}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Chat</span>
                  </button>
                )}
              </div>

              {chatSessions.length === 0 && messages.length === 0 ? (
                <div className="p-4 rounded-2xl glass-card border border-dashed border-white/15 text-center text-slate-400 text-xs py-5">
                  <p className="font-medium text-slate-300">No previous conversations yet</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tap any quick action or ask a question below to start your first session with Abya AI!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chatSessions.slice(0, 4).map((session) => (
                    <div
                      key={session.id}
                      className="p-3 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/30 hover:bg-white/5 transition-all flex items-center justify-between gap-3 group"
                    >
                      <button
                        onClick={() => handleReopenSession(session)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-xs text-white group-hover:text-emerald-300 truncate">
                            {session.title || "Academic Study Session"}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-mono shrink-0">
                            {session.messagesCount || session.messages?.length || 1} msg
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {session.previewMessage || "Click to reopen this conversation..."}
                        </p>
                        <span className="text-[9px] text-slate-500 mt-1 block">
                          {formatSessionTimestamp(session.updatedAt || session.createdAt)}
                        </span>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleReopenSession(session)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-all active:scale-95"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDeleteRecentSession(session.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* ACTIVE CONVERSATION THREAD (ChatGPT / Gemini Style AI Messages)       */
          /* ===================================================================== */
          <div className="space-y-4 max-w-3xl mx-auto w-full flex-1 flex flex-col justify-start">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Sparkles className="w-8 h-8 text-emerald-400 mb-2" />
                <h3 className="text-sm font-bold text-white">Ask anything to Abya AI</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Type your study doubt or choose a quick action to get step-by-step guidance.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 sm:gap-3 text-left animate-in fade-in duration-200 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md"
                          : m.isFallback
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Content Container */}
                    <div
                      className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Attached Image in Message */}
                      {m.imageUrl && (
                        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 max-w-xs shadow-md">
                          <img
                            src={m.imageUrl}
                            alt="Study Question"
                            className="w-full h-auto max-h-56 object-contain bg-slate-950"
                          />
                        </div>
                      )}

                      {/* Text Bubble */}
                      <div
                        className={`rounded-2xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none shadow-md shadow-emerald-500/10"
                            : "glass-card border border-white/10 text-slate-100 rounded-tl-none bg-slate-900/80 backdrop-blur-md shadow-lg"
                        }`}
                      >
                        {m.content}
                      </div>

                      {/* Assistant Metadata Badges */}
                      {!isUser && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] text-slate-400">
                          {m.isFallback ? (
                            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Cpu className="w-2.5 h-2.5" />
                              Local Study Mentor
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              {m.modelUsed || "Gemini Online AI"}
                            </span>
                          )}

                          {m.thinkingDurationMs && (
                            <span className="text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {Math.round(m.thinkingDurationMs / 100) / 10}s
                            </span>
                          )}

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(m.id, m.content)}
                            className="hover:text-white flex items-center gap-0.5 transition-colors ml-1"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 sm:gap-3 text-left animate-in fade-in duration-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-card rounded-2xl rounded-tl-none p-3.5 border border-white/10 flex items-center gap-2 text-xs text-emerald-300">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-slate-400 ml-1">
                    Abya AI is crafting your explanation...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. STICKY COMPOSER BAR (Always Accessible & Responsive)                    */}
      {/* ========================================================================= */}
      <div className="mt-2 shrink-0 relative z-30">
        {/* Active Image Attachment Pill */}
        {selectedImage && (
          <div className="mb-2 p-2 rounded-2xl glass-card border border-emerald-500/30 flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={selectedImage.previewUrl}
                alt="Selected"
                className="w-10 h-10 object-cover rounded-xl border border-white/10"
              />
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-white truncate">
                  {selectedImage.fileName}
                </div>
                <div className="text-[10px] text-emerald-400">Photo Attached • Ready to analyze</div>
              </div>
            </div>
            <button
              onClick={handleClearSelectedImage}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="glass-card rounded-2xl p-1.5 sm:p-2 border border-white/15 bg-slate-950/90 backdrop-blur-xl shadow-2xl flex items-center gap-1.5">
          {/* Camera / Upload Action */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleImageFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors active:scale-95 shrink-0"
            title="Take Photo of Question"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors active:scale-95 shrink-0 hidden xs:block"
            title="Upload Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Ask Abya AI in ${abyaLanguage}...`}
            className="flex-1 min-w-0 bg-transparent border-0 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-0 px-2 py-1.5"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSend()}
            disabled={(!inputPrompt.trim() && !selectedImage) || isLoading}
            className={`p-2 sm:px-3.5 sm:py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 ${
              (inputPrompt.trim() || selectedImage) && !isLoading
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/25"
                : "bg-white/5 text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & DRAWERS                                                       */}
      {/* ========================================================================= */}

      {/* Language Switcher Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-sm w-full rounded-2xl p-4 border border-purple-500/30 bg-slate-900/95 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Select Abya Language</h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Abya AI will respond naturally in your chosen study tone.
            </p>

            <div className="space-y-2">
              {(
                [
                  { id: "WhatsApp Language", label: "WhatsApp Language (Hinglish)", desc: "Natural chat language, friendly study tone" },
                  { id: "Hinglish", label: "Hinglish", desc: "Hindi in Roman script with English terms" },
                  { id: "English", label: "English", desc: "Clear, standard academic English" },
                  { id: "Hindi", label: "Hindi (हिंदी)", desc: "Devanagari script with exam vocabulary" },
                ] as const
              ).map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    if (onUpdateAbyaLanguage) onUpdateAbyaLanguage(lang.id);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                    abyaLanguage === lang.id
                      ? "bg-purple-500/20 border-purple-500/50 text-white"
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold">{lang.label}</div>
                  <div className="text-[10px] text-slate-400">{lang.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gemini API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-sm w-full rounded-2xl p-4 border border-cyan-500/30 bg-slate-900/95 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Custom Gemini API Key</h3>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Add your own Google Gemini API key to override default server quota.
            </p>

            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full rounded-2xl p-4 border border-emerald-500/30 bg-slate-900/95 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Abya AI Diagnostics</h3>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <span className="text-slate-400">Network Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5" /> Online
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <span className="text-slate-400">Active Model:</span>
                <span className="font-bold text-white">Gemini 2.5 Flash / Pro</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <span className="text-slate-400">Local Intelligence Fallback:</span>
                <span className="font-bold text-cyan-400">Available (Zero Downtime)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Voice Modal */}
      {showLiveVoiceModal && (
        <AbyaLiveVoiceModal
          isOpen={showLiveVoiceModal}
          onClose={() => setShowLiveVoiceModal(false)}
          apiKey={settings.customApiKey}
          studentName={activeStudent?.name || "Student"}
          classLevel={activeStudent?.classLevel || "Class 12"}
          stream={activeStudent?.stream || "Commerce"}
          board={activeStudent?.board || "CBSE"}
        />
      )}

      {/* Academic Intelligence Decision Engine Drawer / Modal */}
      {isIntelligenceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-5xl my-auto rounded-3xl bg-slate-950/95 border border-indigo-500/30 p-4 sm:p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-slate-950/95 py-2 z-10 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-heading">
                    Academic Decision Engine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time study prioritization, revision tracking, exam readiness, and career alignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsIntelligenceDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AcademicDecisionEngineSection
              subjects={academicSubjects?.map(s => ({
                id: s.id,
                name: s.name,
                color: s.color,
                totalChapters: s.totalChapters || 10,
                completedChapters: s.completedChapters || 0,
                targetHoursPerWeek: s.targetHoursPerWeek || 5,
                targetMinutesPerWeek: (s.targetHoursPerWeek || 5) * 60,
                completedMinutes: 0,
                totalSessions: 0,
                gradeLevel: s.classLevel
              })) || []}
              activeStudent={activeStudent || undefined}
              examProfile={examProfile}
              academicSubjects={academicSubjects}
              academicChapters={academicChapters}
              revisions={academicRevisions}
              practiceSessions={academicPractice}
              onNavigate={(tab) => {
                setIsIntelligenceDrawerOpen(false);
                if (onNavigate) onNavigate(tab);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
