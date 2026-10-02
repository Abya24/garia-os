import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Play,
  Pause,
  Square,
  Award,
  BarChart3,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  X,
  RotateCcw,
  Calendar,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Flame,
  TrendingUp,
  Trophy,
  Share2,
  Copy,
  Check,
  Download,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Subject, StudySession, AcademicChapter, StudentProfile } from "../types";
import { getTodayString } from "../utils/storage";
import { formatSecondsToMSS, formatDurationCompact } from "../utils/dateTimeUtils";
import { useTransientToast } from "../utils/uiUtils";
import { CalendarSyncDropdown } from "../components/CalendarSyncDropdown";
import {
  getStudyMilestones,
  calculateStudyStreak,
  generateStudyStreakShareSnippet,
  StudyStreakStats,
} from "../utils/gamificationEngine";
import { MilestoneBadgesCard } from "../components/MilestoneBadgesCard";
import {
  generateStudySessionsCSV,
  downloadStudySessionsCSV,
} from "../utils/studySessionCsvExport";

export {
  calculateStudyStreak,
  generateStudyStreakShareSnippet,
  generateStudySessionsCSV,
  downloadStudySessionsCSV,
  type StudyStreakStats,
};

/**
 * Counts consecutive days with logged study sessions up to today (or yesterday if today is still pending).
 */
export function calculateConsecutiveStudyDays(studySessions: StudySession[] = []): number {
  return calculateStudyStreak(studySessions).currentStreak;
}

interface StudyTrackerProps {
  subjects: Subject[];
  studySessions: StudySession[];
  academicChapters?: AcademicChapter[];
  activeStudent?: StudentProfile;
  onAddSubject: (subj: Omit<Subject, "id" | "completedMinutes" | "totalSessions">) => void;
  onUpdateSubject?: (subj: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onResetSubjectsToDefaults?: () => void;
  onLogStudySession: (session: Omit<StudySession, "id" | "timestamp">) => void;
  onDeleteStudySession?: (sessionId: string) => void;
  onUpdateStudySession?: (session: StudySession) => void;
  onBack?: () => void;
}

interface PersistedTimerState {
  activeSubjectId: string;
  startTime: number;
  accumulatedSeconds: number;
  isRunning: boolean;
  notes: string;
}

export const StudyTracker: React.FC<StudyTrackerProps> = ({
  subjects,
  studySessions,
  academicChapters = [],
  activeStudent,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onResetSubjectsToDefaults,
  onLogStudySession,
  onDeleteStudySession,
  onUpdateStudySession,
}) => {
  const [quickSliderMinutes, setQuickSliderMinutes] = useState<number>(45);
  const profileId = activeStudent?.id || "default-student";
  const timerStorageKey = `garia_timer_state_${profileId}`;

  // Active Timer State
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const { toastMessage, showToast } = useTransientToast(3500);

  // Framer Motion Study Streak scale-up animation & Milestone Congratulations Toast state
  const [isStreakBadgeAnimating, setIsStreakBadgeAnimating] = useState<boolean>(false);
  const [streakAnimCount, setStreakAnimCount] = useState<number>(0);
  const [streakCongratsToast, setStreakCongratsToast] = useState<{
    streakDays: number;
    title: string;
    message: string;
  } | null>(null);
  const prevStreakRef = React.useRef<number | null>(null);

  const triggerStreakMilestoneToast = React.useCallback((days: number) => {
    if (days !== 3 && days !== 7) return;
    const title =
      days === 7
        ? "Congratulations! 7-Day Study Streak Unlocked!"
        : "Congratulations! 3-Day Study Streak Reached!";
    const message =
      days === 7
        ? "Congratulations on logging study sessions for 7 consecutive days! A full week of academic consistency!"
        : "Congratulations on hitting a 3-day consecutive study streak! Keep building your daily study momentum!";

    setStreakCongratsToast({ streakDays: days, title, message });
    try {
      confetti({
        particleCount: days === 7 ? 80 : 50,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#06b6d4"],
      });
    } catch {
      // Ignore confetti errors in headless browsers
    }
  }, []);

  const triggerSessionLoggedStreakAnimation = React.useCallback(
    (loggedSession: Omit<StudySession, "id" | "timestamp">) => {
      setStreakAnimCount((c) => c + 1);
      setIsStreakBadgeAnimating(true);
      setTimeout(() => setIsStreakBadgeAnimating(false), 850);

      const simulatedSessions: StudySession[] = [
        ...studySessions,
        {
          ...loggedSession,
          id: `temp-${Date.now()}`,
          timestamp: Date.now(),
        },
      ];
      const nextStreak = calculateStudyStreak(simulatedSessions).currentStreak;
      if (nextStreak === 3 || nextStreak === 7) {
        triggerStreakMilestoneToast(nextStreak);
      }
    },
    [studySessions, triggerStreakMilestoneToast]
  );

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectTarget, setNewSubjectTarget] = useState("300"); // 5 hours default target per week
  const [newSubjectColor, setNewSubjectColor] = useState("#10b981");

  // Manual Log Session Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualSubjectId, setManualSubjectId] = useState<string>("");
  const [manualDate, setManualDate] = useState<string>(getTodayString());
  const [manualHours, setManualHours] = useState<string>("0");
  const [manualMinutes, setManualMinutes] = useState<string>("45");
  const [manualNotes, setManualNotes] = useState<string>("");

  // Edit Study Session Modal
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [editSessionSubjectId, setEditSessionSubjectId] = useState<string>("");
  const [editSessionDate, setEditSessionDate] = useState<string>("");
  const [editSessionHours, setEditSessionHours] = useState<string>("0");
  const [editSessionMinutes, setEditSessionMinutes] = useState<string>("0");
  const [editSessionNotes, setEditSessionNotes] = useState<string>("");

  // Search & Filter for Sessions
  const [sessionSearch, setSessionSearch] = useState<string>("");
  const [sessionSubjectFilter, setSessionSubjectFilter] = useState<string>("ALL");

  // 1. Re-hydrate Timer State on Mount or Profile Switch
  useEffect(() => {
    try {
      const savedStr = localStorage.getItem(timerStorageKey);
      if (savedStr) {
        const saved: PersistedTimerState = JSON.parse(savedStr);
        if (saved.activeSubjectId) {
          setActiveSubjectId(saved.activeSubjectId);
        } else if (subjects.length > 0) {
          setActiveSubjectId(subjects[0].id);
        }

        setSessionNotes(saved.notes || "");
        setAccumulatedSeconds(saved.accumulatedSeconds || 0);

        if (saved.isRunning && saved.startTime) {
          const now = Date.now();
          const elapsedSinceStart = Math.floor((now - saved.startTime) / 1000);
          const currentTotal = (saved.accumulatedSeconds || 0) + Math.max(0, elapsedSinceStart);
          setSecondsElapsed(currentTotal);
          setStartTime(saved.startTime);
          setIsTimerRunning(true);
        } else {
          setSecondsElapsed(saved.accumulatedSeconds || 0);
          setIsTimerRunning(false);
          setStartTime(null);
        }
      } else {
        // Reset timer state if no saved state for this profile
        if (subjects.length > 0 && !activeSubjectId) {
          setActiveSubjectId(subjects[0].id);
        }
        setSecondsElapsed(0);
        setAccumulatedSeconds(0);
        setIsTimerRunning(false);
        setStartTime(null);
        setSessionNotes("");
      }
    } catch (e) {
      console.error("Failed to parse timer state", e);
    }
  }, [profileId]);

  // Set default active subject when subjects change or profile changes
  useEffect(() => {
    if (subjects.length > 0 && (!activeSubjectId || !subjects.some((s) => s.id === activeSubjectId))) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  // 2. High-Precision Timer Effect using Timestamp Difference
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - startTime) / 1000);
        setSecondsElapsed(accumulatedSeconds + Math.max(0, delta));
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, startTime, accumulatedSeconds]);

  // 3. Save Active Timer State to LocalStorage
  const persistTimer = (
    running: boolean,
    startTs: number | null,
    accumSecs: number,
    subjId: string,
    notesStr: string
  ) => {
    try {
      const payload: PersistedTimerState = {
        activeSubjectId: subjId,
        startTime: startTs || Date.now(),
        accumulatedSeconds: accumSecs,
        isRunning: running,
        notes: notesStr,
      };
      localStorage.setItem(timerStorageKey, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save timer state", e);
    }
  };

  const clearPersistedTimer = () => {
    localStorage.removeItem(timerStorageKey);
  };

  // Timer Control Handlers
  const handleStartSession = () => {
    const subjId = activeSubjectId || (subjects[0]?.id ?? "");
    if (!subjId) {
      showToast("Please create a subject before starting a study session.");
      return;
    }

    const now = Date.now();
    setActiveSubjectId(subjId);
    setStartTime(now);
    setIsTimerRunning(true);
    persistTimer(true, now, accumulatedSeconds, subjId, sessionNotes);
  };

  const handlePauseSession = () => {
    setIsTimerRunning(false);
    setAccumulatedSeconds(secondsElapsed);
    setStartTime(null);
    persistTimer(false, null, secondsElapsed, activeSubjectId, sessionNotes);
  };

  const handleStopSession = () => {
    if (isSaving) return;

    if (secondsElapsed < 5) {
      showToast("Session too short (less than 5s). Timer reset.");
      setIsTimerRunning(false);
      setSecondsElapsed(0);
      setAccumulatedSeconds(0);
      setStartTime(null);
      setSessionNotes("");
      clearPersistedTimer();
      return;
    }

    setIsSaving(true);
    const activeSubj = subjects.find((s) => s.id === activeSubjectId);
    if (activeSubj) {
      const sessionPayload = {
        subjectId: activeSubj.id,
        subjectName: activeSubj.name,
        durationSeconds: secondsElapsed,
        date: getTodayString(),
        notes: sessionNotes,
      };
      onLogStudySession(sessionPayload);
      triggerSessionLoggedStreakAnimation(sessionPayload);
      showToast(`Study session saved! (${Math.round(secondsElapsed / 60)} mins for ${activeSubj.name})`);
    }

    setIsTimerRunning(false);
    setSecondsElapsed(0);
    setAccumulatedSeconds(0);
    setStartTime(null);
    setSessionNotes("");
    clearPersistedTimer();
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsElapsed(0);
    setAccumulatedSeconds(0);
    setStartTime(null);
    setSessionNotes("");
    clearPersistedTimer();
    showToast("Timer reset.");
  };

  // Subject Modal Handlers
  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setNewSubjectName("");
    setNewSubjectTarget("300");
    setNewSubjectColor("#10b981");
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setNewSubjectName(subj.name);
    setNewSubjectTarget(String(subj.targetMinutesPerWeek));
    setNewSubjectColor(subj.color || "#10b981");
    setIsSubjectModalOpen(true);
  };

  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    if (editingSubject && onUpdateSubject) {
      onUpdateSubject({
        ...editingSubject,
        name: newSubjectName.trim(),
        targetMinutesPerWeek: parseInt(newSubjectTarget) || 300,
        color: newSubjectColor,
      });
      showToast(`Subject "${newSubjectName.trim()}" updated.`);
    } else {
      onAddSubject({
        name: newSubjectName.trim(),
        targetMinutesPerWeek: parseInt(newSubjectTarget) || 300,
        color: newSubjectColor,
      });
      showToast(`Subject "${newSubjectName.trim()}" created.`);
    }

    setNewSubjectName("");
    setEditingSubject(null);
    setIsSubjectModalOpen(false);
  };

  // Manual Session Handlers
  const handleOpenManualModal = () => {
    setManualSubjectId(activeSubjectId || subjects[0]?.id || "");
    setManualDate(getTodayString());
    setManualHours("0");
    setManualMinutes("45");
    setManualNotes("");
    setIsManualModalOpen(true);
  };

  const handleManualSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hrs = parseInt(manualHours) || 0;
    const mins = parseInt(manualMinutes) || 0;
    const totalSecs = hrs * 3600 + mins * 60;

    if (totalSecs <= 0) {
      showToast("Duration must be greater than 0 minutes.");
      return;
    }

    const selectedSubj = subjects.find((s) => s.id === manualSubjectId);
    if (!selectedSubj) {
      showToast("Please select a valid subject.");
      return;
    }

    const sessionPayload = {
      subjectId: selectedSubj.id,
      subjectName: selectedSubj.name,
      durationSeconds: totalSecs,
      date: manualDate || getTodayString(),
      notes: manualNotes,
    };
    onLogStudySession(sessionPayload);
    triggerSessionLoggedStreakAnimation(sessionPayload);

    showToast(`Logged ${hrs > 0 ? `${hrs}h ` : ""}${mins}m for ${selectedSubj.name}!`);
    setIsManualModalOpen(false);
  };

  // Edit Session Handlers
  const handleOpenEditSessionModal = (session: StudySession) => {
    setEditingSession(session);
    setEditSessionSubjectId(session.subjectId);
    setEditSessionDate(session.date);
    const totalMins = Math.round(session.durationSeconds / 60);
    setEditSessionHours(String(Math.floor(totalMins / 60)));
    setEditSessionMinutes(String(totalMins % 60));
    setEditSessionNotes(session.notes || "");
  };

  const handleSaveEditedSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !onUpdateStudySession) return;

    const hrs = parseInt(editSessionHours) || 0;
    const mins = parseInt(editSessionMinutes) || 0;
    const totalSecs = hrs * 3600 + mins * 60;

    if (totalSecs <= 0) {
      showToast("Duration must be greater than 0 minutes.");
      return;
    }

    const selectedSubj = subjects.find((s) => s.id === editSessionSubjectId);

    onUpdateStudySession({
      ...editingSession,
      subjectId: editSessionSubjectId,
      subjectName: selectedSubj?.name || editingSession.subjectName,
      durationSeconds: totalSecs,
      date: editSessionDate,
      notes: editSessionNotes,
    });

    showToast("Study session log updated.");
    setEditingSession(null);
  };

  const handleDeleteSession = (session: StudySession) => {
    if (onDeleteStudySession) {
      onDeleteStudySession(session.id);
      showToast("Session deleted.");
    }
  };

  // Filtered Sessions List
  const filteredSessions = studySessions.filter((s) => {
    const matchesSearch =
      s.subjectName.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (s.notes || "").toLowerCase().includes(sessionSearch.toLowerCase()) ||
      s.date.includes(sessionSearch);
    const matchesSubject = sessionSubjectFilter === "ALL" || s.subjectId === sessionSubjectFilter;
    return matchesSearch && matchesSubject;
  });

  const [selectedGoalType, setSelectedGoalType] = useState<string>("ALL");
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>("ALL");

  // Available chapters for selected subject
  const currentTrackerChapters = React.useMemo(() => {
    if (sessionSubjectFilter === "ALL") return academicChapters;
    return academicChapters.filter((ch) => ch.subjectId === sessionSubjectFilter);
  }, [academicChapters, sessionSubjectFilter]);

  const studyMilestones = getStudyMilestones(studySessions, subjects);
  const studyStreak = React.useMemo(
    () => calculateStudyStreak(studySessions),
    [studySessions]
  );

  // Shareable Study Consistency Snippet state
  const [shareSnippetText, setShareSnippetText] = useState<string | null>(null);
  const [isShareCopied, setIsShareCopied] = useState<boolean>(false);

  const handleExportStudyHistoryCSV = (useFilteredOnly: boolean = false) => {
    const targetList =
      useFilteredOnly && (sessionSearch.trim() !== "" || sessionSubjectFilter !== "ALL")
        ? filteredSessions
        : studySessions;
    const result = downloadStudySessionsCSV(targetList, subjects, activeStudent);
    showToast(
      `Exported ${result.rowCount} study session${result.rowCount === 1 ? "" : "s"} (${result.totalHours}h total) to ${result.filename}`
    );
  };

  const handleShareStudyStreak = async () => {
    const snippet = generateStudyStreakShareSnippet(
      studyStreak,
      activeStudent?.name
    );
    setShareSnippetText(snippet);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(snippet);
      }
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    } catch {
      setIsShareCopied(true);
      setTimeout(() => setIsShareCopied(false), 2500);
    }
    showToast("Study consistency summary generated & copied to clipboard!");
  };

  // Automatically trigger congratulations toast when user hits a 3-day or 7-day study streak
  useEffect(() => {
    const current = studyStreak.currentStreak;
    const prev = prevStreakRef.current;
    prevStreakRef.current = current;

    if (current === 3 || current === 7) {
      const storageFlagKey = `garia_streak_congrats_${profileId}_${getTodayString()}_${current}`;
      const alreadyShown = sessionStorage.getItem(storageFlagKey);
      if ((prev !== null && prev !== current) || !alreadyShown) {
        try {
          sessionStorage.setItem(storageFlagKey, "1");
        } catch {
          // Ignore storage errors
        }
        triggerStreakMilestoneToast(current);
      }
    }
  }, [studyStreak.currentStreak, profileId, triggerStreakMilestoneToast]);

  // Auto-dismiss streak congratulations toast after 5.5s
  useEffect(() => {
    if (!streakCongratsToast) return;
    const timer = setTimeout(() => {
      setStreakCongratsToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [streakCongratsToast]);

  return (
    <div className="space-y-6 pb-4 md:pb-0 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up-toast duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      {/* 3-Day / 7-Day Study Streak Congratulations Toast Notification */}
      <AnimatePresence>
        {streakCongratsToast && (
          <motion.div
            id="study-streak-congratulations-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-28 right-4 z-50 max-w-sm w-full bg-slate-900/95 border border-amber-500/50 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-amber-300 tracking-tight">
                  {streakCongratsToast.title}
                </p>
                <button
                  type="button"
                  onClick={() => setStreakCongratsToast(null)}
                  className="text-slate-400 hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Dismiss streak notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {streakCongratsToast.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Study Tracker
              </h1>
              {activeStudent && (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                  {activeStudent.name || "Student"} ({activeStudent.stream || "General"})
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Track live study sessions, log offline hours, and analyze subject mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.div
            key={`streak-badge-${streakAnimCount}`}
            id="study-streak-header-badge"
            initial={{ scale: 1 }}
            animate={
              isStreakBadgeAnimating
                ? { scale: [1, 1.18, 0.96, 1.08, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.55, ease: "easeOut" }}
            className={`flex items-center gap-2 pl-3.5 pr-2 py-1.5 rounded-2xl border text-xs font-bold font-mono tabular-nums transition-colors ${
              studyStreak.currentStreak > 0
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm"
                : "bg-slate-900/80 border-white/10 text-slate-400"
            }`}
            title="Current consecutive days of study sessions"
          >
            <Flame
              className={`w-4 h-4 shrink-0 ${
                studyStreak.currentStreak > 0
                  ? "text-amber-400 fill-amber-400"
                  : "text-slate-500"
              }`}
            />
            <span>
              {studyStreak.currentStreak}{" "}
              {studyStreak.currentStreak === 1 ? "Day Streak" : "Days Streak"}
            </span>
            <button
              type="button"
              id="share-study-streak-btn"
              onClick={handleShareStudyStreak}
              className="ml-1 px-2 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/10 text-[11px] font-sans font-semibold text-amber-200 hover:text-white flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              title="Share study streak & consistency summary"
            >
              {isShareCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3 h-3 text-amber-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          </motion.div>

          <button
            type="button"
            id="export-study-sessions-csv-header-btn"
            data-testid="export-study-csv-header-btn"
            onClick={() => handleExportStudyHistoryCSV(false)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl glass-pill border border-cyan-500/30 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all cursor-pointer"
            title="Export complete study session history as a CSV spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenManualModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl glass-pill border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>Manual Log</span>
          </button>

          {onResetSubjectsToDefaults && (
            <button
              onClick={() => {
                onResetSubjectsToDefaults();
                showToast("Subjects restored to stream defaults.");
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl glass-pill border border-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
              title="Restore Default Stream Subjects"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Defaults</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 text-xs font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Classic Study Command Bar with Dropdowns & Quick Duration Slider */}
      <div className="classic-paper-header rounded-2xl p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            id="study-tracker-subject-dropdown"
            aria-label="Select Active Study Subject"
            value={activeSubjectId}
            onChange={(e) => setActiveSubjectId(e.target.value)}
            className="classic-select text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer"
          >
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                Active Subject: {subj.name}
              </option>
            ))}
          </select>

          <select
            id="study-tracker-history-filter-dropdown"
            aria-label="Filter Logged Study Sessions by Subject"
            value={sessionSubjectFilter}
            onChange={(e) => setSessionSubjectFilter(e.target.value)}
            className="classic-select text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="ALL">History Filter: All Subjects</option>
            {subjects.map((subj) => (
              <option key={subj.id} value={subj.id}>
                Filter: {subj.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 px-3.5 py-2 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <label
              htmlFor="study-tracker-quick-duration-slider"
              className="text-xs font-bold text-slate-300 whitespace-nowrap"
            >
              Session Slider:
            </label>
            <input
              id="study-tracker-quick-duration-slider"
              type="range"
              min={15}
              max={180}
              step={5}
              value={quickSliderMinutes}
              onChange={(e) => setQuickSliderMinutes(Number(e.target.value))}
              aria-label="Quick Study Session Duration Slider"
              className="classic-slider flex-1"
            />
            <span className="text-xs font-mono font-bold text-amber-300 min-w-[3.2rem] text-right">
              {quickSliderMinutes}m
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const targetSubj =
                subjects.find((s) => s.id === activeSubjectId) || subjects[0];
              if (!targetSubj) return;
              const newSession = {
                subjectId: targetSubj.id,
                subjectName: targetSubj.name,
                durationMinutes: quickSliderMinutes,
                durationSeconds: quickSliderMinutes * 60,
                date: getTodayString(),
                notes: `Logged via Quick Duration Slider (${quickSliderMinutes}m)`,
              };
              triggerSessionLoggedStreakAnimation(newSession);
              onLogStudySession(newSession);
              showToast(`Logged ${quickSliderMinutes}m for ${targetSubj.name}!`);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors shrink-0"
          >
            + Log {quickSliderMinutes}m
          </button>
        </div>
      </div>

      {/* Study Streak Visual Indicator Card */}
      <section
        id="study-streak-visual-indicator"
        aria-label="Study Streak Visual Indicator"
        className="glass-card rounded-3xl p-5 sm:p-6 border border-amber-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-amber-950/25 shadow-lg space-y-5"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left: Primary Consecutive Days Counter, Progress Circle & Flame Badge (5 cols) */}
          <div className="lg:col-span-5 flex items-center gap-4 border-b lg:border-b-0 lg:border-r border-white/10 pb-4 lg:pb-0 lg:pr-5">
            <motion.div
              key={`streak-circle-${streakAnimCount}`}
              id="study-streak-progress-circle"
              initial={{ scale: 1 }}
              animate={
                isStreakBadgeAnimating
                  ? { scale: [1, 1.15, 0.97, 1.06, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center shrink-0"
              title={`Streak Milestone Progress: ${studyStreak.currentStreak}/${studyStreak.nextMilestone} consecutive days (${studyStreak.milestoneProgressPercent}%)`}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
                <circle
                  cx="44"
                  cy="44"
                  r="37"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-slate-800"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="37"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 37}
                  strokeDashoffset={
                    2 * Math.PI * 37 * (1 - Math.min(100, Math.max(0, studyStreak.milestoneProgressPercent)) / 100)
                  }
                  className={`transition-all duration-500 ${
                    studyStreak.currentStreak > 0 ? "text-amber-400" : "text-slate-600"
                  }`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${
                    studyStreak.currentStreak > 0
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-500"
                  }`}
                />
                <span className="text-[10px] font-mono font-bold text-amber-300 tabular-nums mt-0.5">
                  {studyStreak.milestoneProgressPercent}%
                </span>
              </div>
            </motion.div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <span>Study Streak</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400 font-normal">
                  {studyStreak.studiedToday ? "Logged Today ✓" : "Today Pending"}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  id="study-streak-consecutive-days-count"
                  className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white tracking-tight"
                >
                  {studyStreak.currentStreak}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-200 font-heading">
                  {studyStreak.currentStreak === 1
                    ? "Consecutive Day"
                    : "Consecutive Days"}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {studyStreak.studiedToday
                  ? `Great consistency! You've logged ${studyStreak.todayMinutes}m across ${studyStreak.todaySessionsCount} study session${studyStreak.todaySessionsCount === 1 ? "" : "s"} today.`
                  : studyStreak.currentStreak > 0
                  ? `You're on a ${studyStreak.currentStreak}-day study streak! Complete a session today to reach ${studyStreak.currentStreak + 1} consecutive days.`
                  : "Complete a study timer or manual log today to ignite your consecutive day study streak."}
              </p>
            </div>
          </div>

          {/* Right: 7-Day Visual Calendar Grid & Milestone Progress (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200">
                  7-Day Study Session Calendar Grid
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 font-mono tabular-nums">
                <span>
                  7-Day Logged:{" "}
                  <strong className="text-amber-300">
                    {studyStreak.last7Days.filter((d) => d.studied).length}/7
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Best Streak:{" "}
                  <strong className="text-amber-300">
                    {studyStreak.longestStreak}d
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  Total Days:{" "}
                  <strong className="text-emerald-300">
                    {studyStreak.totalStudyDays}
                  </strong>
                </span>
              </div>
            </div>

            {/* 7-Day Visual Calendar Grid */}
            <div
              id="study-streak-7day-calendar-grid"
              role="grid"
              aria-label="7-Day Study Session Visual Calendar Grid"
              className="grid grid-cols-7 gap-1.5 sm:gap-2"
            >
              {studyStreak.last7Days.map((dayItem) => {
                const isSelectedDate = sessionSearch === dayItem.date;
                const dayNumber = dayItem.date.slice(8);
                return (
                  <button
                    key={dayItem.date}
                    type="button"
                    role="gridcell"
                    aria-selected={dayItem.studied}
                    onClick={() =>
                      setSessionSearch((prev) =>
                        prev === dayItem.date ? "" : dayItem.date
                      )
                    }
                    className={`p-2 sm:p-2.5 rounded-2xl border text-center flex flex-col items-center justify-between gap-1 transition-all cursor-pointer ${
                      dayItem.studied
                        ? "bg-amber-500/15 border-amber-500/40 text-white hover:border-amber-400"
                        : dayItem.isToday
                        ? "bg-slate-950/90 border-cyan-500/40 text-slate-300 hover:border-cyan-400"
                        : "bg-slate-950/60 border-white/5 text-slate-500 hover:border-white/15"
                    } ${isSelectedDate ? "ring-2 ring-cyan-400" : ""}`}
                    title={`${dayItem.date}: ${
                      dayItem.studied
                        ? `${dayItem.minutes}m studied across ${dayItem.sessionsCount} session${dayItem.sessionsCount === 1 ? "" : "s"}`
                        : "No study sessions logged"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5 text-[10px]">
                      <span
                        className={`font-semibold truncate ${
                          dayItem.isToday ? "text-cyan-300 font-bold" : "text-slate-400"
                        }`}
                      >
                        {dayItem.isToday ? "Today" : dayItem.dayLabel}
                      </span>
                      <span className="font-mono tabular-nums text-[9px] text-slate-400">
                        {dayNumber}
                      </span>
                    </div>

                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center ${
                        dayItem.studied
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "bg-slate-900 text-slate-600 border border-white/5"
                      }`}
                    >
                      {dayItem.studied ? (
                        <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      ) : (
                        <span className="text-[10px] font-mono tabular-nums text-slate-500">
                          —
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        dayItem.studied ? "text-amber-300 font-semibold" : "text-slate-500"
                      }`}
                    >
                      {dayItem.studied ? `${dayItem.minutes}m` : "0m"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Next Streak Milestone Progress Bar */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span className="flex items-center gap-1 text-slate-300 font-sans font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Next Target: {studyStreak.nextMilestone}-Day Consecutive Streak
                  </span>
                </span>
                <span>
                  {studyStreak.currentStreak} / {studyStreak.nextMilestone} days (
                  {studyStreak.milestoneProgressPercent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, studyStreak.milestoneProgressPercent)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shareable Study Consistency Text Snippet Box */}
        {shareSnippetText && (
          <div
            id="study-streak-shareable-snippet-panel"
            className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Shareable Study Consistency Summary</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareStudyStreak}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{isShareCopied ? "Copied!" : "Copy Text"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareSnippetText(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Close shareable snippet"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <pre
              id="study-streak-shareable-snippet-text"
              className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-white/5"
            >
              {shareSnippetText}
            </pre>
          </div>
        )}

        {/* 30-Day Study Session Duration & Streak Consistency Bar Chart (Recharts) */}
        <div
          id="study-streak-30day-chart-card"
          className="pt-4 border-t border-white/10 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>30-Day Daily Study Session Duration & Streak Consistency</span>
              </h3>
              <p className="text-xs text-slate-400">
                Daily study minutes over the last 30 days, highlighting days where your study streak was maintained.
              </p>
            </div>

            {/* Legend & 30-Day Totals */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
                <span className="text-slate-300">Streak Maintained</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                <span className="text-slate-300">Single Study Day</span>
              </div>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums text-slate-300">
                This Week: <strong className="text-amber-300">{studyStreak.weeklyStudyHours}h</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums text-slate-300">
                30d Total: <strong className="text-emerald-300">{studyStreak.monthlyStudyHours}h</strong>
              </span>
            </div>
          </div>

          <div className="h-52 sm:h-60 w-full bg-slate-950/70 rounded-2xl p-3 border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={studyStreak.last30Days}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  unit="m"
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-white/15 rounded-xl p-2.5 shadow-xl text-xs space-y-1">
                        <div className="font-bold text-white flex items-center justify-between gap-3">
                          <span>
                            {item.dayLabel}, {item.shortDate} ({item.date})
                          </span>
                          {item.streakMaintained && (
                            <span className="text-amber-300 font-mono">
                              🔥 Streak Day {item.streakLengthOnDay}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-mono tabular-nums">
                          Duration:{" "}
                          <strong className="text-white">
                            {item.minutes} mins ({item.hours} hrs)
                          </strong>
                        </div>
                        <div className="text-slate-400">
                          {item.studied
                            ? `${item.sessionsCount} study session${
                                item.sessionsCount === 1 ? "" : "s"
                              } logged · ${
                                item.streakMaintained
                                  ? "Streak Maintained"
                                  : "Session Logged"
                              }`
                            : "No study sessions logged"}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="minutes" name="Study Duration (mins)" radius={[4, 4, 0, 0]}>
                  {studyStreak.last30Days.map((entry) => (
                    <Cell
                      key={entry.date}
                      fill={
                        entry.streakMaintained
                          ? "#f59e0b"
                          : entry.studied
                          ? "#06b6d4"
                          : "#1e293b"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Universal Dropdown Navigation Ribbon (Rule 1 & Rule 2) */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Subject Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-slate-400">Subject:</span>
            <select
              id="tracker-subject-dropdown"
              value={sessionSubjectFilter}
              onChange={(e) => {
                setSessionSubjectFilter(e.target.value);
                setSelectedChapterFilter("ALL");
              }}
              className="bg-transparent text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Subjects ({subjects.length})</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <span className="text-[11px] font-semibold text-slate-400">Chapter:</span>
            <select
              id="tracker-chapter-dropdown"
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Chapters ({currentTrackerChapters.length})</option>
              {currentTrackerChapters.map((ch) => (
                <option key={ch.id} value={ch.id} className="bg-slate-900 text-white">
                  {ch.chapterNumber ? `Ch ${ch.chapterNumber}: ` : ""}{ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Goal Type Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-2xl border border-white/10 min-h-[44px]">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-semibold text-slate-400">Goal Type:</span>
            <select
              id="tracker-goaltype-dropdown"
              value={selectedGoalType}
              onChange={(e) => setSelectedGoalType(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Goal Types</option>
              <option value="weekly_hours" className="bg-slate-900 text-white">Weekly Target (Hours)</option>
              <option value="daily_streak" className="bg-slate-900 text-white">Daily Streak</option>
              <option value="chapter_mastery" className="bg-slate-900 text-white">Chapter Completion</option>
              <option value="exam_revision" className="bg-slate-900 text-white">Exam Revision</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-auto sm:min-w-[220px] sm:ml-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sessions, topics..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="w-full bg-slate-950/80 text-xs text-white placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500 min-h-[38px]"
            />
          </div>
        </div>
      </div>

      {/* Study Hours & Mastery Milestone Badges */}
      <MilestoneBadgesCard
        title="Study Milestones & Hours Badges"
        subtitle="Clock study hours like '10 Hours Studied' or multi-subject mastery to unlock academic prestige badges."
        category="study"
        badges={studyMilestones.badges}
        unlockedCount={studyMilestones.unlockedCount}
        totalCount={studyMilestones.totalCount}
        latestUnlocked={studyMilestones.latestUnlocked}
        defaultExpanded={true}
      />

      {/* Active Study Session Timer Card */}
      <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-emerald-950/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left w-full md:w-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>{isTimerRunning ? "Live Study Session Running" : "Study Timer Ready"}</span>
            </span>

            <div className="text-4xl sm:text-6xl font-extrabold font-mono tracking-wider text-white py-2">
              {formatSecondsToMSS(secondsElapsed)}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <label className="text-xs text-slate-400 font-medium">
                Active Subject:
              </label>
              <select
                disabled={isTimerRunning}
                value={activeSubjectId}
                onChange={(e) => setActiveSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-bold text-cyan-300 bg-slate-900 border border-white/10 focus:outline-none disabled:opacity-80"
              >
                {subjects.length === 0 ? (
                  <option value="">No subjects created</option>
                ) : (
                  subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-slate-900" />
                  <span>{secondsElapsed > 0 ? "Resume Session" : "Start Timer"}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseSession}
                  className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-900 font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 transition-all transform active:scale-95"
                >
                  <Pause className="w-5 h-5 fill-slate-900" />
                  <span>Pause Timer</span>
                </button>
              )}

              <button
                onClick={handleStopSession}
                disabled={secondsElapsed === 0}
                className="px-5 py-3 rounded-2xl glass-pill border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-2 hover:bg-emerald-500/20 disabled:opacity-40 transition-all"
              >
                <Square className="w-5 h-5 fill-emerald-300" />
                <span>Save & Stop</span>
              </button>

              {secondsElapsed > 0 && !isTimerRunning && (
                <button
                  onClick={handleResetTimer}
                  className="p-3 rounded-2xl glass-pill border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>

            {secondsElapsed > 0 && (
              <input
                type="text"
                placeholder="Session notes (e.g. Completed Chapter 3 Numerical Problems)"
                value={sessionNotes}
                onChange={(e) => {
                  setSessionNotes(e.target.value);
                  persistTimer(isTimerRunning, startTime, accumulatedSeconds, activeSubjectId, e.target.value);
                }}
                className="w-full text-xs px-3 py-2 rounded-xl glass-pill border border-white/10 text-white placeholder-slate-400 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Subjects Overview List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
          <span>Active Subjects & Mastery</span>
          <span className="text-xs font-normal text-slate-400 font-mono">
            Weekly Target vs Actual Logged
          </span>
        </h3>

        {subjects.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h4 className="font-bold text-white font-heading">
              No subjects configured for this profile
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Click "New Subject" above or "Reset Defaults" to seed standard stream subjects for {activeStudent?.stream || "your stream"}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => {
              // Calculate actual logged study time dynamically from studySessions
              const subjSessions = studySessions.filter((s) => s.subjectId === subj.id);
              const totalSecs = subjSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
              const actualCompletedMins = Math.round(totalSecs / 60);

              const progressPct = Math.min(
                100,
                Math.round(
                  (actualCompletedMins / (subj.targetMinutesPerWeek || 300)) * 100
                )
              );

              // Calculate matching academic chapter count
              const matchingChapters = academicChapters.filter(
                (c) =>
                  c.subjectId === subj.id ||
                  c.subjectName?.toLowerCase() === subj.name.toLowerCase()
              );
              const completedChapters = matchingChapters.filter((c) => c.status === "Completed");

              return (
                <div
                  key={subj.id}
                  className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: subj.color || "#10b981" }}
                        />
                        <h4 className="font-bold text-base text-white font-heading">
                          {subj.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(subj)}
                          className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-cyan-300 transition-colors"
                          title="Edit Subject"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSubject(subj.id);
                            showToast(`Deleted "${subj.name}".`);
                          }}
                          className="p-1.5 rounded-lg glass-pill text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between my-1">
                      <div className="text-2xl font-black font-mono text-white">
                        {progressPct}%
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {Math.round(actualCompletedMins / 60)}h / {Math.round((subj.targetMinutesPerWeek || 300) / 60)}h weekly
                      </span>
                    </div>

                    {/* Progress bar visual */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden my-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: subj.color || "#10b981",
                        }}
                      />
                    </div>

                    {/* Chapter / Syllabus metric snippet if available */}
                    {matchingChapters.length > 0 && (
                      <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Syllabus: {completedChapters.length}/{matchingChapters.length} Chapters Done ({Math.round((completedChapters.length / matchingChapters.length) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{subjSessions.length} Study Session(s)</span>
                    <button
                      onClick={() => {
                        setManualSubjectId(subj.id);
                        handleOpenManualModal();
                      }}
                      className="text-cyan-400 hover:underline text-[11px] font-semibold"
                    >
                      + Log Time
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Study Session History Section */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Recent Study Logs</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, edit, or delete past study session entries for {activeStudent?.name || "active profile"}.
            </p>
          </div>

          {/* Search & Subject Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes/dates..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl glass-pill text-xs text-white border border-white/10 focus:outline-none w-36 sm:w-48"
              />
            </div>

            <select
              value={sessionSubjectFilter}
              onChange={(e) => setSessionSubjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-cyan-300 bg-slate-900 border border-white/10 focus:outline-none"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              id="export-study-sessions-csv-btn"
              data-testid="export-study-csv-btn"
              onClick={() => handleExportStudyHistoryCSV(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Export study session history as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredSessions.length})</span>
            </button>
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center italic">
            No logged study sessions match your search or filter.
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredSessions.map((session) => {
              const matchingSubj = subjects.find((s) => s.id === session.subjectId);
              const color = matchingSubj?.color || "#06b6d4";

              return (
                <div
                  key={session.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white font-heading">
                          {session.subjectName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                          {session.date}
                        </span>
                        <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {formatDurationCompact(session.durationSeconds)}
                        </span>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-slate-300 mt-1 italic font-sans">
                          "{session.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto shrink-0">
                    <CalendarSyncDropdown
                      event={{
                        id: session.id,
                        title: `Study Session: ${session.subjectName}`,
                        description: `Duration: ${formatDurationCompact(session.durationSeconds)}${session.notes ? `\nNotes: ${session.notes}` : ""}`,
                        date: session.date,
                        category: "STUDY",
                      }}
                      buttonLabel="Sync"
                      variant="icon"
                    />
                    <button
                      onClick={() => handleOpenEditSessionModal(session)}
                      className="p-1.5 rounded-lg glass-pill text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Edit Logged Session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session)}
                      className="p-1.5 rounded-lg glass-pill text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Session Log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white">
                {editingSubject ? "Edit Subject" : "Add New Subject"}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-2 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accountancy, Physics, Economics..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Study Hours per Week
                </label>
                <select
                  value={newSubjectTarget}
                  onChange={(e) => setNewSubjectTarget(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                >
                  <option value="120">2 Hours / week</option>
                  <option value="240">4 Hours / week</option>
                  <option value="300">5 Hours / week</option>
                  <option value="420">7 Hours / week</option>
                  <option value="600">10 Hours / week</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"].map(
                    (col) => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setNewSubjectColor(col)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          newSubjectColor === col
                            ? "scale-110 border-white shadow-md"
                            : "border-transparent opacity-60"
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 font-bold"
                >
                  {editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Log Study Session Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span>Manual Log Study Session</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-2 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSessionSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={manualSubjectId}
                  onChange={(e) => setManualSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Practiced previous year questions"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold"
                >
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Log Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <span>Edit Study Log Entry</span>
              </h3>
              <button
                onClick={() => setEditingSession(null)}
                className="p-2 rounded-full glass-pill text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSession} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={editSessionSubjectId}
                  onChange={(e) => setEditSessionSubjectId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={editSessionDate}
                  onChange={(e) => setEditSessionDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={editSessionHours}
                    onChange={(e) => setEditSessionHours(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editSessionMinutes}
                    onChange={(e) => setEditSessionMinutes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white bg-slate-900 border border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Notes..."
                  value={editSessionNotes}
                  onChange={(e) => setEditSessionNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 rounded-xl glass-pill text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 font-bold"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
