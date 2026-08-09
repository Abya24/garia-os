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
} from "lucide-react";
import { Subject, StudySession } from "../types";
import { getTodayString } from "../utils/storage";

interface StudyTrackerProps {
  subjects: Subject[];
  studySessions: StudySession[];
  onAddSubject: (subj: Omit<Subject, "id" | "completedMinutes" | "totalSessions">) => void;
  onUpdateSubject?: (subj: Subject) => void;
  onDeleteSubject: (id: string) => void;
  onLogStudySession: (session: Omit<StudySession, "id" | "timestamp">) => void;
}

export const StudyTracker: React.FC<StudyTrackerProps> = ({
  subjects,
  studySessions,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onLogStudySession,
}) => {
  // Active Timer State
  const [activeSubjectId, setActiveSubjectId] = useState<string>("");
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectTarget, setNewSubjectTarget] = useState("300"); // 5 hours default target per week
  const [newSubjectColor, setNewSubjectColor] = useState("#10b981");

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartSession = () => {
    if (!activeSubjectId && subjects.length > 0) {
      setActiveSubjectId(subjects[0].id);
    }
    setIsTimerRunning(true);
  };

  const handlePauseSession = () => {
    setIsTimerRunning(false);
  };

  const handleStopSession = () => {
    if (isSaving) return;
    setIsSaving(true);

    if (secondsElapsed > 0 && activeSubjectId) {
      const activeSubj = subjects.find((s) => s.id === activeSubjectId);
      if (activeSubj) {
        onLogStudySession({
          subjectId: activeSubj.id,
          subjectName: activeSubj.name,
          durationSeconds: secondsElapsed,
          date: getTodayString(),
          notes: sessionNotes,
        });
      }
    }

    setIsTimerRunning(false);
    setSecondsElapsed(0);
    setSessionNotes("");
    setTimeout(() => setIsSaving(false), 500);
  };

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
    } else {
      onAddSubject({
        name: newSubjectName.trim(),
        targetMinutesPerWeek: parseInt(newSubjectTarget) || 300,
        color: newSubjectColor,
      });
    }

    setNewSubjectName("");
    setEditingSubject(null);
    setIsSubjectModalOpen(false);
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs > 0 ? String(hrs).padStart(2, "0") + ":" : ""}${String(
      mins
    ).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Study Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track actual study duration per subject and master your syllabus.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Active Study Session Timer Card */}
      <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-emerald-950/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left w-full md:w-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Live Study Session</span>
            </span>

            <div className="text-4xl sm:text-6xl font-extrabold font-mono tracking-wider text-white py-2">
              {formatTimer(secondsElapsed)}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2">
              <label className="text-xs text-slate-400 font-medium">
                Subject:
              </label>
              <select
                disabled={isTimerRunning}
                value={activeSubjectId}
                onChange={(e) => setActiveSubjectId(e.target.value)}
                className="px-3 py-1.5 rounded-xl glass-pill text-xs font-bold text-cyan-300 bg-slate-900 border border-white/10 focus:outline-none"
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
            <div className="flex items-center gap-3">
              {!isTimerRunning ? (
                <button
                  onClick={handleStartSession}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
                >
                  <Play className="w-5 h-5 fill-slate-900" />
                  <span>Start Session</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseSession}
                  className="px-6 py-3 rounded-2xl bg-amber-500 text-slate-900 font-extrabold flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 transition-all transform active:scale-95"
                >
                  <Pause className="w-5 h-5 fill-slate-900" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleStopSession}
                disabled={secondsElapsed === 0}
                className="px-5 py-3 rounded-2xl glass-pill border border-rose-500/30 text-rose-400 font-bold flex items-center gap-2 hover:bg-rose-500/20 disabled:opacity-40 transition-all"
              >
                <Square className="w-5 h-5 fill-rose-400" />
                <span>Save & Stop</span>
              </button>
            </div>

            {secondsElapsed > 0 && (
              <input
                type="text"
                placeholder="Session notes (e.g., Chapter 4 practice completed)"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-xl glass-pill border border-white/10 text-white placeholder-slate-400 focus:outline-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Subjects Overview List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-heading text-white flex items-center justify-between">
          <span>Subjects & Progress</span>
          <span className="text-xs font-normal text-slate-400 font-mono">
            Target per week vs Logged
          </span>
        </h3>

        {subjects.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center border border-white/10">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h4 className="font-bold text-white font-heading">
              No subjects added yet
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Click "New Subject" above to create Accountancy, Economics, or Business Studies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subj) => {
              const progressPct = Math.min(
                100,
                Math.round(
                  (subj.completedMinutes / subj.targetMinutesPerWeek) * 100
                )
              );

              return (
                <div
                  key={subj.id}
                  className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
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
                          onClick={() => onDeleteSubject(subj.id)}
                          className="p-1.5 rounded-lg glass-pill text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-2xl font-black font-mono text-white my-2">
                      {progressPct}%
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
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      {Math.round(subj.completedMinutes / 60)}h /{" "}
                      {Math.round(subj.targetMinutesPerWeek / 60)}h per wk
                    </span>
                    <span>{subj.totalSessions} Sessions</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
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
                  placeholder="e.g. Accountancy, Economics, Physics..."
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-pill text-white border border-white/10 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Target Study Minutes per Week
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
                  {["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899"].map(
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
                  {editingSubject ? "Save Subject" : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
