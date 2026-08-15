import React, { useState } from "react";
import { ShieldCheck, Copy, Check, Terminal, Cpu } from "lucide-react";
import {
  APP_VERSION_STRING,
  APP_BUILD_DATE,
  getAppEnvironment,
  SYSTEM_VERSION_DETAILS,
} from "../constants/version";

interface ProductionVersionBadgeProps {
  variant?: "card" | "compact" | "minimal" | "footer" | "banner";
  className?: string;
  showCopy?: boolean;
}

export const ProductionVersionBadge: React.FC<ProductionVersionBadgeProps> = ({
  variant = "card",
  className = "",
  showCopy = true,
}) => {
  const [copied, setCopied] = useState(false);
  const environment = getAppEnvironment();

  const getEnvBadgeStyles = () => {
    switch (environment) {
      case "Production":
        return {
          dot: "bg-emerald-400 animate-pulse",
          pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
      case "Staging":
        return {
          dot: "bg-amber-400 animate-pulse",
          pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        };
      default:
        return {
          dot: "bg-cyan-400",
          pill: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
        };
    }
  };

  const envStyles = getEnvBadgeStyles();

  const handleCopyDiagnostics = () => {
    const text = `${APP_VERSION_STRING}\nBuild: ${APP_BUILD_DATE}\nEnvironment: ${environment}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compact / Footer layout
  if (variant === "footer" || variant === "compact") {
    return (
      <div
        className={`p-3 rounded-2xl bg-slate-900/80 border border-white/10 text-left font-mono space-y-1 ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white tracking-wide">
            {APP_VERSION_STRING}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${envStyles.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${envStyles.dot}`} />
            <span>{environment}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Build: {APP_BUILD_DATE}</span>
          {showCopy && (
            <button
              onClick={handleCopyDiagnostics}
              title="Copy Version Details"
              className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Minimal inline pill
  if (variant === "minimal") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-[11px] font-mono ${className}`}
      >
        <span className="font-bold text-white">{APP_VERSION_STRING}</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-400">Build: {APP_BUILD_DATE}</span>
        <span className="text-slate-500">•</span>
        <span className={`inline-flex items-center gap-1 font-bold ${envStyles.pill} px-1.5 py-0.2 rounded-md`}>
          <span className={`w-1.5 h-1.5 rounded-full ${envStyles.dot}`} />
          {environment}
        </span>
      </div>
    );
  }

  // Standard Card layout (for Settings, Profile System Info, About Modal, More Menu)
  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-white/15 shadow-lg space-y-3 font-mono ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>{APP_VERSION_STRING}</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-sans block">
              Official Production Release
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${envStyles.pill}`}
          >
            <span className={`w-2 h-2 rounded-full ${envStyles.dot}`} />
            <span>{environment}</span>
          </span>

          {showCopy && (
            <button
              onClick={handleCopyDiagnostics}
              title="Copy Version Information"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">
            Build Identifier
          </span>
          <p className="font-bold text-slate-200">{APP_BUILD_DATE}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/5 space-y-0.5">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">
            Deployment Environment
          </span>
          <p className="font-bold text-emerald-400">{environment}</p>
        </div>
      </div>
    </div>
  );
};
