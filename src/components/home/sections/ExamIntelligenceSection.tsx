import React from "react";
import {
  ShieldAlert,
  Bot,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  MessageSquare,
} from "lucide-react";
import {
  ActiveTab,
  ExamProfile,
  StudentProfile,
  Subject,
} from "../../../types";
import { AppLanguage } from "../../../utils/i18n";
import { ExamIntelligenceReport } from "../../../utils/examIntelligenceEngine";
import { SmartSuggestion } from "../../../utils/suggestionsEngine";

interface ExamIntelligenceSectionProps {
  examReport: ExamIntelligenceReport | null;
  examProfile?: ExamProfile;
  activeStudent?: StudentProfile;
  subjects: Subject[];
  smartSuggestions: SmartSuggestion[];
  currentLanguage: AppLanguage;
  onNavigate: (tab: ActiveTab) => void;
  onDismissSuggestion?: (id: string) => void;
}

export const ExamIntelligenceSection: React.FC<ExamIntelligenceSectionProps> = ({
  examReport,
  examProfile,
  activeStudent,
  subjects,
  smartSuggestions,
  currentLanguage,
  onNavigate,
  onDismissSuggestion,
}) => {
  const targetExamName =
    examProfile?.targetExamName ||
    (activeStudent
      ? `${activeStudent.classLevel || "Class 12"} ${activeStudent.stream || "Board"} Final Exams`
      : "Board Final Exams");

  const readinessScore = examReport?.overallReadinessScore || 84;
  const readinessTier = examReport?.readinessCategory || "Good Progress";

  // Calculate days remaining
  let daysUntilExam = 60;
  if (examProfile?.targetExamDate) {
    const examDate = new Date(examProfile.targetExamDate);
    const now = new Date();
    const diffTime = examDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) daysUntilExam = diffDays;
  }

  // Recommended Daily Study Hours based on days left & readiness
  const suggestedDailyHours = readinessScore >= 85 ? 3.0 : readinessScore >= 70 ? 3.5 : 4.5;

  return (
    <section id="section-4-exam-intelligence" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
            4
          </div>
          <h2 className="text-base sm:text-lg font-bold font-heading text-white">
            {currentLanguage === "hi" ? "परीक्षा बुद्धिमत्ता व सिफारिशें" : "Exam Intelligence"}
          </h2>
          <span className="text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Powered</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("abya")}
            className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Ask Abya AI</span>
          </button>
          <button
            onClick={() => onNavigate("exam")}
            className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>{currentLanguage === "hi" ? "परीक्षा केंद्र" : "Exam Center"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid: Exam Readiness & Upcoming Exam (5 cols) + Suggested Hours & Smart Recommendations (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ========================================================================= */}
        {/* A. READINESS SCORE & UPCOMING EXAM CARD (5 cols)                         */}
        {/* ========================================================================= */}
        <div
          id="exam-readiness-card"
          className="lg:col-span-5 glass-card rounded-3xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-slate-900/90 to-slate-900/90 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {currentLanguage === "hi" ? "परीक्षा तत्परता स्कोर" : "Exam Readiness Score"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {readinessTier} • Predicted Score Range
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {readinessScore}% Ready
              </span>
            </div>

            {/* Big Score Radial/Progress Display */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Target Exam
                  </div>
                  <div className="text-base font-bold text-white truncate max-w-[200px]">
                    {targetExamName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Countdown
                  </div>
                  <div className="text-base font-extrabold text-cyan-300 font-mono">
                    {daysUntilExam} Days Left
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, readinessScore)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Score Prediction: {Math.max(65, readinessScore - 5)}% – {Math.min(99, readinessScore + 8)}%</span>
                  <span>Confidence: High</span>
                </div>
              </div>
            </div>

            {/* Suggested Daily Study Hours */}
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Suggested Study Hours
                  </div>
                  <div className="text-[11px] text-slate-400">
                    To maintain top percentile standing
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-emerald-300 font-mono">
                  {suggestedDailyHours}h / day
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("exam")}
            className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
          >
            <span>Open Comprehensive Exam Intelligence</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* B. SMART RECOMMENDATIONS & ABYA AI SUGGESTIONS (7 cols)                  */}
        {/* ========================================================================= */}
        <div
          id="exam-smart-recommendations-card"
          className="lg:col-span-7 glass-card rounded-3xl p-5 border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-slate-900/90 to-slate-900/90 space-y-4 shadow-sm flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-1.5">
                    <span>{currentLanguage === "hi" ? "स्मार्ट सिफारिशें" : "Smart Action Recommendations"}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    High-yield study & revision steps generated for your syllabus
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                Adaptive AI
              </span>
            </div>

            {/* Smart Suggestions List */}
            <div className="space-y-2.5">
              {smartSuggestions.length > 0 ? (
                smartSuggestions.slice(0, 2).map((sug) => (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/20 hover:border-purple-500/40 space-y-2 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                          <span className="truncate">{sug.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {sug.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <button
                        onClick={() => {
                          if (sug.targetTab) onNavigate(sug.targetTab as ActiveTab);
                        }}
                        className="text-[11px] text-purple-300 hover:text-white font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>{sug.actionText || "Start Action"}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      {onDismissSuggestion && (
                        <button
                          onClick={() => onDismissSuggestion(sug.id)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/50 border border-dashed border-white/10 text-center space-y-2">
                  <p className="text-xs text-slate-300">
                    {currentLanguage === "hi"
                      ? "अव्या एआई सिफारिश: आज के लिए 1 अभ्यास टेस्ट और 2 घंटे अध्ययन पूरा करें।"
                      : "Abya AI Recommendation: Review top priority topics in Accountancy & Economics today."}
                  </p>
                  <button
                    onClick={() => onNavigate("study")}
                    className="text-xs text-purple-300 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Syllabus Priority Topics</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Powered by Garia Abya AI Engine</span>
            <button
              onClick={() => onNavigate("abya")}
              className="text-purple-300 hover:text-white font-semibold flex items-center gap-1"
            >
              <span>Chat with Abya AI</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
