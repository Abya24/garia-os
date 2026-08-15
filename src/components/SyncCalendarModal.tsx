import React, { useState } from "react";
import {
  Calendar,
  Download,
  ExternalLink,
  Check,
  X,
  Clock,
  Bell,
  Sparkles,
  FileText,
  Copy,
  Info,
} from "lucide-react";
import {
  IcsEventOptions,
  buildVCalendar,
  downloadIcsFile,
  getGoogleCalendarWebUrl,
} from "../utils/icsExport";

interface SyncCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: IcsEventOptions;
  customTitle?: string;
  sourceLabel?: string;
}

export const SyncCalendarModal: React.FC<SyncCalendarModalProps> = ({
  isOpen,
  onClose,
  event,
  customTitle = "Sync Schedule to External Calendar",
  sourceLabel = "Garia OS Academic Hub",
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const googleUrl = getGoogleCalendarWebUrl(event);

  const handleDownloadIcs = () => {
    const icsContent = buildVCalendar([event], event.title);
    const filename = `Garia_${event.date}_${event.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 25)}.ics`;
    downloadIcsFile(filename, icsContent);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleCopyIcs = () => {
    const icsContent = buildVCalendar([event], event.title);
    navigator.clipboard.writeText(icsContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-amber-500/30 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                {sourceLabel}
              </span>
              <h3 className="text-lg font-bold text-white font-heading">{customTitle}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Preview Card */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-base font-bold text-white font-heading">{event.title}</h4>
            {event.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono uppercase">
                {event.category}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-300 font-mono flex-wrap">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
            {event.time && (
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Clock className="w-3.5 h-3.5" />
                {event.time}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-emerald-300">
              <Bell className="w-3.5 h-3.5" />
              Reminder Set
            </span>
          </div>

          {event.description && (
            <p className="text-xs text-slate-400 whitespace-pre-line pt-1 border-t border-white/5 line-clamp-4">
              {event.description}
            </p>
          )}
        </div>

        {/* Sync Options Buttons */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading block">
            Choose Sync Option:
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download .ics Button */}
            <button
              onClick={handleDownloadIcs}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 group"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded .ics!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                  <span>Download .ics File</span>
                </>
              )}
            </button>

            {/* Direct Google Calendar Web Link */}
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Add to Google Calendar</span>
            </a>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              Works on Android, iOS, Windows, Mac & Linux
            </span>
            <button
              onClick={handleCopyIcs}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 underline underline-offset-2"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied iCal Raw</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy raw .ics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
