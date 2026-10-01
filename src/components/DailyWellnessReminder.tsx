import React, { useMemo, useState } from "react";
import {
  Droplets,
  Activity,
  Sparkles,
  CheckCircle2,
  Clock,
  Sun,
  Sunset,
  Moon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { WaterLog, ActiveTab } from "../types";
import { AppLanguage } from "../utils/i18n";

export interface DailyWellnessReminderProps {
  water: WaterLog;
  todayStudyMinutes: number;
  todayFocusMinutes?: number;
  todayCompletedTasksCount?: number;
  isPomodoroRunning?: boolean;
  currentDateTime?: Date;
  currentLanguage?: AppLanguage;
  onAddWaterGlass: () => void;
  onNavigate?: (tab: ActiveTab) => void;
  className?: string;
}

export const DailyWellnessReminder: React.FC<DailyWellnessReminderProps> = ({
  water,
  todayStudyMinutes = 0,
  todayFocusMinutes = 0,
  todayCompletedTasksCount = 0,
  isPomodoroRunning = false,
  currentDateTime = new Date(),
  currentLanguage = "en",
  onAddWaterGlass,
  className = "",
}) => {
  const [stretchBreaksTaken, setStretchBreaksTaken] = useState<number>(0);
  const [wellnessFeedback, setWellnessFeedback] = useState<string | null>(null);
  const [preferredView, setPreferredView] = useState<"auto" | "water" | "stretch">("auto");

  const waterGlasses = Math.max(0, Number(water?.glasses) || 0);
  const waterGoal = Math.max(1, Number(water?.goal) || 8);
  const waterProgressPercent = Math.min(
    100,
    Math.round((waterGlasses / waterGoal) * 100)
  );

  // Determine Time of Day & Expected Hydration Pace
  const timeOfDayContext = useMemo(() => {
    const hour = currentDateTime.getHours();
    if (hour >= 5 && hour < 12) {
      return {
        period: "morning" as const,
        label: currentLanguage === "hi" ? "सुबह का सत्र (Morning)" : "Morning Study Window",
        expectedGlasses: Math.max(2, Math.round(waterGoal * 0.3)),
        icon: Sun,
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        period: "afternoon" as const,
        label: currentLanguage === "hi" ? "दोपहर का सत्र (Afternoon)" : "Afternoon Peak Window",
        expectedGlasses: Math.max(4, Math.round(waterGoal * 0.6)),
        icon: Sun,
      };
    }
    if (hour >= 17 && hour < 21) {
      return {
        period: "evening" as const,
        label: currentLanguage === "hi" ? "शाम का रिवीजन (Evening)" : "Evening Revision Window",
        expectedGlasses: Math.max(6, Math.round(waterGoal * 0.8)),
        icon: Sunset,
      };
    }
    return {
      period: "night" as const,
      label: currentLanguage === "hi" ? "रात्रि सत्र (Night)" : "Late-Evening Wind-Down",
      expectedGlasses: waterGoal,
      icon: Moon,
    };
  }, [currentDateTime, waterGoal, currentLanguage]);

  // Determine Current Activity Level based on study minutes, focus logs, completed tasks, and active Pomodoro
  const activityContext = useMemo(() => {
    const effectiveMinutes = Math.max(todayStudyMinutes, todayFocusMinutes);
    if (
      isPomodoroRunning ||
      effectiveMinutes >= 45 ||
      todayCompletedTasksCount >= 3
    ) {
      return {
        level: "high" as const,
        label:
          currentLanguage === "hi"
            ? `उच्च गतिविधि (${effectiveMinutes}m अध्ययन)`
            : `High Activity · ${effectiveMinutes}m studied today`,
        defaultPrimary: "stretch" as const,
      };
    }
    if (effectiveMinutes >= 20 || todayCompletedTasksCount >= 1) {
      return {
        level: "moderate" as const,
        label:
          currentLanguage === "hi"
            ? `मध्यम गतिविधि (${effectiveMinutes}m अध्ययन)`
            : `Moderate Activity · ${effectiveMinutes}m studied`,
        defaultPrimary:
          waterGlasses < timeOfDayContext.expectedGlasses
            ? ("water" as const)
            : ("stretch" as const),
      };
    }
    return {
      level: "light" as const,
      label:
        currentLanguage === "hi"
          ? "प्रारंभिक गतिविधि स्तर"
          : "Starting Activity · Ready for Deep Work",
      defaultPrimary: "water" as const,
    };
  }, [
    todayStudyMinutes,
    todayFocusMinutes,
    todayCompletedTasksCount,
    isPomodoroRunning,
    waterGlasses,
    timeOfDayContext.expectedGlasses,
    currentLanguage,
  ]);

  const activeSuggestionType =
    preferredView === "auto" ? activityContext.defaultPrimary : preferredView;

  const handleDrinkWaterNow = () => {
    onAddWaterGlass();
    setWellnessFeedback(
      currentLanguage === "hi"
        ? "बहुत बढ़िया! +1 गिलास पानी लॉग किया गया 💧"
        : "Hydration logged! +1 glass of water added to today's goal."
    );
    setTimeout(() => setWellnessFeedback(null), 3500);
  };

  const handleTakeStretchBreak = () => {
    setStretchBreaksTaken((prev) => prev + 1);
    setWellnessFeedback(
      currentLanguage === "hi"
        ? "शानदार! 2-मिनट स्ट्रेच ब्रेक पूरा हुआ — गर्दन और कंधों को आराम दें 🧘"
        : "2-Minute Stretch Break logged! Roll your shoulders, stretch your neck & look 20ft away."
    );
    setTimeout(() => setWellnessFeedback(null), 4000);
  };

  const TimeIcon = timeOfDayContext.icon;

  return (
    <section
      id="home-daily-wellness-reminder"
      data-testid="daily-wellness-reminder"
      role="status"
      aria-label="Daily Wellness Reminder Notification"
      className={`glass-card rounded-3xl p-4 sm:p-5 border border-cyan-500/30 bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-emerald-950/25 shadow-lg space-y-3.5 ${className}`}
    >
      {/* Top Notification Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 flex items-center justify-center shrink-0">
            {activeSuggestionType === "water" ? (
              <Droplets className="w-4 h-4 text-cyan-400" />
            ) : (
              <Activity className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-cyan-300 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <TimeIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{timeOfDayContext.label}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-300">
                {activityContext.label}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold font-heading text-white">
              {currentLanguage === "hi"
                ? "दैनिक स्वास्थ्य अनुस्मारक (Daily Wellness Reminder)"
                : "Daily Wellness Reminder — Hydration & Stretch Break"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {wellnessFeedback && (
            <span
              id="daily-wellness-reminder-feedback"
              data-testid="daily-wellness-reminder-feedback"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{wellnessFeedback}</span>
            </span>
          )}

          <button
            type="button"
            id="daily-wellness-cycle-suggestion-btn"
            onClick={() =>
              setPreferredView((prev) =>
                prev === "water" ? "stretch" : "water"
              )
            }
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>
              {currentLanguage === "hi" ? "सुझाव बदलें" : "Switch Tip"}
            </span>
          </button>
        </div>
      </div>

      {/* Dual Smart Suggestion Cards: Drink Water + Short Stretch Break */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: Hydration Suggestion (Drink Water) */}
        <div
          id="wellness-reminder-water-card"
          data-testid="wellness-reminder-water-card"
          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
            activeSuggestionType === "water"
              ? "bg-slate-950/95 border-cyan-400/50 shadow-sm"
              : "bg-slate-950/70 border-white/10"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-300 inline-flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "हाइड्रेशन सुझाव: पानी पिएँ"
                    : "Hydration Reminder: Drink Water"}
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-300 font-bold">
                {waterGlasses}/{waterGoal} glasses ({waterProgressPercent}%)
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {waterGlasses < timeOfDayContext.expectedGlasses
                ? currentLanguage === "hi"
                  ? `${timeOfDayContext.label} के लिए आप ${timeOfDayContext.expectedGlasses - waterGlasses} गिलास पीछे हैं। एकाग्रता बनाए रखने के लिए अभी एक गिलास पानी पिएँ।`
                  : `You're ${timeOfDayContext.expectedGlasses - waterGlasses} glass(es) behind pace for the ${timeOfDayContext.period}. Drink water now to boost memory retention and focus.`
                : currentLanguage === "hi"
                ? "आपकी हाइड्रेशन गति अच्छी है! निरंतर मानसिक ऊर्जा के लिए एक गिलास पानी और पिएँ।"
                : "Great hydration pace! Drink a glass of water between chapters to keep cognitive alertness high."}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
                style={{ width: `${Math.max(8, waterProgressPercent)}%` }}
              />
            </div>

            <button
              type="button"
              id="wellness-reminder-drink-water-btn"
              data-testid="wellness-reminder-drink-water-btn"
              onClick={handleDrinkWaterNow}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {currentLanguage === "hi" ? "+1 गिलास पानी" : "Drink Water (+1)"}
              </span>
            </button>
          </div>
        </div>

        {/* Card 2: Mobility & Posture Suggestion (Short Stretch Break) */}
        <div
          id="wellness-reminder-stretch-card"
          data-testid="wellness-reminder-stretch-card"
          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
            activeSuggestionType === "stretch"
              ? "bg-slate-950/95 border-emerald-400/50 shadow-sm"
              : "bg-slate-950/70 border-white/10"
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-300 inline-flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {currentLanguage === "hi"
                    ? "गतिशीलता सुझाव: छोटा स्ट्रेच ब्रेक लें"
                    : "Posture & Mobility: Take a Short Stretch Break"}
                </span>
              </span>
              <span className="font-mono tabular-nums text-slate-300 font-bold">
                {stretchBreaksTaken} {stretchBreaksTaken === 1 ? "break" : "breaks"} today
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {activityContext.level === "high"
                ? currentLanguage === "hi"
                  ? "आपने आज गहन अध्ययन किया है! गर्दन, कंधों और आँखों की थकान कम करने के लिए 2 मिनट का छोटा स्ट्रेच ब्रेक लें।"
                  : "High study activity detected! Stand up for a 2-minute short stretch break—roll your shoulders and rest your eyes (20-20-20 rule)."
                : currentLanguage === "hi"
                ? `${timeOfDayContext.label} में जकड़न से बचने के लिए 2 मिनट का स्ट्रेच ब्रेक लें और अपनी मुद्रा सीधी रखें।`
                : `During your ${timeOfDayContext.period} study block, take a short stretch break every 25–45 minutes to prevent posture fatigue.`}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-400 inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>2-min neck, back & eye reset</span>
            </span>

            <button
              type="button"
              id="wellness-reminder-stretch-break-btn"
              data-testid="wellness-reminder-stretch-break-btn"
              onClick={handleTakeStretchBreak}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {currentLanguage === "hi"
                  ? "स्ट्रेच ब्रेक लें"
                  : "Take Stretch Break"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyWellnessReminder;
