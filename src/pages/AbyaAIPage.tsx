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
}

export const AbyaAIPage: React.FC<AbyaAIPageProps> = ({
  messages,
  settings,
  activeStudent,
  insightCards,
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
  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    fileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [isCurriculumExpanded, setIsCurriculumExpanded] = useState(false);

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
      return;
    }

    handleSend(promptText, "explain_topic", undefined, curriculumContext);
  };

  // Quick Action Chips
  const quickActions: {
    type: AbyaQuickActionType;
    label: string;
    icon: React.ElementType;
    prompt: string;
    bgHover: string;
    defaultMode?: AbyaAIMode;
  }[] = [
    {
      type: "high_thinking",
      label: "🧠 High Thinking",
      icon: Brain,
      prompt: "Use deep step-by-step reasoning (gemini-3.1-pro-preview with ThinkingLevel.HIGH) to analyze and solve this complex derivation / multi-step proof:",
      bgHover: "hover:bg-purple-500/15 hover:border-purple-500/50 text-purple-300 border-purple-500/30",
      defaultMode: "high_thinking",
    },
    {
      type: "search_grounding",
      label: "🌐 Search Grounded",
      icon: Search,
      prompt: "Use Google Search Grounding (gemini-3.5-flash) to find the latest real-time syllabus updates, exam dates, and official announcements for:",
      bgHover: "hover:bg-blue-500/15 hover:border-blue-500/50 text-blue-300 border-blue-500/30",
      defaultMode: "search_grounded",
    },
    {
      type: "fast_mode",
      label: "⚡ Fast Lite",
      icon: Zap,
      prompt: "Give me an ultra-fast flashcard summary and rapid-recall key points using gemini-3.1-flash-lite for:",
      bgHover: "hover:bg-amber-500/15 hover:border-amber-500/50 text-amber-300 border-amber-500/30",
      defaultMode: "fast_lite",
    },
    {
      type: "plan_day",
      label: "Study Coach",
      icon: Calendar,
      prompt: "Act as my Study Coach: help me structure my daily study routine, break down my syllabus into manageable daily goals, and optimize my study schedule.",
      bgHover: "hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-300",
    },
    {
      type: "explain_topic",
      label: "Doubt Solver",
      icon: GraduationCap,
      prompt: "I have a concept doubt. Please explain it clearly with step-by-step breakdown, simple analogies, key formulas/points, and a quick check question.",
      bgHover: "hover:bg-purple-500/10 hover:border-purple-500/40 text-purple-300",
    },
    {
      type: "revise",
      label: "Revision Planner",
      icon: RotateCw,
      prompt: "Act as my Revision Planner: analyze my weak topics and chapter statuses, and create a prioritized revision queue for my subjects.",
      bgHover: "hover:bg-blue-500/10 hover:border-blue-500/40 text-blue-300",
    },
    {
      type: "exam_coach",
      label: "Exam Preparation",
      icon: Trophy,
      prompt: "Act as my Exam Coach: evaluate my countdown status, mock test scores, PYQ coverage, and give me actionable exam prep strategies.",
      bgHover: "hover:bg-amber-500/10 hover:border-amber-500/40 text-amber-300",
    },
    {
      type: "career_guidance",
      label: "Career Guidance",
      icon: Target,
      prompt: "Give me tailored career guidance based on my stream, target career pathways, and recommended course stages.",
      bgHover: "hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-300",
    },
  ];

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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const getCardIcon = (type: AbyaInsightCard["type"]) => {
    switch (type) {
      case "priority":
        return Flame;
      case "revision":
        return RotateCw;
      case "test":
        return BarChart3;
      case "exam":
        return Trophy;
      case "career":
        return Target;
      default:
        return Sparkles;
    }
  };

  const getCardColor = (type: AbyaInsightCard["type"]) => {
    switch (type) {
      case "priority":
        return "border-rose-500/30 text-rose-400 bg-rose-500/10";
      case "revision":
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
      case "test":
        return "border-amber-500/30 text-amber-400 bg-amber-500/10";
      case "exam":
        return "border-yellow-500/30 text-yellow-400 bg-yellow-500/10";
      case "career":
        return "border-cyan-500/30 text-cyan-400 bg-cyan-500/10";
      default:
        return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-cyan-400 to-indigo-500 p-0.5 flex items-center justify-center font-bold text-slate-900 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-white font-heading">
                Abya AI
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                Multimodal & Live Voice
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Student:</span>
              <span className="text-emerald-300 font-medium">
                {activeStudent.name} ({activeStudent.classLevel} {activeStudent.stream} • {activeStudent.board})
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
          {/* Provider Diagnostics Button */}
          <button
            onClick={() => setShowDiagnosticsModal(true)}
            className={`p-2 px-3 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-bold shadow-md ${
              diagnostics?.lastStatus === "online"
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 shadow-emerald-500/10"
                : diagnostics?.lastStatus === "offline"
                ? "bg-rose-500/20 border-rose-400/50 text-rose-300 hover:bg-rose-500/30 shadow-rose-500/10"
                : "bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 shadow-amber-500/10"
            }`}
            title="Abya AI Provider Diagnostics & Engine Status"
          >
            {diagnostics?.lastStatus === "online" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online AI</span>
                {diagnostics?.latencyMs ? (
                  <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">
                    ({diagnostics.latencyMs}ms)
                  </span>
                ) : null}
              </>
            ) : diagnostics?.lastStatus === "offline" ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Local Mentor</span>
              </>
            )}
            <Activity className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Live Voice Button */}
          <button
            onClick={() => setShowLiveVoiceModal(true)}
            className="p-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/50 hover:bg-emerald-500/30 text-emerald-300 transition-all text-xs flex items-center gap-1.5 font-bold shadow-md shadow-emerald-500/10"
            title="Start Live Voice Conversation (gemini-3.1-flash-live-preview)"
          >
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Live Voice</span>
          </button>

          {/* Language Selector */}
          <button
            onClick={() => setShowLanguageModal(true)}
            className="p-2 px-3 rounded-xl glass-pill text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors text-xs flex items-center gap-1.5 font-bold"
            title="Abya AI Language Setting"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">{abyaLanguage}</span>
          </button>

          {/* API Key Config */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="p-2 rounded-xl glass-pill text-slate-300 hover:text-emerald-300 transition-colors text-xs flex items-center gap-1.5"
            title="Configure Custom API Key"
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline font-medium">API Key</span>
          </button>

          {/* Clear Chat */}
          <button
            onClick={onClearChat}
            className="p-2 rounded-xl glass-pill text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Mode Selector Tabs */}
      <div className="glass-card rounded-2xl p-2 border border-slate-800 mb-3 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setSelectedMode("standard")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedMode === "standard"
              ? "bg-slate-800 text-white border border-slate-600 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Standard (Flash)</span>
        </button>

        <button
          onClick={() => setSelectedMode("high_thinking")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedMode === "high_thinking"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-md shadow-purple-500/10"
              : "text-slate-400 hover:text-purple-300"
          }`}
          title="gemini-3.1-pro-preview with ThinkingLevel.HIGH for complex derivations"
        >
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span>High Thinking Mode</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-mono">
            3.1-Pro
          </span>
        </button>

        <button
          onClick={() => setSelectedMode("fast_lite")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedMode === "fast_lite"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10"
              : "text-slate-400 hover:text-amber-300"
          }`}
          title="gemini-3.1-flash-lite for ultra low-latency instant answers"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Fast Lite</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 font-mono">
            3.1-Lite
          </span>
        </button>

        <button
          onClick={() => setSelectedMode("search_grounded")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
            selectedMode === "search_grounded"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-500/10"
              : "text-slate-400 hover:text-blue-300"
          }`}
          title="gemini-3.5-flash with googleSearch tool for real-time web grounding"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>Search Grounding</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono">
            3.5-Flash
          </span>
        </button>
      </div>

      {/* Abya Insight Cards Slider */}
      {insightCards.length > 0 && (
        <div className="mb-3 shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-bold text-slate-300 font-heading flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Abya Insight Cards</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Profile: {activeStudent.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {insightCards.map((card) => {
              const Icon = getCardIcon(card.type);
              const colorClasses = getCardColor(card.type);

              return (
                <div
                  key={card.id}
                  className={`min-w-[240px] max-w-[280px] p-3 rounded-2xl glass-card border flex-1 flex flex-col justify-between ${colorClasses}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-heading flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{card.title}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white line-clamp-1 mb-1">
                      {card.recommendation}
                    </p>
                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {card.reason}
                    </p>
                  </div>

                  {card.actionText && card.actionTab && onNavigate && (
                    <button
                      onClick={() => onNavigate(card.actionTab!)}
                      className="mt-2.5 pt-2 border-t border-white/10 text-[11px] font-bold text-emerald-300 hover:text-white flex items-center justify-between w-full transition-colors group"
                    >
                      <span>{card.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Context Note Attachment Banner */}
      {attachedContextNote && (
        <div className="glass-pill p-3 rounded-xl border border-cyan-500/30 mb-3 flex items-center justify-between text-xs text-cyan-300 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Attached Context: "{attachedContextNote}"</span>
          </div>
          <button
            onClick={onClearAttachedContext}
            className="text-slate-400 hover:text-white ml-2 text-xs font-bold"
          >
            Remove
          </button>
        </div>
      )}

      {/* Curriculum Topic Intelligence Bar */}
      {curriculumSubjects.length > 0 && currentSubject && (
        <div className="glass-card rounded-2xl p-3 border border-emerald-500/20 mb-3 shrink-0 bg-slate-900/60 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-white font-heading truncate">
                    {currentSubject.name}
                  </span>
                  <span className="text-[10px] text-slate-400">›</span>
                  <span className="text-[11px] text-slate-300 truncate max-w-[140px] sm:max-w-[200px]">
                    {currentChapter?.title}
                  </span>
                  <span className="text-[10px] text-slate-400">›</span>
                  <span className="text-[11px] text-emerald-300 font-medium truncate max-w-[160px] sm:max-w-[240px]">
                    {currentTopic?.name}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCurriculumExpanded(!isCurriculumExpanded)}
              className="px-2.5 py-1 rounded-lg glass-pill text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 self-start sm:self-center transition-colors shrink-0"
            >
              <span>{isCurriculumExpanded ? "Hide Selector" : "Change Topic"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isCurriculumExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Expandable Topic Selector Dropdowns */}
          {isCurriculumExpanded && (
            <div className="pt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in duration-200">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSelectSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  {curriculumSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.chapters.length} Ch)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Chapter
                </label>
                <select
                  value={selectedChapId}
                  onChange={(e) => handleSelectChapter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  {currentSubject.chapters.map((chap) => (
                    <option key={chap.id} value={chap.id}>
                      Ch {chap.chapterNumber}: {chap.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Topic
                </label>
                <select
                  value={selectedTopId}
                  onChange={(e) => setSelectedTopId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  {currentChapter?.topics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 1-Tap Topic Action Buttons */}
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            <button
              onClick={() => handleCurriculumTopicAction("explanation")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="Step-by-step concept breakdown with real-world analogies"
            >
              <BookOpen className="w-3 h-3 text-emerald-400" />
              <span>Explain Concept</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("notes")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="High-yield quick revision notes & formulas"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Quick Notes</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("revision")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="5-minute rapid recall summary"
            >
              <RotateCw className="w-3 h-3 text-amber-400" />
              <span>5-Min Revision</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("mcq")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="5 topic-specific MCQs with solution breakdowns"
            >
              <Target className="w-3 h-3 text-purple-400" />
              <span>5 MCQs</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("pyq")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="Board exam previous year questions and marking tips"
            >
              <Award className="w-3 h-3 text-blue-400" />
              <span>Board PYQs</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("vvi")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="High frequency VVI questions and student pitfalls"
            >
              <Flame className="w-3 h-3 text-rose-400" />
              <span>VVI & Traps</span>
            </button>

            <button
              onClick={() => handleCurriculumTopicAction("doubt")}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 transition-colors disabled:opacity-50"
              title="Ask a custom doubt about this topic"
            >
              <HelpCircle className="w-3 h-3 text-slate-400" />
              <span>Ask Doubt</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Action Chips Bar */}
      <div className="mb-3 overflow-x-auto pb-1 scrollbar-thin shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.type}
                onClick={() => {
                  if (act.defaultMode) setSelectedMode(act.defaultMode);
                  handleSend(act.prompt, act.type, act.defaultMode);
                }}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl glass-pill border text-xs font-medium flex items-center gap-1.5 transition-all ${act.bgHover} disabled:opacity-50`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-slate-200"
                    : msg.isError
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 font-bold shadow-md shadow-emerald-500/20"
                }`}
              >
                {isUser ? (
                  <User className="w-4 h-4" />
                ) : msg.isError ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed border space-y-2 relative group ${
                  isUser
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-100 rounded-tr-none"
                    : msg.isError
                    ? "bg-rose-950/40 border-rose-500/30 text-rose-200 rounded-tl-none"
                    : "glass-card border-white/10 text-slate-100 rounded-tl-none"
                }`}
              >
                {/* Mode & Provider Badges */}
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
                      <span>Local Mentor (Offline Intelligence)</span>
                      {msg.fallbackReason && msg.fallbackReason !== "none" && (
                        <span className="text-amber-400/80 font-normal">
                          • {msg.fallbackReason === "network_offline" ? "No Internet" : msg.fallbackReason === "timeout" ? "Timeout" : msg.fallbackReason === "rate_limited" ? "Rate Limited" : "API Fallback"}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                {/* User Uploaded Image Preview in Chat */}
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

                {/* Search Grounding Sources */}
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

                {/* Error State with Retry & Fallback options */}
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-900 flex items-center justify-center shrink-0 font-bold">
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

        <div ref={chatEndRef} />
      </div>

      {/* Uploaded Image Thumbnail Preview Bar */}
      {selectedImage && (
        <div className="glass-card p-2.5 rounded-2xl border border-cyan-500/40 mt-2 mb-1 flex items-center justify-between gap-3 shrink-0 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <img
              src={selectedImage.previewUrl}
              alt="Selected problem preview"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-xs">
                  {selectedImage.fileName}
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  gemini-3.1-pro-preview
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Photo ready. Type your specific doubt or press send to solve automatically.
              </p>
            </div>
          </div>

          <button
            onClick={handleRemoveImage}
            className="p-1.5 rounded-xl glass-pill text-slate-400 hover:text-rose-400 transition-colors"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Form with Photo Upload and Mode Status */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="glass-card p-2 rounded-2xl border border-white/10 flex items-center gap-2 mt-2 shrink-0"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="abya-photo-upload"
        />

        {/* Photo Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            selectedImage
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
              : "glass-pill border-slate-700 text-slate-400 hover:text-white"
          }`}
          title="Upload / Capture Study Photo (gemini-3.1-pro-preview Image Analysis)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          type="text"
          placeholder={
            selectedImage
              ? "Ask a question about this photo (or leave empty to solve step-by-step)..."
              : selectedMode === "high_thinking"
              ? `High Thinking Mode: Ask complex derivation or proof for ${activeStudent.name}...`
              : selectedMode === "search_grounded"
              ? `Search Grounding: Search latest exam dates, syllabus news for ${activeStudent.name}...`
              : selectedMode === "fast_lite"
              ? `Fast Lite Mode: Rapid answer for ${activeStudent.name}...`
              : `Ask Abya AI anything for ${activeStudent.name}...`
          }
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={(!inputPrompt.trim() && !selectedImage) || isLoading}
          className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 text-slate-900 font-bold disabled:opacity-40 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Live Voice API Modal */}
      <AbyaLiveVoiceModal
        isOpen={showLiveVoiceModal}
        onClose={() => setShowLiveVoiceModal(false)}
        activeStudent={activeStudent}
        customApiKey={settings.customApiKey}
      />

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                <span>Abya AI API Key Config</span>
              </h3>
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

      {/* Language Selector Modal */}
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
              <strong className="text-emerald-300">{activeStudent.name}</strong>. Settings are isolated per profile.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: "WhatsApp Language" as AbyaLanguageSetting,
                  label: "WhatsApp Language",
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
                  badge: "Devanagari / Hindi",
                  desc: "Conversational Hindi explanations for concepts and questions.",
                },
                {
                  id: "Hinglish" as AbyaLanguageSetting,
                  label: "Hinglish",
                  badge: "Mix",
                  desc: "Natural combination of Hindi & English written in Roman script.",
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
      {/* Provider Diagnostics Modal */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div
            className="w-full max-w-lg glass-card rounded-3xl border border-emerald-500/30 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading text-white">
                    Abya AI Provider Diagnostics
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

            {/* Provider Status Card */}
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

            {/* Fallback Activation Triggers Specification */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Fallback Architecture</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abya AI operates exclusively with <strong className="text-emerald-300">Online AI (Gemini 3.7 / 3.1)</strong> by default. Local Intelligence study mentor triggers only on these exact edge conditions:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-[11px]">API / Server Failure</strong>
                    <p className="text-[10px] text-slate-400">Upstream 500 error or gateway rejection</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-[11px]">Request Timeout</strong>
                    <p className="text-[10px] text-slate-400">Response exceeds 35-second client timeout</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                  <WifiOff className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-[11px]">Network Offline</strong>
                    <p className="text-[10px] text-slate-400">No internet connectivity on student device</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white text-[11px]">Rate Limit (429)</strong>
                    <p className="text-[10px] text-slate-400">Exceeded API provider quota allowance</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Actions */}
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
