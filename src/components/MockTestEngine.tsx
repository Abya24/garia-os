import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Award,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Flame,
  AlertTriangle,
  Play,
  Check,
  TrendingUp,
} from "lucide-react";
import { TopicMCQ, StudentProfile } from "../types";
import { SEED_MCQS } from "../utils/questionBankEngine";

export type MockTestMode = "full" | "subject" | "chapter" | "topic" | "speed";

export interface MockTestHistoryRecord {
  id: string;
  mode: MockTestMode;
  modeLabel: string;
  classLevel: string;
  subjectName: string;
  chapterTitle?: string;
  topicTitle?: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattemptedAnswers: number;
  accuracyPct: number;
  timeSpentSeconds: number;
  dateStr: string;
  timestamp: number;
  topicBreakdown: {
    topicName: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
}

interface MockTestEngineProps {
  activeStudent?: StudentProfile;
  availableMCQs: TopicMCQ[];
  onSaveToExamCenter?: (record: {
    testName: string;
    subjectName: string;
    score: number;
    maxMarks: number;
    correct: number;
    incorrect: number;
    timeMinutes: number;
  }) => void;
  onNavigateToAbya?: (topicName: string) => void;
}

export const MockTestEngine: React.FC<MockTestEngineProps> = ({
  activeStudent,
  availableMCQs,
  onSaveToExamCenter,
  onNavigateToAbya,
}) => {
  // Storage key for history
  const profileId = activeStudent?.id || "default";
  const storageKey = `garia_mock_test_history_${profileId}`;

  // Mode Selection
  const [selectedMode, setSelectedMode] = useState<MockTestMode>("full");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedChapter, setSelectedChapter] = useState<string>("ALL");
  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");
  const [speedPerQuestionSeconds, setSpeedPerQuestionSeconds] = useState<number>(30); // 30s per question for speed test

  // Test Running State
  const [testState, setTestState] = useState<"IDLE" | "ACTIVE" | "REVIEW">("IDLE");
  const [testQuestions, setTestQuestions] = useState<TopicMCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(600);
  const [initialDurationSeconds, setInitialDurationSeconds] = useState<number>(600);
  const [currentResultRecord, setCurrentResultRecord] = useState<MockTestHistoryRecord | null>(null);

  // Performance History
  const [history, setHistory] = useState<MockTestHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const saveHistoryRecord = (record: MockTestHistoryRecord) => {
    const updated = [record, ...history].slice(0, 30); // keep last 30
    setHistory(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Extract unique subjects, chapters, topics from availableMCQs
  const safeAvailableMCQs = useMemo(() => {
    return Array.isArray(availableMCQs) ? availableMCQs : [];
  }, [availableMCQs]);

  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    safeAvailableMCQs.forEach((m) => {
      if (m && m.subjectName) set.add(m.subjectName);
    });
    return Array.from(set);
  }, [safeAvailableMCQs]);

  const chaptersList = useMemo(() => {
    const set = new Set<string>();
    safeAvailableMCQs
      .filter((m) => m && (selectedSubject === "ALL" || m.subjectName === selectedSubject))
      .forEach((m) => {
        if (m && m.chapterTitle) set.add(m.chapterTitle);
      });
    return Array.from(set);
  }, [safeAvailableMCQs, selectedSubject]);

  const topicsList = useMemo(() => {
    const set = new Set<string>();
    safeAvailableMCQs
      .filter(
        (m) =>
          m &&
          (selectedSubject === "ALL" || m.subjectName === selectedSubject) &&
          (selectedChapter === "ALL" || m.chapterTitle === selectedChapter)
      )
      .forEach((m) => {
        if (m && m.topicName) set.add(m.topicName);
      });
    return Array.from(set);
  }, [safeAvailableMCQs, selectedSubject, selectedChapter]);

  // Launch Test Logic
  const handleStartTest = () => {
    let pool = [...safeAvailableMCQs];
    if (pool.length === 0) {
      pool = [...SEED_MCQS];
    }

    if (selectedMode === "subject" && selectedSubject !== "ALL") {
      pool = pool.filter((q) => q.subjectName === selectedSubject);
    } else if (selectedMode === "chapter") {
      if (selectedSubject !== "ALL") pool = pool.filter((q) => q.subjectName === selectedSubject);
      if (selectedChapter !== "ALL") pool = pool.filter((q) => q.chapterTitle === selectedChapter);
    } else if (selectedMode === "topic") {
      if (selectedSubject !== "ALL") pool = pool.filter((q) => q.subjectName === selectedSubject);
      if (selectedChapter !== "ALL") pool = pool.filter((q) => q.chapterTitle === selectedChapter);
      if (selectedTopic !== "ALL") pool = pool.filter((q) => q.topicName === selectedTopic);
    }

    if (pool.length === 0) pool = [...availableMCQs];

    let questionCount = 10;
    let durationSec = 600; // 10 min

    if (selectedMode === "full") {
      questionCount = Math.min(pool.length, 15);
      durationSec = questionCount * 60; // 1 min per Q
    } else if (selectedMode === "subject") {
      questionCount = Math.min(pool.length, 10);
      durationSec = questionCount * 60;
    } else if (selectedMode === "chapter") {
      questionCount = Math.min(pool.length, 8);
      durationSec = questionCount * 60;
    } else if (selectedMode === "topic") {
      questionCount = Math.min(pool.length, 5);
      durationSec = questionCount * 60;
    } else if (selectedMode === "speed") {
      questionCount = Math.min(pool.length, 10);
      durationSec = questionCount * speedPerQuestionSeconds;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, questionCount);

    setTestQuestions(shuffled);
    setCurrentIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(durationSec);
    setInitialDurationSeconds(durationSec);
    setTestState("ACTIVE");
    setCurrentResultRecord(null);
  };

  // Submit test and generate deep result
  const handleSubmitTest = (autoSubmit: boolean = false) => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const topicMap: Record<string, { correct: number; total: number }> = {};

    testQuestions.forEach((q, idx) => {
      const topName = q.topicName || q.chapterTitle || "General Concepts";
      if (!topicMap[topName]) {
        topicMap[topName] = { correct: 0, total: 0 };
      }
      topicMap[topName].total += 1;

      const userAns = userAnswers[idx];
      if (userAns === undefined || userAns === null) {
        unattemptedCount++;
      } else if (userAns === q.correctOptionIndex) {
        correctCount++;
        topicMap[topName].correct += 1;
      } else {
        incorrectCount++;
      }
    });

    const totalQ = testQuestions.length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;
    const timeSpent = Math.max(1, initialDurationSeconds - timeLeftSeconds);

    const modeLabels: Record<MockTestMode, string> = {
      full: "Full Syllabus Mock Test",
      subject: "Subject Mock Test",
      chapter: "Chapter Test",
      topic: "Topic Drill Test",
      speed: "Rapid Speed Test",
    };

    const topicBreakdown = Object.entries(topicMap).map(([tName, data]) => ({
      topicName: tName,
      correct: data.correct,
      total: data.total,
      accuracy: Math.round((data.correct / data.total) * 100),
    }));

    const resultRecord: MockTestHistoryRecord = {
      id: `mock-${Date.now()}`,
      mode: selectedMode,
      modeLabel: modeLabels[selectedMode],
      classLevel: activeStudent?.classLevel || "Class 12",
      subjectName: selectedSubject === "ALL" ? "All Subjects" : selectedSubject,
      chapterTitle: selectedChapter !== "ALL" ? selectedChapter : undefined,
      topicTitle: selectedTopic !== "ALL" ? selectedTopic : undefined,
      totalQuestions: totalQ,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unattemptedAnswers: unattemptedCount,
      accuracyPct: accuracy,
      timeSpentSeconds: timeSpent,
      dateStr: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      topicBreakdown,
    };

    setCurrentResultRecord(resultRecord);
    saveHistoryRecord(resultRecord);
    setTestState("REVIEW");

    if (onSaveToExamCenter) {
      onSaveToExamCenter({
        testName: `${resultRecord.modeLabel} (${resultRecord.subjectName})`,
        subjectName: resultRecord.subjectName,
        score: correctCount * 4,
        maxMarks: totalQ * 4,
        correct: correctCount,
        incorrect: incorrectCount,
        timeMinutes: Math.round(timeSpent / 60),
      });
    }
  };

  // Timer Effect with Auto Submission
  useEffect(() => {
    if (testState !== "ACTIVE") return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testState, timeLeftSeconds, userAnswers, testQuestions]);

  const currentQ = testQuestions[currentIndex];

  return (
    <div className="space-y-6">
      {/* 1. IDLE MODE: SETUP AND MODE SELECTOR */}
      {testState === "IDLE" && (
        <div className="space-y-6">
          {/* Mode Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                id: "full" as MockTestMode,
                title: "Full Syllabus",
                desc: "15 Comprehensive questions simulating official board exam environment.",
                icon: Award,
                badge: "Exam Simulation",
                color: "indigo",
              },
              {
                id: "subject" as MockTestMode,
                title: "Subject Mock",
                desc: "10 Curated questions across all chapters of a chosen subject.",
                icon: BookOpen,
                badge: "10 Qs / 10 Mins",
                color: "cyan",
              },
              {
                id: "chapter" as MockTestMode,
                title: "Chapter Test",
                desc: "8 Focused questions targeting specific chapter concepts & derivations.",
                icon: CheckCircle2,
                badge: "Chapter Focus",
                color: "emerald",
              },
              {
                id: "topic" as MockTestMode,
                title: "Topic Drill",
                desc: "5 Precision micro-drills to fix specific formula & theory gaps.",
                icon: Flame,
                badge: "Concept Fix",
                color: "amber",
              },
              {
                id: "speed" as MockTestMode,
                title: "Speed Test",
                desc: "Rapid-fire 10 questions with 30s timer per question.",
                icon: Zap,
                badge: "30s / Question",
                color: "rose",
              },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m.id)}
                  className={`p-4 rounded-3xl text-left border transition-all flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500"
                      : "bg-slate-950/60 border-white/10 hover:border-white/20 hover:bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                      {m.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{m.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Test Filters & Launcher Config */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Configure {selectedMode.toUpperCase()} Exam Parameters</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tailored question pool based on student profile:{" "}
                  <strong className="text-indigo-400">{activeStudent?.classLevel || "Class 10"}</strong> (
                  <strong className="text-emerald-400">{activeStudent?.stream || "General"}</strong>)
                </p>
              </div>

              <button
                onClick={handleStartTest}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Examination
              </button>
            </div>

            {/* Sub-filters depending on mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedMode !== "full" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedChapter("ALL");
                      setSelectedTopic("ALL");
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Stream Subjects</option>
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedMode === "chapter" || selectedMode === "topic") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Chapter</label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => {
                      setSelectedChapter(e.target.value);
                      setSelectedTopic("ALL");
                    }}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Available Chapters</option>
                    {chaptersList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMode === "topic" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Select Topic Drill</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Chapter Topics</option>
                    {topicsList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMode === "speed" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pace per Question</label>
                  <div className="flex items-center gap-2">
                    {[20, 30, 45].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setSpeedPerQuestionSeconds(sec)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          speedPerQuestionSeconds === sec
                            ? "bg-rose-600 text-white border-rose-400"
                            : "bg-slate-950 text-slate-400 border-white/10"
                        }`}
                      >
                        {sec}s / Q
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance History Section */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span>Performance History & Attempt Log</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Track accuracy growth, topic weak points, and completion speeds across previous mock exams.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-xl border border-white/10">
                {history.length} Tests Recorded
              </span>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-white/10 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No mock tests completed yet.</p>
                <p className="text-xs text-slate-500">
                  Select a test mode above and complete your first examination to view real-time accuracy and topic analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {record.modeLabel}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">{record.subjectName}</span>
                        {record.chapterTitle && (
                          <span className="text-xs text-slate-400">• {record.chapterTitle}</span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">• {record.dateStr}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                        <span>
                          Score: <strong className="text-white">{record.correctAnswers}</strong>/{record.totalQuestions}
                        </span>
                        <span>•</span>
                        <span>
                          Accuracy:{" "}
                          <strong
                            className={
                              record.accuracyPct >= 75
                                ? "text-emerald-400"
                                : record.accuracyPct >= 50
                                ? "text-amber-400"
                                : "text-rose-400"
                            }
                          >
                            {record.accuracyPct}%
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Time: <strong className="text-white">{Math.round(record.timeSpentSeconds / 60)}m</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentResultRecord(record);
                          setTestState("REVIEW");
                        }}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10"
                      >
                        View Breakdown
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ACTIVE TEST RUNNER */}
      {testState === "ACTIVE" && currentQ && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6">
          {/* Header Progress Bar & Timer */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-white/10">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">
                {currentQ.subjectName} • {currentQ.chapterTitle}
              </span>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Question <span className="text-white font-bold">{currentIndex + 1}</span> of {testQuestions.length}
              </div>
            </div>

            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-bold text-sm border ${
                timeLeftSeconds < 60
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(timeLeftSeconds / 60)}:{(timeLeftSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {currentQ.topicName || "Core Exam Concept"}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQ.questionText}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, oIdx) => {
              const isChosen = userAnswers[currentIndex] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => setUserAnswers((prev) => ({ ...prev, [currentIndex]: oIdx }))}
                  className={`w-full p-4 rounded-2xl text-left border text-sm font-medium transition-all flex items-center justify-between ${
                    isChosen
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20"
                      : "bg-slate-950/60 text-slate-200 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                        isChosen ? "bg-white text-indigo-900" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                  {isChosen && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>

          {/* Question Navigator Grid */}
          <div className="pt-2">
            <div className="text-xs font-semibold text-slate-400 mb-2">Question Quick Index</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {testQuestions.map((_, qIdx) => {
                const isAnswered = userAnswers[qIdx] !== undefined;
                const isCurrent = currentIndex === qIdx;
                return (
                  <button
                    key={qIdx}
                    onClick={() => setCurrentIndex(qIdx)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all ${
                      isCurrent
                        ? "bg-indigo-500 text-white ring-2 ring-indigo-300"
                        : isAnswered
                        ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                        : "bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation & Submit Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((p) => p - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/5 text-white disabled:opacity-30 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < testQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((p) => p + 1)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitTest(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Submit Exam
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. REVIEW & RESULT GENERATION MODE */}
      {testState === "REVIEW" && currentResultRecord && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-6">
          {/* Result Score Card Header */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/20 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white font-heading">
              Exam Performance Scorecard
            </h2>
            <p className="text-xs text-slate-300">
              {currentResultRecord.modeLabel} • {currentResultRecord.subjectName}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 max-w-2xl mx-auto">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</span>
                <div
                  className={`text-2xl font-extrabold font-mono mt-1 ${
                    currentResultRecord.accuracyPct >= 75
                      ? "text-emerald-400"
                      : currentResultRecord.accuracyPct >= 50
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {currentResultRecord.accuracyPct}%
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Score</span>
                <div className="text-2xl font-extrabold text-white font-mono mt-1">
                  {currentResultRecord.correctAnswers}/{currentResultRecord.totalQuestions}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Time Spent</span>
                <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                  {Math.round(currentResultRecord.timeSpentSeconds / 60)}m {currentResultRecord.timeSpentSeconds % 60}s
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Incorrect</span>
                <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
                  {currentResultRecord.incorrectAnswers}
                </div>
              </div>
            </div>
          </div>

          {/* Topic-Wise Analysis Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Topic-Wise Accuracy & Weak Area Analysis</span>
            </h4>

            <div className="space-y-3">
              {currentResultRecord.topicBreakdown.map((t, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{t.topicName}</span>
                    <span className="font-mono font-bold text-slate-300">
                      {t.correct}/{t.total} ({t.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        t.accuracy >= 75
                          ? "bg-emerald-400"
                          : t.accuracy >= 50
                          ? "bg-amber-400"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${t.accuracy}%` }}
                    />
                  </div>
                  {t.accuracy < 60 && onNavigateToAbya && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Needs concept revision
                      </span>
                      <button
                        onClick={() => onNavigateToAbya(t.topicName)}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Ask Abya AI to clarify →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Question by Question Detailed Solution Review */}
          {testQuestions.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-4">
              <h4 className="font-bold text-sm text-white">Step-by-Step Question Review & Solutions</h4>
              <div className="space-y-4">
                {testQuestions.map((q, qIdx) => {
                  const userAns = userAnswers[qIdx];
                  const isCorrect = userAns === q.correctOptionIndex;
                  return (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-2xl border ${
                        isCorrect
                          ? "bg-emerald-950/20 border-emerald-500/30"
                          : "bg-rose-950/20 border-rose-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">
                          Q{qIdx + 1}. {q.questionText}
                        </span>
                        {isCorrect ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="mt-3 text-xs space-y-1.5">
                        <div className="text-slate-300">
                          Your Answer:{" "}
                          <strong className={isCorrect ? "text-emerald-300" : "text-rose-300"}>
                            {userAns !== undefined
                              ? `${String.fromCharCode(65 + userAns)}. ${q.options[userAns]}`
                              : "Unattempted"}
                          </strong>
                        </div>
                        {!isCorrect && (
                          <div className="text-emerald-400">
                            Correct Answer:{" "}
                            <strong>
                              {String.fromCharCode(65 + q.correctOptionIndex)}. {q.options[q.correctOptionIndex]}
                            </strong>
                          </div>
                        )}
                        {q.explanation && (
                          <div className="p-2.5 rounded-xl bg-white/5 text-slate-300 mt-2">
                            <strong className="text-indigo-400">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setTestState("IDLE");
                setCurrentResultRecord(null);
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Take Another Examination
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
