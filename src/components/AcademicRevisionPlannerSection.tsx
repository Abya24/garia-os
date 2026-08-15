import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Sparkles,
  Clock,
  Trash2,
  Zap,
  RotateCcw,
  Flame,
  Check,
} from "lucide-react";
import {
  AcademicRevisionItem,
  AcademicSubject,
  AcademicChapter,
  ChapterPriority,
  AcademicVVITopic,
  ExamTestRecord,
  StudentProfile,
} from "../types";
import {
  generateSpacedRepetitionSchedule,
  generateComprehensiveRevisionPlan,
  SpacedRepetitionInterval,
} from "../utils/revisionIntelligenceEngine";
import { CalendarSyncDropdown } from "./CalendarSyncDropdown";

interface AcademicRevisionPlannerSectionProps {
  revisions: AcademicRevisionItem[];
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  vviTopics?: AcademicVVITopic[];
  examTests?: ExamTestRecord[];
  activeStudent?: StudentProfile;
  onAddRevision: (revision: Omit<AcademicRevisionItem, "id" | "createdAt">) => void;
  onToggleRevisionComplete: (id: string) => void;
  onDeleteRevision: (id: string) => void;
  onAskAbya?: (topicName: string) => void;
}

export const AcademicRevisionPlannerSection: React.FC<AcademicRevisionPlannerSectionProps> = ({
  revisions,
  subjects,
  chapters,
  vviTopics = [],
  examTests = [],
  activeStudent,
  onAddRevision,
  onToggleRevisionComplete,
  onDeleteRevision,
  onAskAbya,
}) => {
  const [activeTab, setActiveTab] = useState<
    "today" | "upcoming" | "overdue" | "completed" | "auto"
  >("today");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSpacedModal, setShowSpacedModal] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split("T")[0];

  // Form state for Single Revision
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");
  const [formChapterTitle, setFormChapterTitle] = useState<string>("");
  const [formPriority, setFormPriority] = useState<ChapterPriority>("VVI");
  const [formScheduledDate, setFormScheduledDate] = useState<string>(todayStr);
  const [formNotes, setFormNotes] = useState<string>("");

  // Spaced Repetition Modal State
  const [spacedSubjectId, setSpacedSubjectId] = useState<string>(subjects[0]?.id || "");
  const [spacedChapterTitle, setSpacedChapterTitle] = useState<string>("");
  const [spacedPriority, setSpacedPriority] = useState<ChapterPriority>("VVI");
  const [spacedSelectedIntervals, setSpacedSelectedIntervals] = useState<
    SpacedRepetitionInterval[]
  >([1, 3, 7, 15, 30]);

  // Automated Comprehensive Revision Plan from Engine
  const autoPlan = useMemo(() => {
    return generateComprehensiveRevisionPlan(
      chapters,
      vviTopics,
      revisions,
      examTests,
      activeStudent
    );
  }, [chapters, vviTopics, revisions, examTests, activeStudent]);

  const todayRevisions = revisions.filter((r) => !r.completed && r.scheduledDate === todayStr);
  const overdueRevisions = revisions.filter((r) => !r.completed && r.scheduledDate < todayStr);
  const upcomingRevisions = revisions.filter((r) => !r.completed && r.scheduledDate > todayStr);
  const completedRevisions = revisions.filter((r) => r.completed);

  const getDisplayedList = () => {
    switch (activeTab) {
      case "today":
        return todayRevisions;
      case "overdue":
        return overdueRevisions;
      case "upcoming":
        return upcomingRevisions;
      case "completed":
        return completedRevisions;
      default:
        return todayRevisions;
    }
  };

  const displayed = getDisplayedList();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChapterTitle) return;

    const sub = subjects.find((s) => s.id === formSubjectId);
    onAddRevision({
      subjectId: formSubjectId,
      subjectName: sub ? sub.name : "Subject",
      chapterTitle: formChapterTitle,
      priority: formPriority,
      scheduledDate: formScheduledDate,
      completed: false,
      notes: formNotes || "Scheduled revision session",
    });

    setFormChapterTitle("");
    setFormNotes("");
    setShowAddModal(false);
  };

  // Handle Spaced Repetition Multi-Creation
  const handleCreateSpacedSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spacedChapterTitle) return;

    const sub = subjects.find((s) => s.id === spacedSubjectId);
    const subName = sub ? sub.name : "Subject";

    const schedule = generateSpacedRepetitionSchedule(
      spacedSubjectId,
      subName,
      spacedChapterTitle,
      spacedPriority,
      spacedSelectedIntervals
    );

    schedule.forEach((item) => {
      onAddRevision({
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        chapterTitle: item.chapterTitle,
        priority: item.priority,
        scheduledDate: item.scheduledDate,
        completed: false,
        notes: item.notes,
      });
    });

    setSpacedChapterTitle("");
    setShowSpacedModal(false);
  };

  // Schedule auto item
  const handleAddAutoItem = (item: (typeof autoPlan.dailySuggestedRevisions)[0]) => {
    onAddRevision({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      chapterTitle: item.chapterTitle,
      priority: item.priority,
      scheduledDate: todayStr,
      completed: false,
      notes: `${item.reason} • Recommended 1-3-7-15-30 spaced review`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-900/40 via-purple-900/30 to-slate-900/80 border border-amber-500/30 backdrop-blur-md shadow-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Smart Revision Planner
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Spaced Revision Scheduler</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Optimize long-term recall with priority-weighted, recency-based revision cycles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSpacedModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow-lg transition-all shrink-0"
          >
            <RotateCcw className="w-4 h-4" /> Spaced Scheduler (1-3-7-15-30)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-lg transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Single Revision
          </button>
        </div>
      </div>

      {/* View Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("auto")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "auto"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Automated Queue ({autoPlan.dailySuggestedRevisions.length})
        </button>

        <button
          onClick={() => setActiveTab("today")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "today"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Today ({todayRevisions.length})
        </button>

        <button
          onClick={() => setActiveTab("overdue")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "overdue"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Overdue ({overdueRevisions.length})
        </button>

        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "upcoming"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Upcoming ({upcomingRevisions.length})
        </button>

        <button
          onClick={() => setActiveTab("completed")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === "completed"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed ({completedRevisions.length})
        </button>
      </div>

      {/* AI Automated Queue View */}
      {activeTab === "auto" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Adaptive Spaced Repetition & Weak Topic Prioritizer
              </span>
              <p className="text-[11px] text-slate-400">
                Automatically identifies unreviewed chapters, VVI board exam topics, and mock test weak points.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-white/10 px-3 py-1 rounded-xl">
              {autoPlan.dailySuggestedRevisions.length} Tasks
            </span>
          </div>

          <div className="space-y-3">
            {autoPlan.dailySuggestedRevisions.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-indigo-400 font-bold">{item.subjectName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.priority === "VVI"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-slate-400">{item.reason}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{item.chapterTitle}</h4>
                </div>

                <div className="flex items-center gap-2">
                  {onAskAbya && (
                    <button
                      onClick={() => onAskAbya(item.chapterTitle)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10"
                    >
                      Abya Notes
                    </button>
                  )}
                  <button
                    onClick={() => handleAddAutoItem(item)}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Today
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {displayed.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No revisions in this category</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === "overdue"
              ? "Awesome! You have no overdue revisions."
              : "Schedule a revision session to review important formulas and concepts."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Revision Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((rev) => (
            <div
              key={rev.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                rev.completed
                  ? "bg-slate-900/40 border-slate-800/80 opacity-75"
                  : rev.scheduledDate < todayStr
                  ? "bg-rose-950/20 border-rose-900/50"
                  : "bg-slate-900/80 border-slate-800 hover:border-amber-500/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggleRevisionComplete(rev.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                    rev.completed
                      ? "bg-emerald-500 border-emerald-500 text-slate-950"
                      : "bg-slate-800 border-slate-700 text-transparent hover:border-amber-400"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 fill-current" />
                </button>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-amber-400 font-semibold">{rev.subjectName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rev.priority === "VVI"
                          ? "bg-rose-500/20 text-rose-300"
                          : rev.priority === "Important"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {rev.priority}
                    </span>
                    {rev.scheduledDate < todayStr && !rev.completed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        Overdue
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{rev.chapterTitle}</h3>
                  {rev.notes && <p className="text-xs text-slate-400">{rev.notes}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> {rev.scheduledDate}
                </span>
                <CalendarSyncDropdown
                  event={{
                    id: `rev-${rev.id}`,
                    title: `[Revision] ${rev.subjectName}: ${rev.chapterTitle}`,
                    description: `Priority: ${rev.priority}\nScheduled: ${rev.scheduledDate}\nNotes: ${rev.notes || "None"}`,
                    date: rev.scheduledDate,
                    category: "REVISION",
                  }}
                  variant="icon"
                />
                <button
                  onClick={() => onDeleteRevision(rev.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  title="Delete Revision Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Schedule Revision Session
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <select
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chapter / Topic Title</label>
                <input
                  type="text"
                  placeholder="e.g. Partnership Fundamentals"
                  value={formChapterTitle}
                  onChange={(e) => setFormChapterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Priority</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as ChapterPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="VVI">🔥 VVI (Highest Focus)</option>
                  <option value="Important">⚡ Important</option>
                  <option value="Normal">📘 Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scheduled Revision Date</label>
                <input
                  type="date"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes</label>
                <textarea
                  placeholder="e.g. Solve 3 long-answer questions and formulas"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium"
                >
                  Save Revision Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spaced Repetition Multi-Scheduler Modal (1, 3, 7, 15, 30 days) */}
      {showSpacedModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 w-full max-w-md text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <span>Spaced Repetition Generator</span>
              </h3>
              <button
                onClick={() => setShowSpacedModal(false)}
                className="text-slate-400 hover:text-white font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Automatically schedules spaced intervals (Day +1, +3, +7, +15, +30) to establish permanent neurological memory consolidation.
            </p>

            <form onSubmit={handleCreateSpacedSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject</label>
                <select
                  value={spacedSubjectId}
                  onChange={(e) => setSpacedSubjectId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Chapter / Concept Title</label>
                <input
                  type="text"
                  placeholder="e.g. Ray Optics & Optical Instruments"
                  value={spacedChapterTitle}
                  onChange={(e) => setSpacedChapterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Priority</label>
                <select
                  value={spacedPriority}
                  onChange={(e) => setSpacedPriority(e.target.value as ChapterPriority)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="VVI">🔥 VVI (Crucial Examination Focus)</option>
                  <option value="Important">⚡ Important</option>
                  <option value="Normal">📘 Normal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Select Spaced Intervals</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([1, 3, 7, 15, 30] as SpacedRepetitionInterval[]).map((intv) => {
                    const isSelected = spacedSelectedIntervals.includes(intv);
                    return (
                      <button
                        type="button"
                        key={intv}
                        onClick={() => {
                          if (isSelected) {
                            if (spacedSelectedIntervals.length > 1) {
                              setSpacedSelectedIntervals((prev) => prev.filter((i) => i !== intv));
                            }
                          } else {
                            setSpacedSelectedIntervals((prev) => [...prev, intv].sort((a, b) => a - b));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-400"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        +{intv}d
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Will generate {spacedSelectedIntervals.length} linked revision checkpoints.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSpacedModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Generate {spacedSelectedIntervals.length} Cycles
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
