import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  BookOpen,
  Calendar,
  GraduationCap,
  RefreshCw,
  Target,
  BarChart3,
  ArrowRight,
  Zap,
  RotateCw,
  Globe,
  X,
  MessageCircle,
  Search,
  Mic,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  CheckCircle2,
  FileText,
  HelpCircle,
  Activity,
  Wifi,
  Cpu,
  Radio,
  Camera,
  Sliders,
  CheckSquare,
  Plus,
  PanelLeft,
  Volume2,
  VolumeX,
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
  StudySession,
  FocusSessionLog,
} from "../types";
import { AbyaLiveVoiceModal } from "../components/AbyaLiveVoiceModal";
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
  tasks?: Task[];
  academicSubjects?: AcademicSubject[];
  academicChapters?: AcademicChapter[];
  academicRevisions?: AcademicRevisionItem[];
  academicPractice?: AcademicPracticeSession[];
  examProfile?: ExamProfile;
  habits?: Habit[];
  studySessions?: StudySession[];
  focusLogs?: FocusSessionLog[];
}

export const AbyaAIPage: React.FC<AbyaAIPageProps> = ({
  messages,
  settings,
  activeStudent,
  abyaLanguage = "WhatsApp Language",
  onUpdateAbyaLanguage,
  onSendMessage,
  onClearChat,
  attachedContextNote,
  onClearAttachedContext,
  onNavigate,
  onRetryLastMessage,
  academicSubjects = [],
  academicChapters = [],
  examProfile,
}) => {
  // ChatGPT-style Collapsible Left Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Composer & AI Controls
  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedMode, setSelectedMode] = useState<AbyaAIMode>("standard");
  const [responseDepthLevel, setResponseDepthLevel] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [showLiveVoiceModal, setShowLiveVoiceModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);

  // Recent chat sessions state
  const [chatSessions, setChatSessions] = useState<AbyaChatSession[]>(() =>
    loadAbyaChatSessions(activeStudent?.id || "")
  );

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
  const recognitionRef = useRef<any>(null);

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

  // Sync sessions when student changes
  useEffect(() => {
    const loaded = loadAbyaChatSessions(activeStudent?.id || "");
    setChatSessions(loaded);
  }, [activeStudent?.id]);

  // Save current active session whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      const firstUserMsg =
        messages.find((m) => m.role === "user")?.content || "Academic Session";
      const lastMsg = messages[messages.length - 1]?.content || "";
      const title =
        firstUserMsg.slice(0, 45).trim() + (firstUserMsg.length > 45 ? "..." : "");

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

  // Master Curriculum State (for contextual drilldown in sidebar)
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [selectedChapId, setSelectedChapId] = useState<string>("");
  const [selectedTopId, setSelectedTopId] = useState<string>("");

  const curriculumSubjects = useMemo(() => {
    return getCurriculumSubjects(activeStudent?.classLevel, activeStudent?.stream);
  }, [activeStudent?.classLevel, activeStudent?.stream]);

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

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Image Upload Handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      e.target.value = "";
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

  const handleClearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Voice Dictation (Web Speech API)
  const handleToggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
      return;
    }
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.lang = abyaLanguage === "Hindi" ? "hi-IN" : "en-IN";
    rec.interimResults = false;
    rec.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      if (transcript) {
        setInputPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    rec.onend = () => setIsDictating(false);
    rec.onerror = () => setIsDictating(false);
    recognitionRef.current = rec;
    setIsDictating(true);
    rec.start();
  };

  // Read Aloud (SpeechSynthesis TTS)
  const handleToggleSpeak = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
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
    const rawPrompt = (textToSend || inputPrompt).trim();
    if ((!rawPrompt && !selectedImage) || isLoading) return;

    const depthHint =
      responseDepthLevel <= 2
        ? " (Keep response concise and bulleted)"
        : responseDepthLevel >= 4
        ? " (Provide a comprehensive, detailed step-by-step explanation with examples)"
        : "";

    const prompt =
      rawPrompt ? `${rawPrompt}${depthHint && !textToSend ? depthHint : ""}` : "";

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

  // Weak Subject & Topic Extraction for smart starter prompts
  const weakSubjectTitle = useMemo(() => {
    const weakChap = academicChapters.find(
      (c) =>
        (c.status as string) === "needs_revision" ||
        (c.masteryLevel && c.masteryLevel < 50) ||
        c.isWeak
    );
    if (weakChap) return weakChap.title;
    return academicSubjects[0]?.name || activeStudent?.stream || "Core Subject";
  }, [academicChapters, academicSubjects, activeStudent?.stream]);

  // Suggested Prompts List
  const suggestedPromptsList = useMemo(() => {
    const careerTarget =
      activeStudent?.stream === "Commerce"
        ? "CA Foundation & B.Com"
        : "JEE / NEET / Board";
    return [
      "What should I study today?",
      "Create a revision timetable for my upcoming exams.",
      `Explain the hardest concept in ${weakSubjectTitle}.`,
      "Give me 5 high-yield MCQs for quick practice.",
      `Build a ${careerTarget} roadmap.`,
    ];
  }, [activeStudent?.stream, weakSubjectTitle]);

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
        setInputPrompt("Explain step-by-step: ");
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      default:
        promptToSend = `Help me with ${actionType} for my studies.`;
    }

    handleSend(promptToSend, actionType);
  };

  const handleDeleteRecentSession = (sessionId: string) => {
    deleteAbyaChatSession(sessionId, activeStudent?.id || "");
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const formatSessionTimestamp = (ts: number) => {
    const now = Date.now();
    const diffHours = Math.floor((now - ts) / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24)
      return `Today, ${new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    if (diffHours < 48) return "Yesterday";
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const handleCurriculumTopicAction = (
    action: "explanation" | "notes" | "mcq" | "pyq" | "revision"
  ) => {
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

    setIsSidebarOpen(false);
    handleSend(prompt, undefined, undefined, {
      classLevel: activeStudent?.classLevel,
      stream: activeStudent?.stream,
      subject: currentSubject.name,
      chapter: currentChapter?.title,
      topic: currentTopic.name,
      modeType: action,
    });
  };

  const studentDisplayName = getStudentDisplayName(activeStudent, settings, "Student");
  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <div
      id="abya-chatgpt-studio"
      className={`flex w-full max-w-6xl mx-auto animate-in fade-in duration-300 relative rounded-3xl overflow-hidden border border-amber-500/25 bg-slate-950/95 shadow-2xl ${
        isKeyboardOpen ? "pb-1" : "pb-2"
      }`}
      style={{
        height: viewportHeight
          ? `${Math.max(340, viewportHeight - (isKeyboardOpen ? 8 : 88))}px`
          : "calc(var(--visual-viewport-height, 100dvh) - 88px)",
        maxHeight: viewportHeight ? `${viewportHeight}px` : "calc(100dvh - 80px)",
      }}
    >
      {/* ========================================================================= */}
      {/* 1. COLLAPSIBLE CHATGPT LEFT SIDEBAR (Threads + Syllabus Context)          */}
      {/* ========================================================================= */}
      {isSidebarOpen && (
        <aside
          id="abya-chatgpt-sidebar"
          className="w-72 sm:w-80 shrink-0 border-r border-amber-500/20 bg-slate-900/95 flex flex-col justify-between p-3.5 z-30 animate-in slide-in-from-left-4 duration-200"
        >
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {/* New Thread Button */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                id="abya-new-chat-btn"
                onClick={() => {
                  onClearChat();
                  setIsSidebarOpen(false);
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Study Thread</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Canonical Curriculum Drilldown Dropdowns */}
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-amber-500/25 space-y-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 uppercase tracking-wider font-classic">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Syllabus Topic Drilldown</span>
              </div>

              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="abya-curriculum-subject-select"
                    className="block text-[10px] font-semibold text-slate-400 mb-0.5"
                  >
                    Subject:
                  </label>
                  <select
                    id="abya-curriculum-subject-select"
                    value={currentSubject?.id || ""}
                    onChange={(e) => {
                      setSelectedSubId(e.target.value);
                      setSelectedChapId("");
                      setSelectedTopId("");
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-white focus:outline-none"
                  >
                    {curriculumSubjects.map((sub) => (
                      <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentSubject && currentSubject.chapters.length > 0 && (
                  <div>
                    <label
                      htmlFor="abya-curriculum-chapter-select"
                      className="block text-[10px] font-semibold text-slate-400 mb-0.5"
                    >
                      Chapter:
                    </label>
                    <select
                      id="abya-curriculum-chapter-select"
                      value={currentChapter?.id || ""}
                      onChange={(e) => {
                        setSelectedChapId(e.target.value);
                        setSelectedTopId("");
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-cyan-200 focus:outline-none"
                    >
                      {currentSubject.chapters.map((ch) => (
                        <option key={ch.id} value={ch.id} className="bg-slate-900 text-white">
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {currentChapter && currentChapter.topics.length > 0 && (
                  <div>
                    <label
                      htmlFor="abya-curriculum-topic-select"
                      className="block text-[10px] font-semibold text-slate-400 mb-0.5"
                    >
                      Topic:
                    </label>
                    <select
                      id="abya-curriculum-topic-select"
                      value={currentTopic?.id || ""}
                      onChange={(e) => setSelectedTopId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-emerald-200 focus:outline-none"
                    >
                      {currentChapter.topics.map((tp) => (
                        <option key={tp.id} value={tp.id} className="bg-slate-900 text-white">
                          {tp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 1-Tap Topic Actions */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCurriculumTopicAction("explanation")}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Explain Concept
                </button>
                <button
                  type="button"
                  onClick={() => handleCurriculumTopicAction("notes")}
                  className="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Formula Notes
                </button>
                <button
                  type="button"
                  onClick={() => handleCurriculumTopicAction("mcq")}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  5 Practice MCQs
                </button>
                <button
                  type="button"
                  onClick={() => handleCurriculumTopicAction("pyq")}
                  className="px-2 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Board PYQs
                </button>
              </div>
            </div>

            {/* Recent Conversation Threads */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Recent Threads ({chatSessions.length})
              </div>
              {chatSessions.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400">
                  Your saved study threads will appear here automatically.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {chatSessions.slice(0, 6).map((session) => (
                    <div
                      key={session.id}
                      className="p-2.5 rounded-xl bg-slate-950/75 hover:bg-slate-950 border border-white/10 flex items-center justify-between gap-2 group"
                    >
                      <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="text-xs font-bold text-white truncate">
                          {session.title || "Academic Session"}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {formatSessionTimestamp(session.updatedAt || session.createdAt)} ·{" "}
                          {session.messagesCount || 1} msgs
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecentSession(session.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Footer: AI Diagnostics Status */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowDiagnosticsModal(true)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Engine Status</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                Online
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN CHATGPT WORKSPACE COLUMN                                          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* TOP CLASSIC CHATGPT CONTROL BAR */}
        <header className="px-3 sm:px-5 py-2.5 border-b border-amber-500/20 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Left: Sidebar Toggle + Model/Persona Selector Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="abya-sidebar-toggle-btn"
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              title="Toggle Syllabus & Threads Sidebar"
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-amber-500/25 text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PanelLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Threads & Syllabus</span>
            </button>

            {/* Canonical AI Model & Persona Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <label htmlFor="abya-mode-dropdown" className="sr-only">
                Select AI Model & Mode
              </label>
              <select
                id="abya-mode-dropdown"
                aria-label="Select Abya AI Mode"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as AbyaAIMode)}
                className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer"
              >
                <option value="standard" className="bg-slate-900 text-white">
                  Abya 3.8 Flash · Study Mentor
                </option>
                <option value="high_thinking" className="bg-slate-900 text-white">
                  Abya 3.1 Pro · Deep Thinking
                </option>
                <option value="fast_lite" className="bg-slate-900 text-white">
                  Abya 3.1 Lite · Fast Recall
                </option>
                <option value="search_grounded" className="bg-slate-900 text-white">
                  Abya Search · Live Web Grounding
                </option>
                <option value="exam_coach" className="bg-slate-900 text-white">
                  Exam Strategy & Marking Coach
                </option>
                <option value="career_coach" className="bg-slate-900 text-white">
                  Career & Stream Advisor
                </option>
                <option value="mentor" className="bg-slate-900 text-white">
                  Focus & Discipline Mentor
                </option>
              </select>
            </div>
          </div>

          {/* Right: Depth Slider + Language Dropdown + Live Voice + Clear Chat */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Response Depth Slider */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-white/10">
              <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <label
                htmlFor="abya-response-depth-slider"
                className="text-[11px] font-semibold text-slate-300 whitespace-nowrap"
              >
                Depth: {responseDepthLevel}/5
              </label>
              <input
                id="abya-response-depth-slider"
                type="range"
                min={1}
                max={5}
                step={1}
                value={responseDepthLevel}
                onChange={(e) => setResponseDepthLevel(Number(e.target.value))}
                aria-label="AI Response Depth Slider"
                className="w-20 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Canonical AI Language Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-white/10">
              <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <label htmlFor="abya-language-dropdown" className="sr-only">
                Select AI Response Language
              </label>
              <select
                id="abya-language-dropdown"
                aria-label="Select Abya AI Language"
                value={abyaLanguage}
                onChange={(e) =>
                  onUpdateAbyaLanguage &&
                  onUpdateAbyaLanguage(e.target.value as AbyaLanguageSetting)
                }
                className="bg-transparent text-xs font-bold text-purple-200 focus:outline-none cursor-pointer"
              >
                <option value="WhatsApp Language" className="bg-slate-900 text-white">
                  Hinglish (Mentor Mix)
                </option>
                <option value="English" className="bg-slate-900 text-white">
                  Academic English
                </option>
                <option value="Hindi" className="bg-slate-900 text-white">
                  Hindi (हिंदी)
                </option>
                <option value="Hinglish" className="bg-slate-900 text-white">
                  Roman Hinglish
                </option>
              </select>
            </div>

            {/* Live Voice Mentor Button */}
            <button
              type="button"
              id="abya-live-voice-btn"
              onClick={() => setShowLiveVoiceModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Launch Real-Time Live Voice Tutor"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live Voice</span>
            </button>

            {/* Clear Thread Button */}
            <button
              type="button"
              id="abya-clear-chat-btn"
              onClick={onClearChat}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Reset Conversation Thread"
              aria-label="Clear Chat History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Attached Note Context Banner */}
        {attachedContextNote && (
          <div className="mx-4 mt-2.5 px-3.5 py-2 rounded-xl border border-cyan-500/35 bg-cyan-950/40 flex items-center justify-between text-xs text-cyan-200 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">Attached Study Context: "{attachedContextNote}"</span>
            </div>
            <button
              type="button"
              onClick={onClearAttachedContext}
              className="text-slate-300 hover:text-white ml-3 text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* CENTERED CHATGPT CONVERSATION STREAM                                  */}
        {/* ===================================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-5 custom-scrollbar">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            {/* ChatGPT-Style Classic Welcome Hero & Starter Cards when thread is fresh */}
            {!hasUserMessages && (
              <div className="space-y-6 py-4 text-center animate-in fade-in duration-300">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-cyan-500 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-300" />
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full classic-badge text-[10px] font-bold">
                    <span>
                      {activeStudent?.classLevel || "Class 12"} ·{" "}
                      {activeStudent?.stream || "Science"} ·{" "}
                      {activeStudent?.board || "CBSE"}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-classic tracking-tight">
                    What shall we study or solve today,{" "}
                    <span className="text-amber-200" dir="ltr">
                      {studentDisplayName}
                    </span>
                    ?
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                    Ask any concept doubt, upload a photo of a question paper, or launch a structured study blueprint below.
                  </p>
                </div>

                {/* 2x3 ChatGPT-Style Starter Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-left">
                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("study_plan")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-emerald-500/45 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 font-classic">
                        Today's Study Plan
                      </span>
                      <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Custom time-blocked schedule for today's pending tasks & weak topics
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("revision_plan")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-cyan-500/45 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 font-classic">
                        Spaced Revision Plan
                      </span>
                      <RotateCw className="w-4 h-4 text-cyan-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Active recall intervals & high-yield formula sheets for due chapters
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("exam_strategy")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-purple-500/45 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 font-classic">
                        Exam Scoring Strategy
                      </span>
                      <Target className="w-4 h-4 text-purple-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Board weightage breakdown, marking rubrics & exam-hall time pacing
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("progress_analysis")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-amber-500/50 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 font-classic">
                        Syllabus Mastery Audit
                      </span>
                      <BarChart3 className="w-4 h-4 text-amber-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Identify weak chapters and next actions to reach 95%+ readiness
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("weekly_schedule")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-emerald-500/45 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 font-classic">
                        7-Day Timetable
                      </span>
                      <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Balanced weekly study routine with theory, numericals & mock tests
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickActionClick("ask_doubt")}
                    className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-amber-500/25 hover:border-rose-500/45 transition-all group cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-rose-300 font-classic">
                        Step-by-Step Doubt Solver
                      </span>
                      <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Instant conceptual breakdown, analogies & solved practice questions
                    </p>
                  </button>
                </div>

                {/* One-Tap Suggested Prompts Strip */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {suggestedPromptsList.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(promptText)}
                      className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/35 text-xs text-slate-300 hover:text-white inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 text-left animate-in fade-in duration-200 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-200"
                        : m.isFallback
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-500 text-slate-950 shadow-sm"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Content Column */}
                  <div
                    className={`flex flex-col max-w-[88%] sm:max-w-[84%] ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    {m.imageUrl && (
                      <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 max-w-xs shadow-md">
                        <img
                          src={m.imageUrl}
                          alt="Uploaded Study Problem"
                          className="w-full h-auto max-h-56 object-contain bg-slate-950"
                        />
                      </div>
                    )}

                    <div
                      className={`rounded-3xl px-4 py-3.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? "bg-slate-800/95 border border-amber-500/30 text-white font-medium rounded-tr-sm shadow-sm"
                          : "bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-sm shadow-md"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Search Grounding Citations */}
                    {!isUser && m.groundingSources && m.groundingSources.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                          <Search className="w-3 h-3" /> Sources:
                        </span>
                        {m.groundingSources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-[10px] text-cyan-300 hover:text-white inline-flex items-center gap-1 transition-colors"
                          >
                            <span className="truncate max-w-[160px]">{src.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Executed OS Action Card */}
                    {m.executedAction && (
                      <div className="mt-2.5 w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            {m.executedAction.module === "tasks" && (
                              <CheckSquare className="w-4 h-4" />
                            )}
                            {m.executedAction.module === "notes" && (
                              <FileText className="w-4 h-4" />
                            )}
                            {m.executedAction.module === "wellness" && (
                              <Zap className="w-4 h-4" />
                            )}
                            {m.executedAction.module === "goals" && (
                              <Target className="w-4 h-4" />
                            )}
                            {m.executedAction.module === "exam" && (
                              <BookOpen className="w-4 h-4" />
                            )}
                            {m.executedAction.module === "study" && (
                              <GraduationCap className="w-4 h-4" />
                            )}
                            {![
                              "tasks",
                              "notes",
                              "wellness",
                              "goals",
                              "exam",
                              "study",
                            ].includes(m.executedAction.module) && (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="truncate text-left">
                            <p className="font-bold text-emerald-300 truncate">
                              {m.executedAction.summary}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Saved in{" "}
                              <span className="capitalize">{m.executedAction.module}</span>
                            </p>
                          </div>
                        </div>
                        {m.executedAction.targetTab && onNavigate && (
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate(m.executedAction!.targetTab as ActiveTab)
                            }
                            className="shrink-0 px-3 py-1.5 text-xs font-bold bg-emerald-500 text-slate-950 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Assistant Response Action Bar (ChatGPT Style) */}
                    {!isUser && (
                      <div className="flex items-center gap-3 mt-1.5 px-1 flex-wrap text-[11px] text-slate-400">
                        {m.isFallback ? (
                          <span className="inline-flex items-center gap-1 text-amber-300 font-mono">
                            <Cpu className="w-3 h-3" />
                            <span>Scholar Mentor Engine</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                            <Sparkles className="w-3 h-3" />
                            <span>{m.modelUsed || "gemini-3.8-flash"}</span>
                          </span>
                        )}

                        {m.thinkingDurationMs && (
                          <span className="text-slate-500 font-mono flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {Math.round(m.thinkingDurationMs / 100) / 10}s
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSpeak(m.id, m.content)}
                          className="hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Read Aloud"
                        >
                          {speakingId === m.id ? (
                            <>
                              <VolumeX className="w-3 h-3 text-amber-400" />
                              <span className="text-amber-300">Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>

                        {onRetryLastMessage && m.id === messages[messages.length - 1]?.id && (
                          <button
                            type="button"
                            onClick={onRetryLastMessage}
                            className="hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Regenerate response"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-3 text-left animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/90 rounded-3xl rounded-tl-sm px-4 py-3 border border-white/10 flex items-center gap-2 text-xs text-emerald-300">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-slate-300 ml-1">
                    Abya AI is composing a scholarly response...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* CENTERED CHATGPT COMPOSER DOCK                                        */}
        {/* ===================================================================== */}
        <div className="px-3 sm:px-6 pb-3 pt-1 shrink-0">
          <div className="max-w-3xl mx-auto w-full space-y-2">
            {/* Selected Image Preview Pill */}
            {selectedImage && (
              <div className="p-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/35 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={selectedImage.previewUrl}
                    alt="Selected problem"
                    className="w-10 h-10 object-cover rounded-xl border border-white/10"
                  />
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-bold text-white truncate">
                      {selectedImage.fileName}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Image attached · Ready for step-by-step multimodal analysis
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelectedImage}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Floating ChatGPT Input Bar */}
            <div className="rounded-3xl p-2 border border-amber-500/30 bg-slate-900/95 shadow-xl flex items-center gap-2">
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
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-white/10 transition-colors shrink-0 cursor-pointer"
                title="Capture Photo of Question"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-white/10 transition-colors shrink-0 hidden sm:flex cursor-pointer"
                title="Upload Question Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToggleDictation}
                className={`p-2.5 rounded-2xl border transition-colors shrink-0 cursor-pointer ${
                  isDictating
                    ? "bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse"
                    : "bg-slate-950/80 hover:bg-slate-800 border-white/10 text-slate-300 hover:text-emerald-300"
                }`}
                title="Voice Dictation"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                id="abya-chat-input"
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message Abya AI (${abyaLanguage})... Ask a doubt, create a task, or plan revision`}
                className="flex-1 min-w-0 bg-transparent border-0 text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-0 px-2 py-2"
              />

              <button
                type="button"
                id="abya-send-btn"
                onClick={() => handleSend()}
                disabled={(!inputPrompt.trim() && !selectedImage) || isLoading}
                className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  (inputPrompt.trim() || selectedImage) && !isLoading
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS (Diagnostics & Live Voice)                                      */}
      {/* ========================================================================= */}
      {showDiagnosticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="glass-card max-w-md w-full rounded-2xl p-5 border border-emerald-500/30 bg-slate-900/95 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white font-classic">
                  Abya AI Diagnostics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 cursor-pointer"
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
                <span className="text-slate-400">Primary Models:</span>
                <span className="font-bold text-white font-mono">
                  gemini-3.8-flash / 3.1-pro
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <span className="text-slate-400">Live Voice Engine:</span>
                <span className="font-bold text-amber-300 font-mono">
                  gemini-3.8-live
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
                <span className="text-slate-400">Local Mentor Fallback:</span>
                <span className="font-bold text-cyan-400">Active (Zero Downtime)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showLiveVoiceModal && (
        <AbyaLiveVoiceModal
          isOpen={showLiveVoiceModal}
          onClose={() => setShowLiveVoiceModal(false)}
          studentName={activeStudent?.name || "Student"}
          classLevel={activeStudent?.classLevel || "Class 12"}
          stream={activeStudent?.stream || "Commerce"}
          board={activeStudent?.board || "CBSE"}
        />
      )}
    </div>
  );
};
