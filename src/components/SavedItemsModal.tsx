import React, { useState } from "react";
import {
  X,
  Bookmark,
  BookOpen,
  HelpCircle,
  Compass,
  FileText,
  Trash2,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
} from "lucide-react";
import { ActiveTab, Note, QuestionBankProfileProgress } from "../types";

interface SavedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  notes?: Note[];
  qbankProgress?: QuestionBankProfileProgress;
}

export const SavedItemsModal: React.FC<SavedItemsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  notes = [],
  qbankProgress,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "notes" | "questions" | "careers" | "scholarships">("all");

  if (!isOpen) return null;

  const pinnedNotes = notes.filter((n) => n.pinned);

  const savedQuestionsCount =
    (qbankProgress?.mcqBookmarks?.length || 0) +
    (qbankProgress?.pyqBookmarks?.length || 0) +
    (qbankProgress?.practiceBookmarks?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shadow-md">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white flex items-center gap-2">
                <span>Saved Items & Bookmarks</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {pinnedNotes.length + savedQuestionsCount + 3} Saved
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Quick access to bookmarked questions, pinned notes, and career cards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation */}
        <div className="px-4 py-2.5 border-b border-white/5 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "all", label: "All Items" },
            { id: "questions", label: `Bookmarked Questions (${savedQuestionsCount})` },
            { id: "notes", label: `Pinned Notes (${pinnedNotes.length})` },
            { id: "careers", label: "Saved Careers" },
            { id: "scholarships", label: "Saved Scholarships" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content list */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 max-h-[500px]">
          {/* Question Bank Bookmarks */}
          {(activeTab === "all" || activeTab === "questions") && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Question Bank Bookmarks</span>
                <button
                  onClick={() => {
                    onNavigate("questionbank");
                    onClose();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                >
                  <span>Open Question Bank</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {savedQuestionsCount > 0 ? (
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {savedQuestionsCount} Bookmarked MCQs & PYQs
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Saved for intensive revision and error notebook review
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate("questionbank");
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-cyan-500/40"
                  >
                    Solve Now
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
                  No questions bookmarked yet. Click the bookmark icon next to any MCQ or PYQ in Question Bank.
                </div>
              )}
            </div>
          )}

          {/* Pinned Notes */}
          {(activeTab === "all" || activeTab === "notes") && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Pinned Study Notes</span>
                <button
                  onClick={() => {
                    onNavigate("notes");
                    onClose();
                  }}
                  className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1"
                >
                  <span>Open Notes App</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {pinnedNotes.length > 0 ? (
                <div className="space-y-2">
                  {pinnedNotes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onNavigate("notes");
                        onClose();
                      }}
                      className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{n.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">{n.content}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-center text-xs text-slate-400">
                  No notes pinned. Pin your key formula sheets or summaries in Notes.
                </div>
              )}
            </div>
          )}

          {/* Career & Scholarships */}
          {(activeTab === "all" || activeTab === "careers" || activeTab === "scholarships") && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Saved Career Paths & Scholarships</span>
                <button
                  onClick={() => {
                    onNavigate("career");
                    onClose();
                  }}
                  className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                >
                  <span>Open Career Center</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div
                onClick={() => {
                  onNavigate("career");
                  onClose();
                }}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 hover:border-purple-400/50 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Target Dream Careers & Govt Exams</div>
                    <div className="text-[11px] text-slate-400">
                      UPSC, CA, Software Engineering, MBBS, Study Abroad
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Garia OS Universal Bookmarking</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
