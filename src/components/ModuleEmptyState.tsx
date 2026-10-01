import React from "react";
import { ArrowRight, Plus, Sparkles, LucideIcon } from "lucide-react";

export type ModuleEmptyAccent = "emerald" | "cyan" | "purple" | "indigo" | "amber";

export interface ModuleEmptyStateProps {
  id?: string;
  testId?: string;
  actionButtonId?: string;
  title: string;
  description: string;
  icon?: React.ReactNode | LucideIcon;
  lucideIcon?: React.ReactNode | LucideIcon;
  illustration?: React.ReactNode | LucideIcon;
  onAction: () => void;
  actionLabel?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  accentColor?: ModuleEmptyAccent;
  helperText?: string;
}

const ACCENT_STYLES: Record<
  ModuleEmptyAccent,
  {
    border: string;
    iconBox: string;
    iconColor: string;
    sparkleColor: string;
    button: string;
    helperBadge: string;
  }
> = {
  emerald: {
    border: "border-emerald-500/25 hover:border-emerald-500/40",
    iconBox: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    iconColor: "text-emerald-400",
    sparkleColor: "text-amber-400",
    button:
      "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/15",
    helperBadge: "text-emerald-300/90",
  },
  cyan: {
    border: "border-cyan-500/25 hover:border-cyan-500/40",
    iconBox: "bg-cyan-500/10 border-cyan-500/25 text-cyan-400",
    iconColor: "text-cyan-400",
    sparkleColor: "text-emerald-400",
    button:
      "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/15",
    helperBadge: "text-cyan-300/90",
  },
  purple: {
    border: "border-purple-500/25 hover:border-purple-500/40",
    iconBox: "bg-purple-500/10 border-purple-500/25 text-purple-400",
    iconColor: "text-purple-400",
    sparkleColor: "text-cyan-400",
    button:
      "bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-purple-500/15",
    helperBadge: "text-purple-300/90",
  },
  indigo: {
    border: "border-indigo-500/25 hover:border-indigo-500/40",
    iconBox: "bg-indigo-500/10 border-indigo-500/25 text-indigo-400",
    iconColor: "text-indigo-400",
    sparkleColor: "text-amber-400",
    button:
      "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/15",
    helperBadge: "text-indigo-300/90",
  },
  amber: {
    border: "border-amber-500/25 hover:border-amber-500/40",
    iconBox: "bg-amber-500/10 border-amber-500/25 text-amber-400",
    iconColor: "text-amber-400",
    sparkleColor: "text-emerald-400",
    button:
      "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/15",
    helperBadge: "text-amber-300/90",
  },
};

export const ModuleEmptyState: React.FC<ModuleEmptyStateProps> = ({
  id,
  testId,
  actionButtonId,
  title,
  description,
  icon,
  lucideIcon,
  illustration,
  onAction,
  actionLabel = "Get Started",
  secondaryActionLabel,
  onSecondaryAction,
  accentColor = "emerald",
  helperText,
}) => {
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.emerald;
  const visual = illustration ?? lucideIcon ?? icon;

  const renderIllustration = () => {
    if (React.isValidElement(visual)) {
      return visual;
    }
    if (
      typeof visual === "function" ||
      (typeof visual === "object" && visual !== null)
    ) {
      const IconComponent = visual as LucideIcon;
      return <IconComponent className={`w-7 h-7 ${styles.iconColor}`} />;
    }
    return <Sparkles className={`w-7 h-7 ${styles.iconColor}`} />;
  };

  return (
    <div
      id={id}
      data-testid={testId || id || "module-empty-state"}
      className={`p-6 rounded-2xl bg-slate-900/60 border border-dashed ${styles.border} text-center space-y-4 flex-1 flex flex-col items-center justify-center transition-colors`}
    >
      {/* Contextual Lucide Icon / Illustration Badge */}
      <div className="relative mx-auto">
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-inner ${styles.iconBox}`}
        >
          {renderIllustration()}
        </div>
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center shadow-sm"
        >
          <Sparkles className={`w-3.5 h-3.5 ${styles.sparkleColor}`} />
        </span>
      </div>

      {/* Copy & Context */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-white font-heading">
          {title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">{description}</p>
        {helperText && (
          <p className={`text-[11px] font-medium pt-0.5 ${styles.helperBadge}`}>
            {helperText}
          </p>
        )}
      </div>

      {/* Primary 'Get Started' CTA & Optional Secondary Action */}
      <div className="pt-1 flex items-center justify-center gap-2.5 flex-wrap">
        <button
          type="button"
          id={actionButtonId || (id ? `${id}-action-btn` : undefined)}
          data-testid={actionButtonId || (id ? `${id}-action-btn` : "empty-state-action-btn")}
          onClick={onAction}
          className={`min-h-[40px] px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer ${styles.button}`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{actionLabel}</span>
        </button>

        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>{secondaryActionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ModuleEmptyState;
