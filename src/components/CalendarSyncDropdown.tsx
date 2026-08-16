import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Download,
  ExternalLink,
  ChevronDown,
  Check,
  Share2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  IcsEventOptions,
  buildVCalendar,
  downloadIcsFile,
  getGoogleCalendarWebUrl,
} from "../utils/icsExport";
import {
  getGoogleAccessToken,
  createGoogleCalendarEvent,
  signInWithGoogle,
} from "../utils/googleCalendar";

interface CalendarSyncDropdownProps {
  event: IcsEventOptions;
  buttonLabel?: string;
  variant?: "primary" | "secondary" | "icon" | "minimal" | "pill";
  className?: string;
}

export const CalendarSyncDropdown: React.FC<CalendarSyncDropdownProps> = ({
  event,
  buttonLabel = "Sync .ics",
  variant = "pill",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isDirectSyncing, setIsDirectSyncing] = useState(false);
  const [directSynced, setDirectSynced] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const icsContent = buildVCalendar([event], event.title);
    const filename = `Garia_${event.date}_${event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25)}.ics`;
    downloadIcsFile(filename, icsContent);
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      setIsOpen(false);
    }, 1800);
  };

  const handleDirectSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDirectSyncing(true);
    try {
      let token = await getGoogleAccessToken();
      if (!token) {
        const res = await signInWithGoogle();
        token = res?.accessToken || null;
      }
      if (!token) {
        setIsDirectSyncing(false);
        return;
      }

      await createGoogleCalendarEvent(token, {
        id: event.id || `event-${Date.now()}`,
        type: event.category === "exam" ? "exam" : event.category === "TASK" ? "task" : "event",
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        category: event.category,
      });

      setDirectSynced(true);
      setTimeout(() => {
        setDirectSynced(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Direct sync error", err);
    } finally {
      setIsDirectSyncing(false);
    }
  };

  const handleOpenGoogle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarWebUrl(event);
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const renderButton = () => {
    switch (variant) {
      case "icon":
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`p-1.5 rounded-xl border border-white/10 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-all ${className}`}
            title="Export .ics / Sync to Calendar"
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        );
      case "minimal":
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors ${className}`}
          >
            <Calendar className="w-3 h-3" />
            <span>{buttonLabel}</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        );
      case "primary":
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md hover:bg-amber-400 transition-all flex items-center gap-1.5 ${className}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{buttonLabel}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        );
      case "pill":
      default:
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-medium transition-all flex items-center gap-1.5 ${className}`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{buttonLabel}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        );
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {renderButton()}

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-slate-900/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              Export / Sync
            </div>
            <div className="text-xs font-bold text-white truncate font-heading">{event.title}</div>
          </div>

          {/* Direct Google Calendar API Sync */}
          <button
            type="button"
            onClick={handleDirectSync}
            disabled={isDirectSyncing}
            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 flex items-center justify-between transition-colors group"
          >
            <span className="flex items-center gap-2">
              {isDirectSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : directSynced ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>
                {isDirectSyncing
                  ? "Syncing GCal API..."
                  : directSynced
                  ? "Synced to Google!"
                  : "Direct Sync to Google"}
              </span>
            </span>
            {directSynced && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 flex items-center justify-between transition-colors group"
          >
            <span className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Download .ics File</span>
            </span>
            {downloaded && <Check className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={handleOpenGoogle}
            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open in Google Calendar</span>
          </button>
        </div>
      )}
    </div>
  );
};
