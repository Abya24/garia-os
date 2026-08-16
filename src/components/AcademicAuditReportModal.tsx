import React, { useState } from "react";
import {
  ShieldCheck,
  Share2,
  CheckCircle2,
  Copy,
  BookOpen,
  Layers,
  Sparkles,
  Award,
  Check,
  X,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react";
import { AcademicSubject, AcademicChapter, CareerProfile } from "../types";

interface AcademicAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: AcademicSubject[];
  chapters: AcademicChapter[];
  careerProfile: CareerProfile;
}

export const AcademicAuditReportModal: React.FC<AcademicAuditReportModalProps> = ({
  isOpen,
  onClose,
  subjects,
  chapters,
  careerProfile,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedStatus, setSharedStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate audit metrics
  const totalSubjects = subjects.length;
  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === "Completed").length;
  const inProgressChapters = chapters.filter((c) => c.status === "In Progress").length;
  const pendingChapters = chapters.filter((c) => c.status === "Pending" || !c.status).length;
  const highPriorityChapters = chapters.filter((c) => c.priority === "High" || c.priority === "Urgent").length;
  const completedPYQs = chapters.filter((c) => c.pyqStatus === "Completed").length;
  const revisedChapters = chapters.filter((c) => (c.revisionCount || 0) > 0).length;

  const syllabusProgress = totalChapters > 0
    ? Math.round((completedChapters / totalChapters) * 100)
    : 0;

  const pyqProgress = totalChapters > 0
    ? Math.round((completedPYQs / totalChapters) * 100)
    : 0;

  const currentGrade =
    syllabusProgress >= 85
      ? "A+ (Elite Master)"
      : syllabusProgress >= 70
      ? "A (Exam Ready)"
      : syllabusProgress >= 50
      ? "B+ (Solid Track)"
      : "B (In Progress)";

  // Format summary text for social sharing
  const generateShareText = () => {
    const streamTitle = careerProfile.stream || "Science / Commerce / Arts";
    const targetCareer = careerProfile.targetCareer || "Academic Excellence";

    return (
      `🎓 *Garia OS Academic Audit Status*\n` +
      `👤 Student Stream: ${streamTitle} | Target: ${targetCareer}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 *Overall Readiness*: ${syllabusProgress}%\n` +
      `🏅 *Audit Grade*: ${currentGrade}\n` +
      `📚 *Subjects Active*: ${totalSubjects}\n` +
      `📖 *Chapters Mastered*: ${completedChapters}/${totalChapters}\n` +
      `📝 *PYQs Solved*: ${completedPYQs}/${totalChapters}\n` +
      `🔄 *Revisions Tracked*: ${revisedChapters} chapters\n` +
      `⚡ *High Priority Focus*: ${highPriorityChapters} core chapters\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ Audited via Garia OS Academic Center & Question Bank Intelligence.`
    );
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    const shareData = {
      title: "My Garia OS Academic Audit Status",
      text: shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setSharedStatus("Shared successfully via device menu!");
        setTimeout(() => setSharedStatus(null), 4000);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          // Fallback to clipboard
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setSharedStatus("Audit summary copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setTimeout(() => setSharedStatus(null), 3000);
      }, 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-emerald-500/30 p-6 md:p-8 text-white shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ACADEMIC INTEGRITY AUDIT VERIFIED</span>
          </div>
          <h2 className="text-2xl font-extrabold font-heading text-white tracking-tight flex items-center gap-2">
            Academic Status & Integrity Report
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            Real-time audit verification for {careerProfile.stream || "Class 12"} • Target: {careerProfile.targetCareer || "Higher Studies"}
          </p>
        </div>

        {/* Highlight Score Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-white/10">
          <div className="text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Readiness
            </span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {syllabusProgress}%
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Status Grade
            </span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {currentGrade.split(" ")[0]}
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              PYQ Solved
            </span>
            <span className="text-2xl font-black text-purple-300 font-mono">
              {pyqProgress}%
            </span>
          </div>
          <div className="text-center p-2 rounded-xl bg-white/[0.02]">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">
              Total Chapters
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono">
              {totalChapters}
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Audited Study Indicators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" /> Active Subjects
              </span>
              <span className="font-bold text-white font-mono">{totalSubjects} Subjects</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Completed Chapters
              </span>
              <span className="font-bold text-emerald-300 font-mono">{completedChapters} / {totalChapters}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> In Progress
              </span>
              <span className="font-bold text-amber-300 font-mono">{inProgressChapters} Chapters</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-400" /> High-Priority Units
              </span>
              <span className="font-bold text-rose-300 font-mono">{highPriorityChapters} Chapters</span>
            </div>
          </div>
        </div>

        {/* Subject wise mini status */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Subject-Level Breakdown
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const subChapters = chapters.filter((c) => c.subjectId === sub.id);
              const subDone = subChapters.filter((c) => c.status === "Completed").length;
              const subPct = subChapters.length > 0 ? Math.round((subDone / subChapters.length) * 100) : 0;

              return (
                <div
                  key={sub.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-semibold text-white">{sub.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">
                      {subDone}/{subChapters.length} ch
                    </span>
                    <span className="font-bold text-emerald-400 font-mono w-10 text-right">
                      {subPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notification / Toast Banner */}
        {sharedStatus && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{sharedStatus}</span>
          </div>
        )}

        {/* Share Action Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ready for standard device share, WhatsApp, Telegram or Notes.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => copyToClipboard(generateShareText())}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/15"
              title="Copy audit report text to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Summary"}</span>
            </button>

            <button
              onClick={handleShare}
              id="social-share-audit-btn"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
              title="Share summary via standard device share menu"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Audit Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
