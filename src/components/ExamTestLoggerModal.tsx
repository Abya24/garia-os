import React, { useState } from "react";
import { X, Award, CheckCircle2, AlertTriangle, Clock, Calendar, FileText, CheckSquare, Plus } from "lucide-react";
import { AcademicSubject, ExamTestRecord } from "../types";
import { getTodayString } from "../utils/storage";

interface ExamTestLoggerModalProps {
  isOpen: boolean;
  subjects: AcademicSubject[];
  onClose: () => void;
  onSaveTest: (test: Omit<ExamTestRecord, "id" | "createdAt">) => void;
  editingTest?: ExamTestRecord | null;
}

export const ExamTestLoggerModal: React.FC<ExamTestLoggerModalProps> = ({
  isOpen,
  subjects,
  onClose,
  onSaveTest,
  editingTest,
}) => {
  if (!isOpen) return null;

  const defaultSubjectId = editingTest?.subjectId || subjects[0]?.id || "";
  const defaultSubjectObj = subjects.find((s) => s.id === defaultSubjectId);

  const [subjectId, setSubjectId] = useState<string>(defaultSubjectId);
  const [subjectName, setSubjectName] = useState<string>(
    editingTest?.subjectName || defaultSubjectObj?.name || subjects[0]?.name || "Accountancy"
  );
  const [testName, setTestName] = useState<string>(editingTest?.testName || "Mid-Term Practice Test");
  const [date, setDate] = useState<string>(
    editingTest?.date || getTodayString()
  );
  const [maxMarks, setMaxMarks] = useState<number>(editingTest?.maxMarks ?? 100);
  const [marksObtained, setMarksObtained] = useState<number>(editingTest?.marksObtained ?? 75);
  const [totalQuestions, setTotalQuestions] = useState<number>(editingTest?.totalQuestions ?? 50);
  const [correctAnswers, setCorrectAnswers] = useState<number>(editingTest?.correctAnswers ?? 38);
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(editingTest?.incorrectAnswers ?? 8);
  const [unattemptedQuestions, setUnattemptedQuestions] = useState<number>(editingTest?.unattemptedQuestions ?? 4);
  const [timeTakenMinutes, setTimeTakenMinutes] = useState<number>(editingTest?.timeTakenMinutes ?? 60);
  const [notes, setNotes] = useState<string>(editingTest?.notes || "");

  const handleSubjectChange = (sId: string) => {
    setSubjectId(sId);
    const found = subjects.find((s) => s.id === sId);
    if (found) setSubjectName(found.name);
  };

  // Live Auto Calculations
  const calculatedPercentage =
    maxMarks > 0 ? Math.min(100, Math.max(0, (marksObtained / maxMarks) * 100)) : 0;

  const totalAttempted = correctAnswers + incorrectAnswers;
  const calculatedAccuracy =
    totalAttempted > 0 ? Math.min(100, (correctAnswers / totalAttempted) * 100) : 0;

  const calculatedAttemptRate =
    totalQuestions > 0 ? Math.min(100, (totalAttempted / totalQuestions) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) return;

    onSaveTest({
      subjectId,
      subjectName,
      testName,
      date,
      maxMarks: Number(maxMarks),
      marksObtained: Number(marksObtained),
      totalQuestions: Number(totalQuestions),
      correctAnswers: Number(correctAnswers),
      incorrectAnswers: Number(incorrectAnswers),
      unattemptedQuestions: Number(unattemptedQuestions),
      timeTakenMinutes: Number(timeTakenMinutes),
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {editingTest ? "Edit Test Record" : "Record Test Performance"}
              </h3>
              <p className="text-xs text-slate-400">
                Log exam marks and question accuracy to generate AI insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top Calculations Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-white/10 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Percentage
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {calculatedPercentage.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Accuracy
              </span>
              <span className="text-2xl font-black text-cyan-400">
                {calculatedAccuracy.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Attempt Rate
              </span>
              <span className="text-2xl font-black text-purple-400">
                {calculatedAttemptRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Subject
              </label>
              <select
                value={subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.stream})
                  </option>
                ))}
              </select>
            </div>

            {/* Test Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Exam / Test Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Unit Test 2, Chapter 4 Quiz, Pre-Board"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Test Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Time Taken */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Time Taken (Minutes)
              </label>
              <input
                type="number"
                min="0"
                value={timeTakenMinutes}
                onChange={(e) => setTimeTakenMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Maximum Marks */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Maximum Marks
              </label>
              <input
                type="number"
                min="1"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            {/* Marks Obtained */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Marks Obtained
              </label>
              <input
                type="number"
                min="0"
                max={maxMarks}
                value={marksObtained}
                onChange={(e) => setMarksObtained(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Question Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" /> Detailed Question Analysis
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Total Questions</label>
                <input
                  type="number"
                  min="0"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] text-emerald-400 mb-1">Correct Answers</label>
                <input
                  type="number"
                  min="0"
                  value={correctAnswers}
                  onChange={(e) => setCorrectAnswers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-rose-400 mb-1">Incorrect Answers</label>
                <input
                  type="number"
                  min="0"
                  value={incorrectAnswers}
                  onChange={(e) => setIncorrectAnswers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-amber-400 mb-1">Unattempted</label>
                <input
                  type="number"
                  min="0"
                  value={unattemptedQuestions}
                  onChange={(e) => setUnattemptedQuestions(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Revision Notes / Weak Areas Identified
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Need to revise ratio calculations and Partnership goodwill concepts."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              {editingTest ? "Update Record" : "Save Performance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
