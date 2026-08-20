import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import {
  AbyaMessage,
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
import {
  getCurriculumSubjects,
  CurriculumSubject,
  CurriculumChapter,
  CurriculumTopic,
} from "../data/masterCurriculum";

interface AbyaAIPageProps {
  messages: AbyaMessage[];
  settings: UserSettings;
  activeStudent: StudentProfile;
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
  // Optional intelligence props
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

  // Drawers
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isIntelligenceDrawerOpen, setIsIntelligenceDrawerOpen] = useState(false);

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

  // Dynamic Visual Viewport support for Mobile Virtual Keyboards
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        setViewportHeight(currentHeight);
        const isVirtualKeyboard = window.innerHeight - currentHeight > 120;
        setIsKeyboardOpen(isVirtualKeyboard);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      window.visualViewport.addEventListener("scroll", handleViewportChange);
      handleViewportChange();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange);
        window.visualViewport.removeEventListener("scroll", handleViewportChange);
      }
    };
  }, []);

  // Curriculum Hierarchy State (Class -> Stream -> Subject -> Chapter -> Topic)
  const curriculumSubjects = getCurriculumSubjects(
    activeStudent.classLevel,
    activeStudent.stream
  );
  const [selectedSubId, setSelectedSubId] = useState<string>(
    curriculumSubjects[0]?.id || ""
  );
  const currentSubject =
    curriculumSubjects.find((s) => s.id === selectedSubId) ||
    curriculumSubjects[0];
  const [selectedChapId, setSelectedChapId] = useState<string>(
    currentSubject?.chapters[0]?.id || ""
  );
  const currentChapter =
    currentSubject?.chapters.find((c) => c.id === selectedChapId) ||
    currentSubject?.chapters[0];
  const [selectedTopId, setSelectedTopId] = useState<string>(
    currentChapter?.topics[0]?.id || ""
  );
  const currentTopic =
    currentChapter?.topics.find((t) => t.id === selectedTopId) ||
    currentChapter?.topics[0];

  // Update chapter/topic selections when subject changes
  const handleSelectSubject = (subId: string) => {
    setSelectedSubId(subId);
    const sub = curriculumSubjects.find((s) => s.id === subId);
    if (sub && sub.chapters.length > 0) {
      setSelectedChapId(sub.chapters[0].id);
      if (sub.chapters[0].topics.length > 0) {
        setSelectedTopId(sub.chapters[0].topics[0].id);
      }
    }
  };

  const handleSelectChapter = (chapId: string) => {
    setSelectedChapId(chapId);
    const chap = currentSubject?.chapters.find((c) => c.id === chapId);
    if (chap && chap.topics.length > 0) {
      setSelectedTopId(chap.topics[0].id);
    }
  };

  const handleCurriculumTopicAction = (
    modeType: "explanation" | "notes" | "revision" | "mcq" | "pyq" | "vvi" | "doubt"
  ) => {
    if (!currentSubject || !currentChapter || !currentTopic) return;

    const curriculumContext = {
      classLevel: activeStudent.classLevel,
      stream: activeStudent.stream,
      subject: currentSubject.name,
      chapter: currentChapter.title,
      topic: currentTopic.name,
      modeType,
    };

    let promptText = "";
    if (modeType === "explanation") {
      promptText = `Please provide a thorough, step-by-step concept explanation for "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}", ${activeStudent.classLevel} ${activeStudent.stream}). Structure your response with: 1. Core Concept in Intuitive Terms, 2. Real-World Analogy, 3. Key Formulas / Rules / Definitions, 4. Step-by-Step Solved Problem, 5. Quick Self-Check Question.`;
    } else if (modeType === "notes") {
      promptText = `Generate high-yield quick revision notes and key definition points for "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}", ${activeStudent.classLevel} ${activeStudent.stream}). Include high-frequency board pointers and formula summaries.`;
    } else if (modeType === "revision") {
      promptText = `Provide a 5-minute rapid recall revision summary for "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}"). Focus on must-remember board exam keywords, triggers, and examiner pitfalls.`;
    } else if (modeType === "mcq") {
      promptText = `Generate 5 exam-standard Multiple Choice Questions (MCQs) for "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}", ${activeStudent.classLevel}). Provide 4 distinct options (A, B, C, D), mark the correct option clearly, provide step-by-step solutions, and alert against common student traps.`;
    } else if (modeType === "pyq") {
      promptText = `Provide verified previous year board exam questions (PYQs) and expected question patterns for "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}"). Include official step-wise marking tips and answer writing rubrics.`;
    } else if (modeType === "vvi") {
      promptText = `Highlight the Most Important (VVI) exam questions and common mistake areas students make in "${currentTopic.name}" (Chapter: "${currentChapter.title}", Subject: "${currentSubject.name}"). How can I score 100% on questions from this topic?`;
    } else if (modeType === "doubt") {
      setInputPrompt(`[${currentSubject.name} - ${currentTopic.name}] Doubt: `);
      inputRef.current?.focus();
      return;
    }

    setIsContextDrawerOpen(false);
    handleSend(promptText, "explain_topic", undefined, curriculumContext);
  };

  // Quick Action Chips (ChatGPT Tools Bar Style)
  const quickActionTools: {
    type: AbyaQuickActionType;
    label: string;
    icon: React.ElementType;
    prompt: string;
    accentClass: string;
    modeToSet?: AbyaAIMode;
    isModalTrigger?: "voice" | "camera" | "intel";
  }[] = [
    {
      type: "fast_mode",
      label: "🎙️ Live Voice",
      icon: Mic,
      prompt: "",
      accentClass: "hover:bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
      isModalTrigger: "voice",
    },
    {
      type: "search_grounding",
      label: "🌐 Search Grounded",
      icon: Search,
      prompt: "Use Google Search Grounding (gemini-3.5-flash) to find the latest verified syllabus updates, exam dates, and official announcements for:",
      accentClass: "hover:bg-blue-500/15 border-blue-500/40 text-blue-300",
      modeToSet: "search_grounded",
    },
    {
      type: "plan_day",
      label: "🎯 Study Coach",
      icon: Calendar,
      prompt: "Act as my Study Coach: analyze my daily schedule, syllabus priorities, and create an optimized step-by-step study plan for today.",
      accentClass: "hover:bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
      modeToSet: "mentor",
    },
    {
      type: "fast_mode",
      label: "⚡ Fast Lite",
      icon: Zap,
      prompt: "Give me an ultra-fast flashcard summary and rapid-recall key points using gemini-3.1-flash-lite for:",
      accentClass: "hover:bg-amber-500/15 border-amber-500/40 text-amber-300",
      modeToSet: "fast_lite",
    },
    {
      type: "high_thinking",
      label: "🧠 High Thinking",
      icon: Brain,
      prompt: "Use deep step-by-step reasoning (gemini-3.1-pro-preview with ThinkingLevel.HIGH) to analyze and solve this complex derivation / multi-step proof:",
      accentClass: "hover:bg-purple-500/15 border-purple-500/40 text-purple-300",
      modeToSet: "high_thinking",
    },
    {
      type: "explain_topic",
      label: "📸 Doubt Solver",
      icon: ImageIcon,
      prompt: "I have a concept doubt. Please explain it clearly with step-by-step breakdown, simple analogies, and a quick check question for:",
      accentClass: "hover:bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
      isModalTrigger: "camera",
    },
    {
      type: "exam_coach",
      label: "📊 Intelligence Panel",
      icon: BarChart3,
      prompt: "",
      accentClass: "hover:bg-indigo-500/15 border-indigo-500/40 text-indigo-300",
      isModalTrigger: "intel",
    },
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPEG, PNG, WebP).");
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
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

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

  // Academic accuracy calculation
  const calculatedAccuracy = (() => {
    if (academicPractice.length === 0) return 88;
    const totalQ = academicPractice.reduce((sum, p) => sum + (p.totalQuestions || 0), 0);
    const correctQ = academicPractice.reduce((sum, p) => sum + (p.correctAnswers || 0), 0);
    return totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 88;
  })();

  // Weak topics extracted from chapters
  const weakTopics = academicChapters
    .filter((c) => c.status === "needs_revision" || (c.masteryLevel && c.masteryLevel < 50))
    .slice(0, 4);

  // Revisions due
  const dueRevisions = academicRevisions
    .filter((r) => r.status === "due" || r.status === "overdue")
    .slice(0, 4);

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
      {/* 1. ABYA HEADER CARD (Clean, Minimal, Modern AI Header)                    */}
      {/* ========================================================================= */}
      <div className="glass-card rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 border border-emerald-500/30 flex items-center justify-between gap-3 mb-2 shrink-0 relative z-40 bg-slate-950/80 backdrop-blur-xl shadow-lg shadow-black/20">
        {/* Left: Avatar & Identity */}
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
                V4 Companion
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5 flex items-center gap-1">
              <span className="text-emerald-300 font-medium truncate">{activeStudent.name}</span>
              <span className="text-slate-600">•</span>
              <span className="truncate">{activeStudent.classLevel}</span>
              {activeStudent.stream && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="truncate hidden xs:inline">{activeStudent.stream}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Clean High-Value Actions (Language Switcher & More Options) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Language Switcher */}
          <button
            onClick={() => setShowLanguageModal(true)}
            id="abya-language-switcher-btn"
            className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 active:scale-95 border border-purple-500/30 text-purple-200 transition-all text-xs flex items-center gap-1.5 font-semibold shrink-0 shadow-sm"
            title="Switch Language (Hinglish, English, Hindi, etc.)"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-xs font-semibold">{abyaLanguage}</span>
            <ChevronDown className="w-3 h-3 text-purple-300 opacity-70 shrink-0" />
          </button>

          {/* More Options Dropdown (Curriculum, Intelligence, Diagnostics, Settings) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              id="abya-more-options-btn"
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 hover:text-white transition-all border border-white/10 text-xs flex items-center gap-1.5 font-semibold shrink-0"
              title="More Options & Settings"
              aria-label="More Options"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">More</span>
            </button>

            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMoreMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-card border border-white/15 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 space-y-1 bg-slate-900/95 backdrop-blur-xl">
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
                      <div className="text-white">Curriculum & AI Context</div>
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
      {/* 2. HERO CONVERSATIONAL CHAT AREA (300% Expanded Viewport)                  */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin flex flex-col">
        {messages.length === 0 ? (
          /* ===================================================================== */
          /* PREMIUM EMPTY STATE (ChatGPT / Gemini Style AI Hero)                  */
          /* ===================================================================== */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-3 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-300 max-w-2xl mx-auto w-full">
            {/* Glowing Abya Icon */}
            <div className="relative mb-3 sm:mb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-indigo-500 p-0.5 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950/90 rounded-[22px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] font-mono shadow-md">
                READY
              </span>
            </div>

            {/* Greeting */}
            <h1 className="text-lg sm:text-2xl font-black text-white font-heading tracking-tight mb-1">
              👋 {getGreeting()}, {activeStudent.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
              I am Abya AI, your academic companion. What concept or problem would you like to master today?
            </p>

            {/* Active Topic Resume Banner */}
            {currentTopic && (
              <div className="w-full glass-card p-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent mb-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider block mb-0.5">
                    Continue Where You Left Off
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {currentTopic.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentSubject?.name} • Ch {currentChapter?.chapterNumber}: {currentChapter?.title}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    onClick={() => handleCurriculumTopicAction("explanation")}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all active:scale-95 shadow-sm shadow-emerald-500/20"
                  >
                    Explain Concept
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("notes")}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/15 transition-all active:scale-95"
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("mcq")}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/15 transition-all active:scale-95"
                  >
                    5 MCQs
                  </button>
                </div>
              </div>
            )}

            {/* Quick Action Prompt Cards Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 text-left">
              <button
                onClick={() => handleCurriculumTopicAction("explanation")}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300">Explain Topic</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Intuitive breakdown & analogies</div>
              </button>

              <button
                onClick={() => handleCurriculumTopicAction("notes")}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">Generate Notes</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">High-yield revision points</div>
              </button>

              <button
                onClick={() => handleCurriculumTopicAction("mcq")}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">Practice MCQs</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Exam-standard questions</div>
              </button>

              <button
                onClick={() => handleCurriculumTopicAction("pyq")}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <RotateCw className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-blue-300">Solve PYQs</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Previous year board papers</div>
              </button>

              <button
                onClick={() => handleCurriculumTopicAction("revision")}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-amber-300">5 Min Revision</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Rapid recall summary</div>
              </button>

              <button
                onClick={() => {
                  handleSend(
                    "Act as my Career & Academic Advisor. Help me evaluate my subject combinations, competitive exam roadmaps, and college entrance pathways.",
                    "career_guidance"
                  );
                }}
                disabled={isLoading}
                className="p-3 rounded-2xl glass-card border border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5 transition-all group active:scale-[0.98]"
              >
                <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-rose-300">Career Guidance</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">Pathways & admissions</div>
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* ACTIVE CHAT STREAM (Spacious, Elegant, ChatGPT / Claude Styling)       */
          /* ===================================================================== */
          <>
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 sm:gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isUser
                        ? "bg-slate-700 text-slate-200"
                        : msg.isError
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 font-bold shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" />
                    ) : msg.isError ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <Bot className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[80%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border space-y-2 relative group ${
                      isUser
                        ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-100 rounded-tr-none"
                        : msg.isError
                        ? "bg-rose-950/40 border-rose-500/30 text-rose-200 rounded-tl-none"
                        : "glass-card border-white/10 text-slate-100 rounded-tl-none bg-slate-900/70"
                    }`}
                  >
                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {!isUser && !msg.isFallback && !msg.isError && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Online AI ({msg.modelUsed || "gemini-3.7-flash"})</span>
                        </span>
                      )}
                      {msg.mode === "high_thinking" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                          <Brain className="w-3 h-3" />
                          <span>High Thinking</span>
                        </span>
                      )}
                      {msg.mode === "fast_lite" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          <Zap className="w-3 h-3" />
                          <span>Fast Lite</span>
                        </span>
                      )}
                      {msg.mode === "search_grounded" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                          <Search className="w-3 h-3" />
                          <span>Search Grounded</span>
                        </span>
                      )}
                      {msg.imageUrl && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                          <ImageIcon className="w-3 h-3" />
                          <span>Photo Analyzed</span>
                        </span>
                      )}
                      {msg.isFallback && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Local Mentor</span>
                        </span>
                      )}
                    </div>

                    {/* Image Preview in Message */}
                    {msg.imageUrl && (
                      <div className="my-2 rounded-xl overflow-hidden border border-slate-700/80 max-w-sm">
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded study problem"
                          referrerPolicy="no-referrer"
                          className="max-h-60 w-auto object-contain bg-slate-950/80"
                        />
                      </div>
                    )}

                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {/* Grounding Sources */}
                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-blue-500/20">
                        <div className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5 mb-1.5">
                          <Search className="w-3.5 h-3.5 text-blue-400" />
                          <span>Web Grounding Sources ({msg.groundingSources.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.groundingSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/50 hover:bg-blue-900/60 border border-blue-500/30 text-blue-200 text-[11px] transition-colors max-w-xs truncate"
                              title={source.uri}
                            >
                              <ExternalLink className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="truncate">{source.title || source.uri}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error State with Retry & Fallback */}
                    {msg.isError && (
                      <div className="pt-2 mt-2 border-t border-rose-500/20 flex flex-wrap items-center gap-2">
                        {onRetryLastMessage && (
                          <button
                            onClick={onRetryLastMessage}
                            className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-rose-600 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Request</span>
                          </button>
                        )}
                        {onTriggerFallbackAction && (
                          <button
                            onClick={() => onTriggerFallbackAction("plan_day")}
                            className="px-3 py-1.5 rounded-xl glass-pill text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 hover:bg-amber-500/10 transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>Use Local Intelligence</span>
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.thinkingDurationMs && (
                          <span className="flex items-center gap-0.5 text-purple-300/80">
                            <Clock className="w-3 h-3" />
                            <span>{msg.thinkingDurationMs}ms</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="opacity-80 hover:opacity-100 text-slate-400 hover:text-white transition-opacity flex items-center gap-1"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing / Loading indicator */}
            {isLoading && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 flex items-center justify-center shrink-0 font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="glass-card px-4 py-3 rounded-2xl border border-white/10 rounded-tl-none flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce delay-150" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-300" />
                  <span className="text-xs text-slate-300 font-mono ml-2">
                    {selectedImage
                      ? "Analyzing image with gemini-3.1-pro-preview..."
                      : selectedMode === "high_thinking"
                      ? "Gemini 3.1 Pro (High Thinking) is reasoning step-by-step..."
                      : selectedMode === "search_grounded"
                      ? "Gemini 3.5 Flash is searching Google & grounding data..."
                      : selectedMode === "fast_lite"
                      ? "Gemini 3.1 Flash Lite is generating instant response..."
                      : `Abya AI is processing request for ${activeStudent.name}...`}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING AI CONTROLS / TOOLS BAR (ChatGPT Style Horizontal Chips)       */}
      {/* ========================================================================= */}
      <div className="pt-2 pb-1.5 overflow-x-auto scrollbar-none shrink-0">
        <div className="flex items-center gap-1.5 min-w-max">
          {quickActionTools.map((act, index) => {
            const Icon = act.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  if (act.isModalTrigger === "voice") {
                    setShowLiveVoiceModal(true);
                  } else if (act.isModalTrigger === "camera") {
                    cameraInputRef.current?.click();
                  } else if (act.isModalTrigger === "intel") {
                    setIsIntelligenceDrawerOpen(true);
                  } else {
                    if (act.modeToSet) setSelectedMode(act.modeToSet);
                    if (act.prompt) {
                      handleSend(
                        `${act.prompt} ${currentTopic ? `"${currentTopic.name}" (${currentSubject?.name})` : "my current syllabus topics"}`,
                        act.type,
                        act.modeToSet
                      );
                    }
                  }
                }}
                disabled={isLoading}
                className={`px-2.5 py-1 rounded-xl glass-pill border text-xs font-medium flex items-center gap-1.5 transition-all ${act.accentClass} disabled:opacity-50 active:scale-95 shadow-sm`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Thumbnail Preview before sending */}
      {selectedImage && (
        <div className="glass-card p-2 rounded-2xl border border-cyan-500/40 mb-1.5 flex items-center justify-between gap-3 shrink-0 bg-slate-900/90 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={selectedImage.previewUrl}
              alt="Selected problem preview"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-cyan-500/30 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-white truncate">
                  {selectedImage.fileName}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono shrink-0">
                  gemini-3.1-pro-preview
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Photo ready. Type doubt or press Send.
              </p>
            </div>
          </div>

          <button
            onClick={handleRemoveImage}
            className="p-1 rounded-xl glass-pill text-slate-400 hover:text-rose-400 transition-colors shrink-0"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODERN STICKY COMPOSER (Floating Rounded Pill / ChatGPT Aesthetic)      */}
      {/* ========================================================================= */}
      <div className="sticky bottom-0 z-30 pt-0.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.2rem)] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="glass-card p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl border border-white/20 flex items-center gap-1 sm:gap-2 bg-slate-900/95 backdrop-blur-2xl shadow-2xl"
        >
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="abya-photo-upload"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
            id="abya-camera-upload"
          />

          {/* Left Attachment / Camera Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px] ${
                selectedImage
                  ? "bg-cyan-500/20 border border-cyan-500 text-cyan-300"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
              title="Upload Study Image / Document"
              aria-label="Upload document or photo"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px]"
              title="Take Photo of Textbook Doubt"
              aria-label="Camera doubt capture"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Center Input */}
          <input
            ref={inputRef}
            type="text"
            placeholder={
              selectedImage
                ? "Ask a question about this photo..."
                : selectedMode === "high_thinking"
                ? `High Thinking: Ask complex proof for ${activeStudent.name}...`
                : selectedMode === "search_grounded"
                ? `Search: Exam updates, dates for ${activeStudent.name}...`
                : `Ask Abya AI anything (${currentTopic ? currentTopic.name : "Study doubt"})...`
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 120);
            }}
            disabled={isLoading}
            className="flex-1 px-2 py-1.5 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none min-w-0 font-sans"
          />

          {/* Right Live Voice Button */}
          <button
            type="button"
            onClick={() => setShowLiveVoiceModal(true)}
            className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/15 transition-all flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px]"
            title="Start Live Voice Conversation"
            aria-label="Start live voice"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputPrompt.trim() && !selectedImage) || isLoading}
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-slate-950 font-black disabled:opacity-30 hover:shadow-lg hover:shadow-emerald-500/25 transition-all shrink-0 active:scale-95 min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Send message to Abya AI"
          >
            <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 5. SUBJECT CONTEXT DRAWER (Slide-out Sheet - Replaces Old Wall of Selects) */}
      {/* ========================================================================= */}
      {isContextDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsContextDrawerOpen(false)}
          />

          <div
            className="relative w-full max-w-md h-full bg-slate-950 border-l border-white/10 shadow-2xl p-4 sm:p-6 overflow-y-auto z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-heading text-white">
                      Curriculum & AI Context
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {activeStudent.name} • {activeStudent.classLevel} {activeStudent.stream}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsContextDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. AI Reasoning Mode */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                  AI Reasoning Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "standard" as AbyaAIMode, label: "⚡ Standard Flash", desc: "Balanced speed & depth" },
                    { id: "high_thinking" as AbyaAIMode, label: "🧠 High Thinking", desc: "Gemini 3.1 Pro Deep Proofs" },
                    { id: "fast_lite" as AbyaAIMode, label: "⚡ Fast Lite", desc: "Instant flashcard speed" },
                    { id: "search_grounded" as AbyaAIMode, label: "🌐 Search Grounded", desc: "Live syllabus & exam news" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedMode === m.id
                          ? "bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/10"
                          : "glass-pill border-white/10 text-slate-300 hover:border-emerald-500/40"
                      }`}
                    >
                      <div className="text-xs font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Subject Selection */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                  Subject
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {curriculumSubjects.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSelectSubject(sub.id)}
                      className={`p-2 rounded-xl text-left border text-xs font-bold transition-all truncate ${
                        selectedSubId === sub.id
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Chapter Selection */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                  Chapter
                </label>
                <select
                  value={selectedChapId}
                  onChange={(e) => handleSelectChapter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-emerald-400"
                >
                  {currentSubject?.chapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      Ch {chap.chapterNumber}: {chap.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Topic Selection */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                  Topic
                </label>
                <select
                  value={selectedTopId}
                  onChange={(e) => setSelectedTopId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400"
                >
                  {currentChapter?.topics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. 1-Tap Topic Action Launcher */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Instant Topic Launcher
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleCurriculumTopicAction("explanation")}
                    className="p-2 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25"
                  >
                    Explain
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("notes")}
                    className="p-2 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/25"
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("mcq")}
                    className="p-2 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-500/25"
                  >
                    MCQs
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("pyq")}
                    className="p-2 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25"
                  >
                    PYQs
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("vvi")}
                    className="p-2 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/25"
                  >
                    VVI
                  </button>
                  <button
                    onClick={() => handleCurriculumTopicAction("revision")}
                    className="p-2 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25"
                  >
                    Revision
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                onClick={() => setIsContextDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:shadow-lg transition-all"
              >
                Apply Context & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ABYA INTELLIGENCE PANEL (Collapsible Drawer with Real Student Data)      */}
      {/* ========================================================================= */}
      {isIntelligenceDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsIntelligenceDrawerOpen(false)}
          />

          <div
            className="relative w-full max-w-md h-full bg-slate-950 border-l border-white/10 shadow-2xl p-4 sm:p-6 overflow-y-auto z-10 flex flex-col justify-between animate-in slide-in-from-right duration-300 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold font-heading text-white">
                      Academic Intelligence
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Personalized for {activeStudent.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsIntelligenceDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Study Stats Snapshot */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-xs mb-0.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Streak</span>
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    {habits.length > 0 ? `${habits[0].streak || 5}d` : "5d"}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-xs mb-0.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Daily XP</span>
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    {activeStudent.xp || 420}
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-cyan-400 font-bold text-xs mb-0.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Accuracy</span>
                  </div>
                  <div className="text-base font-black text-white font-mono">
                    {calculatedAccuracy}%
                  </div>
                </div>
              </div>

              {/* Weak Topics Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Weak Topics & Focus Queue</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{weakTopics.length || 2} detected</span>
                </div>

                {weakTopics.length > 0 ? (
                  <div className="space-y-1.5">
                    {weakTopics.map((chap) => (
                      <div
                        key={chap.id}
                        className="p-2.5 rounded-xl glass-card border border-rose-500/30 bg-rose-500/5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {chap.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Mastery: {chap.masteryLevel || 35}% • Needs Practice
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsIntelligenceDrawerOpen(false);
                            handleSend(
                              `Explain "${chap.title}" in simple intuitive terms and test me with 3 practice questions.`,
                              "explain_topic"
                            );
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-bold shrink-0"
                        >
                          Practice
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>All syllabus chapters currently meet target mastery standards!</span>
                  </div>
                )}
              </div>

              {/* Spaced Repetition Due */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Spaced Repetition Due Today</span>
                  </span>
                  <span className="text-[10px] text-slate-500">{dueRevisions.length || 2} due</span>
                </div>

                {dueRevisions.length > 0 ? (
                  <div className="space-y-1.5">
                    {dueRevisions.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-2.5 rounded-xl glass-card border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {rev.topicName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Stage: {rev.repetitionIntervalDays || 3}d interval
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsIntelligenceDrawerOpen(false);
                            handleSend(
                              `Give me a 5-minute rapid recall drill on "${rev.topicName}" for my spaced repetition schedule.`,
                              "revise"
                            );
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0"
                        >
                          Recall
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>No revision items overdue for today.</span>
                  </div>
                )}
              </div>

              {/* AI Insight Recommendations */}
              {insightCards.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    AI Coaching Insights
                  </span>
                  <div className="space-y-1.5">
                    {insightCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-xl glass-card border border-indigo-500/30 bg-indigo-500/5 space-y-1"
                      >
                        <div className="text-xs font-bold text-indigo-300">{card.title}</div>
                        <p className="text-[11px] text-slate-300 leading-snug">{card.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Close Drawer Button */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => setIsIntelligenceDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all"
              >
                Close Intelligence Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LIVE VOICE API MODAL                                                   */}
      {/* ========================================================================= */}
      <AbyaLiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        activeStudent={activeStudent}
        customApiKey={settings.customApiKey}
      />

      {/* ========================================================================= */}
      {/* 8. API KEY CONFIG MODAL                                                   */}
      {/* ========================================================================= */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <span>Abya AI API Key Config</span>
              </h3>
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              By default, Garia OS uses the system's runtime Gemini API Key securely server-side for all models:
              <br />
              • <strong className="text-purple-300">gemini-3.1-pro-preview</strong> (High Thinking & Image Analysis)
              <br />
              • <strong className="text-amber-300">gemini-3.1-flash-lite</strong> (Low Latency Responses)
              <br />
              • <strong className="text-blue-300">gemini-3.5-flash</strong> (Google Search Grounding)
              <br />
              • <strong className="text-emerald-300">gemini-3.1-flash-live-preview</strong> (Live Voice API)
            </p>

            <div>
              <label className="block text-slate-300 font-medium text-xs mb-1">
                Custom Gemini API Key (Optional)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white text-xs border border-white/10 focus:outline-none"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 rounded-xl glass-pill text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. LANGUAGE SELECTOR MODAL                                                */}
      {/* ========================================================================= */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-heading text-white">
                  Abya AI Language Mode
                </h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select response language for active student profile{" "}
              <strong className="text-emerald-300">{activeStudent.name}</strong>.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: "WhatsApp Language" as AbyaLanguageSetting,
                  label: "Hinglish (Mix)",
                  badge: "Default & Natural",
                  desc: "Casual, friendly & adaptive. Automatically matches your style (Roman Hindi, Hinglish, English).",
                },
                {
                  id: "English" as AbyaLanguageSetting,
                  label: "English",
                  badge: "Formal",
                  desc: "Clear, structured English explanations and academic guidance.",
                },
                {
                  id: "Hindi" as AbyaLanguageSetting,
                  label: "Hindi",
                  badge: "Devanagari",
                  desc: "Conversational Hindi explanations for concepts and questions.",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onUpdateAbyaLanguage) onUpdateAbyaLanguage(item.id);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between gap-3 ${
                    abyaLanguage === item.id
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                      : "glass-pill border-white/10 text-slate-300 hover:border-emerald-500/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-heading text-white">
                        {item.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-white/10 font-mono">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                  {abyaLanguage === item.id && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. DIAGNOSTICS MODAL                                                     */}
      {/* ========================================================================= */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-lg glass-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">
                    Abya AI Diagnostics
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Active AI routing, health telemetry & fallback guards
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Active Engine</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online AI (Google Gemini)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className="text-xs font-bold capitalize text-emerald-300">
                    {diagnostics?.lastStatus || "online"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Latency</span>
                  <span className="text-xs font-bold font-mono text-cyan-300">
                    {diagnostics?.latencyMs ? `${diagnostics.latencyMs}ms` : "Fast (~45ms)"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Online Hits</span>
                  <span className="text-xs font-bold font-mono text-emerald-300">
                    {diagnostics?.onlineSuccessCount ?? 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Fallback Hits</span>
                  <span className="text-xs font-bold font-mono text-amber-300">
                    {diagnostics?.fallbackCount ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500 font-mono truncate">
                Last test: {diagnostics?.lastTestedAt ? new Date(diagnostics.lastTestedAt).toLocaleTimeString() : "Never"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300 text-xs hover:text-white"
                >
                  Close
                </button>
                {onTestDiagnostics && (
                  <button
                    type="button"
                    disabled={isPingingDiagnostics}
                    onClick={async () => {
                      setIsPingingDiagnostics(true);
                      try {
                        await onTestDiagnostics();
                      } finally {
                        setIsPingingDiagnostics(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPingingDiagnostics ? "animate-spin" : ""}`} />
                    <span>{isPingingDiagnostics ? "Pinging..." : "Test AI Health"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
