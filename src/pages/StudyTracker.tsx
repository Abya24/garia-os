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
  ArrowLeft,
} from "lucide-react";
import { Subject, StudySession, AcademicChapter, StudentProfile } from "../types";
import { getTodayString } from "../utils/storage";
import { CalendarSyncDropdown } from "../components/CalendarSyncDropdown";
import { getStudyMilestones } from "../utils/gamificationEngine";
import { MilestoneBadgesCard } from "../components/MilestoneBadgesCard";

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
  onBack,
}) => {
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
      onLogStudySession({
        subjectId: activeSubj.id,
        subjectName: activeSubj.name,
        durationSeconds: secondsElapsed,
        date: getTodayString(),
        notes: sessionNotes,
      });
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

    onLogStudySession({
      subjectId: selectedSubj.id,
      subjectName: selectedSubj.name,
      durationSeconds: totalSecs,
      date: manualDate || getTodayString(),
      notes: manualNotes,
    });

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
    if (window.confirm(`Delete ${Math.round(session.durationSeconds / 60)} min session for ${session.subjectName}?`)) {
      if (onDeleteStudySession) {
        onDeleteStudySession(session.id);
        showToast("Session deleted.");
      }
    }
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, "0") + ":" : ""}${String(
      mins
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatDurationDisplay = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.round((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
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

  const studyMilestones = getStudyMilestones(studySessions, subjects);

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              id="study-tracker-back-btn"
              aria-label="Go Back"
              className="p-2 sm:px-3.5 sm:py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Study Tracker
              </h1>
              {activeStudent && (
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                  {activeStudent.name} ({activeStudent.stream})
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Track live study sessions, log offline hours, and analyze subject mastery.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
                if (window.confirm("Restore default subjects for your stream? Custom subjects will be replaced with standard defaults.")) {
                  onResetSubjectsToDefaults();
                  showToast("Subjects restored to stream defaults.");
                }
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
              {formatTimer(secondsElapsed)}
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
                            if (window.confirm(`Delete subject "${subj.name}"?`)) {
                              onDeleteSubject(subj.id);
                              showToast(`Deleted "${subj.name}".`);
                            }
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
                          {formatDurationDisplay(session.durationSeconds)}
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
                        description: `Duration: ${formatDurationDisplay(session.durationSeconds)}${session.notes ? `\nNotes: ${session.notes}` : ""}`,
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
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
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
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
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
            className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 shadow-2xl space-y-4"
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
