import React, { useState } from "react";
import { Award, Target, Plus, TrendingUp, CheckCircle2, FileText, Trash2 } from "lucide-react";
import { AcademicPracticeSession, AcademicSubject, AcademicChapter } from "../types";
import { calculatePracticeStats } from "../utils/academicEngine";

interface AcademicPracticeTrackerSectionProps {
  practiceSessions: AcademicPracticeSession[];
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  onAddPracticeSession: (session: Omit<AcademicPracticeSession, "id" | "createdAt">) => void;
  onDeletePracticeSession: (id: string) => void;
}

export const AcademicPracticeTrackerSection: React.FC<AcademicPracticeTrackerSectionProps> = ({
  practiceSessions,
  subjects,
  chapters,
  onAddPracticeSession,
  onDeletePracticeSession,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];

  // Form state
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");
  const [formChapterTitle, setFormChapterTitle] = useState<string>("");
  const [formType, setFormType] = useState<"PYQ" | "Mock Test" | "Chapter Test" | "Practice Set">("PYQ");
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formScore, setFormScore] = useState<number>(45);
  const [formMaxMarks, setFormMaxMarks] = useState<number>(50);
  const [formNotes, setFormNotes] = useState<string>("");

  const stats = calculatePracticeStats(practiceSessions);

  const filteredSessions = practiceSessions.filter((s) =>
    selectedTypeFilter === "ALL" ? true : s.practiceType === selectedTypeFilter
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChapterTitle || formMaxMarks <= 0) return;

    const sub = subjects.find((s) => s.id === formSubjectId);
    const scorePct = Math.round((formScore / formMaxMarks) * 100);

    onAddPracticeSession({
      subjectId: formSubjectId,
      subjectName: sub ? sub.name : "Subject",
      chapterTitle: formChapterTitle,
      practiceType: formType,
      date: formDate,
      score: formScore,
      maxMarks: formMaxMarks,
      accuracyPercentage: scorePct,
      notes: formNotes || "Practice session completed",
    });

    setFormChapterTitle("");
    setFormNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/80 border border-emerald-500/30 backdrop-blur-md shadow-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> PYQ & Mock Practice Tracker
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Exam Practice & Question Bank</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            TrackPrevious Year Question papers, mock timing tests, and accuracy statistics.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Practice Test
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-white">
          <div className="text-xs text-slate-400">Total Practice Sets</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.totalAttempts}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-white">
          <div className="text-xs text-slate-400">Average Score</div>
          <div className="text-2xl font-black text-teal-300 mt-1">{stats.avgScorePercentage}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-white">
          <div className="text-xs text-slate-400">Best Score</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.bestScorePercentage}%</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-white">
          <div className="text-xs text-slate-400">Avg Accuracy</div>
          <div className="text-2xl font-black text-purple-400 mt-1">{stats.avgAccuracyPercentage}%</div>
        </div>
      </div>

      {/* Subject Wise Performance Breakdown */}
      {Object.keys(stats.subjectWise).length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Subject-wise Accuracy Breakdown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(stats.subjectWise).map((sw, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-white">
                <div className="font-semibold text-emerald-300 mb-1">{sw.subjectName}</div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Attempts: {sw.attempts}</span>
                  <span className="font-bold text-teal-400">{sw.avgScorePct}% Avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["ALL", "PYQ", "Mock Test", "Chapter Test", "Practice Set"].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedTypeFilter(type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedTypeFilter === type
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200"
            }`}
          >
            {type === "ALL" ? `All Practice (${practiceSessions.length})` : type}
          </button>
        ))}
      </div>

      {/* Practice Log List */}
      {filteredSessions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Target className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No practice sessions logged yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Log PYQ paper attempts and mock test scores to build test confidence and track subject accuracy.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-medium border border-slate-700 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log First Practice Set
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((ps) => {
            const pct = Math.round((ps.score / ps.maxMarks) * 100);
            return (
              <div
                key={ps.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-emerald-400">{ps.subjectName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {ps.practiceType}
                    </span>
                    <span className="text-[11px] text-slate-500">{ps.date}</span>
                  </div>
                  <h3 className="font-bold text-slate-100 text-sm">{ps.chapterTitle}</h3>
                  {ps.notes && <p className="text-xs text-slate-400">{ps.notes}</p>}
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-100">
                      {ps.score} / {ps.maxMarks}
                    </div>
                    <div className="text-xs font-semibold text-emerald-400">{pct}% Accuracy</div>
                  </div>
                  <button
                    onClick={() => onDeletePracticeSession(ps.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" /> Log Practice Test / PYQs
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
                <label className="block text-slate-300 font-medium mb-1">Chapter / Test Title</label>
                <input
                  type="text"
                  placeholder="e.g. 2024 Board PYQ Paper 1"
                  value={formChapterTitle}
                  onChange={(e) => setFormChapterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="PYQ">PYQ Paper</option>
                    <option value="Mock Test">Mock Test</option>
                    <option value="Chapter Test">Chapter Test</option>
                    <option value="Practice Set">Practice Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Score Obtained</label>
                  <input
                    type="number"
                    value={formScore}
                    onChange={(e) => setFormScore(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={formMaxMarks}
                    onChange={(e) => setFormMaxMarks(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Analysis</label>
                <textarea
                  placeholder="e.g. Made calculation errors in Question 4"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  Save Practice Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
