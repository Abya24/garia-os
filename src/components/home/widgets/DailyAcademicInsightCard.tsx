import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Play,
  Plus,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Flame,
  Clock,
  Check,
} from "lucide-react";
import {
  AcademicChapter,
  AcademicSubject,
  Subject,
  Task,
  ActiveTab,
} from "../../../types";
import { getTodayString, saveAcademicChapters } from "../../../utils/storage";
import { AppLanguage } from "../../../utils/i18n";

export interface AcademicInsightSuggestion {
  chapter: AcademicChapter;
  subjectName: string;
  subjectColor: string;
  suggestedTopic: string;
  allWeakChaptersCount: number;
  weakTopicsList: string[];
  reasonText: string;
  estimatedMinutes: number;
}

const SUBJECT_COLOR_HEX: Record<string, string> = {
  emerald: "#10b981",
  cyan: "#06b6d4",
  purple: "#8b5cf6",
  blue: "#3b82f6",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

/**
 * Computes a deterministic Daily Academic Insight revision suggestion
 * based on the user's current `isWeak` chapter status.
 */
export function getDailyAcademicInsight(
  chapters: AcademicChapter[] = [],
  subjects: (AcademicSubject | Subject)[] = [],
  rotationIndex: number = 0
): AcademicInsightSuggestion | null {
  const safeChapters = Array.isArray(chapters) ? chapters : [];
  if (safeChapters.length === 0) return null;

  const subjectMap = new Map<string, { name: string; color: string }>();
  (Array.isArray(subjects) ? subjects : []).forEach((s) => {
    if (s && s.id) {
      const resolvedColor =
        SUBJECT_COLOR_HEX[(s.color || "").toLowerCase()] || s.color || "#06b6d4";
      subjectMap.set(s.id, { name: s.name, color: resolvedColor });
    }
  });

  // Filter chapters flagged with isWeak === true
  const weakChapters = safeChapters.filter((ch) => Boolean(ch && ch.isWeak));

  // Prioritize weak chapters belonging to the user's active subjects if available
  const activeSubjectWeakChapters =
    subjectMap.size > 0
      ? weakChapters.filter((ch) => subjectMap.has(ch.subjectId))
      : weakChapters;

  const pool =
    activeSubjectWeakChapters.length > 0
      ? activeSubjectWeakChapters
      : weakChapters.length > 0
      ? weakChapters
      : safeChapters;

  // Sort pool by priority (VVI > Important > Normal) and lowest revisionCount
  const priorityWeight: Record<string, number> = {
    VVI: 3,
    Important: 2,
    Normal: 1,
  };

  const sortedPool = [...pool].sort((a, b) => {
    if (Boolean(a.isWeak) !== Boolean(b.isWeak)) {
      return a.isWeak ? -1 : 1;
    }
    const weightA = priorityWeight[a.priority || "Normal"] || 1;
    const weightB = priorityWeight[b.priority || "Normal"] || 1;
    if (weightB !== weightA) return weightB - weightA;
    return (a.revisionCount || 0) - (b.revisionCount || 0);
  });

  const safeIdx = Math.abs(rotationIndex) % sortedPool.length;
  const selectedChapter = sortedPool[safeIdx];

  const subjectInfo = subjectMap.get(selectedChapter.subjectId);
  const inferredSubjectName =
    subjectInfo?.name ||
    selectedChapter.subjectName ||
    (selectedChapter.subjectId.includes("acc")
      ? "Accountancy"
      : selectedChapter.subjectId.includes("eco")
      ? "Economics"
      : selectedChapter.subjectId.includes("bst")
      ? "Business Studies"
      : selectedChapter.subjectId.includes("phy")
      ? "Physics"
      : selectedChapter.subjectId.includes("chem")
      ? "Chemistry"
      : selectedChapter.subjectId.includes("math")
      ? "Mathematics"
      : "Core Subject");

  const inferredColor = subjectInfo?.color || "#f43f5e";

  const topics =
    Array.isArray(selectedChapter.topics) && selectedChapter.topics.length > 0
      ? selectedChapter.topics
      : [selectedChapter.title];

  const topicIdx = Math.abs(rotationIndex) % topics.length;
  const suggestedTopic = topics[topicIdx] || selectedChapter.title;

  const revCount = selectedChapter.revisionCount ?? 0;
  const reasonText = selectedChapter.isWeak
    ? `Flagged as a Weak Chapter (isWeak) with ${
        selectedChapter.priority || "High"
      } exam priority and ${revCount} completed ${
        revCount === 1 ? "revision" : "revisions"
      }.${selectedChapter.notes ? ` Note: ${selectedChapter.notes}` : ""}`
    : `All chapters are currently marked strong! Suggested next high-yield topic from ${selectedChapter.title} to maintain mastery.`;

  return {
    chapter: selectedChapter,
    subjectName: inferredSubjectName,
    subjectColor: inferredColor,
    suggestedTopic,
    allWeakChaptersCount: weakChapters.length,
    weakTopicsList: topics,
    reasonText,
    estimatedMinutes: selectedChapter.priority === "VVI" ? 35 : 25,
  };
}

export interface DailyAcademicInsightCardProps {
  academicChapters: AcademicChapter[];
  academicSubjects?: AcademicSubject[];
  subjects?: Subject[];
  profileId?: string;
  currentLanguage?: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onAddTask?: (task: Omit<Task, "id" | "createdAt">) => void;
  onChaptersChange?: (updated: AcademicChapter[]) => void;
  className?: string;
}

export const DailyAcademicInsightCard: React.FC<DailyAcademicInsightCardProps> = ({
  academicChapters = [],
  academicSubjects = [],
  subjects = [],
  profileId,
  currentLanguage = "en",
  onNavigate,
  onAddTask,
  onChaptersChange,
  className = "",
}) => {
  const [localChapters, setLocalChapters] = useState<AcademicChapter[]>(academicChapters);
  const [rotationIndex, setRotationIndex] = useState<number>(0);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [taskAddedFeedback, setTaskAddedFeedback] = useState<boolean>(false);
  const [showWeakChapterManager, setShowWeakChapterManager] = useState<boolean>(false);

  // Sync when prop updates
  React.useEffect(() => {
    if (Array.isArray(academicChapters) && academicChapters.length > 0) {
      setLocalChapters(academicChapters);
    }
  }, [academicChapters]);

  const combinedSubjects = useMemo(() => {
    return [...(academicSubjects || []), ...(subjects || [])];
  }, [academicSubjects, subjects]);

  const insight = useMemo(() => {
    return getDailyAcademicInsight(localChapters, combinedSubjects, rotationIndex);
  }, [localChapters, combinedSubjects, rotationIndex]);

  if (!insight) return null;

  const activeTopic =
    insight.weakTopicsList[selectedTopicIndex % insight.weakTopicsList.length] ||
    insight.suggestedTopic;

  const handleNextSuggestion = () => {
    setRotationIndex((prev) => prev + 1);
    setSelectedTopicIndex(0);
    setTaskAddedFeedback(false);
  };

  const handleScheduleRevisionTask = () => {
    if (!onAddTask) {
      onNavigate("tasks");
      return;
    }
    onAddTask({
      title: `Revise Weak Topic: ${activeTopic} (${insight.chapter.title})`,
      description: `Daily Academic Insight revision for weak chapter "${insight.chapter.title}" in ${insight.subjectName}.`,
      date: getTodayString(),
      priority: "high",
      category: "study",
      completed: false,
      subjectId: insight.chapter.subjectId,
      subjectName: insight.subjectName,
    });
    setTaskAddedFeedback(true);
    setTimeout(() => setTaskAddedFeedback(false), 2800);
  };

  const handleToggleChapterWeakStatus = (targetChapterId: string) => {
    const updated = localChapters.map((ch) =>
      ch.id === targetChapterId ? { ...ch, isWeak: !ch.isWeak } : ch
    );
    setLocalChapters(updated);
    saveAcademicChapters(updated, profileId);
    if (onChaptersChange) {
      onChaptersChange(updated);
    }
  };

  const weakChaptersList = localChapters.filter((ch) => Boolean(ch.isWeak));

  return (
    <motion.section
      id="daily-academic-insight-card"
      aria-label="Daily Academic Insight"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`glass-card rounded-3xl p-5 sm:p-6 border border-rose-500/35 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-rose-950/25 shadow-lg space-y-4 ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/35 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-rose-300 font-medium flex-wrap">
              <span>
                {currentLanguage === "hi"
                  ? "दैनिक शैक्षणिक अंतर्दृष्टि"
                  : "Daily Academic Insight"}
              </span>
              <span aria-hidden="true">·</span>
              <span
                id="daily-insight-weak-count-badge"
                className="text-amber-300 font-mono tabular-nums font-semibold"
              >
                {insight.allWeakChaptersCount}{" "}
                {insight.allWeakChaptersCount === 1
                  ? "Weak Chapter Flagged"
                  : "Weak Chapters Flagged"}{" "}
                (isWeak)
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight">
              {currentLanguage === "hi"
                ? "कमजोर अध्याय (isWeak) पर आधारित आज का रिवीजन सुझाव"
                : "Suggested Topic to Revise Today"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
          <button
            type="button"
            id="daily-insight-manage-weak-btn"
            onClick={() => setShowWeakChapterManager((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>
              {showWeakChapterManager ? "Hide Weak Chapters" : "Manage isWeak Status"}
            </span>
          </button>

          <button
            type="button"
            id="daily-insight-next-topic-btn"
            onClick={handleNextSuggestion}
            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Cycle to the next weak chapter or topic suggestion"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-300" />
            <span>Next Suggestion</span>
          </button>
        </div>
      </div>

      {/* Main Suggestion Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 8 Cols: Suggested Topic & Weak Chapter Details */}
        <div className="lg:col-span-8 p-4 rounded-2xl bg-slate-950/80 border border-rose-500/25 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            {/* Metadata Line (Unboxed clean metadata with separators) */}
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span
                id="daily-insight-subject-name"
                className="font-bold text-cyan-300 flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{insight.subjectName}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-rose-300 font-semibold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                <span>
                  {insight.chapter.isWeak
                    ? "isWeak Chapter Status: Active"
                    : "Mastery Maintenance"}
                </span>
              </span>
              {insight.chapter.priority && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {insight.chapter.priority} Priority
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-400">
                Revisions: {insight.chapter.revisionCount ?? 0}
              </span>
            </div>

            {/* Suggested Topic Headline */}
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-rose-300/90">
                Recommended Revision Topic
              </div>
              <h3
                id="daily-insight-suggested-topic"
                className="text-lg sm:text-xl font-extrabold text-white font-heading tracking-tight"
              >
                {activeTopic}
              </h3>
              <p
                id="daily-insight-chapter-title"
                className="text-xs sm:text-sm text-slate-300 font-medium"
              >
                Chapter: <span className="text-white font-semibold">{insight.chapter.title}</span>
              </p>
            </div>

            {/* Interactive Topic Switcher within this Weak Chapter */}
            {insight.weakTopicsList.length > 1 && (
              <div className="pt-1 space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Sub-topics in this weak chapter (click to focus):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {insight.weakTopicsList.map((topic, idx) => {
                    const isCurrent =
                      idx === selectedTopicIndex % insight.weakTopicsList.length;
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopicIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isCurrent
                            ? "bg-rose-500/25 text-rose-200 border border-rose-500/50 font-semibold"
                            : "bg-slate-900/90 text-slate-400 hover:text-white border border-white/10"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Why Suggested Diagnostic Box */}
          <div
            id="daily-insight-reason"
            className="p-3 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Why revise this today: </span>
              <span>{insight.reasonText}</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick Action Controls */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Action Plan</span>
              <span className="font-mono tabular-nums flex items-center gap-1 text-cyan-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>~{insight.estimatedMinutes}m session</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Complete a focused {insight.estimatedMinutes}-minute active recall session on{" "}
              <strong className="text-white">{activeTopic}</strong> or add it directly to today&apos;s high-priority task list.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="daily-insight-start-study-btn"
              onClick={() => onNavigate("study")}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Revision Session</span>
            </button>

            <button
              type="button"
              id="daily-insight-add-task-btn"
              onClick={handleScheduleRevisionTask}
              className="w-full py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/35 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {taskAddedFeedback ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Added to Today&apos;s Tasks ✓</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Revision Task to Today</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="daily-insight-toggle-weak-btn"
              onClick={() => handleToggleChapterWeakStatus(insight.chapter.id)}
              className="w-full py-2 px-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {insight.chapter.isWeak
                  ? "Mark Chapter Strengthened"
                  : "Flag Chapter as Weak (isWeak)"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Weak Chapters Status Manager */}
      <AnimatePresence>
        {showWeakChapterManager && (
          <motion.div
            id="daily-insight-weak-chapters-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 border-t border-white/10 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                Toggle Chapter &apos;isWeak&apos; Status ({weakChaptersList.length} Weak Flagged)
              </span>
              <button
                type="button"
                onClick={() => onNavigate("exam")}
                className="text-cyan-300 hover:text-cyan-200 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Syllabus</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {localChapters.slice(0, 12).map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleToggleChapterWeakStatus(ch.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    ch.isWeak
                      ? "bg-rose-950/30 border-rose-500/45 text-white"
                      : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{ch.title}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {ch.isWeak ? "Status: isWeak = true" : "Status: Strong"}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      ch.isWeak
                        ? "bg-rose-500/25 text-rose-300 border border-rose-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {ch.isWeak ? "Weak" : "Normal"}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
