import React, { useState, useMemo } from "react";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Clock,
  Award,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  BoardType,
  StreamType,
  CurriculumVerificationStatus,
  CurriculumSourceProvenance,
  CurriculumSourceConflict,
} from "../types";
import {
  getBoardCurriculumHierarchy,
  getCurriculumSubjects,
  normalizeCurriculumBoard,
  CURRICULUM_BOARDS_METADATA,
  DEFAULT_CURRICULUM_ACADEMIC_YEAR,
  CurriculumSubject,
  CurriculumChapter,
} from "../data/masterCurriculum";
import { CurriculumStatusBadge, resolveStudentCurriculumState } from "./CurriculumStatusBadge";

interface CurriculumHierarchyExplorerProps {
  initialBoard?: string;
  initialAcademicYear?: string;
  initialClass?: string;
  initialStream?: StreamType;
  onSelectChapter?: (chapter: CurriculumChapter, subject: CurriculumSubject) => void;
  onAskAbya?: (context: string) => void;
  onStartFocusTimer?: (chapterTitle: string, subjectName: string) => void;
  className?: string;
}

export const CurriculumHierarchyExplorer: React.FC<CurriculumHierarchyExplorerProps> = ({
  initialBoard = "BSEB",
  initialAcademicYear = DEFAULT_CURRICULUM_ACADEMIC_YEAR,
  initialClass = "Class 12",
  initialStream = "Commerce",
  onSelectChapter,
  onAskAbya,
  onStartFocusTimer,
  className = "",
}) => {
  // Navigation Hierarchy State: Board -> Academic Year -> Class -> Stream -> Subject
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoard);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(initialAcademicYear);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [selectedStream, setSelectedStream] = useState<StreamType>(initialStream);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const normalizedBoard = normalizeCurriculumBoard(selectedBoard);
  const boardMeta = CURRICULUM_BOARDS_METADATA[normalizedBoard];

  // Fetch full deterministic board hierarchy
  const hierarchy = useMemo(() => {
    return getBoardCurriculumHierarchy(
      normalizedBoard,
      selectedClass,
      selectedStream,
      selectedAcademicYear
    );
  }, [normalizedBoard, selectedClass, selectedStream, selectedAcademicYear]);

  const subjects = hierarchy.subjects;

  // Active subject selection
  const activeSubject = useMemo(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      return subjects[0];
    }
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  }, [selectedSubjectId, subjects]);

  // Relevant conflicts for active subject / board
  const subjectConflicts = useMemo(() => {
    if (!activeSubject) return [];
    const directConflicts = activeSubject.provenance?.unresolvedConflicts || [];
    if (directConflicts.length > 0) return directConflicts;
    if (activeSubject.provenance?.conflictDetails) return [activeSubject.provenance.conflictDetails];

    // Gather from chapters if any
    const chapConflicts: CurriculumSourceConflict[] = [];
    activeSubject.chapters.forEach((ch) => {
      if (ch.provenance?.conflictDetails) {
        chapConflicts.push(ch.provenance.conflictDetails);
      }
      if (ch.provenance?.unresolvedConflicts) {
        chapConflicts.push(...ch.provenance.unresolvedConflicts);
      }
    });
    return chapConflicts;
  }, [activeSubject]);

  // Filtered chapters for active subject
  const filteredChapters = useMemo(() => {
    if (!activeSubject) return [];
    if (!searchQuery.trim()) return activeSubject.chapters;
    const q = searchQuery.toLowerCase();
    return activeSubject.chapters.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.topics.some((t) => t.name.toLowerCase().includes(q))
    );
  }, [activeSubject, searchQuery]);

  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden ${className}`}
      id="curriculum-hierarchy-explorer"
    >
      {/* 1. Header & Hierarchy Selector Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Board Curriculum & Provenance Explorer
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                  Student Intelligence Layer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect official board evidence, verify 2026–27 session applicability, and review curriculum conflicts.
              </p>
            </div>
          </div>

          {/* Quick Stats on Status */}
          <div className="flex items-center gap-2 shrink-0">
            <CurriculumStatusBadge
              status={hierarchy.verificationStatus}
              provenance={hierarchy.provenance}
              academicYear={hierarchy.academicYear}
              variant="compact"
            />
          </div>
        </div>

        {/* Dynamic Hierarchy Selection Bar: Board -> Year -> Class -> Stream */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
          {/* Selector 1: Board */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              1. Board
            </label>
            <select
              value={selectedBoard}
              onChange={(e) => {
                setSelectedBoard(e.target.value);
                setSelectedSubjectId("");
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="BSEB">BSEB (Bihar Board)</option>
              <option value="CBSE">CBSE (Central Board)</option>
              <option value="ICSE">ICSE / ISC Board</option>
              <option value="UP Board">UP Board (UPMSP)</option>
              <option value="MP Board">MP Board (MPBSE)</option>
              <option value="Maharashtra Board">Maharashtra Board</option>
              <option value="NCERT">NCERT Core</option>
            </select>
          </div>

          {/* Selector 2: Academic Year */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              2. Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="2026-27">2026–27 (Current Target)</option>
              <option value="2025-26">2025–26 (Historical)</option>
              <option value="2024-25">2024–25 (Historical)</option>
            </select>
          </div>

          {/* Selector 3: Class */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              3. Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubjectId("");
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="Class 12">Class 12 (Intermediate)</option>
              <option value="Class 11">Class 11 (Intermediate 1st Yr)</option>
              <option value="Class 10">Class 10 (Matric)</option>
            </select>
          </div>

          {/* Selector 4: Stream */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              4. Stream
            </label>
            <select
              value={selectedStream}
              onChange={(e) => {
                setSelectedStream(e.target.value as StreamType);
                setSelectedSubjectId("");
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="Commerce">Commerce</option>
              <option value="Science">Science</option>
              <option value="Arts">Arts / Humanities</option>
              {selectedClass === "Class 10" && <option value="General">General Curriculum</option>}
            </select>
          </div>
        </div>

        {/* Board Examination Blueprint Note */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">
              {normalizedBoard} Pattern Guidance:{" "}
            </span>
            <span>{boardMeta.examPatternSummary}</span>
          </div>
        </div>
      </div>

      {/* 2. Subjects Horizontal Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {subjects.map((sub) => {
          const isActive = activeSubject?.id === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubjectId(sub.id);
                setExpandedChapterId(null);
              }}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 shrink-0 ${
                isActive
                  ? "border-cyan-400 text-cyan-200 bg-slate-900/90 font-bold"
                  : "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: sub.color }}
              />
              <span>{sub.name}</span>
              {sub.code && (
                <span className="text-[10px] font-mono opacity-70">({sub.code})</span>
              )}
              {sub.verificationStatus === "VERIFIED" ? (
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-3 h-3 text-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Subject Header & Honest Verification Status */}
      {activeSubject && (
        <div className="p-4 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-white font-heading">
                  {activeSubject.name}
                </h4>
                {activeSubject.code && (
                  <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    Subject Code: {activeSubject.code}
                  </span>
                )}
                <CurriculumStatusBadge
                  status={activeSubject.verificationStatus}
                  provenance={activeSubject.provenance}
                  academicYear={activeSubject.academicYear || selectedAcademicYear}
                  subjectCode={activeSubject.code}
                  variant="badge"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeSubject.sourceStatusNote ||
                  "Awaiting official 2026–27 board syllabus confirmation from the state examination council."}
              </p>
            </div>

            {/* Abya AI Doubt Helper Button */}
            {onAskAbya && (
              <button
                type="button"
                onClick={() =>
                  onAskAbya(
                    `Tell me about ${normalizedBoard} ${selectedClass} ${activeSubject.name} (Code: ${activeSubject.code || "Core"}) key chapters, historical question patterns, and official 2026-27 syllabus status.`
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Ask Abya About {activeSubject.name}</span>
              </button>
            )}
          </div>

          {/* Honest State Banner when Official 2026-27 Evidence is Pending */}
          {activeSubject.verificationStatus !== "VERIFIED" && (
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-200">
                  Official {selectedAcademicYear} syllabus evidence is not yet verified.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Garia OS provides this curriculum structure grounded in the official SCERT/BSTBPC
                  prescribed textbook edition and official 2026 examination model papers. Learning
                  materials and practice questions are legitimately supported for your study reference.
                </p>
              </div>
            </div>
          )}

          {/* Cataloged Subject Conflicts Disclosure (e.g. Accountancy NPO, Economics Micro/Macro) */}
          {subjectConflicts.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Officially Recorded Evidence Conflicts & Caveats ({subjectConflicts.length})</span>
              </div>
              <div className="space-y-2">
                {subjectConflicts.map((conf, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-amber-400 font-bold">
                        {conf.category || "CURRICULUM_CONFLICT"}
                      </span>
                      <span className="text-slate-400">{conf.academicYear}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {conf.conflictDescription}
                    </p>
                    <p className="text-[11px] text-cyan-300/90 pt-0.5">
                      <span className="font-semibold text-cyan-200">Student Guidance: </span>
                      {conf.recommendedReviewAction}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Filter for Chapters */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeSubject.name} chapters or topics...`}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              {filteredChapters.length} Chapters Available
            </div>
          </div>

          {/* Chapters Accordion / List */}
          <div className="space-y-2.5">
            {filteredChapters.map((chap, idx) => {
              const isExpanded = expandedChapterId === chap.id;
              const hasConflict = !!chap.provenance?.conflictDetails;

              return (
                <div
                  key={chap.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? "bg-slate-950/80 border-cyan-500/40 shadow-lg"
                      : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {/* Chapter Header Card */}
                  <div
                    onClick={() =>
                      setExpandedChapterId(isExpanded ? null : chap.id)
                    }
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {chap.chapterNumber || idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-white text-xs sm:text-sm font-heading truncate">
                            {chap.title}
                          </h5>

                          {/* Priority Badge - Explicitly Labeled APPLICATION-DERIVED */}
                          {chap.priority === "VVI" ? (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/15 text-rose-300 border border-rose-500/30"
                              title="Application-derived high-priority topic based on historical question weighting; not an official board designation."
                            >
                              App-Derived Priority (VVI)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {chap.priority}
                            </span>
                          )}

                          {hasConflict && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Conflict Caveat
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                          <span>{chap.topics.length} Key Topics</span>
                          {chap.estimatedStudyMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              ~{chap.estimatedStudyMinutes} mins
                            </span>
                          )}
                          {chap.examWeightageMarks && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3 h-3 text-cyan-400" />
                              Est. ~{chap.examWeightageMarks} Marks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Chapter Details: Topics, Study Notes, and Provenance */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-3.5 text-xs">
                      {/* Chapter Note Summary */}
                      {chap.notesSummary && (
                        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 leading-relaxed">
                          <span className="font-semibold text-white">Chapter Focus: </span>
                          {chap.notesSummary}
                        </div>
                      )}

                      {/* Conflict Details on Chapter Level (if present) */}
                      {chap.provenance?.conflictDetails && (
                        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-slate-300 space-y-1">
                          <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Curriculum Conflict Caveat: {chap.provenance.conflictDetails.category}</span>
                          </div>
                          <p className="leading-snug">{chap.provenance.conflictDetails.conflictDescription}</p>
                          <p className="text-[11px] text-amber-200/90 pt-0.5">
                            <span className="font-semibold text-amber-200">Recommended Action: </span>
                            {chap.provenance.conflictDetails.recommendedReviewAction}
                          </p>
                        </div>
                      )}

                      {/* Topics List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                          Syllabus Topics & Core Concepts
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {chap.topics.map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs">{t.name}</span>
                                {t.vviPoints.length > 0 && (
                                  <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/25">
                                    High-Yield
                                  </span>
                                )}
                              </div>
                              {t.vviPoints.length > 0 && (
                                <p className="text-[11px] text-slate-400 leading-snug">
                                  {t.vviPoints[0]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Triggers */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60">
                        <div className="text-[11px] text-slate-500 font-mono">
                          Chapter ID: {chap.id}
                        </div>

                        <div className="flex items-center gap-2">
                          {onStartFocusTimer && (
                            <button
                              type="button"
                              onClick={() =>
                                onStartFocusTimer(chap.title, activeSubject.name)
                              }
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/30 font-bold transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Focus Timer</span>
                            </button>
                          )}

                          {onSelectChapter && (
                            <button
                              type="button"
                              onClick={() => onSelectChapter(chap, activeSubject)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-bold transition-all flex items-center gap-1.5 active:scale-95"
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>Study Material</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
